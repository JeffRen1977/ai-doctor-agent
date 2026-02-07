/**
 * 康复助理数据模型和验证Schema
 */

const Joi = require('joi');

// ========== 康复记录Schema ==========
const rehabilitationRecordSchema = Joi.object({
  recordId: Joi.string().required(),
  userEmail: Joi.string().email().required(),
  type: Joi.string().valid('qa', 'explanation', 'support', 'meditation', 'cbt').required(),
  subtype: Joi.string().optional(),
  input: Joi.any().required(),
  output: Joi.any().required(),
  references: Joi.object({
    healthRecords: Joi.array().items(Joi.string()).optional(),
    conversations: Joi.array().items(Joi.string()).optional(),
    documents: Joi.array().items(Joi.string()).optional()
  }).optional(),
  metadata: Joi.object({
    aiProvider: Joi.string().required(),
    aiModel: Joi.string().required(),
    language: Joi.string().required(),
    version: Joi.string().optional(),
    tags: Joi.array().items(Joi.string()).optional()
  }).required(),
  timestamp: Joi.string().isoDate().required(),
  createdAt: Joi.string().isoDate().required(),
  updatedAt: Joi.string().isoDate().required()
});

// ========== 用户上下文Schema ==========
const userContextSchema = Joi.object({
  userEmail: Joi.string().email().required(),
  healthSnapshot: Joi.object({
    currentMetrics: Joi.any().optional(),
    medications: Joi.array().items(Joi.any()).optional(),
    medicalHistory: Joi.any().optional(),
    recentAlerts: Joi.array().items(Joi.any()).optional()
  }).optional(),
  conversationContext: Joi.object({
    recentMessages: Joi.array().items(Joi.any()).optional(),
    activeConversations: Joi.array().items(Joi.string()).optional()
  }).optional(),
  preferences: Joi.object({
    language: Joi.string().required(),
    aiProvider: Joi.string().optional(),
    aiModel: Joi.string().optional()
  }).required(),
  lastUpdated: Joi.string().isoDate().required()
});

// ========== 反馈Schema ==========
const feedbackSchema = Joi.object({
  recordId: Joi.string().required(),
  userEmail: Joi.string().email().required(),
  effectiveness: Joi.number().min(1).max(5).required(),
  helpful: Joi.boolean().optional(),
  comments: Joi.string().allow('', null).optional(),
  timestamp: Joi.string().isoDate().required()
});

// ========== 辅助函数：创建康复记录 ==========
function createRehabilitationRecord(userEmail, type, input, output, metadata, references = {}) {
  const now = new Date().toISOString();
  return {
    recordId: `rehab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userEmail,
    type,
    input,
    output,
    references: {
      healthRecords: references.healthRecords || [],
      conversations: references.conversations || [],
      documents: references.documents || []
    },
    metadata: {
      ...metadata,
      version: metadata.version || '1.0'
    },
    timestamp: now,
    createdAt: now,
    updatedAt: now
  };
}

// ========== 辅助函数：验证康复记录 ==========
function validateRehabilitationRecord(record) {
  const { error, value } = rehabilitationRecordSchema.validate(record);
  if (error) {
    return {
      valid: false,
      error: error.details[0].message,
      value: null
    };
  }
  return {
    valid: true,
    error: null,
    value
  };
}

// ========== 辅助函数：验证用户上下文 ==========
function validateUserContext(context) {
  const { error, value } = userContextSchema.validate(context);
  if (error) {
    return {
      valid: false,
      error: error.details[0].message,
      value: null
    };
  }
  return {
    valid: true,
    error: null,
    value
  };
}

// ========== 辅助函数：验证反馈 ==========
function validateFeedback(feedback) {
  const { error, value } = feedbackSchema.validate(feedback);
  if (error) {
    return {
      valid: false,
      error: error.details[0].message,
      value: null
    };
  }
  return {
    valid: true,
    error: null,
    value
  };
}

module.exports = {
  rehabilitationRecordSchema,
  userContextSchema,
  feedbackSchema,
  createRehabilitationRecord,
  validateRehabilitationRecord,
  validateUserContext,
  validateFeedback
};
