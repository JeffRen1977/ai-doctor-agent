/**
 * 同意记录：只追加。撤回时再写一条 granted=false，不改历史。
 * 集合 consents。
 */

const Joi = require('joi');

const CONSENT_PURPOSES = {
  ACCOUNT: 'account',
  HEALTH_STORAGE: 'health_storage',
  AI_INFERENCE: 'ai_inference',
  ANALYTICS: 'analytics',
  CROSS_BORDER: 'cross_border'
};

const consentSchema = Joi.object({
  subjectEmail: Joi.string().email().required(),
  purpose: Joi.string().valid(...Object.values(CONSENT_PURPOSES)).required(),
  granted: Joi.boolean().required(),
  policyVersion: Joi.string().required(),
  timestamp: Joi.string().isoDate().required(),
  requestId: Joi.string().allow('', null).optional(),
  actorId: Joi.string().allow('', null).optional(),
  source: Joi.string().allow('', null).optional()
}).unknown(true);

function validateConsent(event) {
  const { error, value } = consentSchema.validate(event, { stripUnknown: true });
  return { valid: !error, error: error ? error.details.map((d) => d.message).join('; ') : null, value };
}

function currentPolicyVersion() {
  return process.env.PRIVACY_POLICY_VERSION || '2026-09-07';
}

module.exports = {
  CONSENT_PURPOSES,
  consentSchema,
  validateConsent,
  currentPolicyVersion
};
