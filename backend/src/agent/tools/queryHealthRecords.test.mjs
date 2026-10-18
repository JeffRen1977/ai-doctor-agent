import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { generateText, isStepCount } from 'ai';
import { MockLanguageModelV4 } from 'ai/test';
import { createQueryHealthRecordsTool } from './queryHealthRecords.mjs';

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

describe('queryHealthRecords tool', () => {
  const mockRepo = {
    getBasicInfo: jest.fn(),
    getFullHealthRecord: jest.fn(),
  };

  beforeEach(() => {
    mockRepo.getBasicInfo.mockReset();
    mockRepo.getFullHealthRecord.mockReset();
  });

  test('inputSchema defaults detail to basic', () => {
    const t = createQueryHealthRecordsTool(mockRepo);
    const parsed = t.inputSchema.safeParse({});
    expect(parsed.success).toBe(true);
    expect(parsed.data.detail).toBe('basic');
  });

  test('passes userId from toolsContext to repo via generateText (basic)', async () => {
    mockRepo.getBasicInfo.mockResolvedValue({ name: '张三', conditions: ['diabetes'] });
    const model = mockModel('query_health_records', { detail: 'basic' });

    await generateText({
      model,
      prompt: '健康档案',
      tools: { query_health_records: createQueryHealthRecordsTool(mockRepo) },
      stopWhen: isStepCount(3),
      toolsContext: { query_health_records: { userId: 'u1' } },
    });

    expect(mockRepo.getBasicInfo).toHaveBeenCalledWith('u1');
  });

  test('calls getFullHealthRecord when detail=full', async () => {
    mockRepo.getFullHealthRecord.mockResolvedValue({ name: '张三', medications: [{ name: '二甲双胍' }] });
    const t = createQueryHealthRecordsTool(mockRepo);
    const result = await t.execute({ detail: 'full' }, { context: { userId: 'u1' } });
    expect(mockRepo.getFullHealthRecord).toHaveBeenCalledWith('u1');
    expect(mockRepo.getBasicInfo).not.toHaveBeenCalled();
    expect(result.record.medications).toHaveLength(1);
  });

  test('returns message when no record', async () => {
    mockRepo.getBasicInfo.mockResolvedValue(null);
    const t = createQueryHealthRecordsTool(mockRepo);
    const result = await t.execute({ detail: 'basic' }, { context: { userId: 'u1' } });
    expect(result.record).toBeNull();
    expect(result.message).toContain('无基本健康信息');
  });
});
