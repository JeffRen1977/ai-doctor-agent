/**
 * 同意服务：最新一条 + 当前政策版本才算有效授予。
 */

process.env.CONSENT_ENFORCE = 'true';
process.env.PRIVACY_POLICY_VERSION = '2026-09-07';

const mockAppendConsent = jest.fn();
const mockListBySubject = jest.fn();

jest.mock('../repositories', () => ({
  consentRepo: {
    appendConsent: (...args) => mockAppendConsent(...args),
    listBySubject: (...args) => mockListBySubject(...args)
  }
}));

jest.mock('../observability/logger', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn()
}));

jest.mock('../observability/requestContext', () => ({
  getContext: () => ({ requestId: 'req-1', userId: 'u1' })
}));

const consentService = require('./consentService');

describe('consentService', () => {
  const previousEnforce = process.env.CONSENT_ENFORCE;

  beforeEach(() => {
    mockAppendConsent.mockReset().mockResolvedValue({ id: 'c1' });
    mockListBySubject.mockReset().mockResolvedValue([]);
    process.env.CONSENT_ENFORCE = 'true';
    process.env.PRIVACY_POLICY_VERSION = '2026-09-07';
  });

  afterAll(() => {
    process.env.CONSENT_ENFORCE = previousEnforce || 'false';
  });

  it('treats latest granted row matching current policy as valid', async () => {
    mockListBySubject.mockResolvedValue([
      {
        purpose: 'ai_inference',
        granted: true,
        policyVersion: '2026-09-07',
        timestamp: '2026-09-07T12:00:00.000Z'
      }
    ]);
    await expect(consentService.hasConsent('a@test.com', 'ai_inference')).resolves.toBe(true);
  });

  it('rejects stale policy version', async () => {
    mockListBySubject.mockResolvedValue([
      {
        purpose: 'ai_inference',
        granted: true,
        policyVersion: '2020-01-01',
        timestamp: '2020-01-01T12:00:00.000Z'
      }
    ]);
    await expect(consentService.hasConsent('a@test.com', 'ai_inference')).resolves.toBe(false);
  });

  it('withdrawal (latest granted=false) blocks the purpose', async () => {
    mockListBySubject.mockResolvedValue([
      {
        purpose: 'ai_inference',
        granted: false,
        policyVersion: '2026-09-07',
        timestamp: '2026-09-08T12:00:00.000Z'
      },
      {
        purpose: 'ai_inference',
        granted: true,
        policyVersion: '2026-09-07',
        timestamp: '2026-09-07T12:00:00.000Z'
      }
    ]);
    await expect(consentService.assertConsent('a@test.com', 'ai_inference')).rejects.toMatchObject({
      code: 'CONSENT_REQUIRED',
      status: 403
    });
  });

  it('blocks openai without cross_border even if ai_inference is granted', async () => {
    mockListBySubject.mockResolvedValue([
      {
        purpose: 'ai_inference',
        granted: true,
        policyVersion: '2026-09-07',
        timestamp: '2026-09-07T12:00:00.000Z'
      }
    ]);
    await expect(consentService.assertCanCallAi('a@test.com', 'openai')).rejects.toMatchObject({
      code: 'CONSENT_REQUIRED',
      purpose: 'cross_border'
    });
  });

  it('allows qwen with only ai_inference', async () => {
    mockListBySubject.mockResolvedValue([
      {
        purpose: 'ai_inference',
        granted: true,
        policyVersion: '2026-09-07',
        timestamp: '2026-09-07T12:00:00.000Z'
      }
    ]);
    await expect(consentService.assertCanCallAi('a@test.com', 'qwen')).resolves.toBeUndefined();
  });
});
