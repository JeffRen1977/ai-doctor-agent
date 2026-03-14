/**
 * Unit tests: MongoDB healthSummaryAdapter
 * Mock connection.getCollection; no real DB.
 */
const mockFindOne = jest.fn();
const mockUpdateOne = jest.fn();
jest.mock('./connection', () => ({
  getCollection: jest.fn(() => ({
    findOne: mockFindOne,
    updateOne: mockUpdateOne
  }))
}));

const { getHealthSummary, setHealthSummary } = require('./healthSummaryAdapter');

beforeEach(() => {
  mockFindOne.mockReset();
  mockUpdateOne.mockReset();
});

describe('getHealthSummary', () => {
  it('returns null when userId is empty', async () => {
    expect(await getHealthSummary('')).toBeNull();
    expect(await getHealthSummary(null)).toBeNull();
  });

  it('returns null when doc not found', async () => {
    mockFindOne.mockResolvedValue(null);
    expect(await getHealthSummary('u1')).toBeNull();
    expect(mockFindOne).toHaveBeenCalledWith({ _id: 'u1' });
  });

  it('returns sanitized doc when found', async () => {
    mockFindOne.mockResolvedValue({
      _id: 'u1',
      summary: 'hello world',
      updatedAt: '2025-01-01T00:00:00.000Z'
    });
    const out = await getHealthSummary('u1');
    expect(out).toEqual({
      summary: 'hello world',
      updatedAt: '2025-01-01T00:00:00.000Z'
    });
  });
});

describe('setHealthSummary', () => {
  it('throws when userId is empty', async () => {
    await expect(setHealthSummary('', { summary: 'x' })).rejects.toThrow('userId required');
    await expect(setHealthSummary(null, { summary: 'x' })).rejects.toThrow('userId required');
  });

  it('upserts with userId as _id and adds updatedAt', async () => {
    mockUpdateOne.mockResolvedValue({ acknowledged: true });
    await setHealthSummary('u1', { summary: 'text' });
    expect(mockUpdateOne).toHaveBeenCalledWith(
      { _id: 'u1' },
      expect.objectContaining({
        $set: expect.objectContaining({
          summary: 'text',
          updatedAt: expect.any(String)
        })
      }),
      { upsert: true }
    );
  });

  it('uses provided updatedAt when given', async () => {
    mockUpdateOne.mockResolvedValue({ acknowledged: true });
    await setHealthSummary('u1', { summary: 's', updatedAt: '2025-06-01T12:00:00.000Z' });
    const call = mockUpdateOne.mock.calls[0];
    expect(call[1].$set.updatedAt).toBe('2025-06-01T12:00:00.000Z');
  });
});
