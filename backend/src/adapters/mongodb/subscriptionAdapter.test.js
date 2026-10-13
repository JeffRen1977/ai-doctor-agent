const mockInsertOne = jest.fn();
const mockFindOne = jest.fn();
const mockUpdateOne = jest.fn();

jest.mock('./connection', () => ({
  getCollection: () => ({
    insertOne: mockInsertOne,
    findOne: mockFindOne,
    updateOne: mockUpdateOne
  })
}));

jest.mock('mongodb', () => {
  function FakeObjectId(id) { return id; }
  return { ObjectId: FakeObjectId };
});

const subscriptionAdapter = require('./subscriptionAdapter');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getActiveSubscription', () => {
  it('returns null on empty userId', async () => {
    expect(await subscriptionAdapter.getActiveSubscription('')).toBeNull();
  });

  it('returns null when no active subscription', async () => {
    mockFindOne.mockResolvedValue(null);
    expect(await subscriptionAdapter.getActiveSubscription('user1')).toBeNull();
  });

  it('returns active subscription with subscriptionId', async () => {
    mockFindOne.mockResolvedValue({
      _id: 'sub123',
      userId: 'user1',
      planId: 'monthly',
      status: 'active',
      endDate: '2027-01-01T00:00:00Z'
    });
    const result = await subscriptionAdapter.getActiveSubscription('user1');
    expect(result.subscriptionId).toBe('sub123');
    expect(result.planId).toBe('monthly');
    expect(result._id).toBeUndefined();
  });
});

describe('createSubscription', () => {
  it('throws on missing fields', async () => {
    await expect(subscriptionAdapter.createSubscription({})).rejects.toThrow('userId and planId required');
  });

  it('creates subscription and returns with subscriptionId', async () => {
    mockInsertOne.mockResolvedValue({ insertedId: 'newid' });
    const result = await subscriptionAdapter.createSubscription({
      userId: 'user1',
      planId: 'monthly',
      endDate: '2027-01-01T00:00:00Z',
      orderNo: 'ORD001'
    });
    expect(result.subscriptionId).toBe('newid');
    expect(result.planId).toBe('monthly');
    expect(mockInsertOne).toHaveBeenCalledTimes(1);
  });
});

describe('updateSubscription', () => {
  it('throws on missing subscriptionId', async () => {
    await expect(subscriptionAdapter.updateSubscription('', {})).rejects.toThrow('subscriptionId required');
  });

  it('updates with $set', async () => {
    mockUpdateOne.mockResolvedValue({ modifiedCount: 1 });
    await subscriptionAdapter.updateSubscription('sub123', { status: 'cancelled' });
    expect(mockUpdateOne).toHaveBeenCalledWith(
      expect.objectContaining({ _id: expect.anything() }),
      { $set: expect.objectContaining({ status: 'cancelled' }) }
    );
  });
});

describe('expireSubscription', () => {
  it('sets status to expired', async () => {
    mockUpdateOne.mockResolvedValue({ modifiedCount: 1 });
    await subscriptionAdapter.expireSubscription('sub123');
    expect(mockUpdateOne).toHaveBeenCalledWith(
      expect.objectContaining({ _id: expect.anything() }),
      { $set: expect.objectContaining({ status: 'expired' }) }
    );
  });
});
