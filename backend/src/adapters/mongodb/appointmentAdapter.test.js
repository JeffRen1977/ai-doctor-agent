const mockUpdateOne = jest.fn();
const mockFindOne = jest.fn();
const mockDeleteOne = jest.fn();
const mockToArray = jest.fn();

jest.mock('./connection', () => ({
  getCollection: jest.fn(() => ({
    updateOne: mockUpdateOne,
    findOne: mockFindOne,
    deleteOne: mockDeleteOne,
    find: () => ({ sort: () => ({ toArray: mockToArray, limit: () => ({ toArray: mockToArray }) }) })
  }))
}));

const {
  saveAppointment,
  getAppointment,
  updateAppointment,
  deleteAppointment,
  listAppointmentsByUser,
  sanitize
} = require('./appointmentAdapter');

beforeEach(() => {
  mockUpdateOne.mockReset();
  mockFindOne.mockReset();
  mockDeleteOne.mockReset();
  mockToArray.mockReset();
});

describe('appointmentAdapter', () => {
  describe('saveAppointment', () => {
    it('upserts with appointmentId as _id', async () => {
      mockUpdateOne.mockResolvedValue({ acknowledged: true });
      await saveAppointment({ appointmentId: 'a1', userEmail: 'u@e.com', status: 'scheduled' });
      expect(mockUpdateOne).toHaveBeenCalledWith(
        { _id: 'a1' },
        expect.objectContaining({ $set: expect.objectContaining({ appointmentId: 'a1', userEmail: 'u@e.com' }) }),
        { upsert: true }
      );
    });
  });

  describe('getAppointment', () => {
    it('returns null when not found', async () => {
      mockFindOne.mockResolvedValue(null);
      expect(await getAppointment('a1')).toBeNull();
    });
    it('returns sanitized appointment when found', async () => {
      mockFindOne.mockResolvedValue({ _id: 'a1', userEmail: 'u@e.com', scheduledDateTime: '2025-02-01T10:00:00.000Z' });
      const out = await getAppointment('a1');
      expect(out.appointmentId).toBe('a1');
      expect(out.userEmail).toBe('u@e.com');
    });
  });

  describe('updateAppointment', () => {
    it('calls updateOne with updates and updatedAt', async () => {
      mockUpdateOne.mockResolvedValue({ acknowledged: true });
      await updateAppointment('a1', { status: 'cancelled' });
      expect(mockUpdateOne).toHaveBeenCalledWith(
        { _id: 'a1' },
        expect.objectContaining({ $set: expect.objectContaining({ status: 'cancelled', updatedAt: expect.any(String) }) })
      );
    });
  });

  describe('deleteAppointment', () => {
    it('calls deleteOne', async () => {
      mockDeleteOne.mockResolvedValue({ deletedCount: 1 });
      await deleteAppointment('a1');
      expect(mockDeleteOne).toHaveBeenCalledWith({ _id: 'a1' });
    });
  });

  describe('listAppointmentsByUser', () => {
    it('returns list', async () => {
      mockToArray.mockResolvedValue([{ _id: 'a1', userEmail: 'u@e.com', scheduledDateTime: '2025-02-01T10:00:00.000Z' }]);
      const list = await listAppointmentsByUser('u@e.com', { limit: 10 });
      expect(list.length).toBe(1);
      expect(list[0].appointmentId).toBe('a1');
    });
  });

  describe('sanitize', () => {
    it('converts timestamp fields', () => {
      const s = sanitize({ appointmentId: 'a1', scheduledDateTime: new Date('2025-02-01T10:00:00.000Z') });
      expect(s.scheduledDateTime).toBe('2025-02-01T10:00:00.000Z');
    });
  });
});
