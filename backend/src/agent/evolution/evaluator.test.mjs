import { describe, test, expect, jest, beforeEach } from '@jest/globals';

const mockGenerateObject = jest.fn();
const mockGetLightModel = jest.fn(() => ({ modelId: 'gpt-4o-mini' }));

jest.unstable_mockModule('ai', () => ({
  generateObject: mockGenerateObject,
}));

jest.unstable_mockModule('../config/agentProvider.mjs', () => ({
  getLightModel: mockGetLightModel,
}));

const { Evaluator } = await import('./evaluator.mjs');

describe('Evaluator', () => {
  const mockLogger = { warn: jest.fn(), error: jest.fn() };
  let evaluator;

  const skill = {
    name: 'symptom_analysis',
    description: '症状分析与初步评估',
    safetyRules: { mustIncludeDisclaimer: true },
  };

  const makeTrace = (overrides = {}) => ({
    userMessage: '我头疼',
    finalAnswer: '建议您多休息，注意观察。以上建议仅供参考。',
    totalSteps: 1,
    steps: [{ toolCalls: [{ toolName: 'query_vitals' }], toolResults: [] }],
    ...overrides,
  });

  const makeEvalResult = (overrides = {}) => ({
    relevance: 8,
    safety: 9,
    toolUsage: 7,
    disclaimer: 8,
    clarity: 8,
    weaknesses: ['工具调用不够充分'],
    suggestions: ['增加用药查询步骤'],
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    evaluator = new Evaluator({
      model: { modelId: 'gpt-4o-mini' },
      logger: mockLogger,
      generateObjectFn: mockGenerateObject,
    });
  });

  test('evaluateTrace calls generateObject with correct prompt', async () => {
    mockGenerateObject.mockResolvedValue({ object: makeEvalResult() });
    const result = await evaluator.evaluateTrace(makeTrace(), skill);

    expect(mockGenerateObject).toHaveBeenCalledTimes(1);
    const callArgs = mockGenerateObject.mock.calls[0][0];
    expect(callArgs.prompt).toContain('symptom_analysis');
    expect(callArgs.prompt).toContain('我头疼');
    expect(callArgs.prompt).toContain('query_vitals');

    expect(result.relevance).toBe(8);
    expect(result.safety).toBe(9);
    expect(result.weaknesses).toContain('工具调用不够充分');
  });

  test('evaluateSkill returns empty result for no traces', async () => {
    const result = await evaluator.evaluateSkill('symptom_analysis', [], skill);

    expect(result.sampleSize).toBe(0);
    expect(result.scores).toBeNull();
    expect(result.gradients).toEqual([]);
    expect(mockGenerateObject).not.toHaveBeenCalled();
  });

  test('evaluateSkill returns empty result for null traces', async () => {
    const result = await evaluator.evaluateSkill('symptom_analysis', null, skill);
    expect(result.sampleSize).toBe(0);
  });

  test('evaluateSkill aggregates scores from multiple traces', async () => {
    mockGenerateObject
      .mockResolvedValueOnce({
        object: makeEvalResult({ relevance: 8, safety: 10, toolUsage: 6, disclaimer: 8, clarity: 8 }),
      })
      .mockResolvedValueOnce({
        object: makeEvalResult({ relevance: 6, safety: 8, toolUsage: 8, disclaimer: 6, clarity: 6 }),
      });

    const traces = [makeTrace(), makeTrace({ userMessage: '胸闷' })];
    const result = await evaluator.evaluateSkill('symptom_analysis', traces, skill);

    expect(result.sampleSize).toBe(2);
    expect(result.scores.relevance).toBe(7);
    expect(result.scores.safety).toBe(9);
    expect(result.scores.toolUsage).toBe(7);
    expect(result.overallScore).toBeCloseTo(7.4, 1);
  });

  test('evaluateSkill collects gradients sorted by frequency', async () => {
    mockGenerateObject
      .mockResolvedValueOnce({
        object: makeEvalResult({
          weaknesses: ['免责声明缺失', '用药未查询'],
          suggestions: ['加强安全提示'],
        }),
      })
      .mockResolvedValueOnce({
        object: makeEvalResult({
          weaknesses: ['用药未查询', '回答过长'],
          suggestions: ['加强安全提示'],
        }),
      });

    const traces = [makeTrace(), makeTrace()];
    const result = await evaluator.evaluateSkill('test', traces, skill);

    const weaknesses = result.gradients.filter((g) => g.type === 'weakness');
    expect(weaknesses[0].text).toBe('用药未查询');
    expect(weaknesses[0].frequency).toBe(1);

    const suggestions = result.gradients.filter((g) => g.type === 'suggestion');
    expect(suggestions[0].text).toBe('加强安全提示');
    expect(suggestions[0].frequency).toBe(1);
  });

  test('evaluateSkill caps sample to 20 traces', async () => {
    mockGenerateObject.mockResolvedValue({ object: makeEvalResult() });
    const traces = Array.from({ length: 30 }, () => makeTrace());
    await evaluator.evaluateSkill('test', traces, skill);

    expect(mockGenerateObject).toHaveBeenCalledTimes(20);
  });

  test('evaluateSkill tolerates individual trace evaluation failures', async () => {
    mockGenerateObject
      .mockRejectedValueOnce(new Error('LLM down'))
      .mockResolvedValueOnce({ object: makeEvalResult() });

    const traces = [makeTrace(), makeTrace()];
    const result = await evaluator.evaluateSkill('test', traces, skill);

    expect(result.sampleSize).toBe(1);
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  test('evaluateSkill returns null scores when all evaluations fail', async () => {
    mockGenerateObject.mockRejectedValue(new Error('LLM down'));
    const traces = [makeTrace()];
    const result = await evaluator.evaluateSkill('test', traces, skill);

    expect(result.sampleSize).toBe(1);
    expect(result.scores).toBeNull();
    expect(result.gradients).toEqual([]);
  });

  test('evaluateTrace handles trace with no tool calls', async () => {
    mockGenerateObject.mockResolvedValue({ object: makeEvalResult() });
    const trace = makeTrace({ steps: [{ toolCalls: [], toolResults: [] }] });
    await evaluator.evaluateTrace(trace, skill);

    const prompt = mockGenerateObject.mock.calls[0][0].prompt;
    expect(prompt).toContain('[]');
  });

  test('uses injected model', async () => {
    mockGenerateObject.mockResolvedValue({ object: makeEvalResult() });
    const customModel = { modelId: 'custom-model' };
    const ev = new Evaluator({ model: customModel, generateObjectFn: mockGenerateObject });
    await ev.evaluateTrace(makeTrace(), skill);

    expect(mockGenerateObject.mock.calls[0][0].model).toBe(customModel);
  });
});
