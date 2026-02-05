const { db } = require('../config/firebase');
const { doc, getDoc, setDoc, updateDoc, collection, query, where, orderBy, limit, addDoc, getDocs } = require('firebase/firestore');
const aiServiceFactory = require('./aiServiceFactory');
const userSettingsService = require('./userSettingsService');

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

      // 触发异常检测
      const anomalyResult = await this.detectAnomalies(userEmail, [dataPoint]);
      
      return {
        success: true,
        dataPoint,
        anomalyDetected: anomalyResult.hasAnomaly,
        alerts: anomalyResult.alerts || []
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
      
      // 获取用户AI设置
      const userSettings = await userSettingsService.getUserAISettings(userEmail);
      const aiProvider = userSettings.success ? (userSettings.aiProvider || 'gemini') : 'gemini';
      const aiModel = userSettings.success ? (userSettings.aiModel || '') : '';
      
      // 使用LLM分析数据趋势和异常
      const prompt = this.buildAnomalyDetectionPrompt(allData);
      
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
      
      // 获取用户AI设置
      const userSettings = await userSettingsService.getUserAISettings(userEmail);
      const aiProvider = userSettings.success ? (userSettings.aiProvider || 'gemini') : 'gemini';
      const aiModel = userSettings.success ? (userSettings.aiModel || '') : '';
      
      // 构建预测提示
      const prompt = this.buildHypoglycemiaPredictionPrompt(glucoseData);
      
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
      
      // 获取用户AI设置
      const userSettings = await userSettingsService.getUserAISettings(userEmail);
      const aiProvider = userSettings.success ? (userSettings.aiProvider || 'gemini') : 'gemini';
      const aiModel = userSettings.success ? (userSettings.aiModel || '') : '';
      
      // 构建HRV分析提示
      const prompt = this.buildHRVAnalysisPrompt(allData);
      
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
      await this.sendNotification(userEmail, alert);
      
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
      console.log(`📱 Sending notification to user: ${userEmail}`);
      
      // 这里可以集成推送通知服务（如 Firebase Cloud Messaging）
      // 目前先保存到通知集合
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
      
      console.log('✅ Notification sent successfully');
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
        lastDataPoint: recentData[0]?.timestamp || null,
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
   * 构建异常检测提示
   */
  buildAnomalyDetectionPrompt(dataStream) {
    return `作为专业的医疗AI助手，请分析以下可穿戴设备的实时数据流，检测异常情况。

数据流：
${JSON.stringify(dataStream.slice(-20), null, 2)} // 最近20个数据点

请分析：
1. 数据趋势：是否有异常的趋势变化？
2. 异常检测：识别任何异常值或异常模式
3. 风险评估：评估潜在的健康风险
4. 预警建议：如果需要，提供预警建议

请以JSON格式返回，包括：
- hasAnomaly: boolean
- anomalies: [{ type, severity, description, recommendation }]
- trend: { direction, rate, significance }`;
  }

  /**
   * 构建低血糖预测提示
   */
  buildHypoglycemiaPredictionPrompt(glucoseData) {
    return `作为专业的医疗AI助手，请基于以下血糖数据，预测未来15-30分钟内发生低血糖的风险。

血糖数据：
${JSON.stringify(glucoseData, null, 2)}

请分析：
1. 当前血糖趋势
2. 预测未来15-30分钟的血糖值
3. 低血糖风险等级（低/中/高）
4. 预测置信度
5. 预防建议

请以JSON格式返回，包括：
- predictedGlucose: number (预测血糖值，单位：mg/dL)
- riskLevel: string (low/medium/high)
- timeWindow: string (预测时间窗口，如"15-30分钟")
- confidence: number (0-1)
- recommendation: string`;
  }

  /**
   * 构建HRV分析提示
   */
  buildHRVAnalysisPrompt(heartRateData) {
    return `作为专业的医疗AI助手，请分析以下心率变异性（HRV）数据，评估心脏疲劳和健康风险。

心率数据：
${JSON.stringify(heartRateData, null, 2)}

请分析：
1. HRV趋势：是否持续下降？
2. 静息心率：是否上升？
3. 心脏疲劳风险：评估心脏疲劳风险
4. 时间范围：分析3-7天的趋势
5. 建议：提供休息和恢复建议

请以JSON格式返回，包括：
- trend: string (stable/declining/improving)
- declineRate: number (下降速率)
- severity: string (low/medium/high)
- riskFactors: array
- recommendation: string`;
  }

  /**
   * 解析异常检测结果
   */
  parseAnomalyAnalysis(aiAnalysis) {
    try {
      const jsonMatch = aiAnalysis.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
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
      arrhythmia: '心律失常预警'
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
