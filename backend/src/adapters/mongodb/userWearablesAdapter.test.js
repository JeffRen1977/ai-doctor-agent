const mockFindOne = jest.fn();
const mockUpdateOne = jest.fn();
const mockToArray = jest.fn();

jest.mock('./connection', () => ({
  getCollection: jest.fn(() => ({
    findOne: mockFindOne,
    updateOne: mockUpdateOne,
    find: () => ({ sort: () => ({ limit: () => ({ toArray: mockToArray }) }) })
  }))
}));

const { getUserWearables, setUserWearables, listHistoryByUser } = require('./userWearablesAdapter');

beforeEach(() => {
  mockFindOne.mockReset();
  mockUpdateOne.mockReset();
  mockToArray.mockReset();
});

describe('userWearablesAdapter', () => {
  it('getUserWearables returns null when not found', async () => {
    mockFindOne.mockResolvedValue(null);
    expect(await getUserWearables('u1')).toBeNull();
  });
  it('setUserWearables upserts by userId', async () => {
    mockUpdateOne.mockResolvedValue({ acknowledged: true });
    await setUserWearables('u1', { lastSync: '2025-02-01T00:00:00.000Z' });
    expect(mockUpdateOne).toHaveBeenCalledWith({ _id: 'u1' }, expect.any(Object), { upsert: true });
  });
  it('listHistoryByUser returns list', async () => {
    mockToArray.mockResolvedValue([{ _id: 'u1', userEmail: 'u@e.com', lastSync: '2025-02-01T00:00:00.000Z' }]);
    const list = await listHistoryByUser('u@e.com', { limit: 10 });
    expect(list.length).toBe(1);
    expect(list[0].timestamp).toBe('2025-02-01T00:00:00.000Z');
  });
});
