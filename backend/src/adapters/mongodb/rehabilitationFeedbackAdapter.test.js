const mockInsertOne = jest.fn();
jest.mock('./connection', () => ({
  getCollection: jest.fn(() => ({ insertOne: mockInsertOne }))
}));

const { addRehabilitationFeedback } = require('./rehabilitationFeedbackAdapter');

beforeEach(() => {
  mockInsertOne.mockReset();
});

describe('addRehabilitationFeedback', () => {
  it('inserts payload and returns { id, ...payload }', async () => {
    mockInsertOne.mockResolvedValue({ insertedId: { toString: () => 'fb123' } });
    const result = await addRehabilitationFeedback({
      recordId: 'rehab_1',
      userEmail: 'u@e.com',
      effectiveness: 5,
      helpful: true
    });
    expect(mockInsertOne).toHaveBeenCalledWith(expect.objectContaining({
      recordId: 'rehab_1',
      userEmail: 'u@e.com',
      effectiveness: 5,
      helpful: true
    }));
    expect(result.id).toBe('fb123');
    expect(result.recordId).toBe('rehab_1');
  });
});
