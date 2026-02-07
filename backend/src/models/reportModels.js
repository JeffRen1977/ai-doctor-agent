/**
 * 临床报告数据模型和验证Schema
 */

const Joi = require('joi');

// ========== 报告类型枚举 ==========
const REPORT_TYPES = [
  'health-assessment',      // 健康评估报告
  'checkup-summary',        // 体检总结报告
  'follow-up-report',       // 随访报告
  'risk-assessment',        // 风险评估报告
  'treatment-plan',         // 治疗方案报告
  'progress-report',        // 进展报告
  'comprehensive-report',   // 综合健康报告
  'other'                   // 其他
];

// ========== 报告状态枚举 ==========
const REPORT_STATUS = [
  'draft',          // 草稿
  'generating',     // 生成中
  'completed',      // 已完成
  'archived'        // 已归档
];

// ========== 报告Schema ==========
const reportSchema = Joi.object({
  reportId: Joi.string().required(),
  userEmail: Joi.string().email().required(),
  reportType: Joi.string().valid(...REPORT_TYPES).required(),
  status: Joi.string().valid(...REPORT_STATUS).required(),
  title: Joi.string().required(),
  generatedAt: Joi.string().isoDate().required(),
  period: Joi.object({
    start: Joi.string().isoDate().required(),
    end: Joi.string().isoDate().required()
  }).optional(),
  sections: Joi.object({
    executiveSummary: Joi.string().allow('', null).optional(),
    healthMetrics: Joi.object().optional(),
    riskAssessment: Joi.array().items(Joi.object()).optional(),
    recommendations: Joi.array().items(Joi.string()).optional(),
    actionItems: Joi.array().items(Joi.object()).optional(),
    charts: Joi.array().items(Joi.object()).optional(),
    attachments: Joi.array().items(Joi.string()).optional()
  }).required(),
  aiProvider: Joi.string().required(),
  aiModel: Joi.string().required(),
  confidence: Joi.number().min(0).max(1).optional(),
  fileInfo: Joi.object({
    pdfURL: Joi.string().uri().allow('', null).optional(),
    pdfPath: Joi.string().allow('', null).optional(),
    size: Joi.number().min(0).optional(),
    generatedAt: Joi.string().isoDate().allow(null).optional()
  }).optional(),
  metadata: Joi.object({
    version: Joi.string().optional(),
    dataSources: Joi.array().items(Joi.string()).optional(),
    relatedAppointments: Joi.array().items(Joi.string()).optional(),
    relatedDocuments: Joi.array().items(Joi.string()).optional(),
    relatedAnalyses: Joi.array().items(Joi.string()).optional()
  }).optional(),
  createdAt: Joi.string().isoDate().required(),
  updatedAt: Joi.string().isoDate().required()
});

// ========== 辅助函数：创建报告对象 ==========
function createReport(data) {
  const now = new Date().toISOString();
  return {
    reportId: data.reportId || `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userEmail: data.userEmail,
    reportType: data.reportType || 'health-assessment',
    status: data.status || 'draft',
    title: data.title || 'Health Report',
    generatedAt: data.generatedAt || now,
    period: data.period || null,
    sections: {
      executiveSummary: data.sections?.executiveSummary || null,
      healthMetrics: data.sections?.healthMetrics || {},
      riskAssessment: data.sections?.riskAssessment || [],
      recommendations: data.sections?.recommendations || [],
      actionItems: data.sections?.actionItems || [],
      charts: data.sections?.charts || [],
      attachments: data.sections?.attachments || []
    },
    aiProvider: data.aiProvider || 'unknown',
    aiModel: data.aiModel || 'unknown',
    confidence: data.confidence || null,
    fileInfo: data.fileInfo || null,
    metadata: {
      version: data.metadata?.version || '1.0',
      dataSources: data.metadata?.dataSources || [],
      relatedAppointments: data.metadata?.relatedAppointments || [],
      relatedDocuments: data.metadata?.relatedDocuments || [],
      relatedAnalyses: data.metadata?.relatedAnalyses || []
    },
    createdAt: data.createdAt || now,
    updatedAt: data.updatedAt || now
  };
}

module.exports = {
  REPORT_TYPES,
  REPORT_STATUS,
  reportSchema,
  createReport
};
