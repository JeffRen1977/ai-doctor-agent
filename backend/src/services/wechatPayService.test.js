jest.mock('fs', () => ({
  readFileSync: jest.fn().mockReturnValue('fake-private-key')
}));

jest.mock('axios');
jest.mock('../observability/logger', () => ({
  error: jest.fn(), warn: jest.fn(), info: jest.fn()
}));

const crypto = require('crypto');
const axios = require('axios');
const wechatPayService = require('./wechatPayService');

beforeEach(() => {
  jest.clearAllMocks();
  delete process.env.WECHAT_APP_ID;
  delete process.env.WECHAT_PAY_MCH_ID;
  delete process.env.WECHAT_PAY_API_KEY;
  delete process.env.WECHAT_PAY_SERIAL_NO;
  delete process.env.WECHAT_PAY_PRIVATE_KEY_PATH;
  delete process.env.WECHAT_PAY_NOTIFY_URL;
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
  it('returns error on missing headers', () => {
    const result = wechatPayService.verifyCallback({}, '{}');
    expect(result.success).toBe(false);
    expect(result.error).toBe('missing_signature_headers');
  });

  it('returns error on missing resource', () => {
    const result = wechatPayService.verifyCallback(
      { 'wechatpay-timestamp': '123', 'wechatpay-nonce': 'abc', 'wechatpay-signature': 'sig' },
      '{}'
    );
    expect(result.success).toBe(false);
    expect(result.error).toBe('missing_resource');
  });

  it('decrypts callback data when configured', () => {
    const apiKey = '12345678901234567890123456789012'; // 32 bytes
    process.env.WECHAT_PAY_API_KEY = apiKey;

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

    const result = wechatPayService.verifyCallback(
      { 'wechatpay-timestamp': '123', 'wechatpay-nonce': 'abc', 'wechatpay-signature': 'sig' },
      body
    );

    expect(result.success).toBe(true);
    expect(result.data.out_trade_no).toBe('ORD001');
    expect(result.data.trade_state).toBe('SUCCESS');
  });
});
