/**
 * 领域模型：Medication（单条用药记录）
 * 与存储无关，供 Repository/Context Builder 使用。
 * 对应架构文档 AI_AGENT_DATA_ARCHITECTURE 第六节。
 * 说明：status 采用 'active'|'paused'|'stopped'；从旧数据（completed/discontinued）读取时需映射为 stopped。
 */

const Joi = require('joi');

const medicationScheduleItemSchema = Joi.object({
  date: Joi.string().isoDate().required(),
  time: Joi.string().required(),
  status: Joi.string().valid('taken', 'pending', 'missed').required(),
  timestamp: Joi.string().isoDate().required()
});

const medicationHistoryItemSchema = Joi.object({
  date: Joi.string().isoDate().required(),
  time: Joi.string().required(),
  status: Joi.string().valid('taken', 'pending', 'missed').required(),
  timestamp: Joi.string().isoDate().required(),
  notes: Joi.string().allow('', null).optional()
});

const medicationSchema = Joi.object({
  id: Joi.string().required(),
  name: Joi.string().required(),
  dosage: Joi.string().allow('', null).optional(),
  frequency: Joi.string().allow('', null).optional(),
  time: Joi.array().items(Joi.string()).optional(),
  route: Joi.string().allow('', null).optional(),
  startDate: Joi.string().isoDate().allow('', null).optional(),
  endDate: Joi.string().isoDate().allow('', null).optional(),
  status: Joi.string().valid('active', 'paused', 'stopped').required(),
  purpose: Joi.string().allow('', null).optional(),
  prescribingDoctor: Joi.string().allow('', null).optional(),
  schedule: Joi.array().items(medicationScheduleItemSchema).optional(),
  history: Joi.array().items(medicationHistoryItemSchema).optional(),
  updatedAt: Joi.date().optional(),
  createdAt: Joi.date().optional()
});

/**
 * 校验并返回规范化后的 Medication
 * @param {Object} data - 待校验对象
 * @returns {{ value: Object } | { error: Joi.ValidationError }}
 */
function validateMedication(data) {
  return medicationSchema.validate(data, { stripUnknown: true });
}

/**
 * 将旧集合中的 status（completed/discontinued）映射为领域 status（stopped）
 * @param {Object} item - 来自旧 medications 集合的单条
 * @returns {Object} 可传入 validateMedication 的对象
 */
function normalizeMedicationFromLegacy(item) {
  if (!item) return item;
  const status = item.status === 'completed' || item.status === 'discontinued' ? 'stopped' : (item.status || 'active');
  return { ...item, status };
}

module.exports = {
  medicationSchema,
  medicationScheduleItemSchema,
  medicationHistoryItemSchema,
  validateMedication,
  normalizeMedicationFromLegacy
};
