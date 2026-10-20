const mockFindOne = jest.fn();
const mockUpdateOne = jest.fn().mockResolvedValue({});
const mockDeleteOne = jest.fn().mockResolvedValue({});

jest.mock('./connection', () => ({
  getCollection: jest.fn(() => ({
    findOne: mockFindOne,
    updateOne: mockUpdateOne,
    deleteOne: mockDeleteOne,
  })),
}));

const { getByUser, upsert, deleteByUser } = require('./patientProfileAdapter');

beforeEach(() => {
  jest.clearAllMocks();
  mockUpdateOne.mockResolvedValue({});
  mockDeleteOne.mockResolvedValue({});
});

describe('patientProfileAdapter', () => {
  describe('getByUser', () => {
    test('returns normalized profile', async () => {
      mockFindOne.mockResolvedValue({
        _id: 'u1',
        conditions: ['diabetes'],
        allergies: ['penicillin'],
        goals: [],
        createdAt: '2026-01-01',
      });
      const result = await getByUser('u1');
      expect(result.userId).toBe('u1');
      expect(result.conditions).toEqual(['diabetes']);
      expect(result.allergies).toEqual(['penicillin']);
      expect(result.concerns).toEqual([]);
    });

    test('returns null for missing user', async () => {
      mockFindOne.mockResolvedValue(null);
      expect(await getByUser('u1')).toBeNull();
    });
  });

  describe('upsert', () => {
    test('uses $addToSet for array fields', async () => {
      await upsert('u1', { conditions: ['hypertension'], lastUpdatedBy: 'agent' });
      expect(mockUpdateOne).toHaveBeenCalledWith(
        { _id: 'u1' },
        expect.objectContaining({
          $addToSet: { conditions: { $each: ['hypertension'] } },
          $set: expect.objectContaining({ lastUpdatedBy: 'agent' }),
        }),
        { upsert: true },
      );
    });

    test('skips $addToSet when no array updates', async () => {
      await upsert('u1', { preferences: { language: 'zh' } });
      const call = mockUpdateOne.mock.calls[0];
      expect(call[1].$addToSet).toBeUndefined();
      expect(call[1].$set.preferences).toEqual({ language: 'zh' });
    });
  });

  describe('deleteByUser', () => {
    test('removes the profile doc', async () => {
      await deleteByUser('u1');
      expect(mockDeleteOne).toHaveBeenCalledWith({ _id: 'u1' });
    });
  });
});
