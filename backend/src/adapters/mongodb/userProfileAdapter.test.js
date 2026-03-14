const mockFindOne = jest.fn();
const mockUpdateOne = jest.fn();
jest.mock('./connection', () => ({
  getCollection: jest.fn(() => ({ findOne: mockFindOne, updateOne: mockUpdateOne }))
}));

const { getByEmail, setByEmail, updateByEmail } = require('./userProfileAdapter');

beforeEach(() => {
  mockFindOne.mockReset();
  mockUpdateOne.mockReset();
});

describe('getByEmail', () => {
  it('returns null when email is empty', async () => {
    expect(await getByEmail('')).toBeNull();
  });
  it('returns doc when found', async () => {
    mockFindOne.mockResolvedValue({ _id: 'a@b.com', name: 'Test', avatar: null });
    const out = await getByEmail('a@b.com');
    expect(out).toEqual({ name: 'Test', avatar: null });
  });
});

describe('setByEmail', () => {
  it('upserts by _id email', async () => {
    mockUpdateOne.mockResolvedValue({ acknowledged: true });
    await setByEmail('a@b.com', { name: 'X' });
    expect(mockUpdateOne).toHaveBeenCalledWith({ _id: 'a@b.com' }, { $set: { name: 'X' } }, { upsert: true });
  });
});

describe('updateByEmail', () => {
  it('updates by _id email', async () => {
    mockUpdateOne.mockResolvedValue({ acknowledged: true });
    await updateByEmail('a@b.com', { name: 'Y' });
    expect(mockUpdateOne).toHaveBeenCalledWith({ _id: 'a@b.com' }, { $set: { name: 'Y' } });
  });
});
