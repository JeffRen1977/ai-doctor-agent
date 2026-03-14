const mockInsertOne = jest.fn();
jest.mock('./connection', () => ({
  getCollection: jest.fn(() => ({ insertOne: mockInsertOne }))
}));

const { addNotification } = require('./notificationAdapter');

beforeEach(() => {
  mockInsertOne.mockReset();
});

describe('addNotification', () => {
  it('inserts and returns { id, ...payload }', async () => {
    mockInsertOne.mockResolvedValue({ insertedId: { toString: () => 'n123' } });
    const result = await addNotification({
      userEmail: 'u@e.com',
      type: 'alert',
      title: 'Test',
      message: 'Hello'
    });
    expect(result.id).toBe('n123');
    expect(result.userEmail).toBe('u@e.com');
    expect(result.type).toBe('alert');
    expect(result.read).toBe(false);
  });
});
