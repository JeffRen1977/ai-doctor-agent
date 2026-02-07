/**
 * 预约管理数据模型和验证Schema
 */

const Joi = require('joi');

// ========== 预约类型枚举 ==========
const APPOINTMENT_TYPES = [
  'consultation',      // 咨询
  'follow-up',        // 随访
  'checkup',          // 体检
  'examination',      // 检查
  'surgery',          // 手术
  'therapy',          // 治疗
  'vaccination',      // 疫苗接种
  'other'             // 其他
];

// ========== 预约状态枚举 ==========
const APPOINTMENT_STATUS = [
  'scheduled',        // 已预约
  'confirmed',         // 已确认
  'completed',        // 已完成
  'cancelled',        // 已取消
  'no-show',          // 未到诊
  'rescheduled'       // 已改期
];

// ========== 预约Schema ==========
const appointmentSchema = Joi.object({
  appointmentId: Joi.string().required(),
  userEmail: Joi.string().email().required(),
  type: Joi.string().valid(...APPOINTMENT_TYPES).required(),
  status: Joi.string().valid(...APPOINTMENT_STATUS).required(),
  scheduledDateTime: Joi.string().isoDate().required(),
  duration: Joi.number().min(15).max(480).default(30), // 分钟
  location: Joi.object({
    name: Joi.string().required(),
    address: Joi.string().allow('', null).optional(),
    phone: Joi.string().allow('', null).optional(),
    department: Joi.string().allow('', null).optional(),
    room: Joi.string().allow('', null).optional()
  }).required(),
  provider: Joi.object({
    name: Joi.string().required(),
    title: Joi.string().allow('', null).optional(), // 职称
    specialty: Joi.string().allow('', null).optional(), // 专科
    phone: Joi.string().allow('', null).optional()
  }).required(),
  reason: Joi.string().allow('', null).optional(), // 预约原因
  notes: Joi.string().allow('', null).optional(), // 备注
  reminders: Joi.array().items(Joi.object({
    type: Joi.string().valid('email', 'sms', 'push', 'calendar').required(),
    scheduledAt: Joi.string().isoDate().required(),
    sent: Joi.boolean().default(false),
    sentAt: Joi.string().isoDate().allow(null).optional()
  })).optional(),
  relatedDocuments: Joi.array().items(Joi.string()).optional(), // 相关文档ID
  relatedAnalyses: Joi.array().items(Joi.string()).optional(), // 相关分析ID
  createdAt: Joi.string().isoDate().required(),
  updatedAt: Joi.string().isoDate().required()
});

// ========== 辅助函数：创建预约对象 ==========
function createAppointment(data) {
  const now = new Date().toISOString();
  return {
    appointmentId: data.appointmentId || `appt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userEmail: data.userEmail,
    type: data.type || 'consultation',
    status: data.status || 'scheduled',
    scheduledDateTime: data.scheduledDateTime,
    duration: data.duration || 30,
    location: {
      name: data.location?.name || '',
      address: data.location?.address || null,
      phone: data.location?.phone || null,
      department: data.location?.department || null,
      room: data.location?.room || null
    },
    provider: {
      name: data.provider?.name || '',
      title: data.provider?.title || null,
      specialty: data.provider?.specialty || null,
      phone: data.provider?.phone || null
    },
    reason: data.reason || null,
    notes: data.notes || null,
    reminders: data.reminders || [],
    relatedDocuments: data.relatedDocuments || [],
    relatedAnalyses: data.relatedAnalyses || [],
    createdAt: data.createdAt || now,
    updatedAt: data.updatedAt || now
  };
}

module.exports = {
  APPOINTMENT_TYPES,
  APPOINTMENT_STATUS,
  appointmentSchema,
  createAppointment
};
