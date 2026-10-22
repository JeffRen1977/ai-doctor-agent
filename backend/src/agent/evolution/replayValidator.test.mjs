import { describe, test, expect, jest, beforeEach } from '@jest/globals';

const mockGenerateText = jest.fn();
const mockGenerateObject = jest.fn();

jest.unstable_mockModule('ai', () => ({
  generateText: mockGenerateText,
  generateObject: mockGenerateObject,
}));

jest.unstable_mockModule('../config/agentProvider.mjs', () => ({
  getAgentModel: jest.fn(() => ({ modelId: 'gpt-4o' })),
  getLightModel: jest.fn(() => ({ modelId: 'gpt-4o-mini' })),
}));

const { ReplayValidator } = await import('./replayValidator.mjs');

describe('ReplayValidator', () => {
  const mockLogger = { warn: jest.fn(), error: jest.fn() };
  let validator;

  const candidate = {
    skill: 'symptom_analysis',
    version: '1.0.1-candidate',
    systemPrompt: '你是一位改进后的症状分析助手。',
  };

  const makeTrace = (overrides = {}) => ({
    _id: 'trace1',
    userMessage: '我头疼',
    finalAnswer: '建议您多休息。以上建议仅供参考。',
    ...overrides,
  });

  const originalSkill = {
    name: 'symptom_analysis',
    version: '1.0.0',
    systemPrompt: '原始 prompt',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    validator = new ReplayValidator({
      model: { modelId: 'gpt-4o' },
      judgeModel: { modelId: 'gpt-4o-mini' },
      logger: mockLogger,
      generateTextFn: mockGenerateText,
      generateObjectFn: mockGenerateObject,
    });
  });

  test('replay calls generateText with candidate prompt', async () => {
    mockGenerateText.mockResolvedValue({ text: '候选回答' });
    const result = await validator.replay('候选 system prompt', '我头疼');

    expect(mockGenerateText).toHaveBeenCalledWith(
      expect.objectContaining({
        system: '候选 system prompt',
        messages: [{ role: 'user', content: '我头疼' }],
        maxTokens: 2048,
      }),
    );
    expect(result).toBe('候选回答');
  });

  test('compareAnswers calls generateObject with both answers', async () => {
    mockGenerateObject.mockResolvedValue({
      object: {
        winner: 'candidate',
        candidateScore: 8,
        originalScore: 7,
        reasoning: '候选版更详细',
      },
    });

    const result = await validator.compareAnswers('问题', '原始回答', '候选回答');

    expect(result.winner).toBe('candidate');
    expect(result.candidateScore).toBe(8);
    expect(result.originalScore).toBe(7);

    const prompt = mockGenerateObject.mock.calls[0][0].prompt;
    expect(prompt).toContain('原始回答');
    expect(prompt).toContain('候选回答');
  });

  test('validate passes when candidate wins majority', async () => {
    mockGenerateText.mockResolvedValue({ text: '候选回答' });
    mockGenerateObject.mockResolvedValue({
      object: { winner: 'candidate', candidateScore: 8, originalScore: 6, reasoning: '更好' },
    });

    const traces = [makeTrace(), makeTrace({ _id: 't2', userMessage: '胸闷' })];
    const result = await validator.validate(candidate, traces, originalSkill);

    expect(result.passed).toBe(true);
    expect(result.wins).toBe(2);
    expect(result.losses).toBe(0);
    expect(result.winRate).toBe(1);
    expect(result.sampleSize).toBe(2);
    expect(result.avgCandidateScore).toBe(8);
    expect(result.avgOriginalScore).toBe(6);
  });

  test('validate fails when original wins majority', async () => {
    mockGenerateText.mockResolvedValue({ text: '候选回答' });
    mockGenerateObject.mockResolvedValue({
      object: { winner: 'original', candidateScore: 5, originalScore: 8, reasoning: '原版更好' },
    });

    const traces = [makeTrace(), makeTrace({ _id: 't2' })];
    const result = await validator.validate(candidate, traces, originalSkill);

    expect(result.passed).toBe(false);
    expect(result.losses).toBe(2);
    expect(result.winRate).toBe(0);
  });

  test('validate fails when no traces', async () => {
    const result = await validator.validate(candidate, [], originalSkill);
    expect(result.passed).toBe(false);
    expect(result.reason).toBe('no_traces');
  });

  test('validate fails when null traces', async () => {
    const result = await validator.validate(candidate, null, originalSkill);
    expect(result.passed).toBe(false);
    expect(result.reason).toBe('no_traces');
  });

  test('validate handles tie results', async () => {
    mockGenerateText.mockResolvedValue({ text: '候选回答' });
    mockGenerateObject.mockResolvedValue({
      object: { winner: 'tie', candidateScore: 7, originalScore: 7, reasoning: '持平' },
    });

    const traces = [makeTrace(), makeTrace({ _id: 't2' })];
    const result = await validator.validate(candidate, traces, originalSkill);

    expect(result.ties).toBe(2);
    expect(result.winRate).toBe(0);
    expect(result.passed).toBe(false);
  });

  test('validate passes with 50% win rate and equal scores', async () => {
    mockGenerateText.mockResolvedValue({ text: '候选回答' });
    mockGenerateObject
      .mockResolvedValueOnce({
        object: { winner: 'candidate', candidateScore: 8, originalScore: 7, reasoning: 'better' },
      })
      .mockResolvedValueOnce({
        object: { winner: 'original', candidateScore: 7, originalScore: 7, reasoning: 'same' },
      });

    const traces = [makeTrace(), makeTrace({ _id: 't2' })];
    const result = await validator.validate(candidate, traces, originalSkill);

    expect(result.wins).toBe(1);
    expect(result.losses).toBe(1);
    expect(result.winRate).toBe(0.5);
    expect(result.avgCandidateScore).toBe(7.5);
    expect(result.avgOriginalScore).toBe(7);
    expect(result.passed).toBe(true);
  });

  test('validate tolerates individual comparison failures', async () => {
    mockGenerateText
      .mockRejectedValueOnce(new Error('LLM down'))
      .mockResolvedValueOnce({ text: '候选回答' });
    mockGenerateObject.mockResolvedValue({
      object: { winner: 'candidate', candidateScore: 8, originalScore: 6, reasoning: 'ok' },
    });

    const traces = [makeTrace(), makeTrace({ _id: 't2' })];
    const result = await validator.validate(candidate, traces, originalSkill);

    expect(result.sampleSize).toBe(1);
    expect(result.passed).toBe(true);
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  test('validate fails when all comparisons fail', async () => {
    mockGenerateText.mockRejectedValue(new Error('LLM down'));

    const traces = [makeTrace()];
    const result = await validator.validate(candidate, traces, originalSkill);

    expect(result.passed).toBe(false);
    expect(result.reason).toBe('all_comparisons_failed');
  });

  test('validate caps sample to 10 traces', async () => {
    mockGenerateText.mockResolvedValue({ text: '候选回答' });
    mockGenerateObject.mockResolvedValue({
      object: { winner: 'candidate', candidateScore: 8, originalScore: 6, reasoning: 'ok' },
    });

    const traces = Array.from({ length: 15 }, (_, i) => makeTrace({ _id: `t${i}` }));
    const result = await validator.validate(candidate, traces, originalSkill);

    expect(result.sampleSize).toBe(10);
    expect(mockGenerateText).toHaveBeenCalledTimes(10);
  });

  test('comparisons include userMessage', async () => {
    mockGenerateText.mockResolvedValue({ text: '候选回答' });
    mockGenerateObject.mockResolvedValue({
      object: { winner: 'candidate', candidateScore: 8, originalScore: 6, reasoning: 'ok' },
    });

    const traces = [makeTrace({ userMessage: '我胸闷' })];
    const result = await validator.validate(candidate, traces, originalSkill);

    expect(result.comparisons[0].userMessage).toBe('我胸闷');
  });
});
