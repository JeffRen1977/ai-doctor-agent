/**
 * WeChat Pay V3 — JSAPI / H5 unified order, callback verification.
 *
 * Env vars:
 *   WECHAT_PAY_MCH_ID, WECHAT_PAY_API_KEY (v3 key),
 *   WECHAT_PAY_SERIAL_NO, WECHAT_PAY_PRIVATE_KEY_PATH,
 *   WECHAT_PAY_NOTIFY_URL, WECHAT_APP_ID
 */

const crypto = require('crypto');
const fs = require('fs');
const axios = require('axios');
const logger = require('../observability/logger');

function getConfig() {
  return {
    appId: process.env.WECHAT_APP_ID || '',
    mchId: process.env.WECHAT_PAY_MCH_ID || '',
    apiKey: process.env.WECHAT_PAY_API_KEY || '',
    serialNo: process.env.WECHAT_PAY_SERIAL_NO || '',
    privateKeyPath: process.env.WECHAT_PAY_PRIVATE_KEY_PATH || '',
    notifyUrl: process.env.WECHAT_PAY_NOTIFY_URL || ''
  };
}

function isConfigured() {
  const c = getConfig();
  return !!(c.mchId && c.apiKey && c.appId);
}

function loadPrivateKey() {
  const keyPath = getConfig().privateKeyPath;
  if (!keyPath) throw new Error('WECHAT_PAY_PRIVATE_KEY_PATH not set');
  return fs.readFileSync(keyPath, 'utf8');
}

function signMessage(message) {
  const privateKey = loadPrivateKey();
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(message);
  return sign.sign(privateKey, 'base64');
}

function buildAuthHeader(method, url, body) {
  const config = getConfig();
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonceStr = crypto.randomBytes(16).toString('hex');
  const urlObj = new URL(url);
  const pathWithQuery = urlObj.pathname + urlObj.search;
  const message = `${method}\n${pathWithQuery}\n${timestamp}\n${nonceStr}\n${body || ''}\n`;
  const signature = signMessage(message);
  return `WECHATPAY2-SHA256-RSA2048 mchid="${config.mchId}",nonce_str="${nonceStr}",timestamp="${timestamp}",serial_no="${config.serialNo}",signature="${signature}"`;
}

/**
 * Create a unified order (JSAPI or H5).
 * @param {object} params
 * @param {string} params.orderNo
 * @param {number} params.amount  in fen (分)
 * @param {string} params.description
 * @param {string} [params.openId]  required for JSAPI
 * @param {string} [params.tradeType]  'JSAPI' | 'H5', default 'JSAPI'
 */
async function createUnifiedOrder({ orderNo, amount, description, openId, tradeType = 'JSAPI' }) {
  if (!isConfigured()) {
    return { success: false, error: 'wechat_pay_not_configured' };
  }

  const config = getConfig();
  const apiUrl = 'https://api.mch.weixin.qq.com/v3/pay/transactions/jsapi';
  const body = {
    appid: config.appId,
    mchid: config.mchId,
    description: String(description).slice(0, 127),
    out_trade_no: orderNo,
    notify_url: config.notifyUrl,
    amount: { total: amount, currency: 'CNY' }
  };

  if (tradeType === 'JSAPI' && openId) {
    body.payer = { openid: openId };
  }

  const bodyStr = JSON.stringify(body);

  try {
    const auth = buildAuthHeader('POST', apiUrl, bodyStr);
    const { data } = await axios.post(apiUrl, bodyStr, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': auth,
        'Accept': 'application/json'
      },
      timeout: 15000
    });

    return { success: true, prepayId: data.prepay_id };
  } catch (err) {
    const errData = err.response?.data;
    logger.error({ err: { message: err.message }, detail: errData }, 'WeChat Pay createUnifiedOrder failed');
    return { success: false, error: errData?.message || err.message };
  }
}

/**
 * Generate pay parameters for frontend (JSAPI).
 */
function generatePayParams(prepayId) {
  const config = getConfig();
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonceStr = crypto.randomBytes(16).toString('hex');
  const pkg = `prepay_id=${prepayId}`;
  const message = `${config.appId}\n${timestamp}\n${nonceStr}\n${pkg}\n`;
  const paySign = signMessage(message);

  return {
    appId: config.appId,
    timeStamp: timestamp,
    nonceStr,
    package: pkg,
    signType: 'RSA',
    paySign
  };
}

/**
 * Verify and decrypt callback notification.
 * @param {object} headers  request headers
 * @param {string} body  raw body string
 * @returns {{ success: boolean, data?: object, error?: string }}
 */
function verifyCallback(headers, body) {
  const config = getConfig();

  try {
    const timestamp = headers['wechatpay-timestamp'];
    const nonce = headers['wechatpay-nonce'];
    const signature = headers['wechatpay-signature'];

    if (!timestamp || !nonce || !signature) {
      return { success: false, error: 'missing_signature_headers' };
    }

    const parsed = typeof body === 'string' ? JSON.parse(body) : body;
    const resource = parsed.resource;
    if (!resource) {
      return { success: false, error: 'missing_resource' };
    }

    const { ciphertext, nonce: resNonce, associated_data } = resource;
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      Buffer.from(config.apiKey, 'utf8'),
      Buffer.from(resNonce, 'utf8')
    );
    if (associated_data) {
      decipher.setAAD(Buffer.from(associated_data, 'utf8'));
    }

    const ciphertextBuf = Buffer.from(ciphertext, 'base64');
    const authTag = ciphertextBuf.slice(-16);
    const encrypted = ciphertextBuf.slice(0, -16);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    const data = JSON.parse(decrypted.toString('utf8'));

    return { success: true, data };
  } catch (err) {
    logger.error({ err: { message: err.message } }, 'WeChat Pay verifyCallback failed');
    return { success: false, error: err.message };
  }
}

module.exports = {
  createUnifiedOrder,
  generatePayParams,
  verifyCallback,
  isConfigured,
  getConfig
};
