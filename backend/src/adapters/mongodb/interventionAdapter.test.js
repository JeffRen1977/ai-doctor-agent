const mockFindOne = jest.fn();
const mockUpdateOne = jest.fn();
jest.mock('./connection', () => ({
  getCollection: jest.fn(() => ({ findOne: mockFindOne, updateOne: mockUpdateOne }))
}));

const { getIntervention, setIntervention } = require('./interventionAdapter');

beforeEach(() => {
  mockFindOne.mockReset();
  mockUpdateOne.mockReset();
});

describe('getIntervention', () => {
  it('returns null when userId is empty', async () => {
    expect(await getIntervention('')).toBeNull();
  });
  it('returns fromFirestore-shaped object when found', async () => {
    mockFindOne.mockResolvedValue({ _id: 'u1', userEmail: 'u@e.com', medication: {}, version: 1 });
    const out = await getIntervention('u1');
    expect(out).toBeTruthy();
    expect(out.userEmail).toBe('u@e.com');
    expect(out.medication).toBeDefined();
  });
  it('returns null when not found', async () => {
    mockFindOne.mockResolvedValue(null);
    expect(await getIntervention('u1')).toBeNull();
  });
});

describe('setIntervention', () => {
  it('upserts payload', async () => {
    mockUpdateOne.mockResolvedValue({ acknowledged: true });
    await setIntervention('u1', { userEmail: 'u@e.com', medication: {} });
    expect(mockUpdateOne).toHaveBeenCalledWith({ _id: 'u1' }, { $set: { userEmail: 'u@e.com', medication: {} } }, { upsert: true });
  });
});
