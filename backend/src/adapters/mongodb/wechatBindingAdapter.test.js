const mockFindOne = jest.fn();
const mockUpdateOne = jest.fn();
const mockDeleteOne = jest.fn();
jest.mock('./connection', () => ({
  getCollection: jest.fn(() => ({
    findOne: mockFindOne,
    updateOne: mockUpdateOne,
    deleteOne: mockDeleteOne
  }))
}));

const { putBindingCode, takeBindingCode } = require('./wechatBindingAdapter');

beforeEach(() => {
  mockFindOne.mockReset();
  mockUpdateOne.mockReset();
  mockDeleteOne.mockReset();
});

describe('putBindingCode', () => {
  it('throws when code is empty', async () => {
    await expect(putBindingCode('', {})).rejects.toThrow('code required');
  });

  it('upserts code document', async () => {
    mockUpdateOne.mockResolvedValue({ acknowledged: true });
    await putBindingCode('ABC123', { userId: 'user1', expiresAt: '2026-12-01T00:15:00Z' });
    expect(mockUpdateOne).toHaveBeenCalledWith(
      { _id: 'ABC123' },
      { $set: expect.objectContaining({ userId: 'user1' }) },
      { upsert: true }
    );
  });

  it('strips non-alphanumeric characters and uppercases', async () => {
    mockUpdateOne.mockResolvedValue({ acknowledged: true });
    await putBindingCode('ab-c!1', { userId: 'user1', expiresAt: '2026-12-01T00:15:00Z' });
    expect(mockUpdateOne).toHaveBeenCalledWith(
      { _id: 'ABC1' },
      expect.any(Object),
      { upsert: true }
    );
  });
});

describe('takeBindingCode', () => {
  it('returns null when code is empty', async () => {
    expect(await takeBindingCode('')).toBeNull();
    expect(await takeBindingCode(null)).toBeNull();
  });

  it('returns userId and deletes on valid code', async () => {
    const future = new Date(Date.now() + 300000).toISOString();
    mockFindOne.mockResolvedValue({ _id: 'ABC123', userId: 'user1', expiresAt: future });
    mockDeleteOne.mockResolvedValue({ deletedCount: 1 });

    const result = await takeBindingCode('ABC123');
    expect(result).toEqual({ userId: 'user1' });
    expect(mockDeleteOne).toHaveBeenCalledWith({ _id: 'ABC123' });
  });

  it('returns null when code not found', async () => {
    mockFindOne.mockResolvedValue(null);
    expect(await takeBindingCode('NOCODE')).toBeNull();
  });

  it('returns null when doc has no userId', async () => {
    const future = new Date(Date.now() + 300000).toISOString();
    mockFindOne.mockResolvedValue({ _id: 'ABC123', expiresAt: future });
    expect(await takeBindingCode('ABC123')).toBeNull();
  });
});
