/**
 * Unit tests: UserSettingsService
 */

const mockGetUserSettings = jest.fn();
const mockSetUserSettings = jest.fn();

jest.mock('../repositories', () => ({
  userSettingsRepo: {
    getUserSettings: (...args) => mockGetUserSettings(...args),
    setUserSettings: (...args) => mockSetUserSettings(...args)
  }
}));

const userSettingsService = require('./userSettingsService');

const origDEPLOYMENT_REGION = process.env.DEPLOYMENT_REGION;
const origDEFAULT_AI_PROVIDER = process.env.DEFAULT_AI_PROVIDER;

beforeEach(() => {
  mockGetUserSettings.mockReset();
  mockSetUserSettings.mockReset();
  process.env.DEPLOYMENT_REGION = '';
  process.env.DEFAULT_AI_PROVIDER = 'gemini';
});

afterEach(() => {
  process.env.DEPLOYMENT_REGION = origDEPLOYMENT_REGION;
  process.env.DEFAULT_AI_PROVIDER = origDEFAULT_AI_PROVIDER;
});

describe('UserSettingsService', () => {
  describe('getUserSettings', () => {
    test('returns repo settings when found', async () => {
      const settings = { aiProvider: 'openai', language: 'zh' };
      mockGetUserSettings.mockResolvedValue(settings);
      const result = await userSettingsService.getUserSettings('user_1');
      expect(result.success).toBe(true);
      expect(result.settings).toEqual(settings);
      expect(mockGetUserSettings).toHaveBeenCalledWith('user_1');
    });

    test('returns default settings when repo returns null/undefined', async () => {
      mockGetUserSettings.mockResolvedValue(null);
      const result = await userSettingsService.getUserSettings('user_1');
      expect(result.success).toBe(true);
      expect(result.settings).toHaveProperty('aiProvider');
      expect(result.settings).toHaveProperty('language', 'zh');
      expect(result.settings).toHaveProperty('theme', 'light');
    });

    test('returns success false and error when repo throws', async () => {
      mockGetUserSettings.mockRejectedValue(new Error('DB error'));
      const result = await userSettingsService.getUserSettings('user_1');
      expect(result.success).toBe(false);
      expect(result.error).toContain('DB error');
    });
  });

  describe('updateUserSettings', () => {
    test('merges with existing and calls setUserSettings', async () => {
      mockGetUserSettings.mockResolvedValue({ aiProvider: 'gemini' });
      mockSetUserSettings.mockResolvedValue(undefined);
      const result = await userSettingsService.updateUserSettings('user_1', { language: 'en' });
      expect(result.success).toBe(true);
      expect(result.settings.language).toBe('en');
      expect(result.settings.aiProvider).toBe('gemini');
      expect(result.settings.updatedAt).toBeDefined();
      expect(mockSetUserSettings).toHaveBeenCalledWith('user_1', expect.any(Object));
    });

    test('returns error when setUserSettings throws', async () => {
      mockGetUserSettings.mockResolvedValue({});
      mockSetUserSettings.mockRejectedValue(new Error('Write failed'));
      const result = await userSettingsService.updateUserSettings('user_1', {});
      expect(result.success).toBe(false);
      expect(result.error).toContain('Write failed');
    });
  });

  describe('getDefaultSettings', () => {
    test('returns object with aiProvider, language, theme, notifications, privacy', () => {
      const def = userSettingsService.getDefaultSettings();
      expect(def.aiProvider).toBe('gemini');
      expect(def.language).toBe('zh');
      expect(def.theme).toBe('light');
      expect(def.notifications).toEqual(expect.objectContaining({ email: true, push: true }));
      expect(def.privacy).toBeDefined();
      expect(def.createdAt).toBeDefined();
      expect(def.updatedAt).toBeDefined();
    });
  });

  describe('getUserAISettings', () => {
    test('returns aiProvider, aiModel, language from getUserSettings', async () => {
      mockGetUserSettings.mockResolvedValue({
        aiProvider: 'openai',
        aiModel: 'gpt-4o',
        language: 'en'
      });
      const result = await userSettingsService.getUserAISettings('user_1');
      expect(result.success).toBe(true);
      expect(result.aiProvider).toBe('openai');
      expect(result.aiModel).toBe('gpt-4o');
      expect(result.language).toBe('en');
    });

    test('uses defaults when settings have no ai fields', async () => {
      mockGetUserSettings.mockResolvedValue({});
      const result = await userSettingsService.getUserAISettings('user_1');
      expect(result.success).toBe(true);
      expect(result.aiProvider).toBe('gemini');
      expect(result.aiModel).toBe('');
      expect(result.language).toBe('zh');
    });

    test('returns success false when getUserSettings fails (repo throws)', async () => {
      mockGetUserSettings.mockRejectedValue(new Error('not found'));
      const result = await userSettingsService.getUserAISettings('user_1');
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  describe('updateUserAISettings', () => {
    test('calls updateUserSettings with aiProvider, aiModel, language', async () => {
      mockGetUserSettings.mockResolvedValue({});
      mockSetUserSettings.mockResolvedValue(undefined);
      const result = await userSettingsService.updateUserAISettings('user_1', {
        aiProvider: 'qwen',
        aiModel: 'qwen-turbo',
        language: 'zh'
      });
      expect(result.success).toBe(true);
      expect(result.settings.aiProvider).toBe('qwen');
      expect(result.settings.aiModel).toBe('qwen-turbo');
      expect(result.settings.language).toBe('zh');
    });
  });

  describe('resetUserSettings', () => {
    test('updates user with default settings', async () => {
      mockGetUserSettings.mockResolvedValue({});
      mockSetUserSettings.mockResolvedValue(undefined);
      const result = await userSettingsService.resetUserSettings('user_1');
      expect(result.success).toBe(true);
      expect(mockSetUserSettings).toHaveBeenCalledWith('user_1', expect.objectContaining({
        aiProvider: 'gemini',
        language: 'zh',
        theme: 'light'
      }));
    });
  });
});
