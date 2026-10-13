const mockCollection = {
  updateOne: jest.fn().mockResolvedValue({ upsertedCount: 1 }),
  find: jest.fn().mockReturnValue({ toArray: jest.fn().mockResolvedValue([]) }),
  deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 }),
  deleteMany: jest.fn().mockResolvedValue({ deletedCount: 2 })
};

jest.mock('./connection', () => ({
  getCollection: jest.fn(() => mockCollection)
}));

const adapter = require('./deviceTokenAdapter');

describe('deviceTokenAdapter', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('registerDevice', () => {
    it('upserts device token with userId and vendor', async () => {
      await adapter.registerDevice('user1', {
        token: 'tok_abc',
        vendor: 'huawei',
        model: 'P60',
        osVersion: '14'
      });
      expect(mockCollection.updateOne).toHaveBeenCalledWith(
        { _id: 'tok_abc' },
        expect.objectContaining({
          $set: expect.objectContaining({ userId: 'user1', vendor: 'huawei', model: 'P60' })
        }),
        { upsert: true }
      );
    });

    it('throws on missing userId', async () => {
      await expect(adapter.registerDevice(null, { token: 't' })).rejects.toThrow('userId and token required');
    });

    it('throws on missing token', async () => {
      await expect(adapter.registerDevice('u1', { token: '' })).rejects.toThrow('userId and token required');
    });

    it('defaults vendor to unknown', async () => {
      await adapter.registerDevice('u1', { token: 't1' });
      expect(mockCollection.updateOne).toHaveBeenCalledWith(
        { _id: 't1' },
        expect.objectContaining({
          $set: expect.objectContaining({ vendor: 'unknown' })
        }),
        { upsert: true }
      );
    });
  });

  describe('getDevicesByUserId', () => {
    it('returns devices mapped with token field', async () => {
      mockCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([
          { _id: 'tok1', userId: 'u1', vendor: 'xiaomi' },
          { _id: 'tok2', userId: 'u1', vendor: 'huawei' }
        ])
      });
      const devices = await adapter.getDevicesByUserId('u1');
      expect(devices).toHaveLength(2);
      expect(devices[0].token).toBe('tok1');
      expect(devices[1].vendor).toBe('huawei');
    });

    it('returns empty array for null userId', async () => {
      const result = await adapter.getDevicesByUserId(null);
      expect(result).toEqual([]);
    });
  });

  describe('removeDevice', () => {
    it('deletes by token', async () => {
      await adapter.removeDevice('tok1');
      expect(mockCollection.deleteOne).toHaveBeenCalledWith({ _id: 'tok1' });
    });

    it('returns zero for null token', async () => {
      const result = await adapter.removeDevice(null);
      expect(result.deletedCount).toBe(0);
    });
  });

  describe('removeAllByUserId', () => {
    it('deletes all devices for user', async () => {
      const result = await adapter.removeAllByUserId('u1');
      expect(mockCollection.deleteMany).toHaveBeenCalledWith({ userId: 'u1' });
      expect(result.deletedCount).toBe(2);
    });
  });
});
