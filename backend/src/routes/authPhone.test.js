jest.mock('../services/smsService');
jest.mock('../repositories', () => ({
  userRepo: {
    getByPhone: jest.fn(),
    setByEmail: jest.fn()
  }
}));
jest.mock('../config/jwtConfig', () => ({
  signAuthToken: jest.fn(() => 'mock-jwt-token'),
  verifyAuthToken: jest.fn(),
  assertJwtSecretConfigured: jest.fn()
}));
jest.mock('../services/consentService', () => ({
  recordConsent: jest.fn().mockResolvedValue({ recorded: true })
}));
jest.mock('../observability/logger', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn()
}));

// Disable rate limiting in tests
process.env.RATE_LIMIT_DISABLED = 'true';

const express = require('express');
const request = require('supertest');
const authPhoneRoutes = require('./authPhone');
const smsService = require('../services/smsService');
const { userRepo } = require('../repositories');

const app = express();
app.use(express.json());
app.use('/api/auth', authPhoneRoutes);

beforeEach(() => {
  jest.clearAllMocks();
});

describe('POST /api/auth/send-sms', () => {
  it('rejects invalid phone number', async () => {
    const res = await request(app)
      .post('/api/auth/send-sms')
      .send({ phone: '12345' });
    expect(res.status).toBe(400);
  });

  it('sends SMS for valid phone', async () => {
    smsService.sendVerificationCode.mockResolvedValue({ success: true, expiresAt: '2026-12-01T00:05:00Z' });
    const res = await request(app)
      .post('/api/auth/send-sms')
      .send({ phone: '13812345678' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(smsService.sendVerificationCode).toHaveBeenCalledWith('13812345678');
  });

  it('returns error when SMS service fails', async () => {
    smsService.sendVerificationCode.mockResolvedValue({ success: false, error: '发送失败' });
    const res = await request(app)
      .post('/api/auth/send-sms')
      .send({ phone: '13812345678' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login-phone', () => {
  it('rejects invalid input', async () => {
    const res = await request(app)
      .post('/api/auth/login-phone')
      .send({ phone: '138', code: '12' });
    expect(res.status).toBe(400);
  });

  it('rejects wrong code', async () => {
    smsService.verifyCode.mockResolvedValue({ valid: false, error: '验证码错误' });
    const res = await request(app)
      .post('/api/auth/login-phone')
      .send({ phone: '13812345678', code: '999999' });
    expect(res.status).toBe(401);
  });

  it('rejects unregistered phone', async () => {
    smsService.verifyCode.mockResolvedValue({ valid: true });
    userRepo.getByPhone.mockResolvedValue(null);
    const res = await request(app)
      .post('/api/auth/login-phone')
      .send({ phone: '13812345678', code: '123456' });
    expect(res.status).toBe(401);
    expect(res.body.error).toContain('未注册');
  });

  it('rejects disabled account', async () => {
    smsService.verifyCode.mockResolvedValue({ valid: true });
    userRepo.getByPhone.mockResolvedValue({ uid: 'uid1', email: 'a@b.com', name: 'Test', disabled: true });
    const res = await request(app)
      .post('/api/auth/login-phone')
      .send({ phone: '13812345678', code: '123456' });
    expect(res.status).toBe(403);
  });

  it('returns token on successful login', async () => {
    smsService.verifyCode.mockResolvedValue({ valid: true });
    userRepo.getByPhone.mockResolvedValue({ uid: 'uid1', email: '13812345678@sms.local', name: 'Test', avatar: null });
    const res = await request(app)
      .post('/api/auth/login-phone')
      .send({ phone: '13812345678', code: '123456' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBe('mock-jwt-token');
    expect(res.body.user.phone).toBe('13812345678');
  });
});

describe('POST /api/auth/register-phone', () => {
  it('rejects without consent', async () => {
    smsService.verifyCode.mockResolvedValue({ valid: true });
    const res = await request(app)
      .post('/api/auth/register-phone')
      .send({ phone: '13812345678', code: '123456', name: 'Test' });
    expect(res.status).toBe(400);
  });

  it('rejects wrong verification code', async () => {
    smsService.verifyCode.mockResolvedValue({ valid: false, error: '验证码错误' });
    const res = await request(app)
      .post('/api/auth/register-phone')
      .send({ phone: '13812345678', code: '999999', name: 'Test', acceptTerms: true, acceptHealthAi: true });
    expect(res.status).toBe(400);
  });

  it('rejects duplicate phone', async () => {
    smsService.verifyCode.mockResolvedValue({ valid: true });
    userRepo.getByPhone.mockResolvedValue({ uid: 'existing' });
    const res = await request(app)
      .post('/api/auth/register-phone')
      .send({ phone: '13812345678', code: '123456', name: 'Test', acceptTerms: true, acceptHealthAi: true });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('已被注册');
  });

  it('creates user and returns token on success', async () => {
    smsService.verifyCode.mockResolvedValue({ valid: true });
    userRepo.getByPhone.mockResolvedValue(null);
    userRepo.setByEmail.mockResolvedValue(undefined);

    const res = await request(app)
      .post('/api/auth/register-phone')
      .send({ phone: '13812345678', code: '123456', name: 'Test', acceptTerms: true, acceptHealthAi: true });
    expect(res.status).toBe(201);
    expect(res.body.token).toBe('mock-jwt-token');
    expect(res.body.user.email).toBe('13812345678@sms.local');
    expect(res.body.user.phone).toBe('13812345678');
    expect(userRepo.setByEmail).toHaveBeenCalledWith(
      '13812345678@sms.local',
      expect.objectContaining({ phone: '13812345678', name: 'Test', role: 'user' })
    );
  });
});
