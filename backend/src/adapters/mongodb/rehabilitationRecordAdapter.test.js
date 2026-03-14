const mockInsertOne = jest.fn();
const mockFind = jest.fn();
const mockFindOne = jest.fn();
const mockUpdateOne = jest.fn();
const mockToArray = jest.fn();
jest.mock('./connection', () => ({
  getCollection: jest.fn(() => ({
    insertOne: mockInsertOne,
    find: () => ({ sort: () => ({ limit: () => ({ toArray: mockToArray }) }) }),
    findOne: mockFindOne,
    updateOne: mockUpdateOne
  }))
}));

jest.mock('mongodb', () => ({
  ObjectId: class ObjectId {
    constructor(id) {
      this.id = id;
    }
    static isValid(id) {
      return typeof id === 'string' && id.length === 24 && /^[a-f0-9]+$/.test(id);
    }
  }
}));

const { addRehabilitationRecord, getRehabilitationRecords, updateRehabilitationRecordFeedback } = require('./rehabilitationRecordAdapter');

beforeEach(() => {
  mockInsertOne.mockReset();
  mockToArray.mockReset();
  mockFindOne.mockReset();
  mockUpdateOne.mockReset();
});

describe('addRehabilitationRecord', () => {
  it('inserts payload and returns { id, ...record }', async () => {
    mockInsertOne.mockResolvedValue({ insertedId: { toString: () => 'abc123' } });
    const record = { recordId: 'rehab_1', userEmail: 'u@e.com', type: 'qa', timestamp: '2025-01-01T00:00:00.000Z' };
    const result = await addRehabilitationRecord(record);
    expect(mockInsertOne).toHaveBeenCalled();
    expect(result.id).toBe('abc123');
    expect(result.recordId).toBe('rehab_1');
  });
});

describe('getRehabilitationRecords', () => {
  it('returns { records, count }', async () => {
    mockToArray.mockResolvedValue([
      { _id: 'oid1', recordId: 'r1', userEmail: 'u@e.com', type: 'qa', timestamp: '2025-01-01T00:00:00.000Z' }
    ]);
    const result = await getRehabilitationRecords('u@e.com', { limitCount: 10 });
    expect(result.records).toHaveLength(1);
    expect(result.records[0].id).toBeDefined();
    expect(result.count).toBe(1);
  });
});

describe('updateRehabilitationRecordFeedback', () => {
  it('updates when doc found by recordId and userEmail', async () => {
    mockFindOne.mockResolvedValue({ _id: 'docId' });
    mockUpdateOne.mockResolvedValue({ modifiedCount: 1 });
    await updateRehabilitationRecordFeedback('rehab_1', 'u@e.com', { effectiveness: 5, helpful: true });
    expect(mockFindOne).toHaveBeenCalledWith({ recordId: 'rehab_1', userEmail: 'u@e.com' });
    expect(mockUpdateOne).toHaveBeenCalledWith(
      { _id: 'docId' },
      expect.objectContaining({ $set: expect.objectContaining({ feedback: expect.any(Object), updatedAt: expect.any(String) }) })
    );
  });
  it('does nothing when doc not found', async () => {
    mockFindOne.mockResolvedValue(null);
    await updateRehabilitationRecordFeedback('rehab_1', 'u@e.com', { effectiveness: 5 });
    expect(mockUpdateOne).not.toHaveBeenCalled();
  });
});
