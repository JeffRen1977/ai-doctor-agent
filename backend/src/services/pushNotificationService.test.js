jest.mock('../observability/logger', () => ({
  error: jest.fn(), warn: jest.fn(), info: jest.fn()
}));

jest.mock('../repositories', () => ({
  deviceTokenRepo: {
    getDevicesByUserId: jest.fn()
  }
}));

jest.mock('axios');

const pushService = require('./pushNotificationService');
const { deviceTokenRepo } = require('../repositories');
const axios = require('axios');

describe('pushNotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.HUAWEI_APP_ID;
    delete process.env.HUAWEI_APP_SECRET;
    delete process.env.XIAOMI_APP_SECRET;
    delete process.env.OPPO_APP_KEY;
    delete process.env.OPPO_APP_SECRET;
    delete process.env.VIVO_APP_ID;
    delete process.env.VIVO_APP_KEY;
    delete process.env.VIVO_APP_SECRET;
  });

  describe('isConfigured', () => {
    it('returns false for unconfigured huawei', () => {
      expect(pushService.isConfigured('huawei')).toBe(false);
    });

    it('returns true when huawei env vars set', () => {
      process.env.HUAWEI_APP_ID = 'id';
      process.env.HUAWEI_APP_SECRET = 'secret';
      expect(pushService.isConfigured('huawei')).toBe(true);
    });

    it('returns true when xiaomi secret set', () => {
      process.env.XIAOMI_APP_SECRET = 'secret';
      expect(pushService.isConfigured('xiaomi')).toBe(true);
    });

    it('returns true when oppo keys set', () => {
      process.env.OPPO_APP_KEY = 'key';
      process.env.OPPO_APP_SECRET = 'secret';
      expect(pushService.isConfigured('oppo')).toBe(true);
    });

    it('returns false for unknown vendor', () => {
      expect(pushService.isConfigured('unknown')).toBe(false);
    });
  });

  describe('detectVendor', () => {
    it('detects Huawei', () => {
      expect(pushService.detectVendor('Mozilla/5.0 (Linux; Android 12; HUAWEI P60)')).toBe('huawei');
    });

    it('detects Honor as Huawei', () => {
      expect(pushService.detectVendor('Mozilla/5.0 (Linux; HarmonyOS 4.0; Honor X50)')).toBe('huawei');
    });

    it('detects Xiaomi', () => {
      expect(pushService.detectVendor('Mozilla/5.0 (Linux; Android 14; Xiaomi 14)')).toBe('xiaomi');
    });

    it('detects Redmi as Xiaomi', () => {
      expect(pushService.detectVendor('Mozilla/5.0 (Linux; MIUI 15; Redmi K70)')).toBe('xiaomi');
    });

    it('detects OPPO', () => {
      expect(pushService.detectVendor('Mozilla/5.0 (Linux; ColorOS 14; OPPO Reno 11)')).toBe('oppo');
    });

    it('detects Realme as OPPO', () => {
      expect(pushService.detectVendor('Mozilla/5.0 (Linux; Android 14; realme GT5)')).toBe('oppo');
    });

    it('detects vivo', () => {
      expect(pushService.detectVendor('Mozilla/5.0 (Linux; OriginOS 4; vivo X100)')).toBe('vivo');
    });

    it('detects iQOO as vivo', () => {
      expect(pushService.detectVendor('Mozilla/5.0 (Linux; Android 14; iQOO 12)')).toBe('vivo');
    });

    it('returns unknown for other user agents', () => {
      expect(pushService.detectVendor('Mozilla/5.0 (Linux; Android 14; Pixel 8)')).toBe('unknown');
    });

    it('returns unknown for null', () => {
      expect(pushService.detectVendor(null)).toBe('unknown');
    });
  });

  describe('sendPush', () => {
    it('returns no_registered_devices when user has no devices', async () => {
      deviceTokenRepo.getDevicesByUserId.mockResolvedValue([]);
      const result = await pushService.sendPush('user1', { title: 'Test', body: 'Body' });
      expect(result.success).toBe(false);
      expect(result.reason).toBe('no_registered_devices');
    });

    it('returns vendor_not_configured when vendor env not set', async () => {
      deviceTokenRepo.getDevicesByUserId.mockResolvedValue([
        { token: 'tok1', vendor: 'huawei' }
      ]);
      const result = await pushService.sendPush('user1', { title: 'Test', body: 'Body' });
      expect(result.success).toBe(false);
      expect(result.results[0].reason).toBe('vendor_not_configured');
    });

    it('sends to huawei when configured', async () => {
      process.env.HUAWEI_APP_ID = 'test-id';
      process.env.HUAWEI_APP_SECRET = 'test-secret';
      deviceTokenRepo.getDevicesByUserId.mockResolvedValue([
        { token: 'huawei-tok', vendor: 'huawei' }
      ]);
      axios.post
        .mockResolvedValueOnce({ data: { access_token: 'at', expires_in: 3600 } })
        .mockResolvedValueOnce({ data: { code: '80000000', msg: 'success' } });

      const result = await pushService.sendPush('user1', { title: 'Health', body: 'Report' });
      expect(result.success).toBe(true);
      expect(result.sent).toBe(1);
      expect(axios.post).toHaveBeenCalledTimes(2);
    });

    it('sends to xiaomi when configured', async () => {
      process.env.XIAOMI_APP_SECRET = 'test-secret';
      deviceTokenRepo.getDevicesByUserId.mockResolvedValue([
        { token: 'mi-tok', vendor: 'xiaomi' }
      ]);
      axios.post.mockResolvedValueOnce({ data: { result: 'ok', code: 0 } });

      const result = await pushService.sendPush('user1', { title: 'Test', body: 'Body' });
      expect(result.success).toBe(true);
      expect(result.sent).toBe(1);
    });

    it('handles errors gracefully', async () => {
      process.env.XIAOMI_APP_SECRET = 'secret';
      deviceTokenRepo.getDevicesByUserId.mockResolvedValue([
        { token: 'tok1', vendor: 'xiaomi' }
      ]);
      axios.post.mockRejectedValue(new Error('network timeout'));

      const result = await pushService.sendPush('user1', { title: 'Test', body: 'Body' });
      expect(result.success).toBe(false);
      expect(result.results[0].error).toBe('network timeout');
    });

    it('sends to multiple devices', async () => {
      process.env.XIAOMI_APP_SECRET = 'secret';
      process.env.HUAWEI_APP_ID = 'id';
      process.env.HUAWEI_APP_SECRET = 'secret';
      deviceTokenRepo.getDevicesByUserId.mockResolvedValue([
        { token: 'mi-tok', vendor: 'xiaomi' },
        { token: 'hw-tok', vendor: 'huawei' }
      ]);
      axios.post
        .mockResolvedValueOnce({ data: { result: 'ok' } })
        .mockResolvedValueOnce({ data: { access_token: 'at', expires_in: 3600 } })
        .mockResolvedValueOnce({ data: { code: '80000000' } });

      const result = await pushService.sendPush('user1', { title: 'Test', body: 'Body' });
      expect(result.success).toBe(true);
      expect(result.sent).toBe(2);
      expect(result.total).toBe(2);
    });
  });
});
