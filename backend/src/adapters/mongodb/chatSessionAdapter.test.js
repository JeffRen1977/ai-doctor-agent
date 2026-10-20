const mockFindOne = jest.fn();
const mockInsertOne = jest.fn();
const mockUpdateOne = jest.fn();
const mockDeleteMany = jest.fn();
const mockToArray = jest.fn();
const mockAggregateToArray = jest.fn();

jest.mock('./connection', () => ({
  getCollection: jest.fn(() => ({
    findOne: mockFindOne,
    insertOne: mockInsertOne,
    updateOne: mockUpdateOne,
    deleteMany: mockDeleteMany,
    find: () => ({ sort: () => ({ limit: () => ({ toArray: mockToArray }) }) }),
    aggregate: () => ({ toArray: mockAggregateToArray })
  }))
}));

const { getLatestSession, getOrCreateSession, appendMessage, getRecentTurnsForAgent, clearLatestSession, listAllUsers, deleteUserSessions } = require('./chatSessionAdapter');

beforeEach(() => {
  mockFindOne.mockReset();
  mockInsertOne.mockReset();
  mockUpdateOne.mockReset();
  mockDeleteMany.mockReset();
  mockToArray.mockReset();
  mockAggregateToArray.mockReset();
});

describe('chatSessionAdapter', () => {
  it('getLatestSession returns null when none', async () => {
    mockToArray.mockResolvedValue([]);
    expect(await getLatestSession('u1')).toBeNull();
  });
  it('getOrCreateSession creates when none', async () => {
    mockToArray.mockResolvedValue([]);
    mockInsertOne.mockResolvedValue({ insertedId: 's1' });
    const out = await getOrCreateSession('u1');
    expect(out.sessionId).toBeDefined();
    expect(out.session).toBeDefined();
  });
  it('appendMessage updates messages', async () => {
    mockFindOne.mockResolvedValue({ userId: 'u1', sessionId: 's1', messages: [] });
    mockUpdateOne.mockResolvedValue({ acknowledged: true });
    await appendMessage('u1', 's1', 'user', 'hello');
    expect(mockUpdateOne).toHaveBeenCalledWith(expect.any(Object), expect.objectContaining({ $set: expect.objectContaining({ messages: expect.any(Array) }) }));
  });
  it('getRecentTurnsForAgent returns empty when no session', async () => {
    mockToArray.mockResolvedValue([]);
    expect(await getRecentTurnsForAgent('u1', 5)).toBe('');
  });
  it('clearLatestSession does nothing when no session', async () => {
    mockToArray.mockResolvedValue([]);
    await clearLatestSession('u1');
    expect(mockUpdateOne).not.toHaveBeenCalled();
  });

  it('listAllUsers returns aggregated user list', async () => {
    const now = new Date();
    mockAggregateToArray.mockResolvedValue([
      {
        _id: 'u1',
        sessionId: 's1',
        messages: [
          { id: 'm1', role: 'user', content: 'hi', timestamp: now },
          { id: 'm2', role: 'assistant', content: 'hello', timestamp: now }
        ],
        startedAt: now,
        updatedAt: now,
        lastMessageAt: now
      }
    ]);
    const result = await listAllUsers();
    expect(result).toHaveLength(1);
    expect(result[0].userId).toBe('u1');
    expect(result[0].messageCount).toBe(2);
  });

  it('listAllUsers returns empty when no sessions', async () => {
    mockAggregateToArray.mockResolvedValue([]);
    const result = await listAllUsers();
    expect(result).toEqual([]);
  });

  it('deleteUserSessions calls deleteMany', async () => {
    mockDeleteMany.mockResolvedValue({ deletedCount: 2 });
    await deleteUserSessions('u1');
    expect(mockDeleteMany).toHaveBeenCalledWith({ userId: 'u1' });
  });
});
