/**
 * 营养分析记录数据模型与校验
 * 对应 Firestore nutritionAnalyses 集合；与 REPOSITORY_EXPANSION_DESIGN §3.3 一致。
 */

const Joi = require('joi');

const nutritionAnalysisDocSchema = Joi.object({
  userEmail: Joi.string().required(),
  nutrition: Joi.object().required(),   // 分析结果（foods、calories、carbs 等）
  feedback: Joi.object().optional(),   // instantFeedback
  timestamp: Joi.string().isoDate().required()
}).unknown(true);

function validateNutritionAnalysisDoc(doc) {
  const { error, value } = nutritionAnalysisDocSchema.validate(doc, { stripUnknown: true });
  return { valid: !error, error: error ? error.details.map(d => d.message).join('; ') : null, value };
}

module.exports = {
  nutritionAnalysisDocSchema,
  validateNutritionAnalysisDoc
};
