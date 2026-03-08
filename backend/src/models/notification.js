/**
 * 通知数据模型与校验
 * 对应 Firestore notifications 集合；与 REPOSITORY_EXPANSION_DESIGN §3.5 一致。
 */

const Joi = require('joi');

const notificationSchema = Joi.object({
  userEmail: Joi.string().required(),
  type: Joi.string().required(),
  alertId: Joi.string().allow('', null).optional(),
  title: Joi.string().allow('', null).optional(),
  message: Joi.string().allow('', null).optional(),
  timestamp: Joi.string().isoDate().required(),
  read: Joi.boolean().optional()
}).unknown(true);

function validateNotification(notification) {
  const { error, value } = notificationSchema.validate(notification, { stripUnknown: true });
  return { valid: !error, error: error ? error.details.map(d => d.message).join('; ') : null, value };
}

module.exports = {
  notificationSchema,
  validateNotification
};
