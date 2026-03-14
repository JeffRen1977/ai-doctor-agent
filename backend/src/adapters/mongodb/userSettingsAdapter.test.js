const mockFindOne = jest.fn();
const mockUpdateOne = jest.fn();
jest.mock('./connection', () => ({
  getCollection: jest.fn(() => ({ findOne: mockFindOne, updateOne: mockUpdateOne }))
}));

const { getUserSettings, setUserSettings } = require('./userSettingsAdapter');

beforeEach(() => {
  mockFindOne.mockReset();
  mockUpdateOne.mockReset();
});

describe('getUserSettings', () => {
  it('returns null when userId is empty', async () => {
    expect(await getUserSettings('')).toBeNull();
    expect(await getUserSettings(null)).toBeNull();
  });
  it('returns sanitized doc when found', async () => {
    mockFindOne.mockResolvedValue({ _id: 'u1', aiProvider: 'qwen', updatedAt: '2025-01-01T00:00:00.000Z' });
    const out = await getUserSettings('u1');
    expect(out).toMatchObject({ aiProvider: 'qwen', updatedAt: '2025-01-01T00:00:00.000Z' });
  });
  it('returns null when doc not found', async () => {
    mockFindOne.mockResolvedValue(null);
    expect(await getUserSettings('u1')).toBeNull();
  });
});

describe('setUserSettings', () => {
  it('upserts with userId as _id', async () => {
    mockUpdateOne.mockResolvedValue({ acknowledged: true });
    await setUserSettings('u1', { aiProvider: 'qwen', updatedAt: new Date().toISOString() });
    expect(mockUpdateOne).toHaveBeenCalledWith({ _id: 'u1' }, { $set: expect.any(Object) }, { upsert: true });
  });
});
