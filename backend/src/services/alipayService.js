/**
 * Alipay — page pay (PC) / WAP pay (mobile), callback verification.
 *
 * Env vars:
 *   ALIPAY_APP_ID, ALIPAY_PRIVATE_KEY, ALIPAY_PUBLIC_KEY,
 *   ALIPAY_NOTIFY_URL, ALIPAY_RETURN_URL
 */

const crypto = require('crypto');
const logger = require('../observability/logger');

function getConfig() {
  return {
    appId: process.env.ALIPAY_APP_ID || '',
    privateKey: process.env.ALIPAY_PRIVATE_KEY || '',
    publicKey: process.env.ALIPAY_PUBLIC_KEY || '',
    notifyUrl: process.env.ALIPAY_NOTIFY_URL || '',
    returnUrl: process.env.ALIPAY_RETURN_URL || '',
    gateway: process.env.ALIPAY_GATEWAY || 'https://openapi.alipay.com/gateway.do'
  };
}

function isConfigured() {
  const c = getConfig();
  return !!(c.appId && c.privateKey && c.publicKey);
}

function sortParams(params) {
  return Object.keys(params)
    .filter((k) => params[k] !== '' && params[k] !== undefined && params[k] !== null && k !== 'sign')
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&');
}

function rsaSign(content, privateKey) {
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(content, 'utf8');
  const pem = privateKey.includes('-----') ? privateKey : `-----BEGIN RSA PRIVATE KEY-----\n${privateKey}\n-----END RSA PRIVATE KEY-----`;
  return sign.sign(pem, 'base64');
}

function rsaVerify(content, signature, publicKey) {
  const verify = crypto.createVerify('RSA-SHA256');
  verify.update(content, 'utf8');
  const pem = publicKey.includes('-----') ? publicKey : `-----BEGIN PUBLIC KEY-----\n${publicKey}\n-----END PUBLIC KEY-----`;
  return verify.verify(pem, signature, 'base64');
}

/**
 * Build Alipay page-pay URL (redirect user's browser).
 * @param {object} params
 * @param {string} params.orderNo
 * @param {number} params.amount  in fen (分), will be converted to yuan
 * @param {string} params.subject
 * @returns {{ success: boolean, payUrl?: string, error?: string }}
 */
function createTradePagePay({ orderNo, amount, subject }) {
  if (!isConfigured()) {
    return { success: false, error: 'alipay_not_configured' };
  }

  const config = getConfig();
  const amountYuan = (amount / 100).toFixed(2);

  const bizContent = JSON.stringify({
    out_trade_no: orderNo,
    total_amount: amountYuan,
    subject: String(subject).slice(0, 256),
    product_code: 'FAST_INSTANT_TRADE_PAY'
  });

  const params = {
    app_id: config.appId,
    method: 'alipay.trade.page.pay',
    charset: 'utf-8',
    sign_type: 'RSA2',
    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
    version: '1.0',
    notify_url: config.notifyUrl,
    return_url: config.returnUrl,
    biz_content: bizContent
  };

  const signStr = sortParams(params);
  params.sign = rsaSign(signStr, config.privateKey);

  const query = Object.keys(params)
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
    .join('&');

  return { success: true, payUrl: `${config.gateway}?${query}` };
}

/**
 * Verify async notification from Alipay.
 * @param {object} params  POST body (key-value)
 * @returns {{ success: boolean, data?: object, error?: string }}
 */
function verifyCallback(params) {
  if (!isConfigured()) {
    return { success: false, error: 'alipay_not_configured' };
  }

  try {
    const config = getConfig();
    const sign = params.sign;
    const signType = params.sign_type;

    if (!sign) {
      return { success: false, error: 'missing_sign' };
    }

    const filtered = { ...params };
    delete filtered.sign;
    delete filtered.sign_type;
    const signStr = sortParams(filtered);

    const valid = rsaVerify(signStr, sign, config.publicKey);
    if (!valid) {
      return { success: false, error: 'invalid_signature' };
    }

    return {
      success: true,
      data: {
        outTradeNo: params.out_trade_no,
        tradeNo: params.trade_no,
        tradeStatus: params.trade_status,
        totalAmount: params.total_amount,
        buyerId: params.buyer_id
      }
    };
  } catch (err) {
    logger.error({ err: { message: err.message } }, 'Alipay verifyCallback failed');
    return { success: false, error: err.message };
  }
}

module.exports = {
  createTradePagePay,
  verifyCallback,
  isConfigured,
  getConfig,
  sortParams,
  rsaSign,
  rsaVerify
};
