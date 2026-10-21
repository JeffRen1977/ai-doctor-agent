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

  describe('interceptSensitiveTopics', () => {
    test('returns crisis response for Chinese suicide keywords', () => {
      const result = safety.interceptSensitiveTopics('我不想活了', 'zh');
      expect(result).toContain('400-161-9995');
      expect(result).toContain('关心您的安全');
    });

    test('returns crisis response for Chinese self-harm keywords', () => {
      expect(safety.interceptSensitiveTopics('我想自残')).toContain('400-161-9995');
    });

    test('returns English crisis response when language is en', () => {
      const result = safety.interceptSensitiveTopics('I want to kill myself', 'en');
      expect(result).toContain('crisis hotline');
      expect(result).toContain('safety');
    });

    test('detects English self-harm patterns', () => {
      expect(safety.interceptSensitiveTopics('thinking about self-harm', 'en')).not.toBeNull();
    });

    test('returns null for normal health messages', () => {
      expect(safety.interceptSensitiveTopics('我头疼', 'zh')).toBeNull();
      expect(safety.interceptSensitiveTopics('I have a headache', 'en')).toBeNull();
    });

    test('returns null for empty or null message', () => {
      expect(safety.interceptSensitiveTopics('', 'zh')).toBeNull();
      expect(safety.interceptSensitiveTopics(null)).toBeNull();
    });

    test('logs a warning when crisis content detected', () => {
      safety.interceptSensitiveTopics('想自杀');
      expect(mockLogger.warn).toHaveBeenCalled();
    });

    test('detects 结束生命', () => {
      expect(safety.interceptSensitiveTopics('我想结束生命')).not.toBeNull();
    });

    test('does not trigger on unrelated 自 characters', () => {
      expect(safety.interceptSensitiveTopics('自然而然恢复了')).toBeNull();
    });
  });

  describe('detectHallucination', () => {
    test('flags answer with numeric medical values but no tool calls', () => {
      const result = safety.detectHallucination(
        '您的血压是 120mmHg，很正常',
        [{ text: 'answer', toolCalls: [], toolResults: [] }],
      );
      expect(result.flagged).toBe(true);
      expect(result.reason).toBe('numeric_without_tool_call');
    });

    test('does not flag when tool calls are present', () => {
      const result = safety.detectHallucination(
        '您的血压是 120mmHg',
        [{ text: '', toolCalls: [{ toolName: 'query_vitals' }], toolResults: [] }],
      );
      expect(result.flagged).toBe(false);
    });

    test('does not flag answer without numeric medical claims', () => {
      expect(safety.detectHallucination('多休息，多喝水', []).flagged).toBe(false);
    });

    test('does not flag empty or null answer', () => {
      expect(safety.detectHallucination('', []).flagged).toBe(false);
      expect(safety.detectHallucination(null, []).flagged).toBe(false);
    });

    test('detects Chinese unit patterns', () => {
      const r1 = safety.detectHallucination('建议服用 500毫克', [{ toolCalls: [] }]);
      expect(r1.flagged).toBe(true);
    });

    test('detects English unit patterns', () => {
      const r = safety.detectHallucination('Take 10mg daily', [{ toolCalls: [] }]);
      expect(r.flagged).toBe(true);
    });

    test('logs warning on flagged hallucination', () => {
      safety.detectHallucination('血糖 5.6mmol', [{ toolCalls: [] }]);
      expect(mockLogger.warn).toHaveBeenCalled();
    });
  });

  describe('assertWritePermission', () => {
    test('throws when write tool used by skill without allowWrite', () => {
      const mockRegistry = { isWriteTool: (n) => n === 'update_meds' };
      const skill = { name: 'health_chat', safetyRules: {} };
      expect(() => safety.assertWritePermission('update_meds', mockRegistry, skill)).toThrow(
        /not authorized for write tool/,
      );
    });

    test('does not throw when skill has allowWrite', () => {
      const mockRegistry = { isWriteTool: () => true };
      const skill = { name: 'admin', safetyRules: { allowWrite: true } };
      expect(() => safety.assertWritePermission('update_meds', mockRegistry, skill)).not.toThrow();
    });

    test('does not throw for read-only tools', () => {
      const mockRegistry = { isWriteTool: () => false };
      const skill = { name: 'health_chat', safetyRules: {} };
      expect(() => safety.assertWritePermission('query_vitals', mockRegistry, skill)).not.toThrow();
    });

    test('does not throw when no registry provided', () => {
      const skill = { name: 'x', safetyRules: {} };
      expect(() => safety.assertWritePermission('any', null, skill)).not.toThrow();
    });
  });
});
