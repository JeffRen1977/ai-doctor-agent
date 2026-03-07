/**
 * 领域模型：ChatSession（单次对话会话）
 * 与存储无关，供 Repository/Context Builder 使用。
 * 对应架构文档 AI_AGENT_DATA_ARCHITECTURE 第八节。
 */

const Joi = require('joi');

const messageSchema = Joi.object({
  id: Joi.string().required(),
  role: Joi.string().valid('user', 'assistant').required(),
  content: Joi.string().required(),
  timestamp: Joi.date().optional()
});

const chatSessionSchema = Joi.object({
  sessionId: Joi.string().required(),
  userId: Joi.string().optional(),
  userEmail: Joi.string().optional(),
  startedAt: Joi.date().required(),
  lastMessageAt: Joi.date().required(),
  messages: Joi.array().items(messageSchema).required(),
  summary: Joi.string().allow('', null).optional(),
  updatedAt: Joi.date().optional()
});

/**
 * 校验并返回规范化后的 ChatSession
 * @param {Object} data - 待校验对象
 * @returns {{ value: Object } | { error: Joi.ValidationError }}
 */
function validateChatSession(data) {
  return chatSessionSchema.validate(data, { stripUnknown: true });
}

module.exports = {
  chatSessionSchema,
  messageSchema,
  validateChatSession
};
