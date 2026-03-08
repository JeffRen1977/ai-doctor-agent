const aiServiceFactory = require('./aiServiceFactory');
const wearableService = require('./wearableService');
const userSettingsService = require('./userSettingsService');
const aiProviderConfig = require('../config/aiProviderConfig');
const { userBasicInfoRepo, digitalTwinRepo, userWearablesRepo, healthRecordRepo } = require('../repositories');

/**
 * 数字孪生服务
 * 整合各种健康数据，使用LLM进行模拟预测和风险评估
 */
class DigitalTwinService {
  constructor() {
    console.log('🤖 Digital Twin Service initialized');
  }

  /**
   * 整合用户的所有健康数据
   * 从多个数据源收集并整合健康数据，构建完整的健康画像
   * 
   * @param {string} userEmail 用户邮箱
   * @returns {Promise<Object>} 整合后的健康数据
   */
  async aggregateUserHealthData(userEmail) {
    try {
      console.log(`📊 Aggregating health data for user: ${userEmail}`);
      
      const aggregatedData = {
        profile: {
          demographics: {},
          medicalHistory: [],
          geneticInfo: {},
          lifestyle: {}
        },
        currentState: {
          vitalSigns: {},
          labResults: {},
          medications: [],
          wearableData: {},
          activeInterventions: [],
          latestAnalysis: null,
          healthScore: null,
          riskFactors: []
        },
        historicalData: {
          healthRecords: [],
          wearableHistory: [],
          analysisHistory: [],
          timeSeriesData: {},
          interventionHistory: [],
          medicalDocuments: []
        }
      };

      const sanitizedEmail = userEmail.replace(/[^a-zA-Z0-9@._-]/g, '_');

      // ========== 1. 通过 Repository 获取个人健康档案（便于今后换国内数据库） ==========
      try {
        const personalData = await userBasicInfoRepo.getFullHealthRecord(sanitizedEmail);
        
        if (personalData) {
          // 1.1 基本信息
          aggregatedData.profile.demographics = personalData.basicInfo || {};
          
          // 1.2 医疗历史
          aggregatedData.profile.medicalHistory = personalData.medicalHistory || '';
          
          // 1.3 生活方式信息
          aggregatedData.profile.lifestyle = {
            medications: Array.isArray(personalData.medications)
              ? personalData.medications.map((m) => (typeof m === 'string' ? m : m.name)).join(', ')
              : '',
            allergies: personalData.allergies || '',
            familyHistory: personalData.familyHistory || ''
          };
          
          // 1.4 用药记录（当前状态，来自子集合）
          aggregatedData.currentState.medications = Array.isArray(personalData.medications)
            ? personalData.medications
            : [];
          
          // 1.5 遗传信息提取（从家族史中提取）
          if (personalData.familyHistory) {
            aggregatedData.profile.geneticInfo = this.extractGeneticInfo(personalData.familyHistory);
          }
          
          // 1.6 时间序列数据整合
          if (personalData.timeSeriesData) {
            // 提取当前生命体征（最新数据点）
            for (const [metric, data] of Object.entries(personalData.timeSeriesData)) {
              if (data.dataPoints && data.dataPoints.length > 0) {
                const latestPoint = data.dataPoints[data.dataPoints.length - 1];
                aggregatedData.currentState.vitalSigns[metric] = {
                  value: latestPoint.value,
                  unit: data.unit,
                  timestamp: latestPoint.timestamp,
                  source: latestPoint.source
                };
              }
              // 添加统计信息（均值、趋势等）
              if (data.statistics) {
                aggregatedData.currentState.vitalSigns[`${metric}_stats`] = data.statistics;
              }
            }
            // 保存完整时间序列历史数据
            aggregatedData.historicalData.timeSeriesData = personalData.timeSeriesData;
          }
          
          // 1.7 干预历史整合
          if (personalData.interventionHistory && Array.isArray(personalData.interventionHistory)) {
            aggregatedData.historicalData.interventionHistory = personalData.interventionHistory;
            // 提取当前活跃的干预
            const activeInterventions = personalData.interventionHistory.filter(
              intervention => intervention.status === 'active'
            );
            aggregatedData.currentState.activeInterventions = activeInterventions;
          }
          
          // 1.8 AI分析结果整合
          if (personalData.aiAnalyses && Array.isArray(personalData.aiAnalyses)) {
            // 保存分析历史（最近20次）
            aggregatedData.historicalData.analysisHistory = personalData.aiAnalyses.slice(-20);
            
            // 提取最新的分析结果
            if (personalData.aiAnalyses.length > 0) {
              const latestAnalysis = personalData.aiAnalyses[personalData.aiAnalyses.length - 1];
              aggregatedData.currentState.latestAnalysis = latestAnalysis;
              
              // 提取健康评分
              if (latestAnalysis.results?.healthScore) {
                aggregatedData.currentState.healthScore = latestAnalysis.results.healthScore;
              }
              
              // 提取风险因素
              if (latestAnalysis.results?.riskFactors) {
                aggregatedData.currentState.riskFactors = latestAnalysis.results.riskFactors;
              }
            }
          }
          
          // 1.9 医疗文档整合
          if (personalData.medicalDocuments && Array.isArray(personalData.medicalDocuments)) {
            aggregatedData.historicalData.medicalDocuments = personalData.medicalDocuments;
            // 提取最近的检验结果
            const labReports = personalData.medicalDocuments.filter(
              doc => doc.documentType === 'lab-report'
            );
            if (labReports.length > 0) {
              aggregatedData.currentState.labResults = labReports.slice(-5); // 最近5次检验
            }
          }
        }
      } catch (error) {
        console.error('❌ Error fetching personal health record:', error);
      }

      // ========== 2. 获取可穿戴设备数据 ==========
      try {
        // 2.1 获取当前可穿戴设备数据
        if (wearableService.getUserWearableData) {
          const fitbitData = await wearableService.getUserWearableData(userEmail, 'fitbit');
          const appleData = await wearableService.getUserWearableData(userEmail, 'apple');
          
          if (fitbitData) {
            aggregatedData.currentState.wearableData.fitbit = fitbitData;
          }
          if (appleData) {
            aggregatedData.currentState.wearableData.apple = appleData;
          }
        } else {
          const data = await userWearablesRepo.getUserWearables(userEmail);
          if (data) {
            if (data.fitbitData) aggregatedData.currentState.wearableData.fitbit = data.fitbitData;
            if (data.appleData) aggregatedData.currentState.wearableData.apple = data.appleData;
          }
        }
        
        // 2.2 获取可穿戴设备历史数据
        try {
          aggregatedData.historicalData.wearableHistory = await userWearablesRepo.listHistoryByUser(userEmail, { limit: 30 });
        } catch (historyError) {
          if (historyError.code !== 'failed-precondition') {
            console.warn('⚠️ Could not fetch wearable history:', historyError.message);
          }
        }
      } catch (error) {
        console.error('❌ Error fetching wearable data:', error);
      }

      // ========== 3. 获取健康记录历史 ==========
      try {
        aggregatedData.historicalData.healthRecords = await healthRecordRepo.listByUser(userEmail, { limit: 20 });
      } catch (error) {
        if (error.code !== 'failed-precondition') {
          console.error('❌ Error fetching health records:', error);
        }
      }

      console.log('✅ Health data aggregation completed');
      return aggregatedData;
    } catch (error) {
      console.error('❌ Error aggregating health data:', error);
      throw error;
    }
  }

  /**
   * 从家族史中提取遗传信息
   * @param {string|Object} familyHistory 家族史数据
   * @returns {Object} 提取的遗传信息
   */
  extractGeneticInfo(familyHistory) {
    try {
      const familyHistoryText = typeof familyHistory === 'string' 
        ? familyHistory 
        : JSON.stringify(familyHistory);
      
      const text = familyHistoryText.toLowerCase();
      
      return {
        hasFamilyDiabetes: /糖尿病|diabetes|diabetic/i.test(familyHistoryText),
        hasFamilyCardiovascular: /心脏病|心血管|heart|cardiovascular|cardiac/i.test(familyHistoryText),
        hasFamilyHypertension: /高血压|hypertension|high\s*blood\s*pressure/i.test(familyHistoryText),
        hasFamilyCancer: /癌症|cancer|tumor|tumour|malignancy/i.test(familyHistoryText),
        hasFamilyObesity: /肥胖|obesity|overweight/i.test(familyHistoryText),
        hasFamilyStroke: /中风|stroke|脑卒中|cerebrovascular/i.test(familyHistoryText),
        hasFamilyKidneyDisease: /肾病|kidney|renal|nephropathy/i.test(familyHistoryText),
        rawText: familyHistoryText
      };
    } catch (error) {
      console.error('❌ Error extracting genetic info:', error);
      return {};
    }
  }

  /**
   * 构建数字孪生模型
   * 基于整合的健康数据，使用LLM构建虚拟生理模型
   * 
   * @param {string} userEmail 用户邮箱
   * @returns {Promise<Object>} 构建结果，包含数字孪生模型
   */
  async buildDigitalTwin(userEmail) {
    try {
      console.log(`🏗️ Building digital twin for user: ${userEmail}`);
      
      // 1. 整合所有健康数据
      const healthData = await this.aggregateUserHealthData(userEmail);
      
      // 2. 获取用户AI设置（优先使用OpenAI，如果可用）
      const userSettings = await userSettingsService.getUserAISettings(userEmail);
      const { aiProvider, aiModel } = aiProviderConfig.getAIServiceConfig(userSettings);
      
      // 3. 构建LLM提示词
      const prompt = this.buildDigitalTwinPrompt(healthData);
      
      // 4. 调用LLM分析
      const aiResult = await aiServiceFactory.analyzeHealthRecords(
        { documents: [{ text: prompt }] },
        { provider: aiProvider, model: aiModel }
      );
      
      if (!aiResult.success) {
        throw new Error(aiResult.error || 'AI analysis failed');
      }
      
      // 5. 解析AI返回的模型数据
      const modelData = this.parseDigitalTwinModel(aiResult.analysis, healthData);
      
      // 6. 构建数字孪生模型对象
      const sanitizedEmail = userEmail.replace(/[^a-zA-Z0-9@._-]/g, '_');
      const digitalTwin = {
        userId: userEmail,
        profile: healthData.profile,
        currentState: healthData.currentState,
        model: modelData,
        lastUpdated: new Date(),
        version: 1,
        metadata: {
          aiProvider: aiProvider,
          aiModel: aiModel,
          buildDate: new Date().toISOString()
        }
      };
      
      await digitalTwinRepo.setDigitalTwin(userEmail, digitalTwin);
      console.log('✅ Digital twin built successfully');
      return {
        success: true,
        digitalTwin: digitalTwin
      };
    } catch (error) {
      console.error('❌ Error building digital twin:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 更新数字孪生模型数据
   * 当有新的健康数据时，更新模型以保持同步
   * 
   * @param {string} userEmail 用户邮箱
   * @param {Object} newData 新数据
   * @returns {Promise<Object>} 更新结果
   */
  async updateDigitalTwin(userEmail, newData) {
    try {
      console.log(`🔄 Updating digital twin for user: ${userEmail}`);
      const currentTwin = await digitalTwinRepo.getDigitalTwin(userEmail);
      if (!currentTwin) {
        console.log('⚠️ Digital twin not found, building new one...');
        return await this.buildDigitalTwin(userEmail);
      }
      const updatedTwin = {
        ...currentTwin,
        ...newData,
        lastUpdated: new Date(),
        version: (currentTwin.version || 1) + 1
      };
      await digitalTwinRepo.setDigitalTwin(userEmail, updatedTwin);
      console.log('✅ Digital twin updated successfully');
      return { success: true, digitalTwin: updatedTwin };
    } catch (error) {
      console.error('❌ Error updating digital twin:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 运行"What-if"模拟
   * 基于数字孪生模型，模拟不同场景对用户健康的影响
   * 
   * @param {string} userEmail 用户邮箱
   * @param {Object} scenario 模拟场景（如：改变用药、调整饮食、增加运动等）
   * @returns {Promise<Object>} 模拟结果，包含短期、中期、长期影响
   */
  async runSimulation(userEmail, scenario) {
    try {
      console.log(`🎮 Running simulation for user: ${userEmail}`);
      console.log('📋 Scenario:', JSON.stringify(scenario, null, 2));
      
      let digitalTwin = await digitalTwinRepo.getDigitalTwin(userEmail);
      if (!digitalTwin) {
        console.log('⚠️ Digital twin not found, building new one...');
        await this.buildDigitalTwin(userEmail);
        digitalTwin = await digitalTwinRepo.getDigitalTwin(userEmail);
        if (!digitalTwin) throw new Error('Failed to build digital twin');
      }
      const userSettings = await userSettingsService.getUserAISettings(userEmail);
      const { aiProvider, aiModel } = aiProviderConfig.getAIServiceConfig(userSettings);
      const prompt = this.buildSimulationPrompt(digitalTwin, scenario);
      
      // 4. 调用LLM进行模拟分析
      const aiResult = await aiServiceFactory.analyzeHealthRecords(
        { documents: [{ text: prompt }] },
        { provider: aiProvider, model: aiModel }
      );
      
      if (!aiResult.success) {
        throw new Error(aiResult.error || 'AI simulation failed');
      }
      
      // 5. 解析模拟结果
      const simulationResult = this.parseSimulationResult(aiResult.analysis, scenario);
      
      console.log('✅ Simulation completed successfully');
      return {
        success: true,
        scenario: scenario,
        result: simulationResult,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Error running simulation:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 并发症风险评估
   * 评估用户在指定时间范围内发生特定并发症的风险
   * 
   * @param {string} userEmail 用户邮箱
   * @param {string} condition 目标疾病/并发症（如：糖尿病并发症、心血管疾病等）
   * @param {number} timeframe 时间范围（月），默认12个月
   * @returns {Promise<Object>} 风险评估结果，包含风险等级、评分、因素、预防措施等
   */
  async assessComplicationRisk(userEmail, condition, timeframe = 12) {
    try {
      console.log(`⚠️ Assessing complication risk for user: ${userEmail}`);
      console.log(`🔍 Condition: ${condition}, Timeframe: ${timeframe} months`);
      
      let digitalTwin = await digitalTwinRepo.getDigitalTwin(userEmail);
      if (!digitalTwin) {
        console.log('⚠️ Digital twin not found, building new one...');
        await this.buildDigitalTwin(userEmail);
        digitalTwin = await digitalTwinRepo.getDigitalTwin(userEmail);
        if (!digitalTwin) throw new Error('Failed to build digital twin');
      }
      const userSettings = await userSettingsService.getUserAISettings(userEmail);
      const { aiProvider, aiModel } = aiProviderConfig.getAIServiceConfig(userSettings);
      const prompt = this.buildRiskAssessmentPrompt(digitalTwin, condition, timeframe);
      
      // 4. 调用LLM进行风险评估
      const aiResult = await aiServiceFactory.analyzeHealthRecords(
        { documents: [{ text: prompt }] },
        { provider: aiProvider, model: aiModel }
      );
      
      if (!aiResult.success) {
        throw new Error(aiResult.error || 'AI risk assessment failed');
      }
      
      // 5. 解析风险评估结果
      const riskAssessment = this.parseRiskAssessment(aiResult.analysis, condition, timeframe);
      
      console.log('✅ Risk assessment completed successfully');
      return {
        success: true,
        condition: condition,
        timeframe: timeframe,
        assessment: riskAssessment,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Error assessing complication risk:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 健康趋势预测
   * 基于历史健康数据和数字孪生模型，预测未来一段时间内的健康趋势
   * 
   * @param {string} userEmail 用户邮箱
   * @param {number} timeframe 时间范围（月），默认6个月
   * @returns {Promise<Object>} 预测结果，包含关键指标变化、风险趋势、里程碑事件等
   */
  async generateHealthProjection(userEmail, timeframe = 6) {
    try {
      console.log(`📈 Generating health projection for user: ${userEmail}`);
      console.log(`⏱️ Timeframe: ${timeframe} months`);
      
      // 1. 获取整合的健康数据（包含历史数据）
      const healthData = await this.aggregateUserHealthData(userEmail);
      
      let digitalTwin = await digitalTwinRepo.getDigitalTwin(userEmail);
      const userSettings = await userSettingsService.getUserAISettings(userEmail);
      const { aiProvider, aiModel } = aiProviderConfig.getAIServiceConfig(userSettings);
      
      // 4. 构建预测提示词
      const prompt = this.buildProjectionPrompt(healthData, digitalTwin, timeframe);
      
      // 5. 调用LLM进行预测分析
      const aiResult = await aiServiceFactory.analyzeHealthRecords(
        { documents: [{ text: prompt }] },
        { provider: aiProvider, model: aiModel }
      );
      
      if (!aiResult.success) {
        throw new Error(aiResult.error || 'AI projection failed');
      }
      
      // 6. 解析预测结果
      const projection = this.parseProjection(aiResult.analysis, timeframe);
      
      console.log('✅ Health projection generated successfully');
      return {
        success: true,
        timeframe: timeframe,
        projection: projection,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Error generating health projection:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ========== AI服务配置方法 ==========

  // ========== LLM提示词构建方法 ==========

  /**
   * 构建数字孪生模型提示词
   * @param {Object} healthData 整合的健康数据
   * @returns {string} LLM提示词
   */
  buildDigitalTwinPrompt(healthData) {
    return `作为专业的医疗AI助手，请基于以下健康数据构建一个数字孪生模型（虚拟生理模型）。

用户健康数据：
${JSON.stringify(healthData, null, 2)}

请分析并构建以下模型组件：
1. 心血管系统模型：基于血压、心率、胆固醇等数据
2. 代谢系统模型：基于血糖、体重、饮食等数据
3. 糖尿病风险评估模型：如果有相关数据
4. 整体健康状况评分

请以JSON格式返回模型数据，包括：
- cardiovascular: { riskLevel, keyMetrics, recommendations }
- diabetes: { riskLevel, keyMetrics, recommendations }
- metabolic: { riskLevel, keyMetrics, recommendations }
- overallHealthScore: number (0-100)
- keyRiskFactors: array
- personalizedRecommendations: array`;
  }

  /**
   * 构建What-if模拟提示词
   * @param {Object} digitalTwin 数字孪生模型
   * @param {Object} scenario 模拟场景
   * @returns {string} LLM提示词
   */
  buildSimulationPrompt(digitalTwin, scenario) {
    return `作为专业的医疗AI助手，请基于数字孪生模型运行"What-if"模拟分析。

当前数字孪生模型：
${JSON.stringify(digitalTwin, null, 2)}

模拟场景：
${JSON.stringify(scenario, null, 2)}

请分析如果实施这个场景，对用户健康的影响：
1. 短期影响（1-3个月）
2. 中期影响（3-6个月）
3. 长期影响（6-12个月）
4. 风险评估
5. 建议和注意事项

请以JSON格式返回结果，包括：
- shortTermImpact: { description, riskChanges, metricChanges }
- mediumTermImpact: { description, riskChanges, metricChanges }
- longTermImpact: { description, riskChanges, metricChanges }
- overallRisk: { level, factors }
- recommendations: array`;
  }

  /**
   * 构建并发症风险评估提示词
   * @param {Object} digitalTwin 数字孪生模型
   * @param {string} condition 目标疾病/并发症
   * @param {number} timeframe 时间范围（月）
   * @returns {string} LLM提示词
   */
  buildRiskAssessmentPrompt(digitalTwin, condition, timeframe) {
    return `作为专业的医疗AI助手，请评估用户在指定时间范围内发生并发症的风险。

数字孪生模型：
${JSON.stringify(digitalTwin, null, 2)}

目标疾病/并发症：${condition}
时间范围：${timeframe}个月

请提供详细的风险评估：
1. 风险等级（低/中/高）
2. 风险评分（0-100）
3. 主要风险因素
4. 预防措施建议
5. 监测指标建议

请以JSON格式返回，包括：
- riskLevel: string (low/medium/high)
- riskScore: number (0-100)
- riskFactors: array
- preventionMeasures: array
- monitoringIndicators: array
- timeline: { milestones, criticalPeriods }`;
  }

  /**
   * 构建健康趋势预测提示词
   * @param {Object} healthData 整合的健康数据
   * @param {Object|null} digitalTwin 数字孪生模型（可选）
   * @param {number} timeframe 时间范围（月）
   * @returns {string} LLM提示词
   */
  buildProjectionPrompt(healthData, digitalTwin, timeframe) {
    return `作为专业的医疗AI助手，请基于用户的健康数据和数字孪生模型，预测未来${timeframe}个月的健康趋势。

健康数据：
${JSON.stringify(healthData, null, 2)}

数字孪生模型：
${digitalTwin ? JSON.stringify(digitalTwin, null, 2) : '尚未构建'}

请提供健康趋势预测：
1. 关键健康指标的变化趋势
2. 潜在健康风险
3. 改善建议
4. 里程碑事件预测

请以JSON格式返回，包括：
- keyMetrics: { metric: { current, projected, trend } }
- riskTrends: array
- milestones: array
- recommendations: array
- confidence: number (0-1)`;
  }

  // ========== LLM响应解析方法 ==========

  /**
   * 解析数字孪生模型
   * 从LLM返回的文本中提取JSON格式的模型数据
   * 
   * @param {string} aiAnalysis LLM返回的分析文本
   * @param {Object} healthData 健康数据（用于生成默认值）
   * @returns {Object} 解析后的模型数据
   */
  parseDigitalTwinModel(aiAnalysis, healthData) {
    try {
      // 尝试从AI返回中提取JSON
      const jsonMatch = aiAnalysis.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // 如果无法解析，返回默认模型结构
      return {
        cardiovascular: {
          riskLevel: 'medium',
          keyMetrics: {},
          recommendations: []
        },
        diabetes: {
          riskLevel: 'low',
          keyMetrics: {},
          recommendations: []
        },
        metabolic: {
          riskLevel: 'medium',
          keyMetrics: {},
          recommendations: []
        },
        overallHealthScore: 70,
        keyRiskFactors: [],
        personalizedRecommendations: []
      };
    } catch (error) {
      console.error('❌ Error parsing digital twin model:', error);
      return {
        cardiovascular: { riskLevel: 'medium', keyMetrics: {}, recommendations: [] },
        diabetes: { riskLevel: 'low', keyMetrics: {}, recommendations: [] },
        metabolic: { riskLevel: 'medium', keyMetrics: {}, recommendations: [] },
        overallHealthScore: 70,
        keyRiskFactors: [],
        personalizedRecommendations: []
      };
    }
  }

  /**
   * 解析What-if模拟结果
   * @param {string} aiAnalysis LLM返回的分析文本
   * @param {Object} scenario 模拟场景
   * @returns {Object} 解析后的模拟结果
   */
  parseSimulationResult(aiAnalysis, scenario) {
    try {
      const jsonMatch = aiAnalysis.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return {
        shortTermImpact: { description: aiAnalysis, riskChanges: {}, metricChanges: {} },
        mediumTermImpact: { description: '', riskChanges: {}, metricChanges: {} },
        longTermImpact: { description: '', riskChanges: {}, metricChanges: {} },
        overallRisk: { level: 'medium', factors: [] },
        recommendations: []
      };
    } catch (error) {
      console.error('❌ Error parsing simulation result:', error);
      return {
        shortTermImpact: { description: aiAnalysis, riskChanges: {}, metricChanges: {} },
        mediumTermImpact: { description: '', riskChanges: {}, metricChanges: {} },
        longTermImpact: { description: '', riskChanges: {}, metricChanges: {} },
        overallRisk: { level: 'medium', factors: [] },
        recommendations: []
      };
    }
  }

  /**
   * 解析并发症风险评估结果
   * @param {string} aiAnalysis LLM返回的分析文本
   * @param {string} condition 目标疾病/并发症
   * @param {number} timeframe 时间范围（月）
   * @returns {Object} 解析后的风险评估结果
   */
  parseRiskAssessment(aiAnalysis, condition, timeframe) {
    try {
      const jsonMatch = aiAnalysis.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return {
        riskLevel: 'medium',
        riskScore: 50,
        riskFactors: [],
        preventionMeasures: [],
        monitoringIndicators: [],
        timeline: { milestones: [], criticalPeriods: [] }
      };
    } catch (error) {
      console.error('❌ Error parsing risk assessment:', error);
      return {
        riskLevel: 'medium',
        riskScore: 50,
        riskFactors: [],
        preventionMeasures: [],
        monitoringIndicators: [],
        timeline: { milestones: [], criticalPeriods: [] }
      };
    }
  }

  /**
   * 解析健康趋势预测结果
   * @param {string} aiAnalysis LLM返回的分析文本
   * @param {number} timeframe 时间范围（月）
   * @returns {Object} 解析后的预测结果
   */
  parseProjection(aiAnalysis, timeframe) {
    try {
      const jsonMatch = aiAnalysis.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return {
        keyMetrics: {},
        riskTrends: [],
        milestones: [],
        recommendations: [],
        confidence: 0.7
      };
    } catch (error) {
      console.error('❌ Error parsing projection:', error);
      return {
        keyMetrics: {},
        riskTrends: [],
        milestones: [],
        recommendations: [],
        confidence: 0.7
      };
    }
  }
}

module.exports = new DigitalTwinService();
