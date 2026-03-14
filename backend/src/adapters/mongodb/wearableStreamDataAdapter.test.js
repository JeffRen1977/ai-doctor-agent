const mockInsertOne = jest.fn();
const mockToArray = jest.fn();

jest.mock('./connection', () => ({
  getCollection: jest.fn(() => ({
    insertOne: mockInsertOne,
    find: () => ({ sort: () => ({ toArray: mockToArray, limit: () => ({ toArray: mockToArray }) }) })
  }))
}));

const { addDataPoint, getRecentByUser, listByUserInTimeRange } = require('./wearableStreamDataAdapter');

beforeEach(() => {
  mockInsertOne.mockReset();
  mockToArray.mockReset();
});

describe('wearableStreamDataAdapter', () => {
  it('addDataPoint returns id', async () => {
    mockInsertOne.mockResolvedValue({ insertedId: { toString: () => 'id1' } });
    const out = await addDataPoint({ userEmail: 'u@e.com', timestamp: new Date().toISOString() });
    expect(out.id).toBe('id1');
  });
  it('getRecentByUser returns list', async () => {
    mockToArray.mockResolvedValue([{ _id: 'id1', userEmail: 'u@e.com', timestamp: '2025-02-01T00:00:00.000Z' }]);
    const list = await getRecentByUser('u@e.com', { limit: 10 });
    expect(Array.isArray(list)).toBe(true);
  });
  it('listByUserInTimeRange returns list', async () => {
    mockToArray.mockResolvedValue([]);
    const list = await listByUserInTimeRange('u@e.com', 0, Date.now(), 10);
    expect(Array.isArray(list)).toBe(true);
  });
});
