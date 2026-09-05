/**
 * 审计服务 —— 记录「谁在什么时候得到了什么 AI 结论」。
 *
 * 三条设计原则：
 *  1. **绝不影响主流程**。审计写库失败只记日志，不能让用户的健康分析请求跟着失败 ——
 *     审计是为了事后追责，不该成为新的故障源。
 *  2. **内容留痕分级**。AUDIT_CAPTURE=digest|summary|full 控制留多少原文：
 *     digest 只存哈希（最小化 PHI 留存），summary 存截断摘要（默认，够人工复盘），
 *     full 存完整原文（合规要求严格时用，需配套访问控制与加密存储）。
 *  3. **哈希始终保留**。无论留多少原文，输入输出的 SHA-256 都存 —— 这是日后证明
 *     「当时模型收到的就是这个、吐出来的就是这个」的唯一依据。
 */

const crypto = require('node:crypto');
const { validateAuditEvent, AUDIT_ACTIONS } = require('../models/auditEvent');
const { auditEventRepo } = require('../repositories');
const logger = require('../observability/logger');
const { getContext } = require('../observability/requestContext');

const SUMMARY_MAX_CHARS = Number(process.env.AUDIT_SUMMARY_MAX_CHARS) || 2000;

/** @returns {'digest'|'summary'|'full'} */
function captureMode() {
  const mode = String(process.env.AUDIT_CAPTURE || 'summary').toLowerCase();
  return ['digest', 'summary', 'full'].includes(mode) ? mode : 'summary';
}

function stringify(value) {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

/** 内容指纹：证明留痕内容未被事后篡改 */
function digest(value) {
  const text = stringify(value);
  if (!text) return null;
  return crypto.createHash('sha256').update(text).digest('hex');
}

/** 按 captureMode 决定留多少原文 */
function summarize(value) {
  const mode = captureMode();
  if (mode === 'digest') return null;
  const text = stringify(value);
  if (!text) return null;
  if (mode === 'full') return text;
  return text.length > SUMMARY_MAX_CHARS
    ? `${text.slice(0, SUMMARY_MAX_CHARS)}…[truncated ${text.length - SUMMARY_MAX_CHARS} chars]`
    : text;
}

/**
 * 写入一条审计记录。永不抛错。
 * @param {object} event
 * @returns {Promise<{recorded: boolean, id?: string, error?: string}>}
 */
async function append(event) {
  const context = getContext();
  const candidate = {
    timestamp: new Date().toISOString(),
    requestId: context.requestId || null,
    actorId: event.actorId ?? context.userId ?? null,
    ...event
  };

  const { valid, error, value } = validateAuditEvent(candidate);
  if (!valid) {
    logger.error({ auditError: error, action: candidate.action }, '审计事件校验失败，未落库');
    return { recorded: false, error };
  }

  try {
    const saved = await auditEventRepo.appendEvent(value);
    return { recorded: true, id: saved?.id };
  } catch (err) {
    // 审计落库失败本身是需要告警的事件：日志里必须留下完整内容，
    // 这样即使数据库写不进去，事后仍能从日志平台重建这条记录。
    logger.error(
      { err: { message: err?.message, stack: err?.stack }, auditEvent: value, event: 'audit_write_failed' },
      '审计记录写入失败'
    );
    return { recorded: false, error: err?.message };
  }
}

/**
 * 记录一次 AI 决策。由 aiServiceFactory 在每次大模型调用后自动调用。
 * @param {object} params
 * @param {string} params.operation 业务操作名，如 'analyzeHealthRecords'
 * @param {string} params.provider
 * @param {string} params.model
 * @param {*} params.input 送进模型的内容
 * @param {*} params.output 模型返回的内容
 * @param {number} params.latencyMs
 * @param {boolean} params.success
 * @param {string} [params.errorMessage]
 * @param {string} [params.subjectEmail] 数据主体
 */
async function recordAiDecision(params) {
  return append({
    action: AUDIT_ACTIONS.AI_DECISION,
    operation: params.operation,
    provider: params.provider,
    model: params.model,
    subjectEmail: params.subjectEmail ?? getContext().userEmail ?? null,
    actorEmail: params.subjectEmail ?? getContext().userEmail ?? null,
    latencyMs: params.latencyMs,
    success: params.success !== false,
    errorMessage: params.errorMessage ?? null,
    inputDigest: digest(params.input),
    // 摘要可单独指定：base64 图片/PDF 这类大对象只留描述符，哈希仍按原文计算
    inputSummary: summarize(params.inputSummaryValue !== undefined ? params.inputSummaryValue : params.input),
    outputDigest: digest(params.output),
    outputSummary: summarize(params.output),
    metadata: params.metadata ?? {}
  });
}

/**
 * 记录告警的生成/送达/被抑制。
 * ALERT_SUPPRESSED 是回答「这个告警当时为什么没发出来」的关键证据 ——
 * 没有它，被规则或置信度阈值静默丢掉的告警在系统里不留任何痕迹。
 * @param {'generated'|'delivered'|'suppressed'} phase
 * @param {object} params
 */
async function recordAlert(phase, params) {
  const actionByPhase = {
    generated: AUDIT_ACTIONS.ALERT_GENERATED,
    delivered: AUDIT_ACTIONS.ALERT_DELIVERED,
    suppressed: AUDIT_ACTIONS.ALERT_SUPPRESSED
  };
  return append({
    action: actionByPhase[phase] || AUDIT_ACTIONS.ALERT_GENERATED,
    operation: params.operation ?? null,
    subjectEmail: params.subjectEmail ?? null,
    actorEmail: params.subjectEmail ?? null,
    success: params.success !== false,
    errorMessage: params.errorMessage ?? null,
    outputSummary: summarize(params.alert),
    outputDigest: digest(params.alert),
    metadata: { reason: params.reason ?? null, severity: params.severity ?? null, ...(params.metadata ?? {}) }
  });
}

/** 查询某个用户的审计轨迹（供合规导出 / 用户行使知情权） */
async function getSubjectTrail(subjectEmail, options = {}) {
  return auditEventRepo.listBySubject(subjectEmail, options);
}

/** 按 requestId 取回一次请求的完整链路，用于事故复盘 */
async function getRequestTrail(requestId) {
  return auditEventRepo.listByRequestId(requestId);
}

module.exports = {
  append,
  recordAiDecision,
  recordAlert,
  getSubjectTrail,
  getRequestTrail,
  digest,
  summarize,
  captureMode,
  AUDIT_ACTIONS
};
