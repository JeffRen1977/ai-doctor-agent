const mockFindOne = jest.fn();
const mockUpdateOne = jest.fn();
jest.mock('./connection', () => ({
  getCollection: jest.fn(() => ({ findOne: mockFindOne, updateOne: mockUpdateOne }))
}));

const { getExercisePlan, setExercisePlan } = require('./exercisePlanAdapter');

beforeEach(() => {
  mockFindOne.mockReset();
  mockUpdateOne.mockReset();
});

describe('getExercisePlan', () => {
  it('returns null when userId is empty', async () => {
    expect(await getExercisePlan('')).toBeNull();
  });
  it('returns plan object when found', async () => {
    mockFindOne.mockResolvedValue({ _id: 'u1', plan: { weekly: [] } });
    const out = await getExercisePlan('u1');
    expect(out).toEqual({ weekly: [] });
  });
  it('returns null when doc has no plan', async () => {
    mockFindOne.mockResolvedValue({ _id: 'u1' });
    expect(await getExercisePlan('u1')).toBeNull();
  });
  it('returns null when not found', async () => {
    mockFindOne.mockResolvedValue(null);
    expect(await getExercisePlan('u1')).toBeNull();
  });
});

describe('setExercisePlan', () => {
  it('upserts with plan and timestamps', async () => {
    mockUpdateOne.mockResolvedValue({ acknowledged: true });
    await setExercisePlan('u1', { plan: { weekly: [] } });
    const call = mockUpdateOne.mock.calls[0];
    expect(call[0]).toEqual({ _id: 'u1' });
    expect(call[1].$set.plan).toEqual({ weekly: [] });
    expect(call[1].$set.updatedAt).toBeDefined();
    expect(call[2]).toEqual({ upsert: true });
  });
});
