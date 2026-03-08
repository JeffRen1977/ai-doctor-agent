/**
 * 遗留对话数据模型（只读兼容层，对应旧版 conversations 集合）
 * 与 REPOSITORY_EXPANSION_DESIGN §3.8 一致；若弃用该集合可返回空数组。
 */

const Joi = require('joi');

const conversationSchema = Joi.object({
  conversationId: Joi.string().required(),
  userEmail: Joi.string().required(),
  updatedAt: Joi.string().isoDate().required(),
  summary: Joi.string().allow('', null).optional()
}).unknown(true);

function validateConversation(conv) {
  const { error, value } = conversationSchema.validate(conv, { stripUnknown: true });
  return { valid: !error, error: error ? error.details.map(d => d.message).join('; ') : null, value };
}

module.exports = {
  conversationSchema,
  validateConversation
};
