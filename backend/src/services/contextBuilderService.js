/**
 * Context Builder：从各 Repository 组装 AIContextPayload，供 AI 调用点使用。
 * 仅依赖 repositories 门面与 models，不引用 adapters 或 config/firebase。
 */

const repositories = require('../repositories');
const { validateAIContextPayload } = require('../models/aiContextPayload');

const DEFAULT_LANGUAGE = 'zh';
const DEFAULT_CHAT_TURNS = 5;
const DEFAULT_MAX_CONTEXT_CHARS = 8000;

/**
 * 按 options 从 repositories 拉取数据，组装并校验为 AIContextPayload。
 * @param {string} userId - 一般为 sanitized email
 * @param {Object} [options]
 * @param {boolean} [options.medications] - 是否拉取用药摘要
 * @param {boolean} [options.vitalsRecent] - 是否拉取最近体征（最近 1 日）
 * @param {boolean} [options.chatRecent] - 是否拉取最近对话轮次
 * @param {string} [options.language] - 'zh' | 'en'
 * @returns {Promise<import('../models/aiContextPayload').AIContextPayload>}
 */
async function buildAIContext(userId, options = {}) {
  const language = options.language === 'en' ? 'en' : 'zh';
  const requestedAt = new Date().toISOString();

  const basicInfoPromise = repositories.userBasicInfoRepo.getBasicInfoForAgent(userId);
  const medicationsPromise = options.medications
    ? repositories.medicationRepo.listActive(userId)
    : Promise.resolve(null);
  const vitalsRecentPromise = options.vitalsRecent
    ? getMostRecentVitals(userId)
    : Promise.resolve(null);
  const chatRecentPromise = options.chatRecent
    ? repositories.chatSessionRepo.getRecentTurnsForAgent(userId, DEFAULT_CHAT_TURNS)
    : Promise.resolve(null);

  const [basicInfo, medicationsList, vitalsRecent, chatRecent] = await Promise.all([
    basicInfoPromise,
    medicationsPromise,
    vitalsRecentPromise,
    chatRecentPromise
  ]);

  const basicInfoStr = basicInfo != null && basicInfo !== '' ? basicInfo : '暂无基础档案信息。';
  let medicationsStr;
  if (!options.medications) {
    medicationsStr = undefined;
  } else if (!medicationsList || medicationsList.length === 0) {
    medicationsStr = '';
  } else {
    medicationsStr = medicationsList
      .map((m) => `${m.name}${m.dosage ? ' ' + m.dosage : ''}${m.frequency ? ' ' + m.frequency : ''}`)
      .join('；');
  }

  let vitalsRecentPayload = undefined;
  if (options.vitalsRecent && vitalsRecent) {
    vitalsRecentPayload = {
      date: vitalsRecent.date,
      summary: vitalsRecent.summary,
      anomalies: vitalsRecent.anomalies,
      trend: vitalsRecent.trend ?? null
    };
  }

  const chatRecentStr = options.chatRecent ? (chatRecent || '') : undefined;

  const payload = {
    userId,
    basicInfo: basicInfoStr,
    medications: medicationsStr,
    vitalsRecent: vitalsRecentPayload,
    chatRecent: chatRecentStr,
    language,
    requestedAt
  };

  const result = validateAIContextPayload(payload);
  if (result.error) throw new Error(result.error.message);
  return result.value;
}

/**
 * 取最近一日的 VitalsDaily（今日或昨日）
 */
async function getMostRecentVitals(userId) {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  const [todayVitals, yesterdayVitals] = await Promise.all([
    repositories.vitalsDailyRepo.getVitalsDaily(userId, todayStr),
    repositories.vitalsDailyRepo.getVitalsDaily(userId, yesterdayStr)
  ]);
  return todayVitals || yesterdayVitals || null;
}

/**
 * 将 AIContextPayload 转为可拼入 System Prompt 的文本。
 * 仅包含有内容的维度；可配置最大长度截断。
 * @param {import('../models/aiContextPayload').AIContextPayload} payload
 * @param {Object} [opts]
 * @param {number} [opts.maxChars] - 最大字符数，超出则截断
 * @returns {string}
 */
function formatContextForSystemPrompt(payload, opts = {}) {
  const maxChars = opts.maxChars ?? DEFAULT_MAX_CONTEXT_CHARS;
  const parts = [];

  if (payload.basicInfo) {
    parts.push('[基础档案]\n' + String(payload.basicInfo));
  }
  if (payload.medications != null && payload.medications !== '') {
    parts.push('[当前用药]\n' + String(payload.medications));
  }
  if (payload.vitalsRecent && (payload.vitalsRecent.summary || (payload.vitalsRecent.anomalies && payload.vitalsRecent.anomalies.length))) {
    const v = payload.vitalsRecent;
    const lines = [];
    if (v.date) lines.push('日期：' + v.date);
    if (v.summary && Object.keys(v.summary).length) lines.push('摘要：' + JSON.stringify(v.summary));
    if (v.anomalies && v.anomalies.length) lines.push('异常：' + JSON.stringify(v.anomalies));
    if (v.trend) lines.push('趋势：' + v.trend);
    if (lines.length) parts.push('[近期体征]\n' + lines.join('\n'));
  }
  if (payload.chatRecent != null && payload.chatRecent !== '') {
    parts.push('[最近对话]\n' + String(payload.chatRecent));
  }

  let text = parts.join('\n\n');
  if (maxChars > 0 && text.length > maxChars) {
    text = text.slice(0, maxChars) + '\n...(已截断)';
  }
  return text;
}

module.exports = {
  buildAIContext,
  formatContextForSystemPrompt,
  getMostRecentVitals,
  DEFAULT_CHAT_TURNS,
  DEFAULT_MAX_CONTEXT_CHARS
};
