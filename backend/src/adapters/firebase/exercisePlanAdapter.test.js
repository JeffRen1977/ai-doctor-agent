/**
 * Unit tests: ExercisePlan Firebase Adapter
 * See docs/data-format/REPOSITORY_EXPANSION_DESIGN.md §3.2
 */

const mockGetDoc = jest.fn();
const mockSetDoc = jest.fn();
jest.mock('../../config/firebase', () => ({ db: {} }));
jest.mock('firebase/firestore', () => ({
  doc: jest.fn((db, col, id) => ({ _col: col, _id: id })),
  getDoc: (...args) => mockGetDoc(...args),
  setDoc: (...args) => mockSetDoc(...args)
}));

const { getExercisePlan, setExercisePlan } = require('./exercisePlanAdapter');

beforeEach(() => {
  mockGetDoc.mockReset();
  mockSetDoc.mockReset();
});

describe('getExercisePlan', () => {
  test('returns null when document does not exist', async () => {
    mockGetDoc.mockResolvedValue({ exists: () => false });
    const result = await getExercisePlan('user_abc');
    expect(result).toBeNull();
  });

  test('returns null when doc exists but plan is missing', async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ userEmail: 'u@e.com' })
    });
    const result = await getExercisePlan('user_abc');
    expect(result).toBeNull();
  });

  test('returns plan object when doc has plan', async () => {
    const plan = { schedule: { mon: 'run' }, targets: { steps: 5000 } };
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ userEmail: 'u@e.com', plan, createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-01-01T00:00:00.000Z' })
    });
    const result = await getExercisePlan('user_abc');
    expect(result).toEqual(plan);
  });
});

describe('setExercisePlan', () => {
  test('calls setDoc with merge true and fills createdAt/updatedAt', async () => {
    mockSetDoc.mockResolvedValue(undefined);
    await setExercisePlan('user_xyz', { plan: { targets: { steps: 3000 } } });
    expect(mockSetDoc).toHaveBeenCalledTimes(1);
    const [ref, payload, opts] = mockSetDoc.mock.calls[0];
    expect(ref._id).toBe('user_xyz');
    expect(ref._col).toBe('exercisePlans');
    expect(payload.plan).toEqual({ targets: { steps: 3000 } });
    expect(payload.userEmail).toBe('user_xyz');
    expect(typeof payload.createdAt).toBe('string');
    expect(typeof payload.updatedAt).toBe('string');
    expect(opts).toEqual({ merge: true });
  });

  test('uses provided userEmail when given', async () => {
    mockSetDoc.mockResolvedValue(undefined);
    await setExercisePlan('user_xyz', { userEmail: 'real@e.com', plan: {} });
    const payload = mockSetDoc.mock.calls[0][1];
    expect(payload.userEmail).toBe('real@e.com');
  });
});
