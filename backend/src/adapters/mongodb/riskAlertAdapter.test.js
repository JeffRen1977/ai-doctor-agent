const mockInsertOne = jest.fn();
const mockUpdateOne = jest.fn();
const mockToArray = jest.fn();

jest.mock('./connection', () => ({
  getCollection: jest.fn(() => ({
    insertOne: mockInsertOne,
    find: () => ({ sort: () => ({ limit: () => ({ toArray: mockToArray }) }) }),
    updateOne: mockUpdateOne
  }))
}));

const { addAlert, getRecentAlertsByUser, acknowledgeAlert, docToAlert } = require('./riskAlertAdapter');

beforeEach(() => {
  mockInsertOne.mockReset();
  mockUpdateOne.mockReset();
  mockToArray.mockReset();
});

describe('riskAlertAdapter', () => {
  describe('addAlert', () => {
    it('inserts and returns id + payload', async () => {
      const insertedId = { toString: () => 'abc123' };
      mockInsertOne.mockResolvedValue({ insertedId });
      const out = await addAlert({
        userEmail: 'u@e.com',
        alertType: 'fall',
        severity: 'high'
      });
      expect(mockInsertOne).toHaveBeenCalledWith(expect.objectContaining({
        userEmail: 'u@e.com',
        alertType: 'fall',
        severity: 'high',
        acknowledged: false
      }));
      expect(out.id).toBe('abc123');
      expect(out.userEmail).toBe('u@e.com');
    });
  });

  describe('getRecentAlertsByUser', () => {
    it('returns alerts sorted by timestamp desc', async () => {
      mockToArray.mockResolvedValue([
        { _id: 'id1', userEmail: 'u@e.com', alertType: 'fall', severity: 'high', timestamp: '2025-02-01T00:00:00.000Z', acknowledged: false }
      ]);
      const list = await getRecentAlertsByUser('u@e.com', 10);
      expect(list.length).toBe(1);
      expect(list[0].id).toBe('id1');
      expect(list[0].alertType).toBe('fall');
    });
  });

  describe('acknowledgeAlert', () => {
    it('calls updateOne with payload', async () => {
      mockUpdateOne.mockResolvedValue({ acknowledged: true });
      await acknowledgeAlert('507f1f77bcf86cd799439011', { acknowledged: true, acknowledgedAt: '2025-02-01T00:00:00.000Z' });
      expect(mockUpdateOne).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ $set: expect.objectContaining({ acknowledged: true }) })
      );
    });
  });

  describe('docToAlert', () => {
    it('maps doc to alert shape', () => {
      const doc = {
        _id: 'oid',
        userEmail: 'u@e.com',
        alertType: 'fall',
        severity: 'high',
        timestamp: '2025-02-01T00:00:00.000Z',
        acknowledged: false
      };
      const alert = docToAlert(doc);
      expect(alert.id).toBe('oid');
      expect(alert.userEmail).toBe('u@e.com');
      expect(alert.alertType).toBe('fall');
    });
  });
});
