/**
 * Unit tests: RiskMonitoringState Firebase Adapter
 * See docs/data-format/REPOSITORY_EXPANSION_DESIGN.md §3.10
 */

const mockGetDoc = jest.fn();
const mockSetDoc = jest.fn();
jest.mock('../../config/firebase', () => ({ db: {} }));
jest.mock('firebase/firestore', () => ({
  doc: jest.fn((db, col, id) => ({ _col: col, _id: id })),
  getDoc: (...args) => mockGetDoc(...args),
  setDoc: (...args) => mockSetDoc(...args)
}));

const { getRiskMonitoringState, setRiskMonitoringState, fromFirestore } = require('./riskMonitoringStateAdapter');

beforeEach(() => {
  mockGetDoc.mockReset();
  mockSetDoc.mockReset();
});

describe('getRiskMonitoringState', () => {
  test('returns null when document does not exist', async () => {
    mockGetDoc.mockResolvedValue({ exists: () => false });
    const result = await getRiskMonitoringState('user_abc');
    expect(result).toBeNull();
  });

  test('returns plain object with lastAutoDetectAt as ISO when doc has Timestamp', async () => {
    const ts = { toDate: () => new Date('2025-01-15T12:00:00.000Z') };
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ lastAutoDetectAt: ts, userEmail: 'u@e.com' })
    });
    const result = await getRiskMonitoringState('user_abc');
    expect(result).not.toBeNull();
    expect(result.lastAutoDetectAt).toBe('2025-01-15T12:00:00.000Z');
    expect(result.userEmail).toBe('u@e.com');
  });
});

describe('setRiskMonitoringState', () => {
  test('calls setDoc with merge true and correct doc id', async () => {
    mockSetDoc.mockResolvedValue(undefined);
    await setRiskMonitoringState('user_xyz', { lastAutoDetectAt: '2025-01-01T00:00:00.000Z', userEmail: 'u@e.com' });
    expect(mockSetDoc).toHaveBeenCalledTimes(1);
    const [ref, data, opts] = mockSetDoc.mock.calls[0];
    expect(ref._col).toBe('riskMonitoringState');
    expect(ref._id).toBe('user_xyz');
    expect(data.lastAutoDetectAt).toBe('2025-01-01T00:00:00.000Z');
    expect(data.userEmail).toBe('u@e.com');
    expect(opts.merge).toBe(true);
  });
});

describe('fromFirestore', () => {
  test('converts Firestore Timestamp to ISO string', () => {
    const ts = { toDate: () => new Date('2025-01-01T00:00:00.000Z') };
    const out = fromFirestore({ lastAutoDetectAt: ts, userEmail: 'u@e.com' });
    expect(out.lastAutoDetectAt).toBe('2025-01-01T00:00:00.000Z');
    expect(out.userEmail).toBe('u@e.com');
  });
});
