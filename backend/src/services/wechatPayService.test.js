const mockReadFileSync = jest.fn().mockReturnValue('fake-private-key');
jest.mock('fs', () => ({
  readFileSync: (...args) => mockReadFileSync(...args)
}));

jest.mock('axios');
jest.mock('../observability/logger', () => ({
  error: jest.fn(), warn: jest.fn(), info: jest.fn()
}));

const crypto = require('crypto');
const axios = require('axios');
const wechatPayService = require('./wechatPayService');

const testKeyPair = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs1', format: 'pem' }
});

beforeEach(() => {
  jest.clearAllMocks();
  mockReadFileSync.mockReturnValue('fake-private-key');
  delete process.env.WECHAT_APP_ID;
  delete process.env.WECHAT_PAY_MCH_ID;
  delete process.env.WECHAT_PAY_API_KEY;
  delete process.env.WECHAT_PAY_SERIAL_NO;
  delete process.env.WECHAT_PAY_PRIVATE_KEY_PATH;
  delete process.env.WECHAT_PAY_NOTIFY_URL;
  delete process.env.WECHAT_PAY_PLATFORM_CERT_PATH;
});

describe('isConfigured', () => {
  it('returns false without env vars', () => {
    expect(wechatPayService.isConfigured()).toBe(false);
  });

  it('returns true with required env vars', () => {
    process.env.WECHAT_APP_ID = 'appid';
    process.env.WECHAT_PAY_MCH_ID = 'mch123';
    process.env.WECHAT_PAY_API_KEY = 'key123456789012345678901234567890';
    expect(wechatPayService.isConfigured()).toBe(true);
  });
});

describe('createUnifiedOrder', () => {
  it('returns error when not configured', async () => {
    const result = await wechatPayService.createUnifiedOrder({
      orderNo: 'ORD001', amount: 2900, description: 'test'
    });
    expect(result.success).toBe(false);
    expect(result.error).toBe('wechat_pay_not_configured');
  });
});

describe('generatePayParams', () => {
  it('returns pay parameters with correct structure', () => {
    process.env.WECHAT_APP_ID = 'wxtest';
    process.env.WECHAT_PAY_PRIVATE_KEY_PATH = '/fake/key.pem';

    const mockSign = jest.spyOn(crypto, 'createSign').mockReturnValue({
      update: jest.fn(),
      sign: jest.fn().mockReturnValue('fakesig')
    });

    const params = wechatPayService.generatePayParams('prepay_abc');
    expect(params.appId).toBe('wxtest');
    expect(params.package).toBe('prepay_id=prepay_abc');
    expect(params.signType).toBe('RSA');
    expect(params.paySign).toBe('fakesig');
    expect(params.timeStamp).toBeDefined();
    expect(params.nonceStr).toBeDefined();

    mockSign.mockRestore();
  });
});

describe('verifyCallback', () => {
  function signBody(timestamp, nonce, body) {
    const message = `${timestamp}\n${nonce}\n${body}\n`;
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(message);
    return sign.sign(testKeyPair.privateKey, 'base64');
  }

  it('returns error on missing headers', () => {
    const result = wechatPayService.verifyCallback({}, '{}');
    expect(result.success).toBe(false);
    expect(result.error).toBe('missing_signature_headers');
  });

  it('returns error on expired timestamp', () => {
    const staleTs = String(Math.floor(Date.now() / 1000) - 600);
    const result = wechatPayService.verifyCallback(
      { 'wechatpay-timestamp': staleTs, 'wechatpay-nonce': 'abc', 'wechatpay-signature': 'sig' },
      '{}'
    );
    expect(result.success).toBe(false);
    expect(result.error).toBe('timestamp_expired');
  });

  it('returns error on invalid signature', () => {
    process.env.WECHAT_PAY_PLATFORM_CERT_PATH = '/fake/platform.pem';
    mockReadFileSync.mockReturnValue(testKeyPair.publicKey);

    const ts = String(Math.floor(Date.now() / 1000));
    const result = wechatPayService.verifyCallback(
      { 'wechatpay-timestamp': ts, 'wechatpay-nonce': 'abc', 'wechatpay-signature': 'badsig' },
      '{}'
    );
    expect(result.success).toBe(false);
    expect(result.error).toBe('invalid_callback_signature');
  });

  it('returns error on missing resource', () => {
    process.env.WECHAT_PAY_PLATFORM_CERT_PATH = '/fake/platform.pem';
    mockReadFileSync.mockReturnValue(testKeyPair.publicKey);

    const ts = String(Math.floor(Date.now() / 1000));
    const body = '{}';
    const sig = signBody(ts, 'abc', body);
    const result = wechatPayService.verifyCallback(
      { 'wechatpay-timestamp': ts, 'wechatpay-nonce': 'abc', 'wechatpay-signature': sig },
      body
    );
    expect(result.success).toBe(false);
    expect(result.error).toBe('missing_resource');
  });

  it('verifies signature, decrypts, and returns callback data', () => {
    const apiKey = '12345678901234567890123456789012';
    process.env.WECHAT_PAY_API_KEY = apiKey;
    process.env.WECHAT_PAY_PLATFORM_CERT_PATH = '/fake/platform.pem';
    mockReadFileSync.mockReturnValue(testKeyPair.publicKey);

    const nonce = '000000000012';
    const aad = 'transaction';
    const plaintext = JSON.stringify({ out_trade_no: 'ORD001', trade_state: 'SUCCESS' });

    const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(apiKey), Buffer.from(nonce));
    cipher.setAAD(Buffer.from(aad));
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    const ciphertext = Buffer.concat([encrypted, authTag]).toString('base64');

    const body = JSON.stringify({
      resource: { ciphertext, nonce, associated_data: aad }
    });

    const ts = String(Math.floor(Date.now() / 1000));
    const sig = signBody(ts, 'abc', body);
    const result = wechatPayService.verifyCallback(
      { 'wechatpay-timestamp': ts, 'wechatpay-nonce': 'abc', 'wechatpay-signature': sig },
      body
    );

    expect(result.success).toBe(true);
    expect(result.data.out_trade_no).toBe('ORD001');
    expect(result.data.trade_state).toBe('SUCCESS');
  });
});
