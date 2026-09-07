/**
 * Auth routes: profile IDOR, refresh must present a JWT, forgot-password enumeration.
 */

process.env.RATE_LIMIT_DISABLED = 'true';
process.env.NODE_ENV = 'test';

const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');

const mockGetUserById = jest.fn();
const mockGetUserProfile = jest.fn();
const mockUpdateUser = jest.fn();
const mockUpdateUserProfile = jest.fn();

jest.mock('../services/firebaseService', () => ({
  getUserById: (...args) => mockGetUserById(...args),
  getUserProfile: (...args) => mockGetUserProfile(...args),
  updateUser: (...args) => mockUpdateUser(...args),
  updateUserProfile: (...args) => mockUpdateUserProfile(...args),
  registerUser: jest.fn(),
  loginUser: jest.fn(),
  logoutUser: jest.fn()
}));

const mockRequestMongoReset = jest.fn().mockResolvedValue({ accepted: true });
const mockRequestFirebaseReset = jest.fn().mockResolvedValue({ accepted: true });
const mockConfirmMongoReset = jest.fn();

jest.mock('../services/passwordResetService', () => ({
  requestMongoReset: (...args) => mockRequestMongoReset(...args),
  requestFirebaseReset: (...args) => mockRequestFirebaseReset(...args),
  confirmMongoReset: (...args) => mockConfirmMongoReset(...args)
}));

jest.mock('../adapters', () => ({
  __useMongoAuth: true
}));

jest.mock('../repositories', () => ({
  userRepo: {
    getByEmail: jest.fn(),
    setByEmail: jest.fn()
  }
}));

const { signAuthToken } = require('../config/jwtConfig');
const authRoutes = require('./auth');

const ME = { id: 'user_1', email: 'me@test.com', name: 'Me', role: 'user' };

function app() {
  const server = express();
  server.use(express.json());
  server.use('/api/auth', authRoutes);
  return server;
}

function bearer(payload = { userId: ME.id, email: ME.email }) {
  return `Bearer ${signAuthToken(payload)}`;
}

beforeEach(() => {
  mockGetUserById.mockReset().mockImplementation(async (id) => {
    if (id === ME.id) return { success: true, user: ME };
    return { success: false, error: '用户不存在' };
  });
  mockGetUserProfile.mockReset().mockResolvedValue({
    success: true,
    profile: { email: ME.email, phone: '123' }
  });
  mockUpdateUser.mockReset().mockResolvedValue({ success: true });
  mockUpdateUserProfile.mockReset().mockResolvedValue({
    success: true,
    profile: { email: ME.email, phone: '999' }
  });
  mockRequestMongoReset.mockClear();
  mockConfirmMongoReset.mockReset();
});

describe('GET /api/auth/profile', () => {
  test('returns 401 without a token', async () => {
    const res = await request(app()).get('/api/auth/profile');
    expect(res.status).toBe(401);
  });

  test('returns own profile with a valid token', async () => {
    const res = await request(app()).get('/api/auth/profile').set('Authorization', bearer());
    expect(res.status).toBe(200);
    expect(res.body.profile.email).toBe(ME.email);
    expect(mockGetUserProfile).toHaveBeenCalledWith(ME.email);
  });
});

describe('GET /api/auth/profile/:email', () => {
  test('returns 403 when the URL email is not the caller', async () => {
    const res = await request(app())
      .get('/api/auth/profile/other@test.com')
      .set('Authorization', bearer());
    expect(res.status).toBe(403);
    expect(mockGetUserProfile).not.toHaveBeenCalled();
  });
});

describe('POST /api/auth/refresh-token', () => {
  test('returns 401 without Authorization', async () => {
    const res = await request(app())
      .post('/api/auth/refresh-token')
      .send({ userId: ME.id, email: ME.email });
    expect(res.status).toBe(401);
  });

  test('returns 401 for a token with a bad signature', async () => {
    const forged = jwt.sign({ userId: ME.id, email: ME.email }, 'wrong-secret-wrong-secret-wrong-secret');
    const res = await request(app())
      .post('/api/auth/refresh-token')
      .set('Authorization', `Bearer ${forged}`);
    expect(res.status).toBe(401);
  });

  test('issues a new token for a valid access token', async () => {
    const res = await request(app())
      .post('/api/auth/refresh-token')
      .set('Authorization', bearer());
    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
  });

  test('issues a new token for an access token that just expired', async () => {
    const now = Math.floor(Date.now() / 1000);
    const expired = jwt.sign(
      { userId: ME.id, email: ME.email, iat: now - 120, exp: now - 10 },
      process.env.JWT_SECRET
    );
    const res = await request(app())
      .post('/api/auth/refresh-token')
      .set('Authorization', `Bearer ${expired}`);
    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
  });
});

describe('POST /api/auth/forgot-password', () => {
  test('returns 200 for an unknown email so accounts cannot be enumerated', async () => {
    const res = await request(app())
      .post('/api/auth/forgot-password')
      .send({ email: 'nobody@test.com' });
    expect(res.status).toBe(200);
    expect(mockRequestMongoReset).toHaveBeenCalledWith('nobody@test.com');
  });
});

describe('POST /api/auth/reset-password', () => {
  test('returns 400 for a bad token', async () => {
    mockConfirmMongoReset.mockResolvedValue({ success: false, error: '重置链接无效或已过期' });
    const res = await request(app())
      .post('/api/auth/reset-password')
      .send({ token: 'a'.repeat(32), password: 'newpassword1' });
    expect(res.status).toBe(400);
  });

  test('returns 200 when the token is valid', async () => {
    mockConfirmMongoReset.mockResolvedValue({ success: true });
    const res = await request(app())
      .post('/api/auth/reset-password')
      .send({ token: 'a'.repeat(32), password: 'newpassword1' });
    expect(res.status).toBe(200);
    expect(mockConfirmMongoReset).toHaveBeenCalledWith('a'.repeat(32), 'newpassword1');
  });
});

describe('POST /api/auth/create-document', () => {
  test('is no longer exposed', async () => {
    const res = await request(app())
      .post('/api/auth/create-document')
      .send({ email: 'x@y.com', uid: 'uid' });
    expect(res.status).toBe(404);
  });
});
