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

const { saveAlert, getAlert, listByUser, updateAlert, sanitize } = require('./emergencyAlertAdapter');

beforeEach(() => {
  mockUpdateOne.mockReset();
  mockFindOne.mockReset();
  mockToArray.mockReset();
});

describe('emergencyAlertAdapter', () => {
  describe('saveAlert', () => {
    it('upserts with alertId as _id', async () => {
      mockUpdateOne.mockResolvedValue({ acknowledged: true });
      await saveAlert({ alertId: 'a1', userEmail: 'u@e.com', severity: 'high' });
      expect(mockUpdateOne).toHaveBeenCalledWith(
        { _id: 'a1' },
        expect.objectContaining({ $set: expect.objectContaining({ alertId: 'a1', userEmail: 'u@e.com' }) }),
        { upsert: true }
      );
    });
  });

  describe('getAlert', () => {
    it('returns null when not found', async () => {
      mockFindOne.mockResolvedValue(null);
      expect(await getAlert('a1')).toBeNull();
    });
    it('returns sanitized alert when found', async () => {
      mockFindOne.mockResolvedValue({ _id: 'a1', userEmail: 'u@e.com', timestamp: '2025-02-01T00:00:00.000Z' });
      const out = await getAlert('a1');
      expect(out.alertId).toBe('a1');
    });
  });

  describe('listByUser', () => {
    it('returns list', async () => {
      mockToArray.mockResolvedValue([{ _id: 'a1', userEmail: 'u@e.com' }]);
      const list = await listByUser('u@e.com', { limit: 10 });
      expect(list.length).toBe(1);
      expect(list[0].alertId).toBe('a1');
    });
  });

  describe('updateAlert', () => {
    it('calls updateOne', async () => {
      mockUpdateOne.mockResolvedValue({ acknowledged: true });
      await updateAlert('a1', { status: 'resolved' });
      expect(mockUpdateOne).toHaveBeenCalledWith(
        { _id: 'a1' },
        expect.objectContaining({ $set: expect.objectContaining({ status: 'resolved', updatedAt: expect.any(String) }) })
      );
    });
  });
});
