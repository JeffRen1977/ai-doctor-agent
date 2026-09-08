/**
 * Unit tests: userSettings routes (GET/PUT /, GET/PUT /ai, POST /reset)
 */

const express = require('express');
const request = require('supertest');

const mockGetUserSettings = jest.fn();
const mockUpdateUserSettings = jest.fn();
const mockGetUserAISettings = jest.fn();
const mockUpdateUserAISettings = jest.fn();
const mockResetUserSettings = jest.fn();

jest.mock('../services/userSettingsService', () => ({
  getUserSettings: (...args) => mockGetUserSettings(...args),
  updateUserSettings: (...args) => mockUpdateUserSettings(...args),
  getUserAISettings: (...args) => mockGetUserAISettings(...args),
  updateUserAISettings: (...args) => mockUpdateUserAISettings(...args),
  resetUserSettings: (...args) => mockResetUserSettings(...args)
}));

jest.mock('../services/consentService', () => ({
  recordConsent: jest.fn().mockResolvedValue({ recorded: true }),
  assertConsent: jest.fn().mockResolvedValue(undefined),
  CROSS_BORDER_PROVIDERS: new Set(['openai', 'gemini'])
}));

jest.mock('../middleware/auth', () => ({
  authenticateToken: (req, res, next) => {
    req.user = { id: 'user_1' };
    next();
  }
}));

const userSettingsRoutes = require('./userSettings');

const app = express();
app.use(express.json());
app.use('/api/user-settings', userSettingsRoutes);

beforeEach(() => {
  mockGetUserSettings.mockReset();
  mockUpdateUserSettings.mockReset();
  mockGetUserAISettings.mockReset();
  mockUpdateUserAISettings.mockReset();
  mockResetUserSettings.mockReset();
});

describe('GET /api/user-settings', () => {
  test('returns 200 and data when getUserSettings succeeds', async () => {
    mockGetUserSettings.mockResolvedValue({ success: true, settings: { language: 'zh', theme: 'light' } });
    const res = await request(app).get('/api/user-settings');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual({ language: 'zh', theme: 'light' });
    expect(mockGetUserSettings).toHaveBeenCalledWith('user_1');
  });

  test('returns 500 when getUserSettings fails', async () => {
    mockGetUserSettings.mockResolvedValue({ success: false, error: 'DB error' });
    const res = await request(app).get('/api/user-settings');
    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Failed to get');
  });
});

describe('PUT /api/user-settings', () => {
  test('returns 200 and updated data when updateUserSettings succeeds', async () => {
    const updated = { language: 'en', theme: 'dark', updatedAt: '2025-01-01' };
    mockUpdateUserSettings.mockResolvedValue({ success: true, settings: updated });
    const res = await request(app)
      .put('/api/user-settings')
      .send({ language: 'en', theme: 'dark' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual(updated);
    expect(mockUpdateUserSettings).toHaveBeenCalledWith('user_1', expect.objectContaining({ language: 'en', theme: 'dark' }));
  });

  test('returns 500 when updateUserSettings fails', async () => {
    mockUpdateUserSettings.mockResolvedValue({ success: false, error: 'Write failed' });
    const res = await request(app).put('/api/user-settings').send({});
    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});

describe('GET /api/user-settings/ai', () => {
  test('returns 200 and aiProvider, aiModel, language when getUserAISettings succeeds', async () => {
    mockGetUserAISettings.mockResolvedValue({
      success: true,
      aiProvider: 'openai',
      aiModel: 'gpt-4o',
      language: 'en'
    });
    const res = await request(app).get('/api/user-settings/ai');
    expect(res.status).toBe(200);
    expect(res.body.data.aiProvider).toBe('openai');
    expect(res.body.data.aiModel).toBe('gpt-4o');
    expect(res.body.data.language).toBe('en');
    expect(mockGetUserAISettings).toHaveBeenCalledWith('user_1');
  });
});

describe('PUT /api/user-settings/ai', () => {
  test('returns 200 when updateUserAISettings succeeds', async () => {
    mockUpdateUserAISettings.mockResolvedValue({
      success: true,
      settings: { aiProvider: 'qwen', aiModel: 'qwen-turbo', language: 'zh' }
    });
    const res = await request(app)
      .put('/api/user-settings/ai')
      .send({ aiProvider: 'qwen', aiModel: 'qwen-turbo', language: 'zh' });
    expect(res.status).toBe(200);
    expect(res.body.data.aiProvider).toBe('qwen');
    expect(mockUpdateUserAISettings).toHaveBeenCalledWith('user_1', expect.objectContaining({ aiProvider: 'qwen' }));
  });
});

describe('POST /api/user-settings/reset', () => {
  test('returns 200 when resetUserSettings succeeds', async () => {
    mockResetUserSettings.mockResolvedValue({
      success: true,
      settings: { aiProvider: 'gemini', language: 'zh' }
    });
    const res = await request(app).post('/api/user-settings/reset');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockResetUserSettings).toHaveBeenCalledWith('user_1');
  });
});
