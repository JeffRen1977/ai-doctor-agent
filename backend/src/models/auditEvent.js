/**
 * 审计事件数据模型与校验
 * 对应集合 auditEvents。回答的是监管与事故复盘时的三个问题：
 *   谁（actorId/actorEmail）、什么时候（timestamp）、看到/得到了什么 AI 结论（output*）。
 *
 * 与业务表的区别：审计记录**只追加不修改**，且要能独立于业务数据长期留存。
 */

const Joi = require('joi');

/** 已落地的审计动作。新增动作时在此登记，避免出现拼写不一致的孤儿类型。 */
const AUDIT_ACTIONS = {
  AI_DECISION: 'ai.decision',           // 一次大模型调用及其结论
  ALERT_GENERATED: 'alert.generated',   // 生成了健康风险告警
  ALERT_DELIVERED: 'alert.delivered',   // 告警实际送达用户
  ALERT_SUPPRESSED: 'alert.suppressed', // 告警被规则抑制（排查「为什么没发出来」的关键）
  RECORD_ACCESSED: 'record.accessed',   // 病历被读取
  ACCOUNT_EXPORTED: 'account.exported', // 用户导出自己的数据
  ACCOUNT_ERASED: 'account.erased'      // 账号注销（主体用哈希，保留处理证明）
};

const auditEventSchema = Joi.object({
  action: Joi.string().valid(...Object.values(AUDIT_ACTIONS)).required(),
  actorId: Joi.string().allow('', null).optional(),
  actorEmail: Joi.string().allow('', null).optional(),
  subjectEmail: Joi.string().allow('', null).optional(), // 数据主体，通常与 actor 相同
  timestamp: Joi.string().isoDate().required(),
  requestId: Joi.string().allow('', null).optional(),

  // AI 决策溯源
  operation: Joi.string().allow('', null).optional(),    // 如 riskMonitoring.detectAnomalies
  provider: Joi.string().allow('', null).optional(),
  model: Joi.string().allow('', null).optional(),
  latencyMs: Joi.number().min(0).allow(null).optional(),
  success: Joi.boolean().required(),
  errorMessage: Joi.string().allow('', null).optional(),

  // 输入输出留痕：摘要用于人工审阅，哈希用于证明内容未被篡改
  inputDigest: Joi.string().allow('', null).optional(),
  inputSummary: Joi.string().allow('', null).optional(),
  outputDigest: Joi.string().allow('', null).optional(),
  outputSummary: Joi.string().allow('', null).optional(),

  metadata: Joi.object().optional()
}).unknown(true);

function validateAuditEvent(event) {
  const { error, value } = auditEventSchema.validate(event, { stripUnknown: true });
  return { valid: !error, error: error ? error.details.map((d) => d.message).join('; ') : null, value };
}

module.exports = {
  AUDIT_ACTIONS,
  auditEventSchema,
  validateAuditEvent
};
