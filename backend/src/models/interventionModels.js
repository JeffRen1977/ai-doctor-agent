/**
 * 精准干预引擎数据模型和验证Schema
 * 基于 INTERVENTION_ENGINE_DATA_COMPATIBILITY.md 设计文档
 */

const Joi = require('joi');

// ========== 用药记录Schema ==========

// 用药计划项Schema
const medicationScheduleItemSchema = Joi.object({
  date: Joi.string().isoDate().required(),          // 日期 (ISO 8601)
  time: Joi.string().required(),                     // 时间（如："08:00"）
  status: Joi.string().valid('taken', 'pending', 'missed').required(),
  timestamp: Joi.string().isoDate().required()       // 时间戳
});

// 用药历史项Schema
const medicationHistoryItemSchema = Joi.object({
  date: Joi.string().isoDate().required(),
  time: Joi.string().required(),
  status: Joi.string().valid('taken', 'pending', 'missed').required(),
  timestamp: Joi.string().isoDate().required(),
  notes: Joi.string().allow('', null).optional()    // 备注
});

// 单个用药记录Schema
const medicationItemSchema = Joi.object({
  id: Joi.string().required(),                      // 药物唯一ID
  name: Joi.string().required(),                     // 药物名称
  dosage: Joi.string().required(),                   // 剂量
  frequency: Joi.string().required(),                // 频率（如："每日2次"）
  time: Joi.array().items(Joi.string()).required(), // 服药时间（如：["08:00", "20:00"]）
  route: Joi.string().allow('', null).optional(),   // 给药途径（如："口服"、"注射"）
  startDate: Joi.string().isoDate().required(),      // 开始日期
  endDate: Joi.string().isoDate().allow('', null).optional(),  // 结束日期（如果仍在进行则为null）
  status: Joi.string().valid('active', 'completed', 'discontinued').required(),
  purpose: Joi.string().allow('', null).optional(), // 用途
  prescribingDoctor: Joi.string().allow('', null).optional(), // 开药医生
  schedule: Joi.array().items(medicationScheduleItemSchema).optional(), // 用药计划
  history: Joi.array().items(medicationHistoryItemSchema).optional()    // 用药历史
});

// medications 集合文档Schema
const medicationsCollectionSchema = Joi.object({
  userEmail: Joi.string().email().required(),
  medications: Joi.array().items(medicationItemSchema).required(),
  lastUpdated: Joi.string().isoDate().required()
});

// ========== 干预方案Schema ==========

// 用药干预Schema
const medicationInterventionSchema = Joi.object({
  adjustments: Joi.array().items(Joi.object()).optional(),  // 调整历史
  currentPlan: Joi.object({
    medications: Joi.array().items(Joi.object()).optional(),
    schedule: Joi.object().optional(),
    targets: Joi.object().optional()
  }).optional()
});

// 营养干预Schema
const nutritionInterventionSchema = Joi.object({
  adjustments: Joi.array().items(Joi.object()).optional(),  // 调整历史
  mealPlan: Joi.object({
    breakfast: Joi.object().optional(),
    lunch: Joi.object().optional(),
    dinner: Joi.object().optional(),
    snacks: Joi.array().items(Joi.object()).optional()
  }).optional(),
  dailyTargets: Joi.object({
    calories: Joi.number().min(0).optional(),
    carbs: Joi.number().min(0).optional(),
    protein: Joi.number().min(0).optional(),
    fat: Joi.number().min(0).optional(),
    fiber: Joi.number().min(0).optional(),
    sugar: Joi.number().min(0).optional()
  }).optional()
});

// 运动干预Schema
const exerciseInterventionSchema = Joi.object({
  adjustments: Joi.array().items(Joi.object()).optional(),  // 调整历史
  weeklyPlan: Joi.object().optional(),                        // 周计划
  progression: Joi.object().optional(),                       // 进展记录
  targets: Joi.object({
    steps: Joi.number().min(0).optional(),
    calories: Joi.number().min(0).optional(),
    duration: Joi.number().min(0).optional(),                  // 分钟
    frequency: Joi.number().min(0).optional()                 // 每周次数
  }).optional()
});

// interventions 集合文档Schema
const interventionsCollectionSchema = Joi.object({
  userEmail: Joi.string().email().required(),
  medication: medicationInterventionSchema.optional(),
  nutrition: nutritionInterventionSchema.optional(),
  exercise: exerciseInterventionSchema.optional(),
  lastAdjusted: Joi.string().isoDate().required(),
  feedback: Joi.object().optional(),                          // 用户反馈
  version: Joi.number().min(1).optional()                     // 版本号
});

// ========== 辅助函数：创建用药记录对象 ==========

/**
 * 创建用药记录对象
 * @param {Object} data - 用药记录数据
 * @returns {Object} 标准化的用药记录对象
 */
function createMedicationItem(data) {
  const now = new Date().toISOString();
  return {
    id: data.id || `med_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: data.name || '',
    dosage: data.dosage || '',
    frequency: data.frequency || '',
    time: data.time || [],
    route: data.route || null,
    startDate: data.startDate || now,
    endDate: data.endDate || null,
    status: data.status || 'active',
    purpose: data.purpose || null,
    prescribingDoctor: data.prescribingDoctor || null,
    schedule: data.schedule || [],
    history: data.history || []
  };
}

/**
 * 创建用药计划项
 * @param {Object} data - 计划项数据
 * @returns {Object} 标准化的计划项对象
 */
function createMedicationScheduleItem(data) {
  const now = new Date().toISOString();
  return {
    date: data.date || now.split('T')[0],
    time: data.time || '',
    status: data.status || 'pending',
    timestamp: data.timestamp || now
  };
}

/**
 * 创建用药历史项
 * @param {Object} data - 历史项数据
 * @returns {Object} 标准化的历史项对象
 */
function createMedicationHistoryItem(data) {
  const now = new Date().toISOString();
  return {
    date: data.date || now.split('T')[0],
    time: data.time || '',
    status: data.status || 'pending',
    timestamp: data.timestamp || now,
    notes: data.notes || null
  };
}

/**
 * 创建medications集合文档
 * @param {string} userEmail - 用户邮箱
 * @param {Array} medications - 用药记录数组
 * @returns {Object} 标准化的medications集合文档
 */
function createMedicationsCollection(userEmail, medications = []) {
  return {
    userEmail: userEmail,
    medications: medications.map(med => createMedicationItem(med)),
    lastUpdated: new Date().toISOString()
  };
}

// ========== 辅助函数：创建干预方案对象 ==========

/**
 * 创建干预方案对象
 * @param {string} userEmail - 用户邮箱
 * @param {Object} data - 干预方案数据
 * @returns {Object} 标准化的干预方案对象
 */
function createInterventionCollection(userEmail, data = {}) {
  const now = new Date().toISOString();
  return {
    userEmail: userEmail,
    medication: data.medication || {
      adjustments: [],
      currentPlan: {
        medications: [],
        schedule: {},
        targets: {}
      }
    },
    nutrition: data.nutrition || {
      adjustments: [],
      mealPlan: {
        breakfast: {},
        lunch: {},
        dinner: {},
        snacks: []
      },
      dailyTargets: {
        calories: 0,
        carbs: 0,
        protein: 0,
        fat: 0,
        fiber: 0,
        sugar: 0
      }
    },
    exercise: data.exercise || {
      adjustments: [],
      weeklyPlan: {},
      progression: {},
      targets: {
        steps: 0,
        calories: 0,
        duration: 0,
        frequency: 0
      }
    },
    lastAdjusted: data.lastAdjusted || now,
    feedback: data.feedback || {},
    version: data.version || 1
  };
}

// ========== 验证函数 ==========

/**
 * 验证用药记录
 * @param {Object} medication - 用药记录对象
 * @returns {Object} 验证结果
 */
function validateMedicationItem(medication) {
  const { error, value } = medicationItemSchema.validate(medication, {
    abortEarly: false,
    stripUnknown: true
  });
  
  return {
    valid: !error,
    error: error ? error.details.map(d => d.message).join('; ') : null,
    value: value
  };
}

/**
 * 验证medications集合文档
 * @param {Object} collection - medications集合文档
 * @returns {Object} 验证结果
 */
function validateMedicationsCollection(collection) {
  const { error, value } = medicationsCollectionSchema.validate(collection, {
    abortEarly: false,
    stripUnknown: true
  });
  
  return {
    valid: !error,
    error: error ? error.details.map(d => d.message).join('; ') : null,
    value: value
  };
}

/**
 * 验证干预方案
 * @param {Object} intervention - 干预方案对象
 * @returns {Object} 验证结果
 */
function validateInterventionCollection(intervention) {
  const { error, value } = interventionsCollectionSchema.validate(intervention, {
    abortEarly: false,
    stripUnknown: true
  });
  
  return {
    valid: !error,
    error: error ? error.details.map(d => d.message).join('; ') : null,
    value: value
  };
}

// ========== 导出 ==========

module.exports = {
  // Schemas
  medicationItemSchema,
  medicationScheduleItemSchema,
  medicationHistoryItemSchema,
  medicationsCollectionSchema,
  medicationInterventionSchema,
  nutritionInterventionSchema,
  exerciseInterventionSchema,
  interventionsCollectionSchema,
  
  // 创建函数
  createMedicationItem,
  createMedicationScheduleItem,
  createMedicationHistoryItem,
  createMedicationsCollection,
  createInterventionCollection,
  
  // 验证函数
  validateMedicationItem,
  validateMedicationsCollection,
  validateInterventionCollection
};
