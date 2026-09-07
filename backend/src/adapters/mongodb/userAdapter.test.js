const mockFindOne = jest.fn();
const mockUpdateOne = jest.fn();
jest.mock('./connection', () => ({
  getCollection: jest.fn(() => ({ findOne: mockFindOne, updateOne: mockUpdateOne }))
}));

const { getByEmail, setByEmail, updateByEmail, getByUid, findByPasswordResetHash } = require('./userAdapter');

beforeEach(() => {
  mockFindOne.mockReset();
  mockUpdateOne.mockReset();
});

describe('getByEmail', () => {
  it('returns null when email is empty', async () => {
    expect(await getByEmail('')).toBeNull();
    expect(await getByEmail(null)).toBeNull();
  });
  it('returns doc data when found', async () => {
    mockFindOne.mockResolvedValue({ _id: 'a@b.com', uid: 'uid1', name: 'Test' });
    const out = await getByEmail('a@b.com');
    expect(out).toEqual({ uid: 'uid1', name: 'Test' });
  });
  it('returns null when not found', async () => {
    mockFindOne.mockResolvedValue(null);
    expect(await getByEmail('a@b.com')).toBeNull();
  });
});

describe('setByEmail', () => {
  it('upserts by _id email', async () => {
    mockUpdateOne.mockResolvedValue({ acknowledged: true });
    await setByEmail('a@b.com', { uid: 'u1', name: 'X' });
    expect(mockUpdateOne).toHaveBeenCalledWith({ _id: 'a@b.com' }, { $set: { uid: 'u1', name: 'X' } }, { upsert: true });
  });
});

describe('updateByEmail', () => {
  it('updates by _id email', async () => {
    mockUpdateOne.mockResolvedValue({ acknowledged: true });
    await updateByEmail('a@b.com', { name: 'Y' });
    expect(mockUpdateOne).toHaveBeenCalledWith({ _id: 'a@b.com' }, { $set: { name: 'Y' } });
  });
});

describe('getByUid', () => {
  it('returns null when uid is empty', async () => {
    expect(await getByUid('')).toBeNull();
  });
  it('returns doc when found by uid', async () => {
    mockFindOne.mockResolvedValue({ _id: 'a@b.com', uid: 'uid1', name: 'Test' });
    const out = await getByUid('uid1');
    expect(out).toEqual({ uid: 'uid1', name: 'Test' });
  });
});

describe('findByPasswordResetHash', () => {
  it('returns null when hash is empty', async () => {
    expect(await findByPasswordResetHash('')).toBeNull();
  });

  it('returns email from _id when the field is missing', async () => {
    mockFindOne.mockResolvedValue({ _id: 'a@b.com', uid: 'uid1', passwordResetTokenHash: 'abc' });
    const out = await findByPasswordResetHash('abc');
    expect(out.email).toBe('a@b.com');
    expect(out.uid).toBe('uid1');
  });
});
