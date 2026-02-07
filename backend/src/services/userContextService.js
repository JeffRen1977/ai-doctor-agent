/**
 * 用户上下文服务
 * 提供统一的用户上下文获取服务，整合健康数据、对话历史和用户偏好
 */

const { db } = require('../config/firebase');
const { doc, getDoc, collection, query, where, orderBy, limit, getDocs } = require('firebase/firestore');
const userSettingsService = require('./userSettingsService');
const wearableService = require('./wearableService');

class UserContextService {
  constructor() {
    console.log('🔍 User Context Service initialized');
  }

  /**
   * 获取用户完整上下文
   * @param {string} userEmail 用户邮箱
   * @returns {Promise<Object>} 用户上下文
   */
  async getUserContext(userEmail) {
    try {
      // 并行获取各个部分
      const [healthSnapshot, conversationContext, preferences] = await Promise.all([
        this.getHealthSnapshot(userEmail),
        this.getConversationContext(userEmail),
        this.getUserPreferences(userEmail)
      ]);

      return {
        userEmail,
        healthSnapshot,
        conversationContext,
        preferences,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Error getting user context:', error);
      // 返回基本上下文，即使部分数据获取失败
      const preferences = await this.getUserPreferences(userEmail);
      return {
        userEmail,
        healthSnapshot: {},
        conversationContext: {},
        preferences,
        lastUpdated: new Date().toISOString()
      };
    }
  }

  /**
   * 获取健康快照
   * @param {string} userEmail 用户邮箱
   * @returns {Promise<Object>} 健康快照
   */
  async getHealthSnapshot(userEmail) {
    try {
      const snapshot = {
        currentMetrics: null,
        medications: [],
        medicalHistory: null,
        recentAlerts: []
      };

      // 1. 获取个人健康档案
      const sanitizedEmail = userEmail.replace(/[^a-zA-Z0-9@._-]/g, '_');
      const healthRecordRef = doc(db, 'personalHealthRecords', sanitizedEmail);
      const healthRecordDoc = await getDoc(healthRecordRef);

      if (healthRecordDoc.exists()) {
        const healthData = healthRecordDoc.data();
        
        // 提取用药记录
        if (healthData.medications) {
          snapshot.medications = Array.isArray(healthData.medications) 
            ? healthData.medications 
            : [];
        }

        // 提取既往病史
        if (healthData.medicalHistory) {
          snapshot.medicalHistory = healthData.medicalHistory;
        }

        // 提取当前指标（从timeSeriesData获取最新值）
        if (healthData.timeSeriesData) {
          snapshot.currentMetrics = this.extractLatestMetrics(healthData.timeSeriesData);
        }
      }

      // 2. 获取可穿戴设备最新数据
      try {
        const wearableData = await wearableService.getUserWearableData(userEmail, 'fitbit');
        if (wearableData && wearableData.success && wearableData.data) {
          const latestData = this.extractLatestWearableMetrics(wearableData.data);
          if (latestData) {
            snapshot.currentMetrics = {
              ...snapshot.currentMetrics,
              ...latestData
            };
          }
        }
      } catch (error) {
        console.warn('⚠️ Error fetching wearable data for context:', error.message);
      }

      // 3. 获取最近的风险预警
      try {
        const alertsRef = collection(db, 'riskAlerts');
        const alertsQuery = query(
          alertsRef,
          where('userEmail', '==', userEmail),
          orderBy('timestamp', 'desc'),
          limit(5)
        );
        
        const alertsSnapshot = await getDocs(alertsQuery);
        snapshot.recentAlerts = alertsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      } catch (error) {
        console.warn('⚠️ Error fetching risk alerts for context:', error.message);
        // 如果索引不存在，使用fallback方法
        try {
          const alertsRef = collection(db, 'riskAlerts');
          const allAlertsSnapshot = await getDocs(alertsRef);
          const userAlerts = allAlertsSnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(alert => alert.userEmail === userEmail)
            .sort((a, b) => {
              const timeA = a.timestamp?.toDate?.() || new Date(a.timestamp);
              const timeB = b.timestamp?.toDate?.() || new Date(b.timestamp);
              return timeB - timeA;
            })
            .slice(0, 5);
          snapshot.recentAlerts = userAlerts;
        } catch (fallbackError) {
          console.warn('⚠️ Fallback query also failed:', fallbackError.message);
        }
      }

      return snapshot;
    } catch (error) {
      console.error('❌ Error getting health snapshot:', error);
      return {
        currentMetrics: null,
        medications: [],
        medicalHistory: null,
        recentAlerts: []
      };
    }
  }

  /**
   * 获取对话上下文
   * @param {string} userEmail 用户邮箱
   * @returns {Promise<Object>} 对话上下文
   */
  async getConversationContext(userEmail) {
    try {
      const context = {
        recentMessages: [],
        activeConversations: []
      };

      // 1. 获取最近的聊天消息
      try {
        const chatHistoryRef = doc(db, 'chatHistory', userEmail);
        const chatHistoryDoc = await getDoc(chatHistoryRef);

        if (chatHistoryDoc.exists()) {
          const chatData = chatHistoryDoc.data();
          const messages = chatData.messages || [];
          
          // 获取最近5条消息
          context.recentMessages = messages
            .slice(-5)
            .map(msg => ({
              id: msg.id,
              content: msg.content,
              sender: msg.sender,
              timestamp: msg.timestamp
            }));
        }
      } catch (error) {
        console.warn('⚠️ Error fetching chat history for context:', error.message);
      }

      // 2. 获取活跃对话
      try {
        const conversationsRef = collection(db, 'conversations');
        const conversationsQuery = query(
          conversationsRef,
          where('userEmail', '==', userEmail),
          orderBy('updatedAt', 'desc'),
          limit(5)
        );

        const conversationsSnapshot = await getDocs(conversationsQuery);
        context.activeConversations = conversationsSnapshot.docs.map(doc => ({
          conversationId: doc.id,
          ...doc.data()
        }));
      } catch (error) {
        console.warn('⚠️ Error fetching conversations for context:', error.message);
        // 如果索引不存在，使用fallback方法
        try {
          const conversationsRef = collection(db, 'conversations');
          const allConversationsSnapshot = await getDocs(conversationsRef);
          const userConversations = allConversationsSnapshot.docs
            .map(doc => ({ conversationId: doc.id, ...doc.data() }))
            .filter(conv => conv.userEmail === userEmail)
            .sort((a, b) => {
              const timeA = a.updatedAt?.toDate?.() || new Date(a.updatedAt);
              const timeB = b.updatedAt?.toDate?.() || new Date(b.updatedAt);
              return timeB - timeA;
            })
            .slice(0, 5);
          context.activeConversations = userConversations;
        } catch (fallbackError) {
          console.warn('⚠️ Fallback query also failed:', fallbackError.message);
        }
      }

      return context;
    } catch (error) {
      console.error('❌ Error getting conversation context:', error);
      return {
        recentMessages: [],
        activeConversations: []
      };
    }
  }

  /**
   * 获取用户偏好
   * @param {string} userEmail 用户邮箱
   * @returns {Promise<Object>} 用户偏好
   */
  async getUserPreferences(userEmail) {
    try {
      const userSettings = await userSettingsService.getUserAISettings(userEmail);
      
      if (userSettings.success) {
        return {
          language: userSettings.language || 'zh',
          aiProvider: userSettings.aiProvider || null,
          aiModel: userSettings.aiModel || null
        };
      }

      return {
        language: 'zh',
        aiProvider: null,
        aiModel: null
      };
    } catch (error) {
      console.error('❌ Error getting user preferences:', error);
      return {
        language: 'zh',
        aiProvider: null,
        aiModel: null
      };
    }
  }

  /**
   * 从时间序列数据中提取最新指标
   * @param {Object} timeSeriesData 时间序列数据
   * @returns {Object} 最新指标
   */
  extractLatestMetrics(timeSeriesData) {
    const metrics = {};
    
    for (const [metricName, series] of Object.entries(timeSeriesData)) {
      if (series && Array.isArray(series.dataPoints) && series.dataPoints.length > 0) {
        // 获取最新的数据点
        const latestPoint = series.dataPoints
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
        metrics[metricName] = latestPoint.value;
      }
    }
    
    return metrics;
  }

  /**
   * 从可穿戴设备数据中提取最新指标
   * @param {Object} wearableData 可穿戴设备数据
   * @returns {Object} 最新指标
   */
  extractLatestWearableMetrics(wearableData) {
    const metrics = {};
    
    // 提取心率
    if (wearableData.heartRate && Array.isArray(wearableData.heartRate) && wearableData.heartRate.length > 0) {
      const latestHR = wearableData.heartRate
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
      metrics.heartRate = latestHR.value;
    }

    // 提取步数
    if (wearableData.steps && Array.isArray(wearableData.steps) && wearableData.steps.length > 0) {
      const latestSteps = wearableData.steps
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
      metrics.steps = latestSteps.value;
    }

    // 提取血糖（如果有）
    if (wearableData.glucose && Array.isArray(wearableData.glucose) && wearableData.glucose.length > 0) {
      const latestGlucose = wearableData.glucose
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
      metrics.glucose = latestGlucose.value;
    }

    return metrics;
  }
}

module.exports = new UserContextService();
