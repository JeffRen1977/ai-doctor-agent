/**
 * 领域模型：AIContextPayload（组装后给 AI 的上下文）
 * 不持久化，由 Context Builder 按需从各维度 Repository 组装而成。
 * 对应架构文档 AI_AGENT_DATA_ARCHITECTURE 第九节。
 */

const Joi = require('joi');

const vitalsRecentSchema = Joi.object({
  date: Joi.string().required(),
  summary: Joi.object().optional(),
  anomalies: Joi.array().optional(),
  trend: Joi.string().allow('', null).optional()
}).optional();

const aiContextPayloadSchema = Joi.object({
  userId: Joi.string().required(),
  basicInfo: Joi.string().required(),
  medications: Joi.string().allow('', null).optional(),
  vitalsRecent: vitalsRecentSchema,
  chatRecent: Joi.string().allow('', null).optional(),
  language: Joi.string().valid('zh', 'en').required(),
  requestedAt: Joi.string().isoDate().required()
});

/**
 * 校验并返回规范化后的 AIContextPayload
 * @param {Object} data - 待校验对象
 * @returns {{ value: Object } | { error: Joi.ValidationError }}
 */
function validateAIContextPayload(data) {
  return aiContextPayloadSchema.validate(data, { stripUnknown: true });
}

module.exports = {
  aiContextPayloadSchema,
  vitalsRecentSchema,
  validateAIContextPayload
};
