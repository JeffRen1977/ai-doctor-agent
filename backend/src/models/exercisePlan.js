/**
 * 运动计划数据模型与校验
 * 对应 Firestore exercisePlans/{userId} 文档；与 REPOSITORY_EXPANSION_DESIGN §3.2 一致。
 */

const Joi = require('joi');

const planPayloadSchema = Joi.object({
  schedule: Joi.object().optional(),
  targets: Joi.object({
    steps: Joi.number().min(0).optional(),
    calories: Joi.number().min(0).optional(),
    duration: Joi.number().min(0).optional(),
    frequency: Joi.number().min(0).optional()
  }).optional(),
  progression: Joi.object().optional(),
  weeklyPlan: Joi.object().optional(),
  adjustments: Joi.array().items(Joi.object()).optional()
}).unknown(true);

const exercisePlanDocSchema = Joi.object({
  userEmail: Joi.string().required(),
  plan: planPayloadSchema.required(),
  createdAt: Joi.string().isoDate().required(),
  updatedAt: Joi.string().isoDate().required()
}).unknown(true);

function validateExercisePlanDoc(doc) {
  const { error, value } = exercisePlanDocSchema.validate(doc, { stripUnknown: true });
  return { valid: !error, error: error ? error.details.map(d => d.message).join('; ') : null, value };
}

function validatePlanPayload(plan) {
  const { error, value } = planPayloadSchema.validate(plan, { stripUnknown: true });
  return { valid: !error, error: error ? error.details.map(d => d.message).join('; ') : null, value };
}

module.exports = {
  planPayloadSchema,
  exercisePlanDocSchema,
  validateExercisePlanDoc,
  validatePlanPayload
};
