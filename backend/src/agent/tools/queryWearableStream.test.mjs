import { describe, test, expect, jest } from '@jest/globals';
import { generateText, isStepCount } from 'ai';
import { MockLanguageModelV4 } from 'ai/test';
import { createQueryWearableStreamTool } from './queryWearableStream.mjs';

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

describe('queryWearableStream tool', () => {
  test('returns data points when available', async () => {
    const mockData = [{ heartRate: 72, timestamp: '2024-01-01T10:00:00Z' }];
    const repo = { getRecentByUser: jest.fn().mockResolvedValue(mockData) };
    const tool = createQueryWearableStreamTool(repo);
    const result = await tool.execute({ limit: 10 }, { context: { userEmail: 'u@test.com' } });
    expect(result.dataPoints).toHaveLength(1);
    expect(result.count).toBe(1);
    expect(repo.getRecentByUser).toHaveBeenCalledWith('u@test.com', { limit: 10 });
  });

  test('returns empty message when no data', async () => {
    const repo = { getRecentByUser: jest.fn().mockResolvedValue([]) };
    const tool = createQueryWearableStreamTool(repo);
    const result = await tool.execute({ limit: 20 }, { context: { userEmail: 'u@test.com' } });
    expect(result.dataPoints).toEqual([]);
    expect(result.message).toContain('无可穿戴设备数据');
  });

  test('passes timeRange to repo when provided', async () => {
    const repo = { getRecentByUser: jest.fn().mockResolvedValue([]) };
    const tool = createQueryWearableStreamTool(repo);
    await tool.execute({ limit: 20, timeRange: '6h' }, { context: { userEmail: 'u@test.com' } });
    expect(repo.getRecentByUser).toHaveBeenCalledWith('u@test.com', { limit: 20, timeRange: '6h' });
  });

  test('uses userEmail from context via generateText', async () => {
    const repo = { getRecentByUser: jest.fn().mockResolvedValue([]) };
    const tool = createQueryWearableStreamTool(repo);

    await generateText({
      model: mockModel('query_wearable_stream', { limit: 5 }),
      tools: { query_wearable_stream: tool },
      toolsContext: { query_wearable_stream: { userEmail: 'special@test.com' } },
      prompt: 'get data',
      stopWhen: isStepCount(2),
    });

    expect(repo.getRecentByUser.mock.calls[0][0]).toBe('special@test.com');
  });

  test('handles null from repo', async () => {
    const repo = { getRecentByUser: jest.fn().mockResolvedValue(null) };
    const tool = createQueryWearableStreamTool(repo);
    const result = await tool.execute({ limit: 20 }, { context: { userEmail: 'u@test.com' } });
    expect(result.dataPoints).toEqual([]);
    expect(result.message).toContain('无可穿戴设备数据');
  });
});
