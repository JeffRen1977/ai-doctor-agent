import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { createAgentSafety } from './safety.mjs';

describe('Agent safety', () => {
  const mockConsentService = { assertCanCallAi: jest.fn() };
  const mockDisclaimerService = { wrapResponse: jest.fn((text) => text + '\n\n[免责声明]') };
  const mockContentModerationService = {
    isConfigured: jest.fn(() => false),
    moderateHealthContent: jest.fn(),
  };
  const mockAuditService = { recordAiDecision: jest.fn() };
  const mockLogger = { warn: jest.fn(), error: jest.fn() };

  let safety;

  beforeEach(() => {
    jest.clearAllMocks();
    safety = createAgentSafety({
      consentService: mockConsentService,
      disclaimerService: mockDisclaimerService,
      contentModerationService: mockContentModerationService,
      auditService: mockAuditService,
      logger: mockLogger,
    });
  });

  test('assertAgentConsent delegates to consentService', async () => {
    await safety.assertAgentConsent('user@test.com');
    expect(mockConsentService.assertCanCallAi).toHaveBeenCalledWith('user@test.com', 'openai');
  });

  test('moderateAgentOutput returns text when moderation not configured', async () => {
    mockContentModerationService.isConfigured.mockReturnValue(false);
    const result = await safety.moderateAgentOutput('hello');
    expect(result).toBe('hello');
    expect(mockContentModerationService.moderateHealthContent).not.toHaveBeenCalled();
  });

  test('moderateAgentOutput returns null when content blocked', async () => {
    mockContentModerationService.isConfigured.mockReturnValue(true);
    mockContentModerationService.moderateHealthContent.mockResolvedValue({ safe: false, labels: ['harmful'] });
    const result = await safety.moderateAgentOutput('bad content');
    expect(result).toBeNull();
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  test('moderateAgentOutput returns text when content passes', async () => {
    mockContentModerationService.isConfigured.mockReturnValue(true);
    mockContentModerationService.moderateHealthContent.mockResolvedValue({ safe: true, labels: [] });
    const result = await safety.moderateAgentOutput('good content');
    expect(result).toBe('good content');
  });

  test('moderateAgentOutput tolerates moderation errors', async () => {
    mockContentModerationService.isConfigured.mockReturnValue(true);
    mockContentModerationService.moderateHealthContent.mockRejectedValue(new Error('service down'));
    const result = await safety.moderateAgentOutput('some text');
    expect(result).toBe('some text');
    expect(mockLogger.error).toHaveBeenCalled();
  });

  test('appendDisclaimer delegates to wrapResponse', () => {
    const result = safety.appendDisclaimer('advice', 'zh');
    expect(mockDisclaimerService.wrapResponse).toHaveBeenCalledWith('advice', 'message', 'zh');
    expect(result).toContain('免责声明');
  });

  test('recordAgentAudit calls auditService.recordAiDecision', async () => {
    await safety.recordAgentAudit({
      userEmail: 'u@test.com',
      message: 'q',
      answer: 'a',
      latencyMs: 500,
      success: true,
      steps: 2,
    });
    expect(mockAuditService.recordAiDecision).toHaveBeenCalledTimes(1);
    const params = mockAuditService.recordAiDecision.mock.calls[0][0];
    expect(params.operation).toBe('healthChat');
    expect(params.subjectEmail).toBe('u@test.com');
    expect(params.metadata.agentPath).toBe(true);
    expect(params.metadata.steps).toBe(2);
  });

  test('recordAgentAudit uses custom skillName as operation', async () => {
    await safety.recordAgentAudit({
      userEmail: 'u@test.com',
      message: 'q',
      answer: 'a',
      latencyMs: 100,
      success: true,
      steps: 1,
      skillName: 'symptom_analysis',
    });
    const params = mockAuditService.recordAiDecision.mock.calls[0][0];
    expect(params.operation).toBe('symptom_analysis');
  });

  test('recordAgentAudit swallows audit errors', async () => {
    mockAuditService.recordAiDecision.mockRejectedValue(new Error('db down'));
    await expect(
      safety.recordAgentAudit({ userEmail: 'u@t.com', message: 'q', answer: 'a', latencyMs: 1, success: true, steps: 1 })
    ).resolves.toBeUndefined();
    expect(mockLogger.error).toHaveBeenCalled();
  });
});
