jest.mock('../services/wechatIntegrationService');
jest.mock('../middleware/auth', () => ({
  authenticateToken: (req, res, next) => {
    req.user = { email: 'test@example.com', userId: 'uid1' };
    next();
  }
}));

const express = require('express');
const request = require('supertest');
const wechatIntegrationRoutes = require('./wechatIntegration');
const wechatService = require('../services/wechatIntegrationService');

const app = express();
app.use(express.json());
app.use('/api/integrations/wechat', wechatIntegrationRoutes);

beforeEach(() => {
  jest.clearAllMocks();
});

describe('POST /api/integrations/wechat/bind-code', () => {
  it('returns bind code on success', async () => {
    wechatService.createWeChatBindCode.mockResolvedValue({
      success: true,
      code: 'ABC123',
      expiresAt: '2026-12-01T00:15:00Z',
      instructionsZh: '发送绑定码到公众号'
    });

    const res = await request(app).post('/api/integrations/wechat/bind-code');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.code).toBe('ABC123');
    expect(wechatService.createWeChatBindCode).toHaveBeenCalledWith('test@example.com');
  });

  it('returns 400 on service failure', async () => {
    wechatService.createWeChatBindCode.mockResolvedValue({
      success: false,
      error: 'Invalid user email'
    });

    const res = await request(app).post('/api/integrations/wechat/bind-code');
    expect(res.status).toBe(400);
  });

  it('returns 500 on exception', async () => {
    wechatService.createWeChatBindCode.mockRejectedValue(new Error('DB error'));

    const res = await request(app).post('/api/integrations/wechat/bind-code');
    expect(res.status).toBe(500);
  });
});
