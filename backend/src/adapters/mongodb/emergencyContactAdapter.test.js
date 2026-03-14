const mockUpdateOne = jest.fn();
const mockFindOne = jest.fn();
const mockDeleteOne = jest.fn();
const mockUpdateMany = jest.fn();
const mockToArray = jest.fn();

jest.mock('./connection', () => ({
  getCollection: jest.fn(() => ({
    updateOne: mockUpdateOne,
    findOne: mockFindOne,
    deleteOne: mockDeleteOne,
    updateMany: mockUpdateMany,
    find: () => ({ sort: () => ({ toArray: mockToArray }) })
  }))
}));

const {
  saveContact,
  getContact,
  listByUser,
  updateContact,
  deleteContact,
  unsetPrimaryForUser,
  sanitize
} = require('./emergencyContactAdapter');

beforeEach(() => {
  mockUpdateOne.mockReset();
  mockFindOne.mockReset();
  mockDeleteOne.mockReset();
  mockUpdateMany.mockReset();
  mockToArray.mockReset();
});

describe('emergencyContactAdapter', () => {
  describe('saveContact', () => {
    it('upserts with contactId as _id', async () => {
      mockUpdateOne.mockResolvedValue({ acknowledged: true });
      await saveContact({ contactId: 'c1', userEmail: 'u@e.com', name: 'Jane' });
      expect(mockUpdateOne).toHaveBeenCalledWith(
        { _id: 'c1' },
        expect.objectContaining({ $set: expect.objectContaining({ contactId: 'c1', userEmail: 'u@e.com' }) }),
        { upsert: true }
      );
    });
  });

  describe('getContact', () => {
    it('returns null when not found', async () => {
      mockFindOne.mockResolvedValue(null);
      expect(await getContact('c1')).toBeNull();
    });
    it('returns sanitized contact when found', async () => {
      mockFindOne.mockResolvedValue({ _id: 'c1', userEmail: 'u@e.com', name: 'Jane' });
      const out = await getContact('c1');
      expect(out.contactId).toBe('c1');
      expect(out.name).toBe('Jane');
    });
  });

  describe('listByUser', () => {
    it('returns list', async () => {
      mockToArray.mockResolvedValue([{ _id: 'c1', userEmail: 'u@e.com' }]);
      const list = await listByUser('u@e.com');
      expect(list.length).toBe(1);
      expect(list[0].contactId).toBe('c1');
    });
  });

  describe('updateContact', () => {
    it('calls updateOne', async () => {
      mockUpdateOne.mockResolvedValue({ acknowledged: true });
      await updateContact('c1', { name: 'Jane Doe' });
      expect(mockUpdateOne).toHaveBeenCalledWith(
        { _id: 'c1' },
        expect.objectContaining({ $set: expect.objectContaining({ name: 'Jane Doe', updatedAt: expect.any(String) }) })
      );
    });
  });

  describe('deleteContact', () => {
    it('calls deleteOne', async () => {
      mockDeleteOne.mockResolvedValue({ deletedCount: 1 });
      await deleteContact('c1');
      expect(mockDeleteOne).toHaveBeenCalledWith({ _id: 'c1' });
    });
  });

  describe('unsetPrimaryForUser', () => {
    it('calls updateMany for isPrimary true', async () => {
      mockUpdateMany.mockResolvedValue({ modifiedCount: 1 });
      await unsetPrimaryForUser('u@e.com');
      expect(mockUpdateMany).toHaveBeenCalledWith(
        { userEmail: 'u@e.com', isPrimary: true },
        expect.objectContaining({ $set: expect.objectContaining({ isPrimary: false }) })
      );
    });
  });
});
