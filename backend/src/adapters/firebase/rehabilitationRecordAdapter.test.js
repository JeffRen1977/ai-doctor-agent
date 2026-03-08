/**
 * Unit tests: RehabilitationRecord Firebase Adapter
 * See docs/data-format/REPOSITORY_EXPANSION_DESIGN.md §3.6
 */

const mockAddDoc = jest.fn();
const mockGetDocs = jest.fn();
const mockUpdateDoc = jest.fn();
jest.mock('../../config/firebase', () => ({ db: {} }));
jest.mock('firebase/firestore', () => ({
  collection: jest.fn((db, col) => ({ _col: col })),
  addDoc: (...args) => mockAddDoc(...args),
  getDocs: (...args) => mockGetDocs(...args),
  updateDoc: (...args) => mockUpdateDoc(...args),
  query: jest.fn(() => ({})),
  where: jest.fn(() => ({})),
  orderBy: jest.fn(() => ({})),
  limit: jest.fn(() => ({}))
}));

const {
  addRehabilitationRecord,
  getRehabilitationRecords,
  updateRehabilitationRecordFeedback,
  docToRecord
} = require('./rehabilitationRecordAdapter');

beforeEach(() => {
  mockAddDoc.mockReset();
  mockGetDocs.mockReset();
  mockUpdateDoc.mockReset();
});

describe('addRehabilitationRecord', () => {
  test('calls addDoc and returns { id, ...record }', async () => {
    mockAddDoc.mockResolvedValue({ id: 'doc_xyz' });
    const record = { recordId: 'rehab_1', userEmail: 'u@e.com', type: 'qa', timestamp: '2025-01-01T00:00:00.000Z' };
    const result = await addRehabilitationRecord(record);
    expect(mockAddDoc).toHaveBeenCalledWith(expect.anything(), record);
    expect(result.id).toBe('doc_xyz');
    expect(result.recordId).toBe('rehab_1');
  });
});

describe('getRehabilitationRecords', () => {
  test('returns { records, count } from snapshot', async () => {
    mockGetDocs.mockResolvedValue({
      docs: [
        { id: 'd1', data: () => ({ recordId: 'r1', userEmail: 'u@e.com', type: 'qa', timestamp: '2025-01-01T00:00:00.000Z' }) }
      ]
    });
    const result = await getRehabilitationRecords('u@e.com', { limitCount: 10 });
    expect(result.records).toHaveLength(1);
    expect(result.records[0].id).toBe('d1');
    expect(result.count).toBe(1);
  });

  test('on failed-precondition uses fallback and filters by type', async () => {
    mockGetDocs
      .mockRejectedValueOnce({ code: 'failed-precondition' })
      .mockResolvedValueOnce({
        docs: [
          { id: 'a', data: () => ({ userEmail: 'u@e.com', type: 'qa', timestamp: '2025-01-02T00:00:00.000Z' }) },
          { id: 'b', data: () => ({ userEmail: 'u@e.com', type: 'explanation', timestamp: '2025-01-01T00:00:00.000Z' }) }
        ]
      });
    const result = await getRehabilitationRecords('u@e.com', { type: 'qa', limitCount: 5 });
    expect(result.records).toHaveLength(1);
    expect(result.records[0].type).toBe('qa');
  });
});

describe('updateRehabilitationRecordFeedback', () => {
  test('calls updateDoc when doc found', async () => {
    const mockRef = {};
    mockGetDocs.mockResolvedValue({ empty: false, docs: [{ ref: mockRef }] });
    mockUpdateDoc.mockResolvedValue(undefined);
    await updateRehabilitationRecordFeedback('rehab_1', 'u@e.com', {
      effectiveness: 4,
      helpful: true,
      comments: 'Good',
      timestamp: '2025-01-01T00:00:00.000Z'
    });
    expect(mockUpdateDoc).toHaveBeenCalledWith(mockRef, expect.objectContaining({ feedback: expect.any(Object), updatedAt: expect.any(String) }));
  });

  test('does not call updateDoc when no doc found', async () => {
    mockGetDocs.mockResolvedValue({ empty: true, docs: [] });
    await updateRehabilitationRecordFeedback('rehab_1', 'u@e.com', { effectiveness: 4 });
    expect(mockUpdateDoc).not.toHaveBeenCalled();
  });
});

describe('docToRecord', () => {
  test('converts Timestamp to ISO string', () => {
    const docSnap = {
      id: 'x',
      data: () => ({ timestamp: { toDate: () => new Date('2025-02-01T00:00:00.000Z') } })
    };
    const out = docToRecord(docSnap);
    expect(out.timestamp).toBe('2025-02-01T00:00:00.000Z');
  });
});
