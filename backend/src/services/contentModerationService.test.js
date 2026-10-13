jest.mock('../observability/logger', () => ({
  error: jest.fn(), warn: jest.fn(), info: jest.fn()
}));

describe('contentModerationService', () => {
  let service;

  beforeEach(() => {
    jest.resetModules();
    delete process.env.ALIBABA_GREEN_ACCESS_KEY_ID;
    delete process.env.ALIBABA_GREEN_ACCESS_KEY_SECRET;
    delete process.env.ALIBABA_SMS_ACCESS_KEY_ID;
    delete process.env.ALIBABA_SMS_ACCESS_KEY_SECRET;
  });

  describe('isConfigured', () => {
    it('returns false when no env vars set', () => {
      service = require('./contentModerationService');
      expect(service.isConfigured()).toBe(false);
    });

    it('returns false when package not installed (green SDK absent)', () => {
      // The @alicloud/green20220302 package is not installed in dev,
      // so isConfigured() should already return false regardless of env vars
      process.env.ALIBABA_GREEN_ACCESS_KEY_ID = 'test-key';
      process.env.ALIBABA_GREEN_ACCESS_KEY_SECRET = 'test-secret';
      service = require('./contentModerationService');
      // Without the green SDK, isConfigured returns false even with keys
      expect(service.isConfigured()).toBe(false);
    });
  });

  describe('moderateText', () => {
    it('returns safe for empty input', async () => {
      service = require('./contentModerationService');
      const result = await service.moderateText('');
      expect(result.safe).toBe(true);
      expect(result.reason).toBe('empty_input');
    });

    it('returns safe for null input', async () => {
      service = require('./contentModerationService');
      const result = await service.moderateText(null);
      expect(result.safe).toBe(true);
    });

    it('returns safe when not configured', async () => {
      service = require('./contentModerationService');
      const result = await service.moderateText('some text');
      expect(result.safe).toBe(true);
      expect(result.reason).toBe('moderation_not_configured');
    });
  });

  describe('moderateHealthContent', () => {
    it('returns safe when not configured', async () => {
      service = require('./contentModerationService');
      const result = await service.moderateHealthContent('health content');
      expect(result.safe).toBe(true);
    });
  });

  describe('shouldBlock', () => {
    it('returns false for empty labels', () => {
      service = require('./contentModerationService');
      expect(service.shouldBlock({ labels: [] })).toBe(false);
    });

    it('returns false for null', () => {
      service = require('./contentModerationService');
      expect(service.shouldBlock(null)).toBe(false);
    });

    it('returns true for blocked labels', () => {
      service = require('./contentModerationService');
      expect(service.shouldBlock({ labels: ['spam'] })).toBe(true);
      expect(service.shouldBlock({ labels: ['politics'] })).toBe(true);
      expect(service.shouldBlock({ labels: ['porn'] })).toBe(true);
    });

    it('returns false for non-blocked labels', () => {
      service = require('./contentModerationService');
      expect(service.shouldBlock({ labels: ['normal'] })).toBe(false);
    });

    it('returns true when any label is blocked', () => {
      service = require('./contentModerationService');
      expect(service.shouldBlock({ labels: ['normal', 'spam'] })).toBe(true);
    });
  });
});
