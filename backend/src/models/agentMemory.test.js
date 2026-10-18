const AgentMemory = require('./agentMemory');

describe('AgentMemory model', () => {
  test('validates required fields', () => {
    const doc = new AgentMemory({});
    const err = doc.validateSync();
    expect(err.errors.userId).toBeDefined();
    expect(err.errors.type).toBeDefined();
    expect(err.errors.content).toBeDefined();
  });

  test('rejects invalid type enum', () => {
    const doc = new AgentMemory({
      userId: 'u1', type: 'invalid', content: 'test',
    });
    const err = doc.validateSync();
    expect(err.errors.type).toBeDefined();
  });

  test('accepts valid conclusion memory', () => {
    const doc = new AgentMemory({
      userId: 'u1', type: 'conclusion',
      content: '患者血糖控制改善', importance: 0.8,
    });
    const err = doc.validateSync();
    expect(err).toBeUndefined();
    expect(doc.importance).toBe(0.8);
    expect(doc.accessCount).toBe(0);
    expect(doc.embedding).toEqual([]);
  });

  test('clamps importance to valid range', () => {
    const doc = new AgentMemory({
      userId: 'u1', type: 'preference',
      content: 'test', importance: 1.5,
    });
    const err = doc.validateSync();
    expect(err.errors.importance).toBeDefined();
  });

  test('accepts all valid type values', () => {
    for (const type of ['conclusion', 'preference', 'summary', 'feedback']) {
      const doc = new AgentMemory({ userId: 'u1', type, content: 'test' });
      expect(doc.validateSync()).toBeUndefined();
    }
  });
});
