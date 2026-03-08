const { userSettingsRepo } = require('../repositories');

class UserSettingsService {
  constructor() {
    this.collectionName = 'userSettings';
  }

  async getUserSettings(userId) {
    try {
      console.log('🔧 Getting user settings for:', userId);
      const settings = await userSettingsRepo.getUserSettings(userId);
      if (settings) {
        console.log('✅ User settings found:', settings);
        return { success: true, settings };
      }
      const defaultSettings = this.getDefaultSettings();
      console.log('📝 No user settings found, returning defaults:', defaultSettings);
      return { success: true, settings: defaultSettings };
    } catch (error) {
      console.error('❌ Error getting user settings:', error);
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
      aiProvider: 'gemini',
      aiModel: '',
      language: 'zh',
      theme: 'light',
      notifications: { email: true, push: true, analysisComplete: true },
      privacy: { dataSharing: false, analytics: true },
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
          aiProvider: result.settings.aiProvider || 'gemini',
          aiModel: result.settings.aiModel || '',
          language: result.settings.language || 'zh'
        };
      }
      return { success: false, error: result.error };
    } catch (error) {
      console.error('❌ Error getting user AI settings:', error);
      return { success: false, error: error.message };
    }
  }

  async updateUserAISettings(userId, aiSettings) {
    try {
      const { aiProvider, aiModel, language } = aiSettings;
      return await this.updateUserSettings(userId, {
        aiProvider: aiProvider || 'gemini',
        aiModel: aiModel || '',
        language: language || 'zh',
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Error updating user AI settings:', error);
      return { success: false, error: error.message };
    }
  }

  async resetUserSettings(userId) {
    try {
      console.log('🔄 Resetting user settings for:', userId);
      const defaultSettings = this.getDefaultSettings();
      return await this.updateUserSettings(userId, defaultSettings);
    } catch (error) {
      console.error('❌ Error resetting user settings:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new UserSettingsService();
