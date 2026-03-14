const mockUpdateOne = jest.fn();
const mockFindOne = jest.fn();
const mockToArray = jest.fn();

jest.mock('./connection', () => ({
  getCollection: jest.fn(() => ({
    updateOne: mockUpdateOne,
    findOne: mockFindOne,
    find: () => ({ sort: () => ({ toArray: mockToArray, limit: () => ({ toArray: mockToArray }) }) })
  }))
}));

const { saveReport, getReport, listReportsByUser, sanitizeReport } = require('./reportAdapter');

beforeEach(() => {
  mockUpdateOne.mockReset();
  mockFindOne.mockReset();
  mockToArray.mockReset();
});

describe('reportAdapter', () => {
  describe('saveReport', () => {
    it('upserts with reportId as _id', async () => {
      mockUpdateOne.mockResolvedValue({ acknowledged: true });
      await saveReport({ reportId: 'r1', userEmail: 'u@e.com', reportType: 'summary' });
      expect(mockUpdateOne).toHaveBeenCalledWith(
        { _id: 'r1' },
        expect.objectContaining({ $set: expect.objectContaining({ reportId: 'r1', userEmail: 'u@e.com' }) }),
        { upsert: true }
      );
    });
  });

  describe('getReport', () => {
    it('returns null when not found', async () => {
      mockFindOne.mockResolvedValue(null);
      expect(await getReport('r1')).toBeNull();
    });
    it('returns sanitized report when found', async () => {
      mockFindOne.mockResolvedValue({ _id: 'r1', userEmail: 'u@e.com', generatedAt: '2025-02-01T00:00:00.000Z' });
      const out = await getReport('r1');
      expect(out).toEqual(expect.objectContaining({ reportId: 'r1', userEmail: 'u@e.com' }));
    });
  });

  describe('listReportsByUser', () => {
    it('returns list sorted by generatedAt desc', async () => {
      mockToArray.mockResolvedValue([
        { _id: 'r1', userEmail: 'u@e.com', generatedAt: '2025-02-01T00:00:00.000Z' }
      ]);
      const list = await listReportsByUser('u@e.com', { limit: 10 });
      expect(list.length).toBe(1);
      expect(list[0].reportId).toBe('r1');
    });
  });

  describe('sanitizeReport', () => {
    it('converts timestamp fields to string', () => {
      const r = sanitizeReport({ reportId: 'r1', generatedAt: new Date('2025-02-01T00:00:00.000Z') });
      expect(r.generatedAt).toBe('2025-02-01T00:00:00.000Z');
    });
  });
});
