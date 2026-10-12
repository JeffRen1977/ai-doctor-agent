/**
 * 微信公众号集成：绑定码、Webhook 绑定、模板消息。
 * 与 telegramIntegrationService 同构。
 */

const crypto = require('crypto');
const axios = require('axios');
const { wechatBindingRepo } = require('../repositories');
const userSettingsService = require('./userSettingsService');
const logger = require('../observability/logger');

const CODE_LEN = 6;
const BIND_TTL_MS = 15 * 60 * 1000;
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

let _accessToken = null;
let _tokenExpiresAt = 0;

function sanitizeUserIdFromEmail(email) {
  if (!email || typeof email !== 'string') return '';
  return email.toLowerCase().replace(/[^a-zA-Z0-9@._-]/g, '_');
}

function randomBindCode() {
  let out = '';
  for (let i = 0; i < CODE_LEN; i++) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return out;
}

function isWeChatConfigured() {
  return !!(process.env.WECHAT_APP_ID && process.env.WECHAT_APP_SECRET);
}

/**
 * SHA1(sort([token, timestamp, nonce])) === signature
 */
function verifySignature(signature, timestamp, nonce) {
  const token = process.env.WECHAT_TOKEN || '';
  const arr = [token, timestamp, nonce].sort();
  const hash = crypto.createHash('sha1').update(arr.join('')).digest('hex');
  return hash === signature;
}

/**
 * Fetch and cache access_token (valid ~7200s, we cache for 7000s).
 */
async function getAccessToken() {
  const now = Date.now();
  if (_accessToken && now < _tokenExpiresAt) {
    return _accessToken;
  }

  const appId = process.env.WECHAT_APP_ID;
  const appSecret = process.env.WECHAT_APP_SECRET;
  if (!appId || !appSecret) {
    throw new Error('WECHAT_APP_ID and WECHAT_APP_SECRET required');
  }

  const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appId}&secret=${appSecret}`;
  const { data } = await axios.get(url, { timeout: 10000 });

  if (data.errcode) {
    throw new Error(`WeChat token error: ${data.errcode} ${data.errmsg}`);
  }

  _accessToken = data.access_token;
  _tokenExpiresAt = now + 7000 * 1000;
  return _accessToken;
}

/**
 * Logged-in user requests a one-time code to send to the WeChat OA.
 */
async function createWeChatBindCode(userEmail) {
  const userId = sanitizeUserIdFromEmail(userEmail);
  if (!userId || !userEmail.includes('@')) {
    return { success: false, error: 'Invalid user email' };
  }

  const code = randomBindCode();
  const expiresAt = new Date(Date.now() + BIND_TTL_MS).toISOString();
  await wechatBindingRepo.putBindingCode(code, { userId, expiresAt });

  return {
    success: true,
    code,
    expiresAt,
    instructionsZh: '请在 15 分钟内，将上方 6 位码发送到微信公众号完成绑定。'
  };
}

/**
 * Process a text message from WeChat OA webhook — try to bind.
 * @param {string} openId  WeChat user's openid
 * @param {string} text    message content
 */
async function bindWeChatUser(openId, text) {
  const raw = String(text || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (raw.length !== CODE_LEN) {
    return { ok: false, reason: 'invalid_code_format' };
  }

  const taken = await wechatBindingRepo.takeBindingCode(raw);
  if (!taken?.userId) {
    return { ok: false, reason: 'invalid_or_expired_code' };
  }

  const existing = await userSettingsService.getUserSettings(taken.userId);
  const integrations = {
    ...(existing.success && existing.settings?.integrations ? existing.settings.integrations : {}),
    wechatOpenId: String(openId)
  };

  const upd = await userSettingsService.updateUserSettings(taken.userId, {
    integrations,
    updatedAt: new Date().toISOString()
  });

  if (!upd.success) {
    return { ok: false, reason: upd.error || 'settings_update_failed' };
  }

  return { ok: true, userId: taken.userId, wechatOpenId: String(openId) };
}

/**
 * Send a template message via WeChat OA.
 * @param {string} openId
 * @param {string} templateId
 * @param {object} data  e.g. { first: { value: '...' }, keyword1: { value: '...' } }
 * @param {string} [url]  optional click URL
 */
async function sendTemplateMessage(openId, templateId, data, url) {
  if (!isWeChatConfigured()) {
    return { sent: false, reason: 'wechat_not_configured' };
  }

  try {
    const token = await getAccessToken();
    const apiUrl = `https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=${token}`;
    const payload = {
      touser: openId,
      template_id: templateId,
      data
    };
    if (url) payload.url = url;

    const { data: result } = await axios.post(apiUrl, payload, { timeout: 10000 });

    if (result.errcode !== 0) {
      logger.error({ errcode: result.errcode, errmsg: result.errmsg }, 'WeChat template send failed');
      return { sent: false, reason: result.errmsg };
    }

    return { sent: true, msgid: result.msgid };
  } catch (err) {
    logger.error({ err: { message: err?.message } }, 'WeChat template send error');
    return { sent: false, reason: err?.message };
  }
}

/**
 * Reply to a user via customer service message (text).
 */
async function sendTextMessage(openId, content) {
  if (!isWeChatConfigured()) {
    return { sent: false, reason: 'wechat_not_configured' };
  }

  try {
    const token = await getAccessToken();
    const apiUrl = `https://api.weixin.qq.com/cgi-bin/message/custom/send?access_token=${token}`;
    await axios.post(apiUrl, {
      touser: openId,
      msgtype: 'text',
      text: { content: String(content).slice(0, 600) }
    }, { timeout: 10000 });
    return { sent: true };
  } catch (err) {
    logger.error({ err: { message: err?.message } }, 'WeChat text send error');
    return { sent: false, reason: err?.message };
  }
}

function _resetTokenCache() {
  _accessToken = null;
  _tokenExpiresAt = 0;
}

module.exports = {
  createWeChatBindCode,
  bindWeChatUser,
  sendTemplateMessage,
  sendTextMessage,
  getAccessToken,
  verifySignature,
  isWeChatConfigured,
  sanitizeUserIdFromEmail,
  _resetTokenCache
};
