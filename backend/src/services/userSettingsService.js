const { userSettingsRepo } = require('../repositories');
const aiProviderConfig = require('../config/aiProviderConfig');

class UserSettingsService {
  constructor() {
    this.collectionName = 'userSettings';
  }

  async getUserSettings(userId) {
    try {
      const settings = await userSettingsRepo.getUserSettings(userId);
      if (settings) return { success: true, settings };
      return { success: true, settings: this.getDefaultSettings() };
    } catch (error) {
      console.error('getUserSettings:', error.message);
      return { success: false, error: error.message };
    }
  }

  async updateUserSettings(userId, settings) {
    try {
      console.log('🔧 Updating user settings for:', userId);
      const existing = await this.getUserSettings(userId);
      const mergedSettings = {
        ...existing.settings,
        ...settings,
        updatedAt: new Date().toISOString()
      };
      await userSettingsRepo.setUserSettings(userId, mergedSettings);
      console.log('✅ User settings updated successfully');
      return { success: true, settings: mergedSettings };
    } catch (error) {
      console.error('❌ Error updating user settings:', error);
      return { success: false, error: error.message };
    }
  }

  getDefaultSettings() {
    return {
      aiProvider: aiProviderConfig.getDefaultProvider(),
      aiModel: '',
      language: 'zh',
      theme: 'light',
      notifications: { email: true, push: true, analysisComplete: true },
      integrations: {
        telegramChatId: null
      },
      privacy: { analytics: false },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  async getUserAISettings(userId) {
    try {
      const result = await this.getUserSettings(userId);
      if (result.success) {
        return {
          success: true,
          aiProvider: result.settings.aiProvider || aiProviderConfig.getDefaultProvider(),
          aiModel: result.settings.aiModel || '',
          language: result.settings.language || 'zh'
        };
      }
      return { success: false, error: result.error };
    } catch (error) {
      console.error('getUserAISettings:', error.message);
      return { success: false, error: error.message };
    }
  }

  async updateUserAISettings(userId, aiSettings) {
    try {
      const { aiProvider, aiModel, language } = aiSettings;
      return await this.updateUserSettings(userId, {
        aiProvider: aiProvider || aiProviderConfig.getDefaultProvider(),
        aiModel: aiModel || '',
        language: language || 'zh',
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('updateUserAISettings:', error.message);
      return { success: false, error: error.message };
    }
  }

  async resetUserSettings(userId) {
    try {
      return await this.updateUserSettings(userId, this.getDefaultSettings());
    } catch (error) {
      console.error('resetUserSettings:', error.message);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new UserSettingsService();
