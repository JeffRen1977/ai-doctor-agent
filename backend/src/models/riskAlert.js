/**
 * 风险预警数据模型与校验
 * 对应 Firestore riskAlerts 集合；与 REPOSITORY_EXPANSION_DESIGN §3.4 一致。
 */

const Joi = require('joi');

const riskAlertSchema = Joi.object({
  userEmail: Joi.string().required(),
  alertType: Joi.string().required(),
  severity: Joi.string().valid('low', 'medium', 'high', 'critical').required(),
  details: Joi.object().optional(),
  timestamp: Joi.string().isoDate().required(),
  acknowledged: Joi.boolean().optional(),
  acknowledgedAt: Joi.string().isoDate().allow('', null).optional(),
  action: Joi.string().allow('', null).optional()
}).unknown(true);

function validateRiskAlert(alert) {
  const { error, value } = riskAlertSchema.validate(alert, { stripUnknown: true });
  return { valid: !error, error: error ? error.details.map(d => d.message).join('; ') : null, value };
}

module.exports = {
  riskAlertSchema,
  validateRiskAlert
};
