const { db } = require('../config/firebase');
const { doc, getDoc, setDoc, updateDoc } = require('firebase/firestore');

class UserSettingsService {
  constructor() {
    this.collectionName = 'userSettings';
  }

  /**
   * 获取用户设置
   */
  async getUserSettings(userId) {
    try {
      console.log('🔧 Getting user settings for:', userId);
      
      const userSettingsRef = doc(db, this.collectionName, userId);
      const userSettingsSnap = await getDoc(userSettingsRef);
      
      if (userSettingsSnap.exists()) {
        const settings = userSettingsSnap.data();
        console.log('✅ User settings found:', settings);
        return {
          success: true,
          settings: settings
        };
      } else {
        // 返回默认设置
        const defaultSettings = this.getDefaultSettings();
        console.log('📝 No user settings found, returning defaults:', defaultSettings);
        return {
          success: true,
          settings: defaultSettings
        };
      }
    } catch (error) {
      console.error('❌ Error getting user settings:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 更新用户设置
   */
  async updateUserSettings(userId, settings) {
    try {
      console.log('🔧 Updating user settings for:', userId);
      console.log('📝 New settings:', settings);
      
      const userSettingsRef = doc(db, this.collectionName, userId);
      
      // 合并现有设置和新设置
      const existingSettings = await this.getUserSettings(userId);
      const mergedSettings = {
        ...existingSettings.settings,
        ...settings,
        updatedAt: new Date().toISOString()
      };
      
      await setDoc(userSettingsRef, mergedSettings, { merge: true });
      
      console.log('✅ User settings updated successfully');
      return {
        success: true,
        settings: mergedSettings
      };
    } catch (error) {
      console.error('❌ Error updating user settings:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 获取默认设置
   */
  getDefaultSettings() {
    return {
      aiProvider: 'gemini', // 默认使用Gemini
      aiModel: '', // 默认使用服务推荐的模型
      language: 'zh', // 默认中文
      theme: 'light', // 默认浅色主题
      notifications: {
        email: true,
        push: true,
        analysisComplete: true
      },
      privacy: {
        dataSharing: false,
        analytics: true
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * 获取用户的AI服务设置
   */
  async getUserAISettings(userId) {
    try {
      const result = await this.getUserSettings(userId);
      if (result.success) {
        return {
          success: true,
          aiProvider: result.settings.aiProvider || 'gemini',
          aiModel: result.settings.aiModel || '',
          language: result.settings.language || 'zh'
        };
      } else {
        return {
          success: false,
          error: result.error
        };
      }
    } catch (error) {
      console.error('❌ Error getting user AI settings:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 更新用户的AI服务设置
   */
  async updateUserAISettings(userId, aiSettings) {
    try {
      const { aiProvider, aiModel } = aiSettings;
      
      const settings = {
        aiProvider: aiProvider || 'gemini',
        aiModel: aiModel || '',
        updatedAt: new Date().toISOString()
      };
      
      return await this.updateUserSettings(userId, settings);
    } catch (error) {
      console.error('❌ Error updating user AI settings:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 重置用户设置为默认值
   */
  async resetUserSettings(userId) {
    try {
      console.log('🔄 Resetting user settings for:', userId);
      
      const defaultSettings = this.getDefaultSettings();
      return await this.updateUserSettings(userId, defaultSettings);
    } catch (error) {
      console.error('❌ Error resetting user settings:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Export singleton instance
module.exports = new UserSettingsService();
