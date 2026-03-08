/**
 * Unit tests: Intervention Firebase Adapter
 * See docs/data-format/REPOSITORY_EXPANSION_DESIGN.md §3.1
 */

const mockGetDoc = jest.fn();
const mockSetDoc = jest.fn();
jest.mock('../../config/firebase', () => ({ db: {} }));
jest.mock('firebase/firestore', () => ({
  doc: jest.fn((db, col, id) => ({ _col: col, _id: id })),
  getDoc: (...args) => mockGetDoc(...args),
  setDoc: (...args) => mockSetDoc(...args)
}));

const { getIntervention, setIntervention, fromFirestore } = require('./interventionAdapter');

beforeEach(() => {
  mockGetDoc.mockReset();
  mockSetDoc.mockReset();
});

describe('getIntervention', () => {
  test('returns null when document does not exist', async () => {
    mockGetDoc.mockResolvedValue({ exists: () => false });
    const result = await getIntervention('user_abc');
    expect(result).toBeNull();
  });

  test('returns plain object with lastAdjusted as ISO string when doc has Timestamp', async () => {
    const ts = { toDate: () => new Date('2025-01-15T12:00:00.000Z') };
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        userEmail: 'u@e.com',
        medication: { adjustments: [], currentPlan: {} },
        lastAdjusted: ts,
        version: 2
      })
    });
    const result = await getIntervention('user_abc');
    expect(result).not.toBeNull();
    expect(result.userEmail).toBe('u@e.com');
    expect(result.lastAdjusted).toBe('2025-01-15T12:00:00.000Z');
    expect(result.version).toBe(2);
  });

  test('returns default shape when doc exists but fields missing', async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ userEmail: 'u@e.com' })
    });
    const result = await getIntervention('user_abc');
    expect(result.medication).toBeDefined();
    expect(result.medication.adjustments).toEqual([]);
    expect(result.nutrition).toBeDefined();
    expect(result.exercise).toBeDefined();
    expect(typeof result.lastAdjusted).toBe('string');
    expect(result.version).toBe(1);
  });
});

describe('setIntervention', () => {
  test('calls setDoc with merge true', async () => {
    mockSetDoc.mockResolvedValue(undefined);
    const data = {
      userEmail: 'u@e.com',
      medication: { adjustments: [] },
      version: 1
    };
    await setIntervention('user_xyz', data);
    expect(mockSetDoc).toHaveBeenCalledTimes(1);
    const [ref, payload, opts] = mockSetDoc.mock.calls[0];
    expect(ref._id).toBe('user_xyz');
    expect(ref._col).toBe('interventions');
    expect(payload.version).toBe(1);
    expect(opts).toEqual({ merge: true });
  });
});

describe('fromFirestore', () => {
  test('converts Timestamp to ISO string', () => {
    const data = {
      userEmail: 'a@b.com',
      lastAdjusted: { toDate: () => new Date('2025-02-01T00:00:00.000Z') }
    };
    const out = fromFirestore(data);
    expect(out.lastAdjusted).toBe('2025-02-01T00:00:00.000Z');
  });

  test('returns null for null input', () => {
    expect(fromFirestore(null)).toBeNull();
  });
});
