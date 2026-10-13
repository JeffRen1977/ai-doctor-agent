const express = require('express');
const request = require('supertest');

jest.mock('../middleware/auth', () => ({
  authenticateToken: (req, _res, next) => {
    req.user = { email: 'test@example.com' };
    next();
  }
}));

jest.mock('../repositories', () => ({
  deviceTokenRepo: {
    registerDevice: jest.fn().mockResolvedValue(undefined),
    getDevicesByUserId: jest.fn().mockResolvedValue([]),
    removeDevice: jest.fn().mockResolvedValue({ deletedCount: 1 })
  }
}));

jest.mock('../services/pushNotificationService', () => ({
  detectVendor: jest.fn().mockReturnValue('xiaomi'),
  sendPush: jest.fn().mockResolvedValue({ success: true, sent: 1, total: 1, results: [] })
}));

const pushRoutes = require('./pushNotification');
const { deviceTokenRepo } = require('../repositories');
const pushService = require('../services/pushNotificationService');

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/push', pushRoutes);
  return app;
}

describe('pushNotification routes', () => {
  let app;
  beforeAll(() => { app = createApp(); });
  beforeEach(() => jest.clearAllMocks());

  describe('POST /push/register-device', () => {
    it('registers device with explicit vendor', async () => {
      const res = await request(app)
        .post('/push/register-device')
        .send({ token: 'abc123', vendor: 'huawei', model: 'P60' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.vendor).toBe('huawei');
      expect(deviceTokenRepo.registerDevice).toHaveBeenCalledWith(
        'test@example.com',
        expect.objectContaining({ token: 'abc123', vendor: 'huawei' })
      );
    });

    it('auto-detects vendor from user-agent when not provided', async () => {
      const res = await request(app)
        .post('/push/register-device')
        .set('User-Agent', 'Xiaomi/MIUI')
        .send({ token: 'xyz789' });
      expect(res.status).toBe(200);
      expect(pushService.detectVendor).toHaveBeenCalled();
    });

    it('rejects missing token', async () => {
      const res = await request(app)
        .post('/push/register-device')
        .send({});
      expect(res.status).toBe(400);
    });

    it('rejects invalid vendor', async () => {
      const res = await request(app)
        .post('/push/register-device')
        .send({ token: 'tok', vendor: 'invalid' });
      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /push/unregister-device', () => {
    it('removes device by token', async () => {
      const res = await request(app)
        .delete('/push/unregister-device')
        .send({ token: 'tok1' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(deviceTokenRepo.removeDevice).toHaveBeenCalledWith('tok1');
    });

    it('rejects missing token', async () => {
      const res = await request(app)
        .delete('/push/unregister-device')
        .send({});
      expect(res.status).toBe(400);
    });
  });

  describe('POST /push/test-push', () => {
    it('sends test push notification', async () => {
      const res = await request(app)
        .post('/push/test-push')
        .send({ title: 'Test', body: 'Hello' });
      expect(res.status).toBe(200);
      expect(pushService.sendPush).toHaveBeenCalledWith(
        'test@example.com',
        expect.objectContaining({ title: 'Test', body: 'Hello' })
      );
    });

    it('uses default title and body when not provided', async () => {
      await request(app).post('/push/test-push').send({});
      expect(pushService.sendPush).toHaveBeenCalledWith(
        'test@example.com',
        expect.objectContaining({ title: 'AI医生测试推送' })
      );
    });
  });

  describe('GET /push/devices', () => {
    it('lists user devices', async () => {
      deviceTokenRepo.getDevicesByUserId.mockResolvedValue([
        { token: 'tok1', vendor: 'huawei' }
      ]);
      const res = await request(app).get('/push/devices');
      expect(res.status).toBe(200);
      expect(res.body.devices).toHaveLength(1);
    });
  });
});
