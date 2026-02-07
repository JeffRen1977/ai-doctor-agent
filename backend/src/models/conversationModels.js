/**
 * 对话历史数据模型和验证Schema
 */

const Joi = require('joi');

// ========== 对话消息Schema ==========
const conversationMessageSchema = Joi.object({
  role: Joi.string().valid('user', 'assistant', 'system').required(),
  content: Joi.string().required(),
  timestamp: Joi.string().isoDate().required(),
  context: Joi.object({
    referencedDocuments: Joi.array().items(Joi.string()).optional(),
    referencedAnalyses: Joi.array().items(Joi.string()).optional(),
    healthDataSnapshot: Joi.any().optional()
  }).optional()
});

// ========== 对话历史Schema ==========
const conversationHistorySchema = Joi.object({
  conversationId: Joi.string().required(),
  userEmail: Joi.string().email().required(),
  messages: Joi.array().items(conversationMessageSchema).required(),
  summary: Joi.string().allow('', null).optional(),
  createdAt: Joi.string().isoDate().required(),
  updatedAt: Joi.string().isoDate().required(),
  metadata: Joi.object({
    title: Joi.string().allow('', null).optional(),
    tags: Joi.array().items(Joi.string()).optional(),
    category: Joi.string().valid('health-qa', 'symptom-analysis', 'medication-advice', 'general', 'other').optional()
  }).optional()
});

// ========== 辅助函数：创建对话消息 ==========
function createConversationMessage(role, content, context = {}) {
  return {
    role: role,
    content: content,
    timestamp: new Date().toISOString(),
    context: {
      referencedDocuments: context.referencedDocuments || [],
      referencedAnalyses: context.referencedAnalyses || [],
      healthDataSnapshot: context.healthDataSnapshot || null
    }
  };
}

// ========== 辅助函数：创建对话历史 ==========
function createConversationHistory(userEmail, initialMessage = null) {
  const now = new Date().toISOString();
  const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    conversationId: conversationId,
    userEmail: userEmail,
    messages: initialMessage ? [initialMessage] : [],
    summary: null,
    createdAt: now,
    updatedAt: now,
    metadata: {
      title: null,
      tags: [],
      category: 'general'
    }
  };
}

module.exports = {
  conversationMessageSchema,
  conversationHistorySchema,
  createConversationMessage,
  createConversationHistory
};
