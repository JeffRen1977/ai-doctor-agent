const mockInsertOne = jest.fn();
const mockFindOne = jest.fn();
const mockUpdateOne = jest.fn();
const mockToArray = jest.fn();

jest.mock('./connection', () => ({
  getCollection: jest.fn(() => ({
    insertOne: mockInsertOne,
    findOne: mockFindOne,
    updateOne: mockUpdateOne,
    find: () => ({ toArray: mockToArray })
  }))
}));

const { addDocument, getDocument, getByUser, setByUser, listAll } = require('./chatHistoryAdapter');

beforeEach(() => {
  mockInsertOne.mockReset();
  mockFindOne.mockReset();
  mockUpdateOne.mockReset();
  mockToArray.mockReset();
});

describe('chatHistoryAdapter', () => {
  it('addDocument returns id', async () => {
    mockInsertOne.mockResolvedValue({ insertedId: { toString: () => 'doc1' } });
    const out = await addDocument({ userEmail: 'u@e.com' });
    expect(out.id).toBe('doc1');
  });
  it('getDocument returns null when not found', async () => {
    mockFindOne.mockResolvedValue(null);
    expect(await getDocument('doc1')).toBeNull();
  });
  it('getByUser returns null when not found', async () => {
    mockFindOne.mockResolvedValue(null);
    expect(await getByUser('u@e.com')).toBeNull();
  });
  it('setByUser upserts', async () => {
    mockUpdateOne.mockResolvedValue({ acknowledged: true });
    await setByUser('u@e.com', { messages: [] });
    expect(mockUpdateOne).toHaveBeenCalledWith({ _id: 'u@e.com' }, expect.any(Object), { upsert: true });
  });
  it('listAll returns array', async () => {
    mockToArray.mockResolvedValue([]);
    const list = await listAll();
    expect(Array.isArray(list)).toBe(true);
  });
});
