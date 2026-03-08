/**
 * 用户上下文服务
 * 提供统一的用户上下文获取服务，整合健康数据、对话历史和用户偏好
 */

const userSettingsService = require('./userSettingsService');
const wearableService = require('./wearableService');
const { userBasicInfoRepo, chatSessionRepo, riskAlertRepo, conversationRepo } = require('../repositories');

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

      // 1. 通过 Repository 获取个人健康档案（便于今后换国内数据库）
      const sanitizedEmail = userEmail.replace(/[^a-zA-Z0-9@._-]/g, '_');
      const fullRecord = await userBasicInfoRepo.getFullHealthRecord(sanitizedEmail);

      if (fullRecord) {
        snapshot.medications = Array.isArray(fullRecord.medications) ? fullRecord.medications : [];
        if (fullRecord.medicalHistory) snapshot.medicalHistory = fullRecord.medicalHistory;
        if (fullRecord.timeSeriesData) {
          snapshot.currentMetrics = this.extractLatestMetrics(fullRecord.timeSeriesData);
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

      // 3. 获取最近的风险预警（通过 Repository）
      try {
        snapshot.recentAlerts = await riskAlertRepo.getRecentAlertsByUser(userEmail, 5);
      } catch (error) {
        console.warn('⚠️ Error fetching risk alerts for context:', error.message);
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

      // 1. 获取最近的聊天消息（通过 Repository，chat_sessions 子集合）
      try {
        const sanitizedEmail = userEmail.replace(/[^a-zA-Z0-9@._-]/g, '_');
        const latest = await chatSessionRepo.getLatestSession(sanitizedEmail);
        if (latest && latest.session.messages && latest.session.messages.length) {
          context.recentMessages = latest.session.messages
            .slice(-5)
            .map((msg) => ({
              id: msg.id,
              content: msg.content,
              sender: msg.role === 'assistant' ? 'assistant' : 'user',
              timestamp: msg.timestamp
            }));
        }
      } catch (error) {
        console.warn('⚠️ Error fetching chat history for context:', error.message);
      }

      // 2. 获取活跃对话（遗留 conversations 集合，通过 Repository）
      try {
        context.activeConversations = await conversationRepo.getActiveConversationsByUser(userEmail, 5);
      } catch (error) {
        console.warn('⚠️ Error fetching conversations for context:', error.message);
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
