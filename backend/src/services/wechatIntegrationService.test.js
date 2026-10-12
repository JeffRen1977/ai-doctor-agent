const crypto = require('crypto');

const mockPutBindingCode = jest.fn();
const mockTakeBindingCode = jest.fn();

jest.mock('../repositories', () => ({
  wechatBindingRepo: {
    putBindingCode: mockPutBindingCode,
    takeBindingCode: mockTakeBindingCode
  }
}));

jest.mock('./userSettingsService', () => ({
  getUserSettings: jest.fn().mockResolvedValue({ success: true, settings: { integrations: {} } }),
  updateUserSettings: jest.fn().mockResolvedValue({ success: true })
}));

jest.mock('../observability/logger', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn()
}));

jest.mock('axios');
const axios = require('axios');

const wechatService = require('./wechatIntegrationService');
const userSettingsService = require('./userSettingsService');

beforeEach(() => {
  jest.clearAllMocks();
  wechatService._resetTokenCache();
  delete process.env.WECHAT_APP_ID;
  delete process.env.WECHAT_APP_SECRET;
  delete process.env.WECHAT_TOKEN;
});

describe('verifySignature', () => {
  it('returns true for valid signature', () => {
    process.env.WECHAT_TOKEN = 'testtoken';
    const timestamp = '1234567890';
    const nonce = 'nonce123';
    const arr = ['testtoken', timestamp, nonce].sort();
    const expected = crypto.createHash('sha1').update(arr.join('')).digest('hex');

    expect(wechatService.verifySignature(expected, timestamp, nonce)).toBe(true);
  });

  it('returns false for invalid signature', () => {
    process.env.WECHAT_TOKEN = 'testtoken';
    expect(wechatService.verifySignature('badsig', '123', 'nonce')).toBe(false);
  });
});

describe('createWeChatBindCode', () => {
  it('rejects invalid email', async () => {
    const result = await wechatService.createWeChatBindCode('');
    expect(result.success).toBe(false);
  });

  it('creates and stores a 6-char code', async () => {
    mockPutBindingCode.mockResolvedValue(undefined);
    const result = await wechatService.createWeChatBindCode('test@example.com');
    expect(result.success).toBe(true);
    expect(result.code).toMatch(/^[A-Z0-9]{6}$/);
    expect(result.expiresAt).toBeDefined();
    expect(mockPutBindingCode).toHaveBeenCalledWith(
      result.code,
      expect.objectContaining({ userId: 'test@example.com' })
    );
  });
});

describe('bindWeChatUser', () => {
  it('rejects wrong-length code', async () => {
    const result = await wechatService.bindWeChatUser('openid1', 'AB');
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('invalid_code_format');
  });

  it('rejects expired/invalid code', async () => {
    mockTakeBindingCode.mockResolvedValue(null);
    const result = await wechatService.bindWeChatUser('openid1', 'ABCDEF');
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('invalid_or_expired_code');
  });

  it('binds user and saves wechatOpenId to settings', async () => {
    mockTakeBindingCode.mockResolvedValue({ userId: 'user1@test.com' });
    userSettingsService.getUserSettings.mockResolvedValue({
      success: true,
      settings: { integrations: { telegramChatId: '999' } }
    });
    userSettingsService.updateUserSettings.mockResolvedValue({ success: true });

    const result = await wechatService.bindWeChatUser('openid123', 'ABCDEF');
    expect(result.ok).toBe(true);
    expect(result.wechatOpenId).toBe('openid123');

    expect(userSettingsService.updateUserSettings).toHaveBeenCalledWith(
      'user1@test.com',
      expect.objectContaining({
        integrations: expect.objectContaining({
          telegramChatId: '999',
          wechatOpenId: 'openid123'
        })
      })
    );
  });
});

describe('getAccessToken', () => {
  it('throws when not configured', async () => {
    await expect(wechatService.getAccessToken()).rejects.toThrow('WECHAT_APP_ID');
  });

  it('fetches and caches token', async () => {
    process.env.WECHAT_APP_ID = 'appid';
    process.env.WECHAT_APP_SECRET = 'secret';

    axios.get.mockResolvedValue({ data: { access_token: 'tok123', expires_in: 7200 } });
    const token1 = await wechatService.getAccessToken();
    expect(token1).toBe('tok123');

    const token2 = await wechatService.getAccessToken();
    expect(token2).toBe('tok123');
    expect(axios.get).toHaveBeenCalledTimes(1);
  });

  it('throws on API error', async () => {
    process.env.WECHAT_APP_ID = 'appid';
    process.env.WECHAT_APP_SECRET = 'secret';
    axios.get.mockResolvedValue({ data: { errcode: 40001, errmsg: 'invalid credential' } });
    await expect(wechatService.getAccessToken()).rejects.toThrow('40001');
  });
});

describe('sendTemplateMessage', () => {
  it('returns not configured when env vars missing', async () => {
    const result = await wechatService.sendTemplateMessage('openid', 'tpl1', {});
    expect(result.sent).toBe(false);
    expect(result.reason).toBe('wechat_not_configured');
  });

  it('sends template message successfully', async () => {
    process.env.WECHAT_APP_ID = 'appid';
    process.env.WECHAT_APP_SECRET = 'secret';

    axios.get.mockResolvedValue({ data: { access_token: 'tok', expires_in: 7200 } });
    axios.post.mockResolvedValue({ data: { errcode: 0, errmsg: 'ok', msgid: 12345 } });

    const result = await wechatService.sendTemplateMessage('openid', 'tpl1', {
      first: { value: 'Hello' }
    });
    expect(result.sent).toBe(true);
    expect(result.msgid).toBe(12345);
  });
});

describe('sendTextMessage', () => {
  it('returns not configured when env vars missing', async () => {
    const result = await wechatService.sendTextMessage('openid', 'hello');
    expect(result.sent).toBe(false);
  });
});

describe('isWeChatConfigured', () => {
  it('returns false without env vars', () => {
    expect(wechatService.isWeChatConfigured()).toBe(false);
  });

  it('returns true with both env vars', () => {
    process.env.WECHAT_APP_ID = 'id';
    process.env.WECHAT_APP_SECRET = 'secret';
    expect(wechatService.isWeChatConfigured()).toBe(true);
  });
});
