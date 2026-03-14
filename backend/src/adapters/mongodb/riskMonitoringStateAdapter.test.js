const mockFindOne = jest.fn();
const mockUpdateOne = jest.fn();
jest.mock('./connection', () => ({
  getCollection: jest.fn(() => ({ findOne: mockFindOne, updateOne: mockUpdateOne }))
}));

const { getRiskMonitoringState, setRiskMonitoringState } = require('./riskMonitoringStateAdapter');

beforeEach(() => {
  mockFindOne.mockReset();
  mockUpdateOne.mockReset();
});

describe('getRiskMonitoringState', () => {
  it('returns null when userId is empty', async () => {
    expect(await getRiskMonitoringState('')).toBeNull();
  });
  it('returns fromFirestore-shaped object when found', async () => {
    mockFindOne.mockResolvedValue({ _id: 'u1', userEmail: 'u@e.com', lastAutoDetectAt: '2025-01-01T00:00:00.000Z' });
    const out = await getRiskMonitoringState('u1');
    expect(out).toMatchObject({ userEmail: 'u@e.com', lastAutoDetectAt: '2025-01-01T00:00:00.000Z' });
  });
  it('returns null when not found', async () => {
    mockFindOne.mockResolvedValue(null);
    expect(await getRiskMonitoringState('u1')).toBeNull();
  });
});

describe('setRiskMonitoringState', () => {
  it('upserts by userId', async () => {
    mockUpdateOne.mockResolvedValue({ acknowledged: true });
    await setRiskMonitoringState('u1', { userEmail: 'u@e.com', lastAutoDetectAt: new Date().toISOString() });
    expect(mockUpdateOne).toHaveBeenCalledWith({ _id: 'u1' }, { $set: expect.any(Object) }, { upsert: true });
  });
});
