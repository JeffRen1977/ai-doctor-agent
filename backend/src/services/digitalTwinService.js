const { db } = require('../config/firebase');
const { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, orderBy, limit } = require('firebase/firestore');
const aiServiceFactory = require('./aiServiceFactory');
const firebaseService = require('./firebaseService');
const wearableService = require('./wearableService');
const userSettingsService = require('./userSettingsService');

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
          wearableData: {}
        },
        historicalData: {
          healthRecords: [],
          wearableHistory: [],
          analysisHistory: []
        }
      };

      // 1. 获取个人健康档案
      try {
        const sanitizedEmail = userEmail.replace(/[^a-zA-Z0-9@._-]/g, '_');
        const personalHealthRef = doc(db, 'personalHealthRecords', sanitizedEmail);
        const personalHealthDoc = await getDoc(personalHealthRef);
        
        if (personalHealthDoc.exists()) {
          const personalData = personalHealthDoc.data();
          aggregatedData.profile.demographics = personalData.basicInfo || {};
          aggregatedData.profile.medicalHistory = personalData.medicalHistory || '';
          aggregatedData.profile.lifestyle = {
            medications: personalData.medications || '',
            allergies: personalData.allergies || '',
            familyHistory: personalData.familyHistory || ''
          };
          aggregatedData.currentState.medications = personalData.medications ? 
            personalData.medications.split(',').map(m => m.trim()) : [];
        }
      } catch (error) {
        console.error('❌ Error fetching personal health record:', error);
      }

      // 2. 获取可穿戴设备数据
      try {
        // wearableService 导出的是一个对象，需要检查方法名
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
          // 如果方法不存在，尝试直接从 Firestore 获取
          const { doc, getDoc } = require('firebase/firestore');
          const userWearablesRef = doc(db, 'userWearables', userEmail);
          const userWearablesDoc = await getDoc(userWearablesRef);
          
          if (userWearablesDoc.exists()) {
            const data = userWearablesDoc.data();
            if (data.fitbitData) {
              aggregatedData.currentState.wearableData.fitbit = data.fitbitData;
            }
            if (data.appleData) {
              aggregatedData.currentState.wearableData.apple = data.appleData;
            }
          }
        }
      } catch (error) {
        console.error('❌ Error fetching wearable data:', error);
      }

      // 3. 获取健康分析历史
      try {
        const healthRecordsRef = collection(db, 'healthRecords');
        const sanitizedEmail = userEmail.replace(/[^a-zA-Z0-9@._-]/g, '_');
        const healthRecordRef = doc(healthRecordsRef, sanitizedEmail);
        const healthRecordDoc = await getDoc(healthRecordRef);
        
        if (healthRecordDoc.exists()) {
          const healthData = healthRecordDoc.data();
          if (healthData.analyses && Array.isArray(healthData.analyses)) {
            aggregatedData.historicalData.analysisHistory = healthData.analyses.slice(-10); // 最近10次分析
          }
        }
      } catch (error) {
        console.error('❌ Error fetching health analysis history:', error);
      }

      // 4. 获取健康记录
      try {
        const healthRecordsRef = collection(db, 'healthRecords');
        const q = query(
          healthRecordsRef,
          where('userEmail', '==', userEmail),
          orderBy('createdAt', 'desc'),
          limit(20)
        );
        const querySnapshot = await getDocs(q);
        aggregatedData.historicalData.healthRecords = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      } catch (error) {
        console.error('❌ Error fetching health records:', error);
      }

      console.log('✅ Health data aggregation completed');
      return aggregatedData;
    } catch (error) {
      console.error('❌ Error aggregating health data:', error);
      throw error;
    }
  }

  /**
   * 构建数字孪生模型
   * @param {string} userEmail 用户邮箱
   * @returns {Promise<Object>} 数字孪生模型
   */
  async buildDigitalTwin(userEmail) {
    try {
      console.log(`🏗️ Building digital twin for user: ${userEmail}`);
      
      // 整合所有健康数据
      const healthData = await this.aggregateUserHealthData(userEmail);
      
      // 获取用户AI设置
      const userSettings = await userSettingsService.getUserAISettings(userEmail);
      const aiProvider = userSettings.success ? (userSettings.aiProvider || 'gemini') : 'gemini';
      const aiModel = userSettings.success ? (userSettings.aiModel || '') : '';
      
      // 使用LLM构建数字孪生模型
      const prompt = this.buildDigitalTwinPrompt(healthData);
      
      const aiResult = await aiServiceFactory.analyzeHealthRecords(
        { documents: [{ text: prompt }] },
        { provider: aiProvider, model: aiModel }
      );
      
      if (!aiResult.success) {
        throw new Error(aiResult.error || 'AI analysis failed');
      }
      
      // 解析AI返回的模型数据
      const modelData = this.parseDigitalTwinModel(aiResult.analysis, healthData);
      
      // 保存数字孪生模型到Firestore
      const sanitizedEmail = userEmail.replace(/[^a-zA-Z0-9@._-]/g, '_');
      const digitalTwinRef = doc(db, 'digitalTwins', sanitizedEmail);
      
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
      
      await setDoc(digitalTwinRef, digitalTwin, { merge: true });
      
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
   * @param {string} userEmail 用户邮箱
   * @param {Object} newData 新数据
   * @returns {Promise<Object>} 更新结果
   */
  async updateDigitalTwin(userEmail, newData) {
    try {
      console.log(`🔄 Updating digital twin for user: ${userEmail}`);
      
      const sanitizedEmail = userEmail.replace(/[^a-zA-Z0-9@._-]/g, '_');
      const digitalTwinRef = doc(db, 'digitalTwins', sanitizedEmail);
      const digitalTwinDoc = await getDoc(digitalTwinRef);
      
      if (!digitalTwinDoc.exists()) {
        // 如果不存在，先构建
        return await this.buildDigitalTwin(userEmail);
      }
      
      const currentTwin = digitalTwinDoc.data();
      
      // 更新数据
      const updatedTwin = {
        ...currentTwin,
        ...newData,
        lastUpdated: new Date(),
        version: (currentTwin.version || 1) + 1
      };
      
      await updateDoc(digitalTwinRef, updatedTwin);
      
      console.log('✅ Digital twin updated successfully');
      return {
        success: true,
        digitalTwin: updatedTwin
      };
    } catch (error) {
      console.error('❌ Error updating digital twin:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 运行"What-if"模拟
   * @param {string} userEmail 用户邮箱
   * @param {Object} scenario 模拟场景
   * @returns {Promise<Object>} 模拟结果
   */
  async runSimulation(userEmail, scenario) {
    try {
      console.log(`🎮 Running simulation for user: ${userEmail}`);
      console.log('📋 Scenario:', scenario);
      
      // 获取数字孪生模型
      const sanitizedEmail = userEmail.replace(/[^a-zA-Z0-9@._-]/g, '_');
      const digitalTwinRef = doc(db, 'digitalTwins', sanitizedEmail);
      const digitalTwinDoc = await getDoc(digitalTwinRef);
      
      if (!digitalTwinDoc.exists()) {
        // 如果不存在，先构建
        await this.buildDigitalTwin(userEmail);
      }
      
      const digitalTwin = digitalTwinDoc.data();
      
      // 获取用户AI设置
      const userSettings = await userSettingsService.getUserAISettings(userEmail);
      const aiProvider = userSettings.success ? (userSettings.aiProvider || 'gemini') : 'gemini';
      const aiModel = userSettings.success ? (userSettings.aiModel || '') : '';
      
      // 构建模拟提示
      const prompt = this.buildSimulationPrompt(digitalTwin, scenario);
      
      // 使用LLM进行模拟
      const aiResult = await aiServiceFactory.analyzeHealthRecords(
        { documents: [{ text: prompt }] },
        { provider: aiProvider, model: aiModel }
      );
      
      if (!aiResult.success) {
        throw new Error(aiResult.error || 'AI simulation failed');
      }
      
      // 解析模拟结果
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
   * @param {string} userEmail 用户邮箱
   * @param {string} condition 疾病条件
   * @param {number} timeframe 时间范围（月）
   * @returns {Promise<Object>} 风险评估结果
   */
  async assessComplicationRisk(userEmail, condition, timeframe = 12) {
    try {
      console.log(`⚠️ Assessing complication risk for user: ${userEmail}`);
      console.log(`🔍 Condition: ${condition}, Timeframe: ${timeframe} months`);
      
      // 获取数字孪生模型
      const sanitizedEmail = userEmail.replace(/[^a-zA-Z0-9@._-]/g, '_');
      const digitalTwinRef = doc(db, 'digitalTwins', sanitizedEmail);
      const digitalTwinDoc = await getDoc(digitalTwinRef);
      
      if (!digitalTwinDoc.exists()) {
        // 如果不存在，先构建
        await this.buildDigitalTwin(userEmail);
      }
      
      const digitalTwin = digitalTwinDoc.data();
      
      // 获取用户AI设置
      const userSettings = await userSettingsService.getUserAISettings(userEmail);
      const aiProvider = userSettings.success ? (userSettings.aiProvider || 'gemini') : 'gemini';
      const aiModel = userSettings.success ? (userSettings.aiModel || '') : '';
      
      // 构建风险评估提示
      const prompt = this.buildRiskAssessmentPrompt(digitalTwin, condition, timeframe);
      
      // 使用LLM进行风险评估
      const aiResult = await aiServiceFactory.analyzeHealthRecords(
        { documents: [{ text: prompt }] },
        { provider: aiProvider, model: aiModel }
      );
      
      if (!aiResult.success) {
        throw new Error(aiResult.error || 'AI risk assessment failed');
      }
      
      // 解析风险评估结果
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
   * @param {string} userEmail 用户邮箱
   * @param {number} timeframe 时间范围（月）
   * @returns {Promise<Object>} 预测结果
   */
  async generateHealthProjection(userEmail, timeframe = 6) {
    try {
      console.log(`📈 Generating health projection for user: ${userEmail}`);
      console.log(`⏱️ Timeframe: ${timeframe} months`);
      
      // 获取数字孪生模型和历史数据
      const healthData = await this.aggregateUserHealthData(userEmail);
      
      const sanitizedEmail = userEmail.replace(/[^a-zA-Z0-9@._-]/g, '_');
      const digitalTwinRef = doc(db, 'digitalTwins', sanitizedEmail);
      const digitalTwinDoc = await getDoc(digitalTwinRef);
      
      let digitalTwin = null;
      if (digitalTwinDoc.exists()) {
        digitalTwin = digitalTwinDoc.data();
      }
      
      // 获取用户AI设置
      const userSettings = await userSettingsService.getUserAISettings(userEmail);
      const aiProvider = userSettings.success ? (userSettings.aiProvider || 'gemini') : 'gemini';
      const aiModel = userSettings.success ? (userSettings.aiModel || '') : '';
      
      // 构建预测提示
      const prompt = this.buildProjectionPrompt(healthData, digitalTwin, timeframe);
      
      // 使用LLM进行预测
      const aiResult = await aiServiceFactory.analyzeHealthRecords(
        { documents: [{ text: prompt }] },
        { provider: aiProvider, model: aiModel }
      );
      
      if (!aiResult.success) {
        throw new Error(aiResult.error || 'AI projection failed');
      }
      
      // 解析预测结果
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

  /**
   * 构建数字孪生模型提示
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
   * 构建模拟提示
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
   * 构建风险评估提示
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
   * 构建预测提示
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

  /**
   * 解析数字孪生模型
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
   * 解析模拟结果
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
   * 解析风险评估结果
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
   * 解析预测结果
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
