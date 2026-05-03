/**
 * Telegram ↔ doctor-agent：绑定码生成、Webhook 完成绑定、可选回复消息。
 */

const axios = require('axios');
const { telegramBindingRepo } = require('../repositories');
const userSettingsService = require('./userSettingsService');

const CODE_LEN = 6;
const BIND_TTL_MS = 15 * 60 * 1000;
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function sanitizeUserIdFromEmail(email) {
  if (!email || typeof email !== 'string') return '';
  return email.toLowerCase().replace(/[^a-zA-Z0-9@._-]/g, '_');
}

function randomBindCode() {
  let out = '';
  for (let i = 0; i < CODE_LEN; i += 1) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return out;
}

/**
 * Logged-in user requests a one-time code to send to the binding Telegram bot.
 * @param {string} userEmail from JWT
 */
async function createTelegramBindCode(userEmail) {
  const userId = sanitizeUserIdFromEmail(userEmail);
  if (!userId || !userEmail.includes('@')) {
    return { success: false, error: 'Invalid user email' };
  }

  const code = randomBindCode();
  const expiresAt = new Date(Date.now() + BIND_TTL_MS).toISOString();
  await telegramBindingRepo.putBindingCode(code, { userId, expiresAt });

  return {
    success: true,
    code,
    expiresAt,
    instructionsZh:
      '请在 15 分钟内，将上方 6 位码发送到已配置 Webhook 的 Telegram 机器人（与 TELEGRAM_BOT_TOKEN 对应）。绑定成功后可用 Hermes MCP 按 chat_id 拉取个人上下文。'
  };
}

/**
 * @param {string|number} chatId Telegram chat.id
 * @param {string} text message text
 */
async function bindTelegramChat(chatId, text) {
  const raw = String(text || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (raw.length !== CODE_LEN) {
    return { ok: false, reason: 'invalid_code_format' };
  }

  const taken = await telegramBindingRepo.takeBindingCode(raw);
  if (!taken?.userId) {
    return { ok: false, reason: 'invalid_or_expired_code' };
  }

  const existing = await userSettingsService.getUserSettings(taken.userId);
  const integrations = {
    ...(existing.success && existing.settings?.integrations ? existing.settings.integrations : {}),
    telegramChatId: String(chatId)
  };

  const upd = await userSettingsService.updateUserSettings(taken.userId, {
    integrations,
    updatedAt: new Date().toISOString()
  });

  if (!upd.success) {
    return { ok: false, reason: upd.error || 'settings_update_failed' };
  }

  return { ok: true, userId: taken.userId, telegramChatId: String(chatId) };
}

/**
 * Optional reply to user in Telegram (same TELEGRAM_BOT_TOKEN as webhook bot).
 */
async function sendTelegramText(chatId, text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || chatId == null) return { sent: false };
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  await axios.post(
    url,
    {
      chat_id: chatId,
      text: String(text).slice(0, 4096),
      disable_web_page_preview: true
    },
    { timeout: 15000 }
  );
  return { sent: true };
}

module.exports = {
  createTelegramBindCode,
  bindTelegramChat,
  sendTelegramText,
  sanitizeUserIdFromEmail
};
