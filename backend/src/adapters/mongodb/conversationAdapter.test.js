const mockFindOne = jest.fn();
const mockUpdateOne = jest.fn();
const mockDeleteOne = jest.fn();
const mockToArray = jest.fn();

jest.mock('./connection', () => ({
  getCollection: jest.fn(() => ({
    findOne: mockFindOne,
    updateOne: mockUpdateOne,
    deleteOne: mockDeleteOne,
    find: () => ({ sort: () => ({ limit: () => ({ toArray: mockToArray }) }) })
  }))
}));

const {
  getActiveConversationsByUser,
  saveConversation,
  getConversation,
  listByUser,
  updateConversation,
  deleteConversation,
  docToConversation,
  sanitizeConversation
} = require('./conversationAdapter');

beforeEach(() => {
  mockFindOne.mockReset();
  mockUpdateOne.mockReset();
  mockDeleteOne.mockReset();
  mockToArray.mockReset();
});

describe('conversationAdapter', () => {
  describe('getActiveConversationsByUser', () => {
    it('returns list from find sort limit', async () => {
      mockToArray.mockResolvedValue([
        { _id: 'c1', userEmail: 'u@e.com', updatedAt: '2025-02-01T00:00:00.000Z' }
      ]);
      const list = await getActiveConversationsByUser('u@e.com', 5);
      expect(list.length).toBe(1);
      expect(list[0].conversationId).toBe('c1');
    });
  });

  describe('saveConversation', () => {
    it('upserts with conversationId as _id', async () => {
      mockUpdateOne.mockResolvedValue({ acknowledged: true });
      await saveConversation({ conversationId: 'c1', userEmail: 'u@e.com' });
      expect(mockUpdateOne).toHaveBeenCalledWith(
        { _id: 'c1' },
        expect.objectContaining({ $set: expect.objectContaining({ conversationId: 'c1', userEmail: 'u@e.com' }) }),
        { upsert: true }
      );
    });
  });

  describe('getConversation', () => {
    it('returns null when not found', async () => {
      mockFindOne.mockResolvedValue(null);
      expect(await getConversation('c1')).toBeNull();
    });
    it('returns sanitized conversation when found', async () => {
      mockFindOne.mockResolvedValue({ _id: 'c1', userEmail: 'u@e.com', updatedAt: '2025-02-01T00:00:00.000Z' });
      const out = await getConversation('c1');
      expect(out.conversationId).toBe('c1');
      expect(out.userEmail).toBe('u@e.com');
    });
  });

  describe('listByUser', () => {
    it('returns list', async () => {
      mockToArray.mockResolvedValue([{ _id: 'c1', userEmail: 'u@e.com' }]);
      const list = await listByUser('u@e.com', 20);
      expect(list.length).toBe(1);
      expect(list[0].conversationId).toBe('c1');
    });
  });

  describe('updateConversation', () => {
    it('calls updateOne with updates and updatedAt', async () => {
      mockUpdateOne.mockResolvedValue({ acknowledged: true });
      await updateConversation('c1', { title: 'New' });
      expect(mockUpdateOne).toHaveBeenCalledWith(
        { _id: 'c1' },
        expect.objectContaining({ $set: expect.objectContaining({ title: 'New', updatedAt: expect.any(String) }) })
      );
    });
  });

  describe('deleteConversation', () => {
    it('calls deleteOne', async () => {
      mockDeleteOne.mockResolvedValue({ deletedCount: 1 });
      await deleteConversation('c1');
      expect(mockDeleteOne).toHaveBeenCalledWith({ _id: 'c1' });
    });
  });

  describe('docToConversation', () => {
    it('maps doc to conversation shape', () => {
      const doc = { _id: 'c1', userEmail: 'u@e.com', updatedAt: '2025-02-01T00:00:00.000Z' };
      const c = docToConversation(doc);
      expect(c.conversationId).toBe('c1');
      expect(c.userEmail).toBe('u@e.com');
    });
  });
});
