const mockFindOne = jest.fn();
const mockUpdateOne = jest.fn();
const mockReplaceOne = jest.fn();
const mockToArray = jest.fn();

jest.mock('./connection', () => ({
  getCollection: jest.fn(() => ({
    findOne: mockFindOne,
    updateOne: mockUpdateOne,
    replaceOne: mockReplaceOne,
    find: () => ({ sort: () => ({ limit: () => ({ toArray: mockToArray }) }) })
  }))
}));

const { getByUser, setByUser, listByUser, sanitizeEmail } = require('./healthRecordAdapter');

beforeEach(() => {
  mockFindOne.mockReset();
  mockUpdateOne.mockReset();
  mockReplaceOne.mockReset();
  mockToArray.mockReset();
});

describe('healthRecordAdapter', () => {
  it('getByUser returns null when not found', async () => {
    mockFindOne.mockResolvedValue(null);
    expect(await getByUser('u@e.com')).toBeNull();
  });
  it('setByUser merges by default', async () => {
    mockUpdateOne.mockResolvedValue({ acknowledged: true });
    await setByUser('u_e_com', { summary: 'ok' });
    expect(mockUpdateOne).toHaveBeenCalledWith(expect.any(Object), expect.any(Object), { upsert: true });
  });
  it('listByUser returns list', async () => {
    mockToArray.mockResolvedValue([{ _id: 'id1', userEmail: 'u@e.com' }]);
    const list = await listByUser('u@e.com', { limit: 10 });
    expect(list.length).toBe(1);
  });
  it('sanitizeEmail replaces invalid chars', () => {
    expect(sanitizeEmail('u@e.com')).toBe('u@e.com');
    expect(sanitizeEmail('u+e.com')).toBe('u_e.com'); // + → _, . allowed
  });
});
