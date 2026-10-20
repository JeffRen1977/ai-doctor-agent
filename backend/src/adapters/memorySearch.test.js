const { tokenize, rankMemories } = require('./memorySearch');

describe('memorySearch', () => {
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
  });
});
