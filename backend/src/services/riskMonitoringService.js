const { db } = require('../config/firebase');
const { doc, getDoc, collection, query, where, orderBy, limit, addDoc, getDocs } = require('firebase/firestore');
const aiServiceFactory = require('./aiServiceFactory');
const userSettingsService = require('./userSettingsService');
const openaiService = require('./openaiService');

/**
 * 实时风险监测服务
 * 利用可穿戴设备实时流数据，通过LLM分析趋势，提前预警异常情况
 */
class RiskMonitoringService {
  constructor() {
    console.log('⚠️ Risk Monitoring Service initialized');
  }

  /**
   * 处理实时流数据
   * @param {string} userEmail 用户邮箱
   * @param {string} deviceType 设备类型
   * @param {Object} data 实时数据
   * @returns {Promise<Object>} 处理结果
   */
  async processStreamData(userEmail, deviceType, data) {
    try {
      console.log(`📊 Processing stream data for user: ${userEmail}, device: ${deviceType}`);
      
      // 存储实时数据到 Firestore
      const timestamp = new Date().toISOString();
      const dataPoint = {
        userEmail,
        deviceType,
        data,
        timestamp,
        processed: false
      };

      // 保存到实时数据流集合
      const streamRef = collection(db, 'wearableStreamData');
      await addDoc(streamRef, dataPoint);

      // 不自动触发异常检测（改为手动触发）
      return {
        success: true,
        dataPoint
      };
    } catch (error) {
      console.error('❌ Error processing stream data:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 异常检测
   * @param {string} userEmail 用户邮箱
   * @param {Array} dataStream 数据流
   * @returns {Promise<Object>} 检测结果
   */
  async detectAnomalies(userEmail, dataStream) {
    try {
      console.log(`🔍 Detecting anomalies for user: ${userEmail}`);
      
      // 获取最近的数据点用于趋势分析
      const recentData = await this.getRecentDataPoints(userEmail, 100);
      const allData = [...recentData, ...dataStream];
      
      // 获取用户健康档案数据用于个性化分析
      const userHealthData = await this.getUserHealthDataForAnalysis(userEmail);
      
      // 获取用户AI设置并优先使用OpenAI
      const userSettings = await userSettingsService.getUserAISettings(userEmail);
      const { aiProvider, aiModel } = this.getAIServiceConfig(userSettings);
      
      // 使用LLM分析数据趋势和异常
      const prompt = this.buildAnomalyDetectionPrompt(allData, userHealthData);
      
      const aiResult = await aiServiceFactory.analyzeHealthRecords(
        { documents: [{ text: prompt }] },
        { provider: aiProvider, model: aiModel }
      );
      
      if (!aiResult.success) {
        throw new Error(aiResult.error || 'AI analysis failed');
      }
      
      // 解析AI返回的异常检测结果
      const anomalyAnalysis = this.parseAnomalyAnalysis(aiResult.analysis);
      
      // 如果有异常，生成预警
      const alerts = [];
      if (anomalyAnalysis.hasAnomaly) {
        for (const anomaly of anomalyAnalysis.anomalies || []) {
          const alert = await this.generateAlert(userEmail, anomaly.type, anomaly.severity, anomaly);
          alerts.push(alert);
        }
      }
      
      return {
        hasAnomaly: anomalyAnalysis.hasAnomaly,
        anomalies: anomalyAnalysis.anomalies || [],
        alerts: alerts,
        analysis: anomalyAnalysis
      };
    } catch (error) {
      console.error('❌ Error detecting anomalies:', error);
      return {
        hasAnomaly: false,
        anomalies: [],
        alerts: [],
        error: error.message
      };
    }
  }

  /**
   * 血糖预测（提前15-30分钟）
   * @param {string} userEmail 用户邮箱
   * @param {Array} glucoseData 血糖数据
   * @returns {Promise<Object>} 预测结果
   */
  async predictHypoglycemia(userEmail, glucoseData) {
    try {
      console.log(`🍬 Predicting hypoglycemia for user: ${userEmail}`);
      
      // 获取用户健康档案数据用于个性化预测
      const userHealthData = await this.getUserHealthDataForAnalysis(userEmail);
      
      // 获取用户AI设置并优先使用OpenAI
      const userSettings = await userSettingsService.getUserAISettings(userEmail);
      const { aiProvider, aiModel } = this.getAIServiceConfig(userSettings);
      
      // 构建预测提示
      const prompt = this.buildHypoglycemiaPredictionPrompt(glucoseData, userHealthData);
      
      // 使用LLM进行预测
      const aiResult = await aiServiceFactory.analyzeHealthRecords(
        { documents: [{ text: prompt }] },
        { provider: aiProvider, model: aiModel }
      );
      
      if (!aiResult.success) {
        throw new Error(aiResult.error || 'AI prediction failed');
      }
      
      // 解析预测结果
      const prediction = this.parseHypoglycemiaPrediction(aiResult.analysis);
      
      // 如果预测到低血糖风险，生成预警
      let alert = null;
      if (prediction.riskLevel === 'high' || prediction.predictedGlucose < 70) {
        alert = await this.generateAlert(
          userEmail,
          'hypoglycemia',
          'high',
          {
            predictedGlucose: prediction.predictedGlucose,
            timeWindow: prediction.timeWindow,
            confidence: prediction.confidence
          }
        );
      }
      
      return {
        success: true,
        prediction: prediction,
        alert: alert
      };
    } catch (error) {
      console.error('❌ Error predicting hypoglycemia:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 心率变异性分析
   * @param {string} userEmail 用户邮箱
   * @param {Array} heartRateData 心率数据
   * @returns {Promise<Object>} 分析结果
   */
  async analyzeHRVTrend(userEmail, heartRateData) {
    try {
      console.log(`❤️ Analyzing HRV trend for user: ${userEmail}`);
      
      // 获取历史心率数据
      const historicalData = await this.getRecentHeartRateData(userEmail, 30); // 最近30天
      const allData = [...historicalData, ...heartRateData];
      
      // 获取用户健康档案数据用于个性化分析
      const userHealthData = await this.getUserHealthDataForAnalysis(userEmail);
      
      // 获取用户AI设置并优先使用OpenAI
      const userSettings = await userSettingsService.getUserAISettings(userEmail);
      const { aiProvider, aiModel } = this.getAIServiceConfig(userSettings);
      
      // 构建HRV分析提示
      const prompt = this.buildHRVAnalysisPrompt(allData, userHealthData);
      
      // 使用LLM分析HRV趋势
      const aiResult = await aiServiceFactory.analyzeHealthRecords(
        { documents: [{ text: prompt }] },
        { provider: aiProvider, model: aiModel }
      );
      
      if (!aiResult.success) {
        throw new Error(aiResult.error || 'AI analysis failed');
      }
      
      // 解析分析结果
      const hrvAnalysis = this.parseHRVAnalysis(aiResult.analysis);
      
      // 如果检测到HRV持续下降，生成预警
      let alert = null;
      if (hrvAnalysis.trend === 'declining' && hrvAnalysis.severity === 'high') {
        alert = await this.generateAlert(
          userEmail,
          'cardiacFatigue',
          'medium',
          {
            trend: hrvAnalysis.trend,
            declineRate: hrvAnalysis.declineRate,
            recommendation: hrvAnalysis.recommendation
          }
        );
      }
      
      return {
        success: true,
        analysis: hrvAnalysis,
        alert: alert
      };
    } catch (error) {
      console.error('❌ Error analyzing HRV trend:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 生成预警
   * @param {string} userEmail 用户邮箱
   * @param {string} alertType 预警类型
   * @param {string} severity 严重程度
   * @param {Object} details 详细信息
   * @returns {Promise<Object>} 预警对象
   */
  async generateAlert(userEmail, alertType, severity, details = {}) {
    try {
      console.log(`🚨 Generating alert for user: ${userEmail}, type: ${alertType}, severity: ${severity}`);
      
      const alert = {
        userEmail,
        alertType,
        severity, // low, medium, high, critical
        details,
        timestamp: new Date().toISOString(),
        acknowledged: false,
        action: this.getAlertAction(alertType, severity)
      };
      
      // 保存预警到 Firestore
      const alertsRef = collection(db, 'riskAlerts');
      const alertDoc = await addDoc(alertsRef, alert);
      
      // 发送通知（这里可以集成推送通知服务）
      await this.sendNotification(userEmail, { ...alert, id: alertDoc.id });
      
      return {
        id: alertDoc.id,
        ...alert
      };
    } catch (error) {
      console.error('❌ Error generating alert:', error);
      throw error;
    }
  }

  /**
   * 发送通知
   * @param {string} userEmail 用户邮箱
   * @param {Object} alert 预警对象
   */
  async sendNotification(userEmail, alert) {
    try {
      const notificationsRef = collection(db, 'notifications');
      await addDoc(notificationsRef, {
        userEmail,
        type: 'risk_alert',
        alertId: alert.id,
        title: this.getAlertTitle(alert.alertType, alert.severity),
        message: this.getAlertMessage(alert),
        timestamp: new Date().toISOString(),
        read: false
      });
    } catch (error) {
      console.error('❌ Error sending notification:', error);
    }
  }

  /**
   * 获取最近的预警
   * @param {string} userEmail 用户邮箱
   * @param {number} limitCount 数量限制
   * @returns {Promise<Array>} 预警列表
   */
  async getRecentAlerts(userEmail, limitCount = 20) {
    try {
      const alertsRef = collection(db, 'riskAlerts');
      
      // 先尝试使用索引查询（如果索引存在）
      try {
        const q = query(
          alertsRef,
          where('userEmail', '==', userEmail),
          orderBy('timestamp', 'desc'),
          limit(limitCount)
        );
        
        const querySnapshot = await getDocs(q);
        const alerts = [];
        
        querySnapshot.forEach((doc) => {
          alerts.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        return alerts;
      } catch (indexError) {
        // 如果索引不存在，使用备用方案：先获取所有该用户的警报，然后在内存中排序
        if (indexError.code === 'failed-precondition') {
          console.warn('⚠️ Firestore index not found, using fallback query method');
          
          // 只使用 where 查询（不需要索引）
          const fallbackQuery = query(
            alertsRef,
            where('userEmail', '==', userEmail)
          );
          
          const querySnapshot = await getDocs(fallbackQuery);
          const alerts = [];
          
          querySnapshot.forEach((doc) => {
            alerts.push({
              id: doc.id,
              ...doc.data()
            });
          });
          
          // 在内存中按时间戳排序并限制数量
          alerts.sort((a, b) => {
            const timeA = new Date(a.timestamp || 0).getTime();
            const timeB = new Date(b.timestamp || 0).getTime();
            return timeB - timeA; // 降序
          });
          
          return alerts.slice(0, limitCount);
        } else {
          // 其他错误，重新抛出
          throw indexError;
        }
      }
    } catch (error) {
      console.error('❌ Error getting recent alerts:', error);
      return [];
    }
  }

  /**
   * 获取实时监测状态
   * @param {string} userEmail 用户邮箱
   * @returns {Promise<Object>} 监测状态
   */
  async getMonitoringStatus(userEmail) {
    try {
      // 获取最近的设备数据
      const recentData = await this.getRecentDataPoints(userEmail, 50);
      
      // 获取最近的预警
      const recentAlerts = await this.getRecentAlerts(userEmail, 10);
      
      // 分析当前状态
      const status = {
        isMonitoring: recentData.length > 0,
        lastDataPoint: recentData.length > 0 ? recentData[recentData.length - 1]?.timestamp : null,
        activeAlerts: recentAlerts.filter(a => !a.acknowledged && a.severity !== 'low'),
        riskLevel: this.calculateOverallRiskLevel(recentAlerts),
        metrics: this.extractCurrentMetrics(recentData)
      };
      
      return {
        success: true,
        status: status
      };
    } catch (error) {
      console.error('❌ Error getting monitoring status:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 获取最近的数据点
   */
  async getRecentDataPoints(userEmail, limitCount = 100) {
    try {
      const streamRef = collection(db, 'wearableStreamData');
      
      // 先尝试使用索引查询（如果索引存在）
      try {
        const q = query(
          streamRef,
          where('userEmail', '==', userEmail),
          orderBy('timestamp', 'desc'),
          limit(limitCount)
        );
        
        const querySnapshot = await getDocs(q);
        const dataPoints = [];
        
        querySnapshot.forEach((doc) => {
          dataPoints.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        return dataPoints.reverse(); // 按时间正序
      } catch (indexError) {
        // 如果索引不存在，使用备用方案：先获取所有该用户的数据点，然后在内存中排序
        if (indexError.code === 'failed-precondition') {
          console.warn('⚠️ Firestore index not found for wearableStreamData, using fallback query method');
          
          // 只使用 where 查询（不需要索引）
          const fallbackQuery = query(
            streamRef,
            where('userEmail', '==', userEmail)
          );
          
          const querySnapshot = await getDocs(fallbackQuery);
          const dataPoints = [];
          
          querySnapshot.forEach((doc) => {
            dataPoints.push({
              id: doc.id,
              ...doc.data()
            });
          });
          
          // 在内存中按时间戳排序并限制数量
          dataPoints.sort((a, b) => {
            const timeA = new Date(a.timestamp || 0).getTime();
            const timeB = new Date(b.timestamp || 0).getTime();
            return timeB - timeA; // 降序
          });
          
          return dataPoints.slice(0, limitCount).reverse(); // 按时间正序
        } else {
          // 其他错误，重新抛出
          throw indexError;
        }
      }
    } catch (error) {
      console.error('❌ Error getting recent data points:', error);
      return [];
    }
  }

  /**
   * 获取最近的心率数据
   */
  async getRecentHeartRateData(userEmail, days = 30) {
    try {
      const dataPoints = await this.getRecentDataPoints(userEmail, days * 24); // 假设每小时一个数据点
      
      return dataPoints
        .filter(dp => dp.data?.heartRate || dp.data?.hrv)
        .map(dp => ({
          timestamp: dp.timestamp,
          heartRate: dp.data?.heartRate,
          hrv: dp.data?.hrv,
          restingHeartRate: dp.data?.restingHeartRate
        }));
    } catch (error) {
      console.error('❌ Error getting recent heart rate data:', error);
      return [];
    }
  }

  /**
   * 获取AI服务配置（优先使用OpenAI）
   */
  getAIServiceConfig(userSettings) {
    // 优先检查OpenAI是否可用
    if (openaiService.isServiceAvailable && openaiService.isServiceAvailable()) {
      const openaiModels = openaiService.getAvailableModels ? openaiService.getAvailableModels() : ['gpt-4o', 'gpt-4-turbo'];
      const models = Array.isArray(openaiModels) ? openaiModels : (openaiModels.all || ['gpt-4o']);
      return {
        aiProvider: 'openai',
        aiModel: models[0] || 'gpt-4o'
      };
    }
    
    // 如果OpenAI不可用，使用用户设置
    if (userSettings.success && userSettings.aiProvider) {
      // 如果用户选择的是Gemini，使用gemini-2.5模型
      if (userSettings.aiProvider === 'gemini') {
        return {
          aiProvider: 'gemini',
          aiModel: userSettings.aiModel || 'gemini-2.5'
        };
      }
      return {
        aiProvider: userSettings.aiProvider,
        aiModel: userSettings.aiModel || ''
      };
    }
    
    // 最后使用Gemini作为后备，使用gemini-2.5模型
    return {
      aiProvider: 'gemini',
      aiModel: 'gemini-2.5'
    };
  }

  /**
   * 获取用户健康数据用于分析
   */
  async getUserHealthDataForAnalysis(userEmail) {
    try {
      const sanitizedEmail = userEmail.replace(/[^a-zA-Z0-9@._-]/g, '_');
      const personalHealthRef = doc(db, 'personalHealthRecords', sanitizedEmail);
      const personalHealthDoc = await getDoc(personalHealthRef);
      
      if (personalHealthDoc.exists()) {
        const data = personalHealthDoc.data();
        return {
          medicalHistory: data.medicalHistory || '',
          medications: data.medications || '',
          allergies: data.allergies || '',
          familyHistory: data.familyHistory || '',
          basicInfo: data.basicInfo || {}
        };
      }
      return null;
    } catch (error) {
      console.error('❌ Error getting user health data:', error);
      return null;
    }
  }

  /**
   * 构建异常检测提示
   */
  buildAnomalyDetectionPrompt(dataStream, userHealthData = null) {
    const recentData = dataStream.slice(-20); // 最近20个数据点
    
    let userContext = '';
    if (userHealthData) {
      userContext = `
用户健康档案信息：
- 既往病史：${userHealthData.medicalHistory || '无'}
- 用药记录：${userHealthData.medications || '无'}
- 过敏史：${userHealthData.allergies || '无'}
- 家族史：${userHealthData.familyHistory || '无'}
`;
    }
    
    return `作为专业的医疗AI助手，请分析以下可穿戴设备的实时数据流，检测异常情况。

${userContext}
数据流（最近20个数据点）：
${JSON.stringify(recentData, null, 2)}

请进行以下分析：
1. **数据趋势分析**：
   - 识别数据趋势（上升/下降/稳定）
   - 计算变化速率
   - 评估趋势的显著性

2. **异常检测**：
   - 识别异常值（超出正常范围的数据点）
   - 识别异常模式（连续异常、周期性异常等）
   - 识别时间序列异常（突然变化、趋势反转等）

3. **风险评估**：
   - 评估潜在的健康风险
   - 考虑用户健康档案信息（如有）
   - 评估风险的严重程度

4. **预警建议**：
   - 如果需要预警，提供具体的预警建议
   - 建议应包括：预警类型、严重程度、描述、建议行动

请以JSON格式返回，严格遵循以下结构：
{
  "hasAnomaly": boolean,
  "anomalies": [
    {
      "type": "hypoglycemia" | "cardiacFatigue" | "arrhythmia" | "hypertension" | "sleepDisorder" | "activityAnomaly",
      "severity": "low" | "medium" | "high" | "critical",
      "description": "异常描述",
      "recommendation": "建议行动"
    }
  ],
  "trend": {
    "direction": "stable" | "rising" | "declining",
    "rate": number,
    "significance": "low" | "medium" | "high"
  }
}`;
  }

  /**
   * 构建低血糖预测提示
   */
  buildHypoglycemiaPredictionPrompt(glucoseData, userHealthData = null) {
    let userContext = '';
    if (userHealthData) {
      userContext = `
用户健康档案信息：
- 既往病史：${userHealthData.medicalHistory || '无'}
- 用药记录：${userHealthData.medications || '无'}（特别注意降糖药）
- 过敏史：${userHealthData.allergies || '无'}
`;
    }
    
    return `作为专业的医疗AI助手，请基于以下血糖数据，预测未来15-30分钟内发生低血糖的风险。

${userContext}
血糖数据（时间序列）：
${JSON.stringify(glucoseData, null, 2)}

请进行以下分析：
1. **当前血糖趋势分析**：
   - 分析血糖变化趋势（上升/下降/稳定）
   - 计算血糖下降速率（mg/dL/分钟）
   - 识别血糖变化模式

2. **未来血糖预测**：
   - 基于当前趋势预测未来15-30分钟的血糖值
   - 考虑用户用药记录（如有降糖药）
   - 评估预测的置信度

3. **低血糖风险评估**：
   - 评估低血糖风险等级（low/medium/high）
   - 如果预测血糖值 < 70 mg/dL，风险等级应为 high
   - 如果血糖下降速率过快，也应提高风险等级

4. **预防建议**：
   - 根据风险等级提供具体的预防建议
   - 建议应包括：是否需要立即进食、建议的食物类型、监测频率等

请以JSON格式返回，严格遵循以下结构：
{
  "predictedGlucose": number,  // 预测血糖值（mg/dL）
  "riskLevel": "low" | "medium" | "high",
  "timeWindow": "15-30分钟",
  "confidence": number,  // 0-1之间的置信度
  "recommendation": "预防建议"
}`;
  }

  /**
   * 构建HRV分析提示
   */
  buildHRVAnalysisPrompt(heartRateData, userHealthData = null) {
    let userContext = '';
    if (userHealthData) {
      userContext = `
用户健康档案信息：
- 既往病史：${userHealthData.medicalHistory || '无'}
- 用药记录：${userHealthData.medications || '无'}
- 家族史：${userHealthData.familyHistory || '无'}
`;
    }
    
    return `作为专业的医疗AI助手，请分析以下心率变异性（HRV）数据，评估心脏疲劳和健康风险。

${userContext}
心率数据（最近30天）：
${JSON.stringify(heartRateData, null, 2)}

请进行以下分析：
1. **HRV趋势分析**：
   - 分析HRV趋势（stable/declining/improving）
   - 如果HRV持续下降，计算下降速率
   - 评估趋势的显著性

2. **静息心率分析**：
   - 分析静息心率是否上升
   - 评估心率变化与HRV的关系

3. **心脏疲劳风险评估**：
   - 评估心脏疲劳风险等级（low/medium/high）
   - 如果HRV持续下降且严重程度为high，应生成预警
   - 考虑用户健康档案信息（如有心脏相关疾病史）

4. **风险因素识别**：
   - 识别可能导致HRV下降的风险因素
   - 考虑活动量、睡眠质量、压力等因素

5. **建议**：
   - 提供休息和恢复建议
   - 建议应包括：休息时间、活动调整、监测频率等

请以JSON格式返回，严格遵循以下结构：
{
  "trend": "stable" | "declining" | "improving",
  "declineRate": number,  // 下降速率（如为下降趋势）
  "severity": "low" | "medium" | "high",
  "riskFactors": ["风险因素1", "风险因素2"],
  "recommendation": "建议内容"
}`;
  }

  /**
   * 解析异常检测结果
   */
  parseAnomalyAnalysis(aiAnalysis) {
    try {
      // 尝试提取JSON对象
      let jsonMatch = aiAnalysis.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        // 验证和规范化异常类型
        if (parsed.anomalies && Array.isArray(parsed.anomalies)) {
          parsed.anomalies = parsed.anomalies.map(anomaly => {
            // 确保异常类型是有效的
            const validTypes = ['hypoglycemia', 'cardiacFatigue', 'arrhythmia', 'hypertension', 'sleepDisorder', 'activityAnomaly'];
            if (!validTypes.includes(anomaly.type)) {
              // 尝试映射到有效类型
              const typeMapping = {
                'low_glucose': 'hypoglycemia',
                'heart_fatigue': 'cardiacFatigue',
                'irregular_heartbeat': 'arrhythmia',
                'high_blood_pressure': 'hypertension',
                'sleep_abnormal': 'sleepDisorder',
                'activity_abnormal': 'activityAnomaly'
              };
              anomaly.type = typeMapping[anomaly.type] || 'activityAnomaly';
            }
            
            // 确保严重程度是有效的
            const validSeverities = ['low', 'medium', 'high', 'critical'];
            if (!validSeverities.includes(anomaly.severity)) {
              anomaly.severity = 'low';
            }
            
            return anomaly;
          });
        }
        
        // 确保hasAnomaly是布尔值
        parsed.hasAnomaly = parsed.hasAnomaly === true || (parsed.anomalies && parsed.anomalies.length > 0);
        
        // 确保trend对象存在
        if (!parsed.trend) {
          parsed.trend = { direction: 'stable', rate: 0, significance: 'low' };
        }
        
        return parsed;
      }
      
      // 默认返回
      return {
        hasAnomaly: false,
        anomalies: [],
        trend: { direction: 'stable', rate: 0, significance: 'low' }
      };
    } catch (error) {
      console.error('❌ Error parsing anomaly analysis:', error);
      return {
        hasAnomaly: false,
        anomalies: [],
        trend: { direction: 'stable', rate: 0, significance: 'low' }
      };
    }
  }

  /**
   * 解析低血糖预测结果
   */
  parseHypoglycemiaPrediction(aiAnalysis) {
    try {
      const jsonMatch = aiAnalysis.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return {
        predictedGlucose: 90,
        riskLevel: 'low',
        timeWindow: '15-30分钟',
        confidence: 0.7,
        recommendation: '继续监测血糖水平'
      };
    } catch (error) {
      console.error('❌ Error parsing hypoglycemia prediction:', error);
      return {
        predictedGlucose: 90,
        riskLevel: 'low',
        timeWindow: '15-30分钟',
        confidence: 0.7,
        recommendation: '继续监测血糖水平'
      };
    }
  }

  /**
   * 解析HRV分析结果
   */
  parseHRVAnalysis(aiAnalysis) {
    try {
      const jsonMatch = aiAnalysis.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return {
        trend: 'stable',
        declineRate: 0,
        severity: 'low',
        riskFactors: [],
        recommendation: '保持当前活动水平'
      };
    } catch (error) {
      console.error('❌ Error parsing HRV analysis:', error);
      return {
        trend: 'stable',
        declineRate: 0,
        severity: 'low',
        riskFactors: [],
        recommendation: '保持当前活动水平'
      };
    }
  }

  /**
   * 获取预警动作
   */
  getAlertAction(alertType, severity) {
    const actions = {
      hypoglycemia: {
        low: '监测血糖，准备零食',
        medium: '立即进食，监测血糖',
        high: '立即进食含糖食物，如15分钟后仍低，寻求医疗帮助',
        critical: '紧急医疗救助，立即联系医生'
      },
      cardiacFatigue: {
        low: '建议适当休息',
        medium: '建议减少活动，增加休息时间',
        high: '建议暂停高强度活动，充分休息',
        critical: '建议立即就医检查'
      },
      arrhythmia: {
        low: '继续监测',
        medium: '建议咨询医生',
        high: '建议立即就医',
        critical: '紧急医疗救助'
      },
      hypertension: {
        low: '继续监测血压',
        medium: '监测血压，考虑咨询医生',
        high: '建议立即咨询医生，可能需要调整用药',
        critical: '紧急医疗救助，立即联系医生'
      },
      sleepDisorder: {
        low: '关注睡眠模式，保持规律作息',
        medium: '建议调整作息时间，如持续异常建议咨询医生',
        high: '建议咨询医生，评估睡眠质量',
        critical: '建议立即就医，评估睡眠障碍'
      },
      activityAnomaly: {
        low: '关注活动模式变化',
        medium: '建议恢复正常活动水平',
        high: '建议咨询医生，评估活动异常原因',
        critical: '建议立即就医，评估活动异常'
      }
    };
    
    return actions[alertType]?.[severity] || '继续监测';
  }

  /**
   * 获取预警标题
   */
  getAlertTitle(alertType, severity) {
    const titles = {
      hypoglycemia: '低血糖预警',
      cardiacFatigue: '心脏疲劳预警',
      arrhythmia: '心律失常预警',
      hypertension: '高血压预警',
      sleepDisorder: '睡眠异常预警',
      activityAnomaly: '活动异常预警'
    };
    
    const severityText = {
      low: '低',
      medium: '中',
      high: '高',
      critical: '紧急'
    };
    
    return `${titles[alertType] || '健康预警'} - ${severityText[severity] || '未知'}风险`;
  }

  /**
   * 获取预警消息
   */
  getAlertMessage(alert) {
    const { alertType, severity, details } = alert;
    
    if (alertType === 'hypoglycemia') {
      return `预测血糖可能降至 ${details.predictedGlucose || '低'} mg/dL，建议${details.timeWindow || '15-30分钟'}内进食。`;
    } else if (alertType === 'cardiacFatigue') {
      return `检测到心率变异性持续下降，建议${details.recommendation || '适当休息'}。`;
    } else if (alertType === 'arrhythmia') {
      return `检测到心律失常，建议${details.recommendation || '咨询医生'}。`;
    } else if (alertType === 'hypertension') {
      return `检测到血压持续升高，建议${details.recommendation || '监测血压，咨询医生'}。`;
    } else if (alertType === 'sleepDisorder') {
      return `检测到睡眠模式异常，建议${details.recommendation || '调整作息，咨询医生'}。`;
    } else if (alertType === 'activityAnomaly') {
      return `检测到活动量异常变化，建议${details.recommendation || '关注活动模式'}。`;
    }
    
    return '检测到健康异常，请关注。';
  }

  /**
   * 计算整体风险等级
   */
  calculateOverallRiskLevel(alerts) {
    if (alerts.length === 0) return 'low';
    
    const hasCritical = alerts.some(a => a.severity === 'critical');
    const hasHigh = alerts.some(a => a.severity === 'high');
    const hasMedium = alerts.some(a => a.severity === 'medium');
    
    if (hasCritical) return 'critical';
    if (hasHigh) return 'high';
    if (hasMedium) return 'medium';
    return 'low';
  }

  /**
   * 提取当前指标
   */
  extractCurrentMetrics(dataPoints) {
    if (dataPoints.length === 0) return {};
    
    const latest = dataPoints[dataPoints.length - 1];
    return {
      heartRate: latest.data?.heartRate || null,
      glucose: latest.data?.glucose || null,
      hrv: latest.data?.hrv || null,
      steps: latest.data?.steps || null,
      timestamp: latest.timestamp
    };
  }
}

module.exports = new RiskMonitoringService();
