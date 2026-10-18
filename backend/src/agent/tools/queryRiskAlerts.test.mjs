import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { generateText, isStepCount } from 'ai';
import { MockLanguageModelV4 } from 'ai/test';
import { createQueryRiskAlertsTool } from './queryRiskAlerts.mjs';

function mockModel(toolName, toolInput) {
  let callCount = 0;
  return new MockLanguageModelV4({
    doGenerate: async () => {
      callCount++;
      if (callCount === 1) {
        return {
          content: [{ type: 'tool-call', toolCallId: 'c1', toolName, input: JSON.stringify(toolInput) }],
          finishReason: { unified: 'tool-calls' },
          usage: { inputTokens: 1, outputTokens: 1 },
        };
      }
      return {
        content: [{ type: 'text', text: 'answer' }],
        finishReason: { unified: 'stop' },
        usage: { inputTokens: 1, outputTokens: 1 },
      };
    },
  });
}

describe('queryRiskAlerts tool', () => {
  const mockRepo = { getRecentAlertsByUser: jest.fn() };

  beforeEach(() => { mockRepo.getRecentAlertsByUser.mockReset(); });

  test('inputSchema defaults limit to 10', () => {
    const t = createQueryRiskAlertsTool(mockRepo);
    const parsed = t.inputSchema.safeParse({});
    expect(parsed.success).toBe(true);
    expect(parsed.data.limit).toBe(10);
  });

  test('inputSchema rejects out-of-range limit', () => {
    const t = createQueryRiskAlertsTool(mockRepo);
    expect(t.inputSchema.safeParse({ limit: 0 }).success).toBe(false);
    expect(t.inputSchema.safeParse({ limit: 100 }).success).toBe(false);
  });

  test('passes userEmail from toolsContext to repo via generateText', async () => {
    mockRepo.getRecentAlertsByUser.mockResolvedValue([{ type: 'high_glucose', severity: 'warning' }]);
    const model = mockModel('query_risk_alerts', { limit: 5 });

    await generateText({
      model,
      prompt: '预警',
      tools: { query_risk_alerts: createQueryRiskAlertsTool(mockRepo) },
      stopWhen: isStepCount(3),
      toolsContext: { query_risk_alerts: { userEmail: 'test@test.com' } },
    });

    expect(mockRepo.getRecentAlertsByUser).toHaveBeenCalledWith('test@test.com', 5);
  });

  test('returns message when no alerts', async () => {
    mockRepo.getRecentAlertsByUser.mockResolvedValue([]);
    const t = createQueryRiskAlertsTool(mockRepo);
    const result = await t.execute({ limit: 5 }, { context: { userEmail: 'a@b.com' } });
    expect(result.alerts).toEqual([]);
    expect(result.message).toContain('无风险预警');
  });
});
