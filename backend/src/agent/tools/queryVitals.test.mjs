import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { generateText, isStepCount } from 'ai';
import { MockLanguageModelV4 } from 'ai/test';
import { createQueryVitalsTool } from './queryVitals.mjs';

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

describe('queryVitals tool', () => {
  const mockRepo = { getVitalsDaily: jest.fn() };

  beforeEach(() => { mockRepo.getVitalsDaily.mockReset(); });

  test('inputSchema exposes date param and validates format', () => {
    const t = createQueryVitalsTool(mockRepo);
    expect(t.inputSchema.safeParse({ date: '2026-10-17' }).success).toBe(true);
    expect(t.inputSchema.safeParse({ date: '10/17' }).success).toBe(false);
    expect(t.inputSchema.safeParse({}).success).toBe(false);
  });

  test('model sees date in inputSchema', async () => {
    mockRepo.getVitalsDaily.mockResolvedValue({ glucose: 135 });
    let modelSeenTools;

    const model = new MockLanguageModelV4({
      doGenerate: async ({ tools }) => {
        modelSeenTools = tools;
        return {
          content: [{ type: 'text', text: 'ok' }],
          finishReason: { unified: 'stop' },
          usage: { inputTokens: 1, outputTokens: 1 },
        };
      },
    });

    await generateText({
      model,
      prompt: 'test',
      tools: { query_vitals: createQueryVitalsTool(mockRepo) },
      stopWhen: isStepCount(1),
      toolsContext: { query_vitals: { userId: 'u1' } },
    });

    const vitalsTool = modelSeenTools.find(t => t.name === 'query_vitals');
    expect(vitalsTool).toBeDefined();
    expect(vitalsTool.inputSchema.properties.date).toBeDefined();
  });

  test('passes userId from toolsContext to repo via generateText', async () => {
    mockRepo.getVitalsDaily.mockResolvedValue({ glucose: 135 });
    const model = mockModel('query_vitals', { date: '2026-10-17' });

    await generateText({
      model,
      prompt: '血糖',
      tools: { query_vitals: createQueryVitalsTool(mockRepo) },
      stopWhen: isStepCount(3),
      toolsContext: { query_vitals: { userId: 'u1' } },
    });

    expect(mockRepo.getVitalsDaily).toHaveBeenCalledWith('u1', '2026-10-17');
  });

  test('returns null message when no data', async () => {
    mockRepo.getVitalsDaily.mockResolvedValue(null);
    const t = createQueryVitalsTool(mockRepo);
    const result = await t.execute({ date: '2026-10-01' }, { context: { userId: 'u1' } });
    expect(result.data).toBeNull();
    expect(result.message).toContain('无体征数据');
    expect(mockRepo.getVitalsDaily).toHaveBeenCalledWith('u1', '2026-10-01');
  });
});
