/**
 * 领域模型：UserBasicInfo（用户基础档案）
 * 与存储无关，供 Repository/Context Builder 使用。
 * 对应架构文档 AI_AGENT_DATA_ARCHITECTURE 第五节约定的根文档基础信息字段。
 */

const Joi = require('joi');

const basicInfoSchema = Joi.object({
  name: Joi.string().allow('', null).optional(),
  gender: Joi.string().valid('male', 'female', 'other').allow(null).optional(),
  birthDate: Joi.string().isoDate().allow('', null).optional(),
  age: Joi.number().min(0).max(150).optional(),
  bloodType: Joi.string().valid('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-').allow(null).optional(),
  height: Joi.number().min(0).max(300).optional(),
  weight: Joi.number().min(0).max(500).optional(),
  bmi: Joi.number().min(0).max(100).optional(),
  nationality: Joi.string().allow('', null).optional(),
  idNumber: Joi.string().allow('', null).optional()
}).optional();

const emergencyContactSchema = Joi.object({
  name: Joi.string().allow('', null).optional(),
  phone: Joi.string().allow('', null).optional(),
  relationship: Joi.string().allow('', null).optional()
}).optional();

const userBasicInfoSchema = Joi.object({
  userId: Joi.string().required(),
  userEmail: Joi.string().email().required(),
  basicInfo: basicInfoSchema,
  medicalHistory: Joi.alternatives().try(Joi.string(), Joi.allow(null)).optional(),
  familyHistory: Joi.alternatives().try(Joi.string(), Joi.allow(null)).optional(),
  allergies: Joi.alternatives().try(Joi.string(), Joi.allow(null)).optional(),
  emergencyContact: emergencyContactSchema,
  medicalDocuments: Joi.array().optional(),
  updatedAt: Joi.date().optional(),
  createdAt: Joi.date().optional()
});

/**
 * 校验并返回规范化后的 UserBasicInfo
 * @param {Object} data - 待校验对象
 * @returns {{ value: Object } | { error: Joi.ValidationError }}
 */
function validateUserBasicInfo(data) {
  return userBasicInfoSchema.validate(data, { stripUnknown: true });
}

module.exports = {
  userBasicInfoSchema,
  basicInfoSchema,
  emergencyContactSchema,
  validateUserBasicInfo
};
