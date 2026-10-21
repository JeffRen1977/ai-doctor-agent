import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { TraceRecorder } from './traceRecorder.mjs';

describe('TraceRecorder', () => {
  const mockCreate = jest.fn();
  const mockLogger = { error: jest.fn(), warn: jest.fn() };
  const mockAgentTrace = { create: mockCreate };
  let recorder;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreate.mockResolvedValue({});
    recorder = new TraceRecorder({ AgentTrace: mockAgentTrace, logger: mockLogger });
  });

  const makeResult = (overrides = {}) => ({
    text: '建议多休息',
    steps: [
      {
        text: '',
        toolCalls: [{ toolName: 'query_vitals', args: { userId: 'u1' } }],
        toolResults: [{ toolName: 'query_vitals', result: '血压正常' }],
        usage: { inputTokens: 100, outputTokens: 50 },
      },
      {
        text: '建议多休息',
        toolCalls: [],
        toolResults: [],
        usage: { inputTokens: 150, outputTokens: 80 },
      },
    ],
    usage: { inputTokens: 250, outputTokens: 130 },
    ...overrides,
  });

  test('buildTrace maps result steps to trace format', () => {
    const trace = recorder.buildTrace({
      userId: 'u1',
      sessionId: 's1',
      skill: 'symptom_analysis',
      userMessage: '我头疼',
      result: makeResult(),
      latencyMs: 1200,
    });

    expect(trace.userId).toBe('u1');
    expect(trace.sessionId).toBe('s1');
    expect(trace.skill).toBe('symptom_analysis');
    expect(trace.userMessage).toBe('我头疼');
    expect(trace.finalAnswer).toBe('建议多休息');
    expect(trace.totalSteps).toBe(2);
    expect(trace.latencyMs).toBe(1200);
    expect(trace.steps[0].stepIndex).toBe(0);
    expect(trace.steps[0].toolCalls[0].toolName).toBe('query_vitals');
    expect(trace.steps[0].toolResults[0].result).toBe('血压正常');
  });

  test('record persists trace via AgentTrace.create', async () => {
    const doc = await recorder.record({
      userId: 'u1',
      sessionId: 's1',
      skill: 'health_chat',
      userMessage: '你好',
      result: makeResult(),
      latencyMs: 500,
    });

    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'u1',
      skill: 'health_chat',
      totalSteps: 2,
    }));
    expect(doc).not.toBeNull();
  });

  test('record swallows DB errors', async () => {
    mockCreate.mockRejectedValue(new Error('db down'));
    const doc = await recorder.record({
      userId: 'u1', sessionId: 's1', skill: 'x',
      userMessage: 'hi', result: makeResult(), latencyMs: 100,
    });
    expect(doc).toBeNull();
    expect(mockLogger.error).toHaveBeenCalled();
  });

  test('buildTrace handles empty steps', () => {
    const trace = recorder.buildTrace({
      userId: 'u1', sessionId: 's1', skill: 'x',
      userMessage: 'hi',
      result: { text: 'ok', steps: [], usage: {} },
      latencyMs: 50,
    });
    expect(trace.totalSteps).toBe(0);
    expect(trace.steps).toEqual([]);
  });

  test('buildTrace truncates long tool results', () => {
    const longResult = 'x'.repeat(5000);
    const trace = recorder.buildTrace({
      userId: 'u1', sessionId: 's1', skill: 'x',
      userMessage: 'hi',
      result: {
        text: 'ok',
        steps: [{
          text: '', toolCalls: [],
          toolResults: [{ toolName: 'query_vitals', result: longResult }],
        }],
        usage: {},
      },
      latencyMs: 50,
    });
    expect(trace.steps[0].toolResults[0].result.length).toBe(2000);
  });
});
