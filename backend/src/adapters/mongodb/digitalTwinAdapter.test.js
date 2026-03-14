const mockFindOne = jest.fn();
const mockUpdateOne = jest.fn();
jest.mock('./connection', () => ({
  getCollection: jest.fn(() => ({ findOne: mockFindOne, updateOne: mockUpdateOne }))
}));

const { getDigitalTwin, setDigitalTwin, sanitizeUserId } = require('./digitalTwinAdapter');

beforeEach(() => {
  mockFindOne.mockReset();
  mockUpdateOne.mockReset();
});

describe('sanitizeUserId', () => {
  it('replaces invalid chars with underscore', () => {
    expect(sanitizeUserId('a@b.com')).toBe('a@b.com');
    expect(sanitizeUserId('a b')).toContain('_');
  });
});

describe('getDigitalTwin', () => {
  it('returns null when userId is empty', async () => {
    expect(await getDigitalTwin('')).toBeNull();
  });
  it('returns doc when found', async () => {
    mockFindOne.mockResolvedValue({ _id: 'user_example_com', lastUpdated: '2025-01-01T00:00:00.000Z' });
    const out = await getDigitalTwin('user@example.com');
    expect(out).toBeTruthy();
    expect(out.lastUpdated).toBe('2025-01-01T00:00:00.000Z');
  });
  it('returns null when doc not found', async () => {
    mockFindOne.mockResolvedValue(null);
    expect(await getDigitalTwin('u@e.com')).toBeNull();
  });
});

describe('setDigitalTwin', () => {
  it('upserts with sanitized id', async () => {
    mockUpdateOne.mockResolvedValue({ acknowledged: true });
    await setDigitalTwin('u@e.com', { profile: {} });
    expect(mockUpdateOne).toHaveBeenCalledWith(
      { _id: 'u@e.com' },
      { $set: { profile: {} } },
      { upsert: true }
    );
  });
});
