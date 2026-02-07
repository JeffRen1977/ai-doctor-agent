/**
 * 健康档案数据模型和验证Schema
 * 基于 HEALTH_RECORD_DATA_STRUCTURE.md 设计文档
 */

const Joi = require('joi');

// ========== 文档类型枚举 ==========
const MEDICAL_DOCUMENT_TYPES = [
  'hospital-record',      // 医院病例
  'doctor-report',        // 医生报告
  'imaging',              // 影像资料
  'lab-report',           // 检验报告
  'prescription',         // 处方
  'discharge-summary',    // 出院小结
  'pathology-report',     // 病理报告
  'ecg-report',          // 心电图报告
  'other'                 // 其他
];

// ========== 分析类型枚举 ==========
const ANALYSIS_TYPES = [
  'document-analysis',           // 文档分析
  'health-assessment',           // 健康评估
  'risk-prediction',             // 风险预测
  'treatment-recommendation',     // 治疗建议
  'nutrition-analysis',          // 营养分析
  'exercise-plan',               // 运动计划
  'medication-review',           // 用药审查
  'symptom-analysis',            // 症状分析
  'other'
];

// ========== 医疗文档Schema ==========
const medicalDocumentSchema = Joi.object({
  documentId: Joi.string().required(),
  documentType: Joi.string().valid(...MEDICAL_DOCUMENT_TYPES).required(),
  title: Joi.string().required(),
  description: Joi.string().allow('', null).optional(),
  originalFileName: Joi.string().required(),
  fileExtension: Joi.string().required(),
  fileInfo: Joi.object({
    downloadURL: Joi.string().uri().required(),
    storagePath: Joi.string().required(),
    size: Joi.number().min(0).required(),
    contentType: Joi.string().required(),
    thumbnailURL: Joi.string().uri().allow('', null).optional()
  }).required(),
  medicalInfo: Joi.object({
    institution: Joi.string().allow('', null).optional(),
    department: Joi.string().allow('', null).optional(),
    doctorName: Joi.string().allow('', null).optional(),
    visitDate: Joi.string().isoDate().allow('', null).optional(),
    diagnosis: Joi.alternatives().try(
      Joi.string(),
      Joi.array().items(Joi.string())
    ).allow('', null).optional(),
    chiefComplaint: Joi.string().allow('', null).optional(),
    treatment: Joi.string().allow('', null).optional(),
    notes: Joi.string().allow('', null).optional()
  }).optional(),
  imagingInfo: Joi.object({
    modality: Joi.string().valid('X-ray', 'CT', 'MRI', 'Ultrasound', 'PET', 'Other').optional(),
    bodyPart: Joi.string().allow('', null).optional(),
    contrastUsed: Joi.boolean().optional(),
    findings: Joi.string().allow('', null).optional(),
    impression: Joi.string().allow('', null).optional(),
    radiologist: Joi.string().allow('', null).optional()
  }).optional(),
  aiExtraction: Joi.object({
    extractedAt: Joi.string().isoDate().required(),
    provider: Joi.string().required(),
    model: Joi.string().required(),
    extractedData: Joi.object().optional(),
    confidence: Joi.number().min(0).max(1).optional()
  }).optional(),
  uploadedAt: Joi.string().isoDate().required(),
  createdAt: Joi.string().isoDate().required(),
  updatedAt: Joi.string().isoDate().required()
});

// ========== AI分析结果Schema ==========
const aiAnalysisSchema = Joi.object({
  analysisId: Joi.string().required(),
  analysisType: Joi.string().valid(...ANALYSIS_TYPES).required(),
  aiProvider: Joi.string().required(),
  aiModel: Joi.string().required(),
  analysisDate: Joi.string().isoDate().required(),
  processingTime: Joi.number().min(0).optional(),
  inputData: Joi.object({
    documentIds: Joi.array().items(Joi.string()).optional(),
    wearableDataPeriod: Joi.object({
      start: Joi.string().isoDate(),
      end: Joi.string().isoDate()
    }).optional(),
    userHealthData: Joi.any().optional(),
    query: Joi.string().allow('', null).optional()
  }).optional(),
  results: Joi.object({
    summary: Joi.string().required(),
    keyFindings: Joi.array().items(Joi.string()).optional(),
    recommendations: Joi.array().items(Joi.string()).optional(),
    nextSteps: Joi.array().items(Joi.string()).optional(),
    healthScore: Joi.object({
      score: Joi.number().min(0).max(100).required(),
      explanation: Joi.string().required(),
      category: Joi.string().valid('excellent', 'good', 'fair', 'poor').optional()
    }).optional(),
    riskFactors: Joi.array().items(Joi.object({
      factor: Joi.string().required(),
      level: Joi.string().valid('low', 'medium', 'high', 'critical').required(),
      description: Joi.string().required(),
      mitigation: Joi.string().allow('', null).optional()
    })).optional(),
    medicalConditions: Joi.array().items(Joi.object({
      condition: Joi.string().required(),
      confidence: Joi.number().min(0).max(1).required(),
      description: Joi.string().required(),
      severity: Joi.string().valid('mild', 'moderate', 'severe').optional()
    })).optional(),
    medicationRecommendations: Joi.array().items(Joi.object({
      medication: Joi.string().required(),
      dosage: Joi.string().allow('', null).optional(),
      frequency: Joi.string().allow('', null).optional(),
      duration: Joi.string().allow('', null).optional(),
      reason: Joi.string().required()
    })).optional(),
    nutritionAnalysis: Joi.object().optional(),
    exercisePlan: Joi.object().optional(),
    structuredData: Joi.object().optional()
  }).required(),
  confidence: Joi.number().min(0).max(1).optional(),
  quality: Joi.string().valid('high', 'medium', 'low').optional(),
  metadata: Joi.object().optional()
});

// ========== 时间序列数据点Schema ==========
const timeSeriesDataPointSchema = Joi.object({
  timestamp: Joi.string().isoDate().required(),
  value: Joi.number().required(),
  source: Joi.string().valid('wearable', 'manual', 'lab', 'ai-estimated').required(),
  quality: Joi.string().valid('high', 'medium', 'low').optional(),
  metadata: Joi.object().optional()
});

// ========== 时间序列数据Schema ==========
const timeSeriesDataSchema = Joi.object({
  metric: Joi.string().required(),
  unit: Joi.string().required(),
  dataPoints: Joi.array().items(timeSeriesDataPointSchema).required(),
  statistics: Joi.object({
    mean: Joi.number().optional(),
    median: Joi.number().optional(),
    min: Joi.number().optional(),
    max: Joi.number().optional(),
    stdDev: Joi.number().optional(),
    trend: Joi.string().valid('increasing', 'decreasing', 'stable').optional()
  }).optional(),
  lastUpdated: Joi.string().isoDate().required()
});

// ========== 干预历史Schema ==========
const interventionHistorySchema = Joi.object({
  interventionId: Joi.string().required(),
  type: Joi.string().valid('medication', 'nutrition', 'exercise', 'lifestyle', 'other').required(),
  startDate: Joi.string().isoDate().required(),
  endDate: Joi.string().isoDate().allow('', null).optional(),
  status: Joi.string().valid('active', 'completed', 'discontinued').required(),
  details: Joi.object({
    description: Joi.string().required(),
    parameters: Joi.any().optional(),
    targetOutcomes: Joi.array().items(Joi.string()).optional()
  }).required(),
  effectiveness: Joi.array().items(Joi.object({
    measuredAt: Joi.string().isoDate().required(),
    metrics: Joi.array().items(Joi.object({
      metric: Joi.string().required(),
      before: Joi.number().required(),
      after: Joi.number().required(),
      improvement: Joi.number().required()
    })).required(),
    overallRating: Joi.string().valid('excellent', 'good', 'fair', 'poor').optional(),
    notes: Joi.string().allow('', null).optional()
  })).optional(),
  userFeedback: Joi.array().items(Joi.object({
    rating: Joi.number().min(1).max(5).required(),
    comments: Joi.string().allow('', null).optional(),
    date: Joi.string().isoDate().required()
  })).optional()
});

// ========== 个人健康档案Schema ==========
const personalHealthRecordSchema = Joi.object({
  userEmail: Joi.string().email().required(),
  basicInfo: Joi.object({
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
  }).optional(),
  medicalHistory: Joi.alternatives().try(
    Joi.string(),
    Joi.array().items(Joi.object()),
    Joi.object()
  ).allow('', null).optional(),
  medications: Joi.alternatives().try(
    Joi.string(),
    Joi.array().items(Joi.object()),
    Joi.object()
  ).allow('', null).optional(),
  familyHistory: Joi.alternatives().try(
    Joi.string(),
    Joi.array().items(Joi.object()),
    Joi.object()
  ).allow('', null).optional(),
  allergies: Joi.alternatives().try(
    Joi.string(),
    Joi.array().items(Joi.object()),
    Joi.object()
  ).allow('', null).optional(),
  surgeries: Joi.array().items(Joi.object()).optional(),
  emergencyContact: Joi.object({
    name: Joi.string().allow('', null).optional(),
    phone: Joi.string().allow('', null).optional(),
    relationship: Joi.string().allow('', null).optional(),
    address: Joi.string().allow('', null).optional()
  }).optional(),
  medicalDocuments: Joi.array().items(medicalDocumentSchema).optional(),
  wearableDataRefs: Joi.object().pattern(
    Joi.string(),
    Joi.object({
      lastSync: Joi.string().isoDate().required(),
      dataCollectionId: Joi.string().allow('', null).optional()
    })
  ).optional(),
  aiAnalyses: Joi.array().items(aiAnalysisSchema).optional(),
  // ========== 新增：时间序列数据 ==========
  timeSeriesData: Joi.object().pattern(
    Joi.string(),
    timeSeriesDataSchema
  ).optional(),
  // ========== 新增：干预历史 ==========
  interventionHistory: Joi.array().items(interventionHistorySchema).optional(),
  createdAt: Joi.date().optional(),
  updatedAt: Joi.date().optional(),
  version: Joi.number().min(1).optional()
});

// ========== 辅助函数：创建医疗文档对象 ==========
function createMedicalDocument(data) {
  const now = new Date().toISOString();
  return {
    documentId: data.documentId || `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    documentType: data.documentType || 'other',
    title: data.title || data.originalFileName || 'Untitled Document',
    description: data.description || null,
    originalFileName: data.originalFileName || '',
    fileExtension: data.fileExtension || '',
    fileInfo: {
      downloadURL: data.fileInfo?.downloadURL || '',
      storagePath: data.fileInfo?.storagePath || '',
      size: data.fileInfo?.size || 0,
      contentType: data.fileInfo?.contentType || '',
      thumbnailURL: data.fileInfo?.thumbnailURL || null
    },
    medicalInfo: {
      institution: data.medicalInfo?.institution || null,
      department: data.medicalInfo?.department || null,
      doctorName: data.medicalInfo?.doctorName || null,
      visitDate: data.medicalInfo?.visitDate || null,
      diagnosis: data.medicalInfo?.diagnosis || null,
      chiefComplaint: data.medicalInfo?.chiefComplaint || null,
      treatment: data.medicalInfo?.treatment || null,
      notes: data.medicalInfo?.notes || null
    },
    imagingInfo: data.imagingInfo || null,
    aiExtraction: data.aiExtraction || null,
    uploadedAt: data.uploadedAt || now,
    createdAt: data.createdAt || now,
    updatedAt: data.updatedAt || now
  };
}

// ========== 辅助函数：创建AI分析对象 ==========
function createAIAnalysis(data) {
  const now = new Date().toISOString();
  return {
    analysisId: data.analysisId || `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    analysisType: data.analysisType || 'other',
    aiProvider: data.aiProvider || 'unknown',
    aiModel: data.aiModel || 'unknown',
    analysisDate: data.analysisDate || now,
    processingTime: data.processingTime || null,
    inputData: data.inputData || {},
    results: data.results || {
      summary: data.summary || ''
    },
    confidence: data.confidence || null,
    quality: data.quality || null,
    metadata: data.metadata || {}
  };
}


// ========== 辅助函数：创建时间序列数据对象 ==========
function createTimeSeriesData(metric, unit, dataPoints = []) {
  const now = new Date().toISOString();
  return {
    metric: metric,
    unit: unit,
    dataPoints: dataPoints,
    statistics: null, // 可以后续计算
    lastUpdated: now
  };
}

// ========== 辅助函数：创建干预历史对象 ==========
function createInterventionHistory(data) {
  const now = new Date().toISOString();
  return {
    interventionId: data.interventionId || `intervention_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: data.type || 'other',
    startDate: data.startDate || now,
    endDate: data.endDate || null,
    status: data.status || 'active',
    details: {
      description: data.details?.description || '',
      parameters: data.details?.parameters || {},
      targetOutcomes: data.details?.targetOutcomes || []
    },
    effectiveness: data.effectiveness || [],
    userFeedback: data.userFeedback || []
  };
}

module.exports = {
  MEDICAL_DOCUMENT_TYPES,
  ANALYSIS_TYPES,
  medicalDocumentSchema,
  aiAnalysisSchema,
  timeSeriesDataSchema,
  timeSeriesDataPointSchema,
  interventionHistorySchema,
  personalHealthRecordSchema,
  createMedicalDocument,
  createAIAnalysis,
  createTimeSeriesData,
  createInterventionHistory
};
