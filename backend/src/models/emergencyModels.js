/**
 * 紧急求助数据模型和验证Schema
 */

const Joi = require('joi');

// ========== 紧急警报触发类型枚举 ==========
const EMERGENCY_TRIGGER_TYPES = [
  'fallDetection',        // AI跌倒检测
  'severeArrhythmia',     // 严重心律失常识别
  'hypoglycemiaEmergency', // 严重低血糖
  'manualTrigger',        // 手动触发
  'other'                 // 其他
];

// ========== 紧急警报严重程度枚举 ==========
const EMERGENCY_SEVERITY = [
  'low',        // 低
  'medium',     // 中
  'high',       // 高
  'critical'    // 严重
];

// ========== 紧急警报状态枚举 ==========
const EMERGENCY_ALERT_STATUS = [
  'active',      // 活跃
  'acknowledged', // 已确认
  'resolved',    // 已解决
  'cancelled'    // 已取消
];

// ========== 紧急联系人Schema ==========
const emergencyContactSchema = Joi.object({
  contactId: Joi.string().required(),
  userEmail: Joi.string().email().required(),
  name: Joi.string().required(),
  relationship: Joi.string().required(), // 关系：配偶、医生、朋友等
  phone: Joi.string().required(),
  email: Joi.string().email().allow('', null).optional(),
  isPrimary: Joi.boolean().default(false),
  location: Joi.string().allow('', null).optional(), // 位置或工作地点
  notes: Joi.string().allow('', null).optional(), // 备注
  notificationEnabled: Joi.boolean().default(true), // 是否启用通知
  createdAt: Joi.string().isoDate().required(),
  updatedAt: Joi.string().isoDate().required()
});

// ========== 紧急警报Schema ==========
const emergencyAlertSchema = Joi.object({
  alertId: Joi.string().required(),
  userEmail: Joi.string().email().required(),
  triggerType: Joi.string().valid(...EMERGENCY_TRIGGER_TYPES).required(),
  severity: Joi.string().valid(...EMERGENCY_SEVERITY).required(),
  status: Joi.string().valid(...EMERGENCY_ALERT_STATUS).default('active'),
  location: Joi.object({
    latitude: Joi.number().min(-90).max(90).optional(),
    longitude: Joi.number().min(-180).max(180).optional(),
    address: Joi.string().allow('', null).optional(),
    accuracy: Joi.number().min(0).optional() // 位置精度（米）
  }).optional(),
  message: Joi.string().allow('', null).optional(), // 警报消息
  details: Joi.object().optional(), // 详细信息
  contactsNotified: Joi.array().items(Joi.string()).default([]), // 已通知的联系人ID
  healthReportSent: Joi.boolean().default(false), // 是否已发送健康报告
  resolvedAt: Joi.string().isoDate().allow(null).optional(),
  resolvedBy: Joi.string().allow('', null).optional(), // 解决人
  resolvedNotes: Joi.string().allow('', null).optional(), // 解决备注
  timestamp: Joi.string().isoDate().required(),
  createdAt: Joi.string().isoDate().required(),
  updatedAt: Joi.string().isoDate().required()
});

// ========== 辅助函数：创建紧急联系人对象 ==========
function createEmergencyContact(data) {
  const now = new Date().toISOString();
  return {
    contactId: data.contactId || `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userEmail: data.userEmail,
    name: data.name || '',
    relationship: data.relationship || '',
    phone: data.phone || '',
    email: data.email || null,
    isPrimary: data.isPrimary || false,
    location: data.location || null,
    notes: data.notes || null,
    notificationEnabled: data.notificationEnabled !== undefined ? data.notificationEnabled : true,
    createdAt: data.createdAt || now,
    updatedAt: data.updatedAt || now
  };
}

// ========== 辅助函数：创建紧急警报对象 ==========
function createEmergencyAlert(data) {
  const now = new Date().toISOString();
  return {
    alertId: data.alertId || `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userEmail: data.userEmail,
    triggerType: data.triggerType || 'manualTrigger',
    severity: data.severity || 'high',
    status: data.status || 'active',
    location: data.location || null,
    message: data.message || null,
    details: data.details || {},
    contactsNotified: data.contactsNotified || [],
    healthReportSent: data.healthReportSent || false,
    resolvedAt: data.resolvedAt || null,
    resolvedBy: data.resolvedBy || null,
    resolvedNotes: data.resolvedNotes || null,
    timestamp: data.timestamp || now,
    createdAt: data.createdAt || now,
    updatedAt: data.updatedAt || now
  };
}

// ========== 验证函数 ==========
function validateEmergencyContact(contact) {
  const { error, value } = emergencyContactSchema.validate(contact, { abortEarly: false, allowUnknown: true });
  if (error) {
    return { valid: false, error: error.details.map(d => d.message).join('; ') };
  }
  return { valid: true, value };
}

function validateEmergencyAlert(alert) {
  const { error, value } = emergencyAlertSchema.validate(alert, { abortEarly: false, allowUnknown: true });
  if (error) {
    return { valid: false, error: error.details.map(d => d.message).join('; ') };
  }
  return { valid: true, value };
}

module.exports = {
  EMERGENCY_TRIGGER_TYPES,
  EMERGENCY_SEVERITY,
  EMERGENCY_ALERT_STATUS,
  emergencyContactSchema,
  emergencyAlertSchema,
  createEmergencyContact,
  createEmergencyAlert,
  validateEmergencyContact,
  validateEmergencyAlert
};
