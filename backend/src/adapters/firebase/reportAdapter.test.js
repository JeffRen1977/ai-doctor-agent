/**
 * Unit tests: Report Firebase Adapter
 * See docs/data-format/REPOSITORY_EXPANSION_DESIGN.md §3.9
 */

const mockSetDoc = jest.fn();
const mockGetDoc = jest.fn();
const mockGetDocs = jest.fn();
jest.mock('../../config/firebase', () => ({ db: {} }));
jest.mock('firebase/firestore', () => ({
  doc: jest.fn((db, col, id) => ({ _col: col, _id: id })),
  collection: jest.fn((db, col) => ({ _col: col })),
  setDoc: (...args) => mockSetDoc(...args),
  getDoc: (...args) => mockGetDoc(...args),
  getDocs: (...args) => mockGetDocs(...args),
  query: jest.fn(() => ({})),
  where: jest.fn(() => ({})),
  orderBy: jest.fn(() => ({})),
  limit: jest.fn(() => ({}))
}));

const { saveReport, getReport, listReportsByUser, sanitizeReport } = require('./reportAdapter');

beforeEach(() => {
  mockSetDoc.mockReset();
  mockGetDoc.mockReset();
  mockGetDocs.mockReset();
});

describe('saveReport', () => {
  test('uses report.reportId as document id and saves payload', async () => {
    mockSetDoc.mockResolvedValue(undefined);
    const report = {
      reportId: 'report_123',
      userEmail: 'u@e.com',
      reportType: 'health-assessment',
      title: 'Test',
      generatedAt: '2025-01-01T00:00:00.000Z',
      sections: {},
      aiProvider: 'openai',
      aiModel: 'gpt-4o',
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z'
    };
    await saveReport(report);
    expect(mockSetDoc).toHaveBeenCalledTimes(1);
    const [ref, payload] = mockSetDoc.mock.calls[0];
    expect(ref._id).toBe('report_123');
    expect(ref._col).toBe('reports');
    expect(payload.reportId).toBe('report_123');
    expect(payload.userEmail).toBe('u@e.com');
  });
});

describe('getReport', () => {
  test('returns null when document does not exist', async () => {
    mockGetDoc.mockResolvedValue({ exists: () => false });
    const result = await getReport('report_missing');
    expect(result).toBeNull();
  });

  test('returns sanitized report with Timestamp converted to ISO', async () => {
    const ts = { toDate: () => new Date('2025-01-01T12:00:00.000Z') };
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      id: 'report_1',
      data: () => ({ userEmail: 'u@e.com', generatedAt: ts, createdAt: ts, updatedAt: ts })
    });
    const result = await getReport('report_1');
    expect(result).not.toBeNull();
    expect(result.reportId).toBe('report_1');
    expect(result.userEmail).toBe('u@e.com');
    expect(result.generatedAt).toBe('2025-01-01T12:00:00.000Z');
    expect(result.createdAt).toBe('2025-01-01T12:00:00.000Z');
    expect(result.updatedAt).toBe('2025-01-01T12:00:00.000Z');
  });
});

describe('listReportsByUser', () => {
  test('returns reports with Timestamps as ISO', async () => {
    const ts = { toDate: () => new Date('2025-01-02T00:00:00.000Z') };
    mockGetDocs.mockResolvedValue({
      docs: [
        { id: 'r1', data: () => ({ userEmail: 'u@e.com', reportType: 'health-assessment', generatedAt: ts }) }
      ]
    });
    const result = await listReportsByUser('u@e.com', { limit: 10 });
    expect(result).toHaveLength(1);
    expect(result[0].reportId).toBe('r1');
    expect(result[0].generatedAt).toBe('2025-01-02T00:00:00.000Z');
  });

  test('on failed-precondition uses fallback and sorts by generatedAt', async () => {
    mockGetDocs
      .mockRejectedValueOnce({ code: 'failed-precondition' })
      .mockResolvedValueOnce({
        docs: [
          { id: 'r2', data: () => ({ userEmail: 'u@e.com', reportType: 'comprehensive', generatedAt: '2025-01-01T00:00:00.000Z' }) },
          { id: 'r1', data: () => ({ userEmail: 'u@e.com', reportType: 'comprehensive', generatedAt: '2025-01-02T00:00:00.000Z' }) }
        ]
      });
    const result = await listReportsByUser('u@e.com', { limit: 5, reportType: 'comprehensive' });
    expect(result).toHaveLength(2);
    expect(result[0].reportId).toBe('r1');
    expect(result[0].generatedAt).toBe('2025-01-02T00:00:00.000Z');
  });
});

describe('sanitizeReport', () => {
  test('converts Firestore Timestamp to ISO string', () => {
    const ts = { toDate: () => new Date('2025-01-01T00:00:00.000Z') };
    const out = sanitizeReport({ generatedAt: ts, title: 'x' });
    expect(out.generatedAt).toBe('2025-01-01T00:00:00.000Z');
    expect(out.title).toBe('x');
  });
});
