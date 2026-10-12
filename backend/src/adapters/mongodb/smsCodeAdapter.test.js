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

const { putSmsCode, getSmsCode, deleteSmsCode, incrementAttempts } = require('./smsCodeAdapter');

beforeEach(() => {
  mockFindOne.mockReset();
  mockUpdateOne.mockReset();
  mockDeleteOne.mockReset();
});

describe('putSmsCode', () => {
  it('throws when phone is empty', async () => {
    await expect(putSmsCode('', {})).rejects.toThrow('phone required');
  });

  it('upserts code document by phone', async () => {
    mockUpdateOne.mockResolvedValue({ acknowledged: true });
    await putSmsCode('13812345678', { code: '123456', expiresAt: '2026-12-01T00:05:00.000Z' });
    expect(mockUpdateOne).toHaveBeenCalledWith(
      { _id: '13812345678' },
      { $set: expect.objectContaining({ code: '123456', attempts: 0 }) },
      { upsert: true }
    );
  });

  it('strips non-digit characters from phone', async () => {
    mockUpdateOne.mockResolvedValue({ acknowledged: true });
    await putSmsCode('+86-138-1234-5678', { code: '111111', expiresAt: '2026-12-01T00:05:00.000Z' });
    expect(mockUpdateOne).toHaveBeenCalledWith(
      { _id: '8613812345678' },
      expect.any(Object),
      { upsert: true }
    );
  });
});

describe('getSmsCode', () => {
  it('returns null when phone is empty', async () => {
    expect(await getSmsCode('')).toBeNull();
    expect(await getSmsCode(null)).toBeNull();
  });

  it('returns code data when found and not expired', async () => {
    const future = new Date(Date.now() + 300000).toISOString();
    mockFindOne.mockResolvedValue({ _id: '13812345678', code: '123456', expiresAt: future, attempts: 1 });
    const out = await getSmsCode('13812345678');
    expect(out).toEqual({ code: '123456', expiresAt: future, attempts: 1 });
  });

  it('returns null when not found', async () => {
    mockFindOne.mockResolvedValue(null);
    expect(await getSmsCode('13812345678')).toBeNull();
  });
});

describe('deleteSmsCode', () => {
  it('does nothing when phone is empty', async () => {
    await deleteSmsCode('');
    expect(mockDeleteOne).not.toHaveBeenCalled();
  });

  it('deletes by phone', async () => {
    mockDeleteOne.mockResolvedValue({ deletedCount: 1 });
    await deleteSmsCode('13812345678');
    expect(mockDeleteOne).toHaveBeenCalledWith({ _id: '13812345678' });
  });
});

describe('incrementAttempts', () => {
  it('does nothing when phone is empty', async () => {
    await incrementAttempts('');
    expect(mockUpdateOne).not.toHaveBeenCalled();
  });

  it('increments attempts by 1', async () => {
    mockUpdateOne.mockResolvedValue({ acknowledged: true });
    await incrementAttempts('13812345678');
    expect(mockUpdateOne).toHaveBeenCalledWith(
      { _id: '13812345678' },
      { $inc: { attempts: 1 } }
    );
  });
});
