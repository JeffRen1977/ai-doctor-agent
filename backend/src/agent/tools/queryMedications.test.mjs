import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { generateText, isStepCount } from 'ai';
import { MockLanguageModelV4 } from 'ai/test';
import { createQueryMedicationsTool } from './queryMedications.mjs';

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

describe('queryMedications tool', () => {
  const mockRepo = { listActive: jest.fn() };

  beforeEach(() => { mockRepo.listActive.mockReset(); });

  test('inputSchema accepts empty object', () => {
    const t = createQueryMedicationsTool(mockRepo);
    expect(t.inputSchema.safeParse({}).success).toBe(true);
  });

  test('passes userId from toolsContext to repo via generateText', async () => {
    mockRepo.listActive.mockResolvedValue([{ name: '二甲双胍', dosage: '500mg' }]);
    const model = mockModel('query_medications', {});

    await generateText({
      model,
      prompt: '药物',
      tools: { query_medications: createQueryMedicationsTool(mockRepo) },
      stopWhen: isStepCount(3),
      toolsContext: { query_medications: { userId: 'u1' } },
    });

    expect(mockRepo.listActive).toHaveBeenCalledWith('u1');
  });

  test('returns empty when no medications', async () => {
    mockRepo.listActive.mockResolvedValue([]);
    const t = createQueryMedicationsTool(mockRepo);
    const result = await t.execute({}, { context: { userId: 'u1' } });
    expect(result.medications).toEqual([]);
    expect(result.message).toContain('无用药记录');
  });

  test('handles null from repo', async () => {
    mockRepo.listActive.mockResolvedValue(null);
    const t = createQueryMedicationsTool(mockRepo);
    const result = await t.execute({}, { context: { userId: 'u1' } });
    expect(result.medications).toEqual([]);
  });
});
