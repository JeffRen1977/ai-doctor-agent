const mockFindOne = jest.fn();
const mockUpdateOne = jest.fn().mockResolvedValue({});
const mockDeleteMany = jest.fn().mockResolvedValue({});
const mockToArray = jest.fn();

jest.mock('./connection', () => ({
  getCollection: jest.fn(() => ({
    findOne: mockFindOne,
    updateOne: mockUpdateOne,
    deleteMany: mockDeleteMany,
    find: jest.fn(() => ({
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      toArray: mockToArray,
    })),
  })),
}));

const { save, findByUser, search, deleteByUser } = require('./agentMemoryAdapter');

beforeEach(() => {
  jest.clearAllMocks();
  mockUpdateOne.mockResolvedValue({});
  mockDeleteMany.mockResolvedValue({});
});

describe('agentMemoryAdapter', () => {
  describe('save', () => {
    test('upserts by userId+content', async () => {
      await save('u1', { type: 'conclusion', content: '血糖改善', importance: 0.8, sourceSessionId: 's1' });
      expect(mockUpdateOne).toHaveBeenCalledWith(
        { userId: 'u1', content: '血糖改善' },
        expect.objectContaining({
          $set: expect.objectContaining({ type: 'conclusion', importance: 0.8 }),
          $setOnInsert: expect.objectContaining({ userId: 'u1', content: '血糖改善' }),
        }),
        { upsert: true },
      );
    });
  });

  describe('findByUser', () => {
    test('returns normalized docs sorted by importance', async () => {
      mockToArray.mockResolvedValue([
        { _id: 'a', userId: 'u1', type: 'conclusion', content: 'test', importance: 0.9, createdAt: '2026-01-01' },
      ]);
      const results = await findByUser('u1', { type: 'conclusion', limit: 10 });
      expect(results).toHaveLength(1);
      expect(results[0].content).toBe('test');
      expect(results[0].importance).toBe(0.9);
    });
  });

  describe('search', () => {
    test('returns only memories matching the query, best first', async () => {
      const now = new Date().toISOString();
      mockToArray.mockResolvedValue([
        { userId: 'u1', type: 'conclusion', content: '血压偏高，注意低盐饮食', importance: 0.8, createdAt: now, updatedAt: now },
        { userId: 'u1', type: 'conclusion', content: '血糖控制改善，建议继续', importance: 0.8, createdAt: now, updatedAt: now },
        { userId: 'u1', type: 'preference', content: '一般健康咨询', importance: 0.3, createdAt: now, updatedAt: now },
      ]);
      const results = await search('u1', '我的血糖最近改善了吗');
      expect(results.map((r) => r.content)).toEqual(['血糖控制改善，建议继续']);
    });

    test('does not throw on regex metacharacters in the query', async () => {
      mockToArray.mockResolvedValue([]);
      await expect(search('u1', '血压(高')).resolves.toEqual([]);
    });

    test('returns empty for blank query', async () => {
      const results = await search('u1', '  ');
      expect(results).toEqual([]);
    });
  });

  describe('deleteByUser', () => {
    test('removes all docs for user', async () => {
      await deleteByUser('u1');
      expect(mockDeleteMany).toHaveBeenCalledWith({ userId: 'u1' });
    });
  });
});
