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

    it('returns true when the SDK is installed and keys are set', () => {
      process.env.ALIBABA_GREEN_ACCESS_KEY_ID = 'test-key';
      process.env.ALIBABA_GREEN_ACCESS_KEY_SECRET = 'test-secret';
      service = require('./contentModerationService');
      expect(service.isConfigured()).toBe(true);
    });
  });

  describe('moderateText with the SDK', () => {
    const mockTextModeration = jest.fn();

    beforeEach(() => {
      mockTextModeration.mockReset();
      // Mirrors the real SDK shape: client is the default export, request is a named export.
      jest.doMock('@alicloud/green20220302', () => {
        class TextModerationRequest {
          constructor(fields) { Object.assign(this, fields); }
        }
        class Client {
          textModerationWithOptions(...args) { return mockTextModeration(...args); }
        }
        return { __esModule: true, default: Client, TextModerationRequest };
      });
      process.env.ALIBABA_GREEN_ACCESS_KEY_ID = 'test-key';
      process.env.ALIBABA_GREEN_ACCESS_KEY_SECRET = 'test-secret';
    });

    afterEach(() => {
      jest.dontMock('@alicloud/green20220302');
    });

    it('blocks text flagged with a blocked label', async () => {
      mockTextModeration.mockResolvedValue({ body: { code: 200, data: { labels: 'spam,ad' } } });
      service = require('./contentModerationService');
      const result = await service.moderateText('buy now');
      expect(result.safe).toBe(false);
      expect(result.labels).toEqual(['spam', 'ad']);
      const [request] = mockTextModeration.mock.calls[0];
      expect(request.service).toBe('chat_detection');
      expect(JSON.parse(request.serviceParameters)).toEqual({ content: 'buy now' });
    });

    it('allows text with no labels', async () => {
      mockTextModeration.mockResolvedValue({ body: { code: 200, data: { labels: '' } } });
      service = require('./contentModerationService');
      const result = await service.moderateText('drink more water');
      expect(result.safe).toBe(true);
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
