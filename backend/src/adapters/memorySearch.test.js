const { tokenize, rankMemories, cosineSimilarity, timeDecay } = require('./memorySearch');

describe('memorySearch', () => {
  describe('cosineSimilarity', () => {
    test('returns 1 for identical vectors', () => {
      expect(cosineSimilarity([1, 0, 0], [1, 0, 0])).toBeCloseTo(1);
    });

    test('returns 0 for orthogonal vectors', () => {
      expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0);
    });

    test('returns 0 for null or empty inputs', () => {
      expect(cosineSimilarity(null, [1])).toBe(0);
      expect(cosineSimilarity([], [])).toBe(0);
    });

    test('returns 0 for mismatched lengths', () => {
      expect(cosineSimilarity([1, 2], [1, 2, 3])).toBe(0);
    });

    test('handles negative values', () => {
      expect(cosineSimilarity([1, 0], [-1, 0])).toBeCloseTo(-1);
    });
  });

  describe('timeDecay', () => {
    test('returns ~1 for a recent date', () => {
      expect(timeDecay(new Date().toISOString())).toBeCloseTo(1, 1);
    });

    test('returns 0 for a date 180+ days ago', () => {
      const old = new Date(Date.now() - 200 * 86400000).toISOString();
      expect(timeDecay(old)).toBe(0);
    });

    test('returns 0 for invalid date', () => {
      expect(timeDecay('not-a-date')).toBe(0);
    });
  });

  describe('tokenize', () => {
    test('splits Chinese text without spaces into bigrams', () => {
      const tokens = tokenize('我最近头疼得厉害');
      expect(tokens).toEqual(expect.arrayContaining(['头疼', '厉害']));
      expect(tokens).not.toContain('最近');
    });

    test('keeps English words and drops stop words', () => {
      expect(tokenize('How should I treat a headache?')).toEqual(['treat', 'headache']);
    });

    test('treats regex metacharacters as plain text', () => {
      expect(() => tokenize('血压(高')).not.toThrow();
      expect(tokenize('血压(高')).toEqual(['血压']);
    });

    test('returns no tokens for blank input', () => {
      expect(tokenize('   ')).toEqual([]);
      expect(tokenize(null)).toEqual([]);
    });
  });

  describe('rankMemories', () => {
    const now = new Date().toISOString();

    test('finds a stored memory from a natural Chinese question', () => {
      const memories = [
        { content: '头疼可能是睡眠不足引起，建议规律作息', importance: 0.7, updatedAt: now },
        { content: '建议减少碳水摄入', importance: 0.7, updatedAt: now },
      ];
      const results = rankMemories(memories, '我最近头疼得厉害怎么办', 5);
      expect(results).toHaveLength(1);
      expect(results[0].content).toContain('头疼');
    });

    test('ranks better matches first', () => {
      const memories = [
        { content: '血压偏高', importance: 0.5, updatedAt: now },
        { content: '血糖控制改善', importance: 0.5, updatedAt: now },
      ];
      const results = rankMemories(memories, '血糖控制', 5);
      expect(results[0].content).toBe('血糖控制改善');
    });

    test('respects the limit', () => {
      const memories = Array.from({ length: 10 }, (_, i) => ({ content: `血糖记录${i}`, updatedAt: now }));
      expect(rankMemories(memories, '血糖', 3)).toHaveLength(3);
    });

    test('scores memories without a valid date', () => {
      const results = rankMemories([{ content: '血糖', importance: 0.5 }], '血糖', 5);
      expect(Number.isFinite(results[0].score)).toBe(true);
    });

    test('boosts results with high cosine similarity', () => {
      const queryEmb = [1, 0, 0];
      const memories = [
        { content: '无关', importance: 0.5, updatedAt: now, embedding: [0, 1, 0] },
        { content: '血糖控制很好', importance: 0.5, updatedAt: now, embedding: [0.9, 0.1, 0] },
      ];
      const results = rankMemories(memories, '血糖', 5, queryEmb);
      expect(results[0].content).toBe('血糖控制很好');
    });

    test('includes semantically similar memories even without keyword overlap', () => {
      const queryEmb = [1, 0, 0];
      const memories = [
        { content: 'glucose improved', importance: 0.5, updatedAt: now, embedding: [0.95, 0.05, 0] },
      ];
      const results = rankMemories(memories, '血糖', 5, queryEmb);
      expect(results).toHaveLength(1);
    });

    test('excludes memories with low cosine similarity and no keyword match', () => {
      const queryEmb = [1, 0, 0];
      const memories = [
        { content: 'unrelated topic', importance: 0.5, updatedAt: now, embedding: [0, 0.1, 0.9] },
      ];
      const results = rankMemories(memories, '血糖', 5, queryEmb);
      expect(results).toHaveLength(0);
    });

    test('falls back to keyword scoring when no embeddings available', () => {
      const memories = [
        { content: '血糖控制改善', importance: 0.5, updatedAt: now },
      ];
      const results = rankMemories(memories, '血糖', 5, null);
      expect(results).toHaveLength(1);
    });
  });
});
