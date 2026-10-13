jest.mock('../observability/logger', () => ({
  error: jest.fn(), warn: jest.fn(), info: jest.fn()
}));

const crypto = require('crypto');
const alipayService = require('./alipayService');

beforeEach(() => {
  jest.clearAllMocks();
  delete process.env.ALIPAY_APP_ID;
  delete process.env.ALIPAY_PRIVATE_KEY;
  delete process.env.ALIPAY_PUBLIC_KEY;
  delete process.env.ALIPAY_NOTIFY_URL;
  delete process.env.ALIPAY_RETURN_URL;
});

describe('isConfigured', () => {
  it('returns false without env vars', () => {
    expect(alipayService.isConfigured()).toBe(false);
  });

  it('returns true with required env vars', () => {
    process.env.ALIPAY_APP_ID = 'app123';
    process.env.ALIPAY_PRIVATE_KEY = 'pk';
    process.env.ALIPAY_PUBLIC_KEY = 'pub';
    expect(alipayService.isConfigured()).toBe(true);
  });
});

describe('sortParams', () => {
  it('sorts and filters params', () => {
    const result = alipayService.sortParams({
      b: '2', a: '1', c: '', sign: 'ignored', d: null
    });
    expect(result).toBe('a=1&b=2');
  });
});

describe('createTradePagePay', () => {
  it('returns error when not configured', () => {
    const result = alipayService.createTradePagePay({
      orderNo: 'ORD001', amount: 2900, subject: 'test'
    });
    expect(result.success).toBe(false);
    expect(result.error).toBe('alipay_not_configured');
  });

  it('builds pay URL when configured', () => {
    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs1', format: 'pem' }
    });

    process.env.ALIPAY_APP_ID = 'testapp';
    process.env.ALIPAY_PRIVATE_KEY = privateKey;
    process.env.ALIPAY_PUBLIC_KEY = publicKey;
    process.env.ALIPAY_NOTIFY_URL = 'https://example.com/notify';
    process.env.ALIPAY_RETURN_URL = 'https://example.com/return';

    const result = alipayService.createTradePagePay({
      orderNo: 'ORD001',
      amount: 2900,
      subject: 'AI医生月度会员'
    });

    expect(result.success).toBe(true);
    expect(result.payUrl).toContain('alipay.trade.page.pay');
    expect(result.payUrl).toContain('ORD001');
  });
});

describe('verifyCallback', () => {
  it('returns error when not configured', () => {
    const result = alipayService.verifyCallback({});
    expect(result.success).toBe(false);
  });

  it('returns error on missing sign', () => {
    process.env.ALIPAY_APP_ID = 'app';
    process.env.ALIPAY_PRIVATE_KEY = 'pk';
    process.env.ALIPAY_PUBLIC_KEY = 'pub';
    const result = alipayService.verifyCallback({ out_trade_no: 'ORD001' });
    expect(result.success).toBe(false);
    expect(result.error).toBe('missing_sign');
  });

  it('verifies valid callback signature', () => {
    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs1', format: 'pem' }
    });

    process.env.ALIPAY_APP_ID = 'testapp';
    process.env.ALIPAY_PRIVATE_KEY = privateKey;
    process.env.ALIPAY_PUBLIC_KEY = publicKey;

    const params = {
      out_trade_no: 'ORD001',
      trade_no: 'T2026',
      trade_status: 'TRADE_SUCCESS',
      total_amount: '29.00'
    };

    const signStr = alipayService.sortParams(params);
    const sign = alipayService.rsaSign(signStr, privateKey);

    const result = alipayService.verifyCallback({ ...params, sign, sign_type: 'RSA2' });
    expect(result.success).toBe(true);
    expect(result.data.outTradeNo).toBe('ORD001');
    expect(result.data.tradeStatus).toBe('TRADE_SUCCESS');
  });

  it('rejects invalid signature', () => {
    const { publicKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs1', format: 'pem' }
    });

    process.env.ALIPAY_APP_ID = 'testapp';
    process.env.ALIPAY_PRIVATE_KEY = 'pk';
    process.env.ALIPAY_PUBLIC_KEY = publicKey;

    const result = alipayService.verifyCallback({
      out_trade_no: 'ORD001',
      sign: 'badsig',
      sign_type: 'RSA2'
    });
    expect(result.success).toBe(false);
  });
});
