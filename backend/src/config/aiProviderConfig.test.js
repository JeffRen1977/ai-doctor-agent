/**
 * Unit tests: AI provider config (getDefaultProvider, getDefaultModel, resolveAIConfig, getAIServiceConfig)
 * See docs/AI_PROVIDER_SWITCH_DESIGN.md Phase 1.
 */

const {
  getDefaultProvider,
  getDefaultModel,
  resolveAIConfig,
  getAIServiceConfig,
  DEFAULT_MODEL_BY_PROVIDER,
  CN_DEFAULT_PROVIDER,
  OVERSEAS_DEFAULT_PROVIDER
} = require('./aiProviderConfig');

const originalEnv = { ...process.env };

afterEach(() => {
  process.env.DEPLOYMENT_REGION = originalEnv.DEPLOYMENT_REGION;
  process.env.DEFAULT_AI_PROVIDER = originalEnv.DEFAULT_AI_PROVIDER;
  process.env.DEFAULT_AI_MODEL = originalEnv.DEFAULT_AI_MODEL;
});

describe('aiProviderConfig', () => {
  describe('getDefaultProvider', () => {
    test('returns OVERSEAS_DEFAULT_PROVIDER when no env set', () => {
      delete process.env.DEPLOYMENT_REGION;
      delete process.env.DEFAULT_AI_PROVIDER;
      expect(getDefaultProvider()).toBe(OVERSEAS_DEFAULT_PROVIDER);
    });

    test('returns DEFAULT_AI_PROVIDER when set', () => {
      process.env.DEFAULT_AI_PROVIDER = 'openai';
      process.env.DEPLOYMENT_REGION = 'cn';
      expect(getDefaultProvider()).toBe('openai');
    });

    test('returns CN_DEFAULT_PROVIDER when DEPLOYMENT_REGION=cn and no DEFAULT_AI_PROVIDER', () => {
      process.env.DEPLOYMENT_REGION = 'cn';
      delete process.env.DEFAULT_AI_PROVIDER;
      expect(getDefaultProvider()).toBe(CN_DEFAULT_PROVIDER);
    });
  });

  describe('getDefaultModel', () => {
    test('returns provider default when DEFAULT_AI_MODEL not set', () => {
      delete process.env.DEFAULT_AI_MODEL;
      expect(getDefaultModel('gemini')).toBe(DEFAULT_MODEL_BY_PROVIDER.gemini);
      expect(getDefaultModel('qwen')).toBe(DEFAULT_MODEL_BY_PROVIDER.qwen);
    });

    test('returns DEFAULT_AI_MODEL when set', () => {
      process.env.DEFAULT_AI_MODEL = 'custom-model';
      expect(getDefaultModel('gemini')).toBe('custom-model');
      expect(getDefaultModel('openai')).toBe('custom-model');
    });

    test('returns empty string for unknown provider when no env model', () => {
      delete process.env.DEFAULT_AI_MODEL;
      expect(getDefaultModel('unknown')).toBe('');
    });
  });

  describe('resolveAIConfig', () => {
    test('returns deployment default when userSettings undefined', () => {
      delete process.env.DEFAULT_AI_PROVIDER;
      delete process.env.DEPLOYMENT_REGION;
      const out = resolveAIConfig(undefined);
      expect(out).toHaveProperty('provider', OVERSEAS_DEFAULT_PROVIDER);
      expect(out).toHaveProperty('model');
      expect(out.model).toBeTruthy();
    });

    test('uses user provider and default model when userSettings.success and aiProvider set, no aiModel', () => {
      delete process.env.DEFAULT_AI_MODEL;
      const out = resolveAIConfig({ success: true, aiProvider: 'openai' });
      expect(out.provider).toBe('openai');
      expect(out.model).toBe(DEFAULT_MODEL_BY_PROVIDER.openai);
    });

    test('uses user provider and aiModel when userSettings has both', () => {
      const out = resolveAIConfig({
        success: true,
        aiProvider: 'qwen',
        aiModel: 'qwen-plus'
      });
      expect(out.provider).toBe('qwen');
      expect(out.model).toBe('qwen-plus');
    });

    test('ignores userSettings when success is false', () => {
      delete process.env.DEFAULT_AI_PROVIDER;
      delete process.env.DEPLOYMENT_REGION;
      const out = resolveAIConfig({ success: false, aiProvider: 'openai', aiModel: 'gpt-4' });
      expect(out.provider).toBe(OVERSEAS_DEFAULT_PROVIDER);
    });

    test('uses default model when user aiModel is empty string', () => {
      delete process.env.DEFAULT_AI_MODEL;
      const out = resolveAIConfig({ success: true, aiProvider: 'ernie', aiModel: '' });
      expect(out.model).toBe(DEFAULT_MODEL_BY_PROVIDER.ernie);
    });
  });

  describe('getAIServiceConfig', () => {
    test('returns aiProvider and aiModel from resolveAIConfig', () => {
      const out = getAIServiceConfig({ success: true, aiProvider: 'qwen', aiModel: 'qwen-turbo' });
      expect(out).toEqual({ aiProvider: 'qwen', aiModel: 'qwen-turbo' });
    });

    test('works with undefined userSettings', () => {
      delete process.env.DEFAULT_AI_PROVIDER;
      delete process.env.DEPLOYMENT_REGION;
      const out = getAIServiceConfig(undefined);
      expect(out).toHaveProperty('aiProvider');
      expect(out).toHaveProperty('aiModel');
      expect(out.aiProvider).toBe(OVERSEAS_DEFAULT_PROVIDER);
    });
  });
});
