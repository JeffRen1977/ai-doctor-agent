/**
 * 临床报告生成服务
 */

const { createReport } = require('../models/reportModels');
const aiServiceFactory = require('./aiServiceFactory');
const userSettingsService = require('./userSettingsService');
const aiProviderConfig = require('../config/aiProviderConfig');
const { userBasicInfoRepo, reportRepo } = require('../repositories');

class ReportService {
  constructor() {
    console.log('📄 Report Service initialized');
  }

  /**
   * 生成健康评估报告
   * @param {string} userEmail 用户邮箱
   * @param {Object} options 选项
   * @returns {Promise<Object>} 报告对象
   */
  async generateHealthAssessmentReport(userEmail, options = {}) {
    try {
      console.log(`📊 Generating health assessment report for user: ${userEmail}`);

      // 获取用户健康数据
      const healthRecord = await this.getUserHealthData(userEmail);
      
      // 获取用户AI设置
      const userSettings = await userSettingsService.getUserAISettings(userEmail);
      const { aiProvider, aiModel } = aiProviderConfig.getAIServiceConfig(userSettings);

      // 构建报告生成提示
      const prompt = this.buildHealthAssessmentPrompt(healthRecord, options);

      // 使用LLM生成报告内容
      const aiResult = await aiServiceFactory.analyzeHealthRecords(
        { documents: [{ text: prompt }] },
        { provider: aiProvider, model: aiModel }
      );

      if (!aiResult.success) {
        throw new Error(aiResult.error || 'AI report generation failed');
      }

      // 解析AI返回的报告内容
      const reportContent = this.parseReportContent(aiResult.analysis, healthRecord);

      // 创建报告对象
      const report = createReport({
        userEmail: userEmail,
        reportType: 'health-assessment',
        status: 'completed',
        title: options.title || `健康评估报告 - ${new Date().toLocaleDateString('zh-CN')}`,
        period: options.period || {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 最近30天
          end: new Date().toISOString()
        },
        sections: reportContent,
        aiProvider: aiProvider,
        aiModel: aiModel,
        confidence: 0.85,
        metadata: {
          version: '1.0',
          dataSources: this.extractDataSources(healthRecord),
          relatedDocuments: healthRecord.medicalDocuments?.map(doc => doc.documentId) || [],
          relatedAnalyses: healthRecord.aiAnalyses?.map(analysis => analysis.analysisId) || []
        }
      });

      await reportRepo.saveReport(report);
      console.log(`✅ Health assessment report generated: ${report.reportId}`);
      return {
        success: true,
        report: report
      };
    } catch (error) {
      console.error('❌ Error generating health assessment report:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 生成综合健康报告
   * @param {string} userEmail 用户邮箱
   * @param {Object} options 选项
   * @returns {Promise<Object>} 报告对象
   */
  async generateComprehensiveReport(userEmail, options = {}) {
    try {
      console.log(`📊 Generating comprehensive report for user: ${userEmail}`);

      // 获取用户健康数据
      const healthRecord = await this.getUserHealthData(userEmail);
      
      // 获取用户AI设置
      const userSettings = await userSettingsService.getUserAISettings(userEmail);
      const { aiProvider, aiModel } = aiProviderConfig.getAIServiceConfig(userSettings);

      // 构建综合报告生成提示
      const prompt = this.buildComprehensiveReportPrompt(healthRecord, options);

      // 使用LLM生成报告内容
      const aiResult = await aiServiceFactory.analyzeHealthRecords(
        { documents: [{ text: prompt }] },
        { provider: aiProvider, model: aiModel }
      );

      if (!aiResult.success) {
        throw new Error(aiResult.error || 'AI report generation failed');
      }

      // 解析AI返回的报告内容
      const reportContent = this.parseReportContent(aiResult.analysis, healthRecord);

      // 创建报告对象
      const report = createReport({
        userEmail: userEmail,
        reportType: 'comprehensive-report',
        status: 'completed',
        title: options.title || `综合健康报告 - ${new Date().toLocaleDateString('zh-CN')}`,
        period: options.period || {
          start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), // 最近90天
          end: new Date().toISOString()
        },
        sections: reportContent,
        aiProvider: aiProvider,
        aiModel: aiModel,
        confidence: 0.85,
        metadata: {
          version: '1.0',
          dataSources: this.extractDataSources(healthRecord),
          relatedDocuments: healthRecord.medicalDocuments?.map(doc => doc.documentId) || [],
          relatedAnalyses: healthRecord.aiAnalyses?.map(analysis => analysis.analysisId) || []
        }
      });

      await reportRepo.saveReport(report);
      console.log(`✅ Comprehensive report generated: ${report.reportId}`);
      return {
        success: true,
        report: report
      };
    } catch (error) {
      console.error('❌ Error generating comprehensive report:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 获取报告
   * @param {string} reportId 报告ID
   * @returns {Promise<Object>} 报告对象
   */
  async getReport(reportId) {
    try {
      const report = await reportRepo.getReport(reportId);
      if (!report) {
        return { success: false, error: 'Report not found' };
      }
      return { success: true, report };
    } catch (error) {
      console.error('❌ Error getting report:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 获取用户的报告列表
   * @param {string} userEmail 用户邮箱
   * @param {Object} filters 过滤条件
   * @returns {Promise<Object>} 报告列表
   */
  async getUserReports(userEmail, filters = {}) {
    try {
      const reports = await reportRepo.listReportsByUser(userEmail, {
        limit: filters.limit,
        reportType: filters.reportType
      });
      return { success: true, reports };
    } catch (error) {
      console.error('❌ Error getting user reports:', error);
      return { success: false, error: error.message };
    }
  }

  // ========== Helper Methods ==========

  /**
   * 获取用户健康数据（通过 Repository，便于今后换国内数据库）
   */
  async getUserHealthData(userEmail) {
    try {
      const sanitizedEmail = userEmail.replace(/[^a-zA-Z0-9@._-]/g, '_');
      const record = await userBasicInfoRepo.getFullHealthRecord(sanitizedEmail);
      return record || {};
    } catch (error) {
      console.error('❌ Error getting user health data:', error);
      return {};
    }
  }

  /**
   * 构建健康评估报告提示
   */
  buildHealthAssessmentPrompt(healthRecord, options) {
    return `请基于以下健康数据生成一份专业的健康评估报告：

用户基本信息：
${JSON.stringify(healthRecord.basicInfo || {}, null, 2)}

医疗历史：
${JSON.stringify(healthRecord.medicalHistory || {}, null, 2)}

用药记录：
${JSON.stringify(healthRecord.medications || {}, null, 2)}

最近的AI分析结果：
${JSON.stringify(healthRecord.aiAnalyses?.slice(-5) || [], null, 2)}

时间序列数据摘要：
${JSON.stringify(healthRecord.timeSeriesData || {}, null, 2)}

请生成包含以下部分的报告：
1. 执行摘要（Executive Summary）
2. 健康指标分析（Health Metrics）
3. 风险评估（Risk Assessment）
4. 建议和行动计划（Recommendations and Action Items）

请用中文回答，保持专业和详细。`;
  }

  /**
   * 构建综合报告提示
   */
  buildComprehensiveReportPrompt(healthRecord, options) {
    return `请基于以下完整健康数据生成一份综合健康报告：

${this.buildHealthAssessmentPrompt(healthRecord, options)}

干预历史：
${JSON.stringify(healthRecord.interventionHistory || [], null, 2)}

请生成一份更全面的报告，包括：
1. 执行摘要
2. 健康指标趋势分析
3. 风险评估和预测
4. 干预效果评估
5. 未来健康建议
6. 行动计划

请用中文回答，保持专业和详细。`;
  }

  /**
   * 解析报告内容
   */
  parseReportContent(aiAnalysis, healthRecord) {
    // 保存完整的AI分析内容作为执行摘要
    // AI返回的内容已经是格式化的Markdown文本
    return {
      executiveSummary: aiAnalysis || '', // 保存完整的AI分析内容
      healthMetrics: this.extractHealthMetrics(healthRecord),
      riskAssessment: this.extractRiskAssessment(healthRecord),
      recommendations: this.extractRecommendations(aiAnalysis),
      actionItems: this.extractActionItems(aiAnalysis),
      charts: []
    };
  }

  /**
   * 提取健康指标
   */
  extractHealthMetrics(healthRecord) {
    return {
      basicInfo: healthRecord.basicInfo || {},
      vitalSigns: this.calculateVitalSigns(healthRecord.timeSeriesData || {}),
      labResults: []
    };
  }

  /**
   * 计算生命体征
   */
  calculateVitalSigns(timeSeriesData) {
    const vitalSigns = {};
    for (const [metric, data] of Object.entries(timeSeriesData)) {
      if (data.statistics) {
        vitalSigns[metric] = {
          current: data.dataPoints[data.dataPoints.length - 1]?.value || null,
          average: data.statistics.mean,
          trend: data.statistics.trend
        };
      }
    }
    return vitalSigns;
  }

  /**
   * 提取风险评估
   */
  extractRiskAssessment(healthRecord) {
    const riskFactors = [];
    const latestAnalysis = healthRecord.aiAnalyses?.slice(-1)[0];
    if (latestAnalysis?.results?.riskFactors) {
      riskFactors.push(...latestAnalysis.results.riskFactors);
    }
    return riskFactors;
  }

  /**
   * 提取建议
   */
  extractRecommendations(aiAnalysis) {
    // 从AI分析中提取建议
    const recommendations = [];
    const lines = aiAnalysis.split('\n');
    for (const line of lines) {
      if (line.includes('建议') || line.includes('推荐')) {
        recommendations.push(line.trim());
      }
    }
    return recommendations.slice(0, 10); // 最多10条
  }

  /**
   * 提取行动计划
   */
  extractActionItems(aiAnalysis) {
    const actionItems = [];
    const lines = aiAnalysis.split('\n');
    for (const line of lines) {
      if (line.includes('行动') || line.includes('步骤') || line.match(/^\d+\./)) {
        actionItems.push({
          description: line.trim(),
          priority: 'medium',
          dueDate: null
        });
      }
    }
    return actionItems.slice(0, 10); // 最多10条
  }

  /**
   * 提取数据源
   */
  extractDataSources(healthRecord) {
    const sources = [];
    if (healthRecord.medicalDocuments?.length > 0) {
      sources.push('medical-documents');
    }
    if (healthRecord.timeSeriesData && Object.keys(healthRecord.timeSeriesData).length > 0) {
      sources.push('time-series-data');
    }
    if (healthRecord.aiAnalyses?.length > 0) {
      sources.push('ai-analyses');
    }
    if (healthRecord.interventionHistory?.length > 0) {
      sources.push('intervention-history');
    }
    return sources;
  }
}

module.exports = new ReportService();
