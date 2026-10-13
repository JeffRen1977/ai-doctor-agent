const mockInsertOne = jest.fn();
const mockFindOne = jest.fn();
const mockUpdateOne = jest.fn();
const mockFind = jest.fn();

jest.mock('./connection', () => ({
  getCollection: () => ({
    insertOne: mockInsertOne,
    findOne: mockFindOne,
    updateOne: mockUpdateOne,
    find: mockFind
  })
}));

const orderAdapter = require('./orderAdapter');

beforeEach(() => {
  jest.clearAllMocks();
  mockFind.mockReturnValue({
    sort: jest.fn().mockReturnValue({
      skip: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue([])
        })
      })
    })
  });
});

describe('createOrder', () => {
  it('throws on missing orderNo', async () => {
    await expect(orderAdapter.createOrder({})).rejects.toThrow('orderNo required');
  });

  it('inserts order and returns without _id', async () => {
    mockInsertOne.mockResolvedValue({ insertedId: 'ORD001' });
    const result = await orderAdapter.createOrder({
      orderNo: 'ORD001',
      userId: 'user1',
      userEmail: 'user1@test.com',
      planId: 'monthly',
      amount: 2900,
      paymentMethod: 'wechat_pay',
      expiresAt: '2026-11-01T00:00:00Z'
    });
    expect(result.orderNo).toBe('ORD001');
    expect(result.amount).toBe(2900);
    expect(result.status).toBe('pending');
    expect(result._id).toBeUndefined();
    expect(mockInsertOne).toHaveBeenCalledTimes(1);
  });
});

describe('getOrderByOrderNo', () => {
  it('returns null on empty input', async () => {
    expect(await orderAdapter.getOrderByOrderNo('')).toBeNull();
  });

  it('returns null when not found', async () => {
    mockFindOne.mockResolvedValue(null);
    expect(await orderAdapter.getOrderByOrderNo('MISSING')).toBeNull();
  });

  it('returns order with orderNo instead of _id', async () => {
    mockFindOne.mockResolvedValue({ _id: 'ORD001', amount: 2900, status: 'paid' });
    const result = await orderAdapter.getOrderByOrderNo('ORD001');
    expect(result.orderNo).toBe('ORD001');
    expect(result.amount).toBe(2900);
    expect(result._id).toBeUndefined();
  });
});

describe('updateOrderStatus', () => {
  it('throws on missing orderNo', async () => {
    await expect(orderAdapter.updateOrderStatus('', {})).rejects.toThrow('orderNo required');
  });

  it('updates with $set including updatedAt', async () => {
    mockUpdateOne.mockResolvedValue({ modifiedCount: 1 });
    const result = await orderAdapter.updateOrderStatus('ORD001', { status: 'paid', tradeNo: 'T123' });
    expect(result).toBe(true);
    expect(mockUpdateOne).toHaveBeenCalledWith(
      { _id: 'ORD001' },
      { $set: expect.objectContaining({ status: 'paid', tradeNo: 'T123' }) }
    );
  });

  it('returns false when no document matched', async () => {
    mockUpdateOne.mockResolvedValue({ modifiedCount: 0 });
    const result = await orderAdapter.updateOrderStatus('ORD001', { status: 'paid' });
    expect(result).toBe(false);
  });

  it('applies condition filter when provided', async () => {
    mockUpdateOne.mockResolvedValue({ modifiedCount: 1 });
    await orderAdapter.updateOrderStatus('ORD001', { status: 'paid' }, { condition: { status: { $ne: 'paid' } } });
    expect(mockUpdateOne).toHaveBeenCalledWith(
      { _id: 'ORD001', status: { $ne: 'paid' } },
      { $set: expect.objectContaining({ status: 'paid' }) }
    );
  });
});

describe('listOrdersByUser', () => {
  it('returns empty for no userId', async () => {
    expect(await orderAdapter.listOrdersByUser('')).toEqual([]);
  });

  it('returns mapped orders', async () => {
    const mockToArray = jest.fn().mockResolvedValue([
      { _id: 'ORD001', amount: 2900 },
      { _id: 'ORD002', amount: 6900 }
    ]);
    mockFind.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({ toArray: mockToArray })
        })
      })
    });

    const results = await orderAdapter.listOrdersByUser('user1');
    expect(results).toHaveLength(2);
    expect(results[0].orderNo).toBe('ORD001');
    expect(results[0]._id).toBeUndefined();
  });
});
