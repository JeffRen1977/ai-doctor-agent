const AgentTrace = require('./agentTrace');

describe('AgentTrace model', () => {
  test('validates required fields', () => {
    const doc = new AgentTrace({});
    const err = doc.validateSync();
    expect(err.errors.sessionId).toBeDefined();
    expect(err.errors.userId).toBeDefined();
    expect(err.errors.skill).toBeDefined();
    expect(err.errors.userMessage).toBeDefined();
  });

  test('accepts valid trace', () => {
    const doc = new AgentTrace({
      sessionId: 's1', userId: 'u1',
      skill: 'health_chat', userMessage: '我血糖怎么样',
      steps: [{
        stepIndex: 0,
        text: '',
        toolCalls: [{ name: 'query_vitals', args: { date: '2026-10-17' } }],
        toolResults: [{ date: '2026-10-17', data: { glucose: 135 } }],
        tokenUsage: { inputTokens: 200, outputTokens: 50 },
      }],
      finalAnswer: '您的血糖最近有所改善',
      totalSteps: 1,
      latencyMs: 1200,
    });
    const err = doc.validateSync();
    expect(err).toBeUndefined();
    expect(doc.steps).toHaveLength(1);
    expect(doc.steps[0].stepIndex).toBe(0);
  });

  test('rejects userScore out of range', () => {
    const doc = new AgentTrace({
      sessionId: 's1', userId: 'u1',
      skill: 'health_chat', userMessage: 'test',
      userScore: 6,
    });
    const err = doc.validateSync();
    expect(err.errors.userScore).toBeDefined();
  });

  test('defaults steps to empty array', () => {
    const doc = new AgentTrace({
      sessionId: 's1', userId: 'u1',
      skill: 'health_chat', userMessage: 'test',
    });
    expect(doc.steps).toEqual([]);
  });
});
