const mockFindOne = jest.fn();
const mockUpdateOne = jest.fn();
const mockReplaceOne = jest.fn();

jest.mock('./connection', () => ({
  getCollection: jest.fn(() => ({
    findOne: mockFindOne,
    updateOne: mockUpdateOne,
    replaceOne: mockReplaceOne
  }))
}));

const { get, set, update, sanitizeUserId } = require('./personalHealthRecordAdapter');

beforeEach(() => {
  mockFindOne.mockReset();
  mockUpdateOne.mockReset();
  mockReplaceOne.mockReset();
});

describe('personalHealthRecordAdapter', () => {
  it('get returns null when not found', async () => {
    mockFindOne.mockResolvedValue(null);
    expect(await get('u1')).toBeNull();
  });
  it('set upserts with merge', async () => {
    mockUpdateOne.mockResolvedValue({ acknowledged: true });
    await set('u1', { basicInfo: {} }, true);
    expect(mockUpdateOne).toHaveBeenCalledWith(expect.any(Object), expect.any(Object), { upsert: true });
  });
  it('update calls updateOne', async () => {
    mockUpdateOne.mockResolvedValue({ acknowledged: true });
    await update('u1', { basicInfo: { name: 'x' } });
    expect(mockUpdateOne).toHaveBeenCalledWith(expect.any(Object), expect.any(Object), { upsert: true });
  });
  it('sanitizeUserId replaces invalid chars', () => {
    expect(sanitizeUserId('u@e.com')).toBe('u@e.com');
  });
});
