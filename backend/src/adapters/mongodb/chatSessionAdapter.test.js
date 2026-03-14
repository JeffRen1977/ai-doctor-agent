const mockFindOne = jest.fn();
const mockInsertOne = jest.fn();
const mockUpdateOne = jest.fn();
const mockToArray = jest.fn();

jest.mock('./connection', () => ({
  getCollection: jest.fn(() => ({
    findOne: mockFindOne,
    insertOne: mockInsertOne,
    updateOne: mockUpdateOne,
    find: () => ({ sort: () => ({ limit: () => ({ toArray: mockToArray }) }) })
  }))
}));

const { getLatestSession, getOrCreateSession, appendMessage, getRecentTurnsForAgent, clearLatestSession } = require('./chatSessionAdapter');

beforeEach(() => {
  mockFindOne.mockReset();
  mockInsertOne.mockReset();
  mockUpdateOne.mockReset();
  mockToArray.mockReset();
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
});
