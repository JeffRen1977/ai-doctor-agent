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

    test('returns DEFAULT_AI_PROVIDER when set (overrides region default)', () => {
      process.env.DEPLOYMENT_REGION = 'cn';
      process.env.DEFAULT_AI_PROVIDER = 'openai';
      expect(getDefaultProvider()).toBe('openai');
    });

    test('returns CN_DEFAULT_PROVIDER when DEPLOYMENT_REGION=cn and no DEFAULT_AI_PROVIDER', () => {
      process.env.DEPLOYMENT_REGION = 'cn';
      delete process.env.DEFAULT_AI_PROVIDER;
      expect(getDefaultProvider()).toBe(CN_DEFAULT_PROVIDER);
    });

    test('returns qwen when DEPLOYMENT_REGION=intl (Model Studio / Singapore)', () => {
      process.env.DEPLOYMENT_REGION = 'intl';
      delete process.env.DEFAULT_AI_PROVIDER;
      expect(getDefaultProvider()).toBe('qwen');
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
    test('returns deployment default from env (ignores userSettings)', () => {
      delete process.env.DEFAULT_AI_PROVIDER;
      delete process.env.DEPLOYMENT_REGION;
      const out = resolveAIConfig(undefined);
      expect(out).toHaveProperty('provider', OVERSEAS_DEFAULT_PROVIDER);
      expect(out).toHaveProperty('model');
      expect(out.model).toBeTruthy();
    });

    test('returns deployment default when DEPLOYMENT_REGION=cn even if userSettings has aiProvider', () => {
      process.env.DEPLOYMENT_REGION = 'cn';
      delete process.env.DEFAULT_AI_PROVIDER;
      delete process.env.DEFAULT_AI_MODEL;
      const out = resolveAIConfig({ success: true, aiProvider: 'openai', aiModel: 'gpt-4o' });
      expect(out.provider).toBe(CN_DEFAULT_PROVIDER);
      expect(out.model).toBe('qwen-turbo');
    });

    test('returns DEFAULT_AI_PROVIDER when set, ignores userSettings', () => {
      process.env.DEFAULT_AI_PROVIDER = 'gemini';
      delete process.env.DEPLOYMENT_REGION;
      delete process.env.DEFAULT_AI_MODEL;
      const out = resolveAIConfig({ success: true, aiProvider: 'openai', aiModel: 'gpt-4o' });
      expect(out.provider).toBe('gemini');
      expect(out.model).toBe('gemini-2.5-flash');
    });
  });

  describe('getAIServiceConfig', () => {
    test('returns deployment default as aiProvider/aiModel (env only)', () => {
      process.env.DEPLOYMENT_REGION = 'intl';
      delete process.env.DEFAULT_AI_PROVIDER;
      delete process.env.DEFAULT_AI_MODEL;
      const out = getAIServiceConfig({ success: true, aiProvider: 'openai' });
      expect(out.aiProvider).toBe('qwen');
      expect(out.aiModel).toBe('qwen-turbo');
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
