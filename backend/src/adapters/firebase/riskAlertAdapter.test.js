/**
 * Unit tests: RiskAlert Firebase Adapter
 * See docs/data-format/REPOSITORY_EXPANSION_DESIGN.md §3.4
 */

const mockAddDoc = jest.fn();
const mockGetDocs = jest.fn();
const mockUpdateDoc = jest.fn();
jest.mock('../../config/firebase', () => ({ db: {} }));
jest.mock('firebase/firestore', () => ({
  doc: jest.fn((db, col, id) => ({ _col: col, _id: id })),
  collection: jest.fn((db, col) => ({ _col: col })),
  addDoc: (...args) => mockAddDoc(...args),
  getDocs: (...args) => mockGetDocs(...args),
  updateDoc: (...args) => mockUpdateDoc(...args),
  query: jest.fn(() => ({})),
  where: jest.fn(() => ({})),
  orderBy: jest.fn(() => ({})),
  limit: jest.fn(() => ({}))
}));

const { addAlert, getRecentAlertsByUser, acknowledgeAlert, docToAlert } = require('./riskAlertAdapter');

beforeEach(() => {
  mockAddDoc.mockReset();
  mockGetDocs.mockReset();
  mockUpdateDoc.mockReset();
});

describe('addAlert', () => {
  test('calls addDoc and returns { id, ...alert }', async () => {
    mockAddDoc.mockResolvedValue({ id: 'alert_xyz' });
    const result = await addAlert({
      userEmail: 'u@e.com',
      alertType: 'hypoglycemia',
      severity: 'high',
      details: { value: 65 }
    });
    expect(mockAddDoc).toHaveBeenCalledTimes(1);
    const payload = mockAddDoc.mock.calls[0][1];
    expect(payload.userEmail).toBe('u@e.com');
    expect(payload.alertType).toBe('hypoglycemia');
    expect(payload.acknowledged).toBe(false);
    expect(result.id).toBe('alert_xyz');
    expect(result.severity).toBe('high');
  });
});

describe('getRecentAlertsByUser', () => {
  test('returns alerts from snapshot with timestamp as ISO string', async () => {
    const ts = { toDate: () => new Date('2025-01-01T12:00:00.000Z') };
    mockGetDocs.mockResolvedValue({
      docs: [
        { id: 'a1', data: () => ({ userEmail: 'u@e.com', alertType: 'hr', severity: 'medium', timestamp: ts }) }
      ]
    });
    const result = await getRecentAlertsByUser('u@e.com', 5);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('a1');
    expect(result[0].timestamp).toBe('2025-01-01T12:00:00.000Z');
  });

  test('on failed-precondition uses fallback and sorts by timestamp', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const ts = { toDate: () => new Date('2025-01-02T00:00:00.000Z') };
    mockGetDocs
      .mockRejectedValueOnce({ code: 'failed-precondition' })
      .mockResolvedValueOnce({
        docs: [
          { id: 'b2', data: () => ({ userEmail: 'u@e.com', alertType: 'bp', timestamp: '2025-01-01T00:00:00.000Z' }) },
          { id: 'b1', data: () => ({ userEmail: 'u@e.com', alertType: 'hr', timestamp: ts }) }
        ]
      });
    const result = await getRecentAlertsByUser('u@e.com', 10);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('b1');
    expect(result[0].timestamp).toBe('2025-01-02T00:00:00.000Z');
    warnSpy.mockRestore();
  });
});

describe('acknowledgeAlert', () => {
  test('calls updateDoc with payload', async () => {
    mockUpdateDoc.mockResolvedValue(undefined);
    await acknowledgeAlert('alert_123', { acknowledged: true, acknowledgedAt: '2025-01-01T00:00:00.000Z' });
    expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
    const [ref, payload] = mockUpdateDoc.mock.calls[0];
    expect(ref._id).toBe('alert_123');
    expect(ref._col).toBe('riskAlerts');
    expect(payload.acknowledged).toBe(true);
  });
});

describe('docToAlert', () => {
  test('converts Timestamp to ISO string', () => {
    const docSnap = {
      id: 'd1',
      data: () => ({ userEmail: 'u@e.com', timestamp: { toDate: () => new Date('2025-02-01T00:00:00.000Z') } })
    };
    const out = docToAlert(docSnap);
    expect(out.id).toBe('d1');
    expect(out.timestamp).toBe('2025-02-01T00:00:00.000Z');
  });
});
