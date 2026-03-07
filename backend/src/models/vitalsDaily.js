/**
 * 领域模型：VitalsDaily（单日体征聚合）
 * 与存储无关，供 Repository/Context Builder 使用。
 * 对应架构文档 AI_AGENT_DATA_ARCHITECTURE 第七节。
 */

const Joi = require('joi');

const heartRateSummarySchema = Joi.object({
  min: Joi.number().optional(),
  max: Joi.number().optional(),
  avg: Joi.number().optional(),
  resting: Joi.number().optional(),
  unit: Joi.string().optional()
}).optional();

const bloodPressureSummarySchema = Joi.object({
  systolicMin: Joi.number().optional(),
  systolicMax: Joi.number().optional(),
  diastolicMin: Joi.number().optional(),
  diastolicMax: Joi.number().optional(),
  unit: Joi.string().optional()
}).optional();

const glucoseSummarySchema = Joi.object({
  min: Joi.number().optional(),
  max: Joi.number().optional(),
  avg: Joi.number().optional(),
  unit: Joi.string().optional()
}).optional();

const summarySchema = Joi.object({
  heartRate: heartRateSummarySchema,
  bloodPressure: bloodPressureSummarySchema,
  glucose: glucoseSummarySchema,
  steps: Joi.number().optional(),
  sleepMinutes: Joi.number().optional(),
  hrv: Joi.object({ avg: Joi.number().optional(), unit: Joi.string().optional() }).optional()
}).optional();

const anomalySchema = Joi.object({
  metric: Joi.string().required(),
  value: Joi.number().optional(),
  at: Joi.string().isoDate().optional(),
  severity: Joi.string().valid('low', 'medium', 'high').optional(),
  description: Joi.string().optional()
});

const vitalsDailySchema = Joi.object({
  userId: Joi.string().optional(),
  userEmail: Joi.string().optional(),
  date: Joi.string().required(),
  source: Joi.string().valid('wearable', 'manual', 'ehr', 'aggregated').optional(),
  summary: summarySchema,
  anomalies: Joi.array().items(anomalySchema).optional(),
  trend: Joi.string().valid('stable', 'improving', 'declining').allow(null).optional(),
  updatedAt: Joi.date().optional(),
  createdAt: Joi.date().optional()
});

/**
 * 校验并返回规范化后的 VitalsDaily
 * @param {Object} data - 待校验对象
 * @returns {{ value: Object } | { error: Joi.ValidationError }}
 */
function validateVitalsDaily(data) {
  return vitalsDailySchema.validate(data, { stripUnknown: true });
}

module.exports = {
  vitalsDailySchema,
  summarySchema,
  anomalySchema,
  validateVitalsDaily
};
