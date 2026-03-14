const mockFind = jest.fn();
const mockInsertOne = jest.fn();
const mockFindOne = jest.fn();
const mockUpdateOne = jest.fn();
const mockDeleteOne = jest.fn();
const mockToArray = jest.fn();

jest.mock('./connection', () => ({
  getCollection: jest.fn(() => ({
    find: () => ({ toArray: mockToArray }),
    insertOne: mockInsertOne,
    findOne: mockFindOne,
    updateOne: mockUpdateOne,
    deleteOne: mockDeleteOne
  }))
}));

const { listActive, add, update, remove } = require('./medicationAdapter');

beforeEach(() => {
  mockToArray.mockReset();
  mockInsertOne.mockReset();
  mockFindOne.mockReset();
  mockUpdateOne.mockReset();
  mockDeleteOne.mockReset();
});

describe('medicationAdapter', () => {
  it('listActive returns empty when none', async () => {
    mockToArray.mockResolvedValue([]);
    const list = await listActive('u1');
    expect(list).toEqual([]);
  });
  it('add inserts and returns medication', async () => {
    mockInsertOne.mockResolvedValue({ insertedId: 'id1' });
    const out = await add('u1', { name: 'Aspirin', dosage: '100mg' });
    expect(out.name).toBe('Aspirin');
    expect(out.id).toBeDefined();
  });
  it('update finds and updates', async () => {
    mockFindOne.mockResolvedValue({ id: 'med1', name: 'A', userId: 'u1' });
    mockUpdateOne.mockResolvedValue({ acknowledged: true });
    await update('u1', 'med1', { name: 'B' });
    expect(mockUpdateOne).toHaveBeenCalled();
  });
  it('remove deletes one', async () => {
    mockDeleteOne.mockResolvedValue({ deletedCount: 1 });
    await remove('u1', 'med1');
    expect(mockDeleteOne).toHaveBeenCalledWith({ userId: 'u1', id: 'med1' });
  });
});
