/**
 * Telegram Bot webhook (no JWT). Verify TELEGRAM_WEBHOOK_SECRET header when set.
 */

const express = require('express');
const router = express.Router();
const telegramIntegrationService = require('../services/telegramIntegrationService');

function verifyTelegramWebhook(req, res, next) {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET || '';
  if (!expected) {
    return next();
  }
  const got = req.headers['x-telegram-bot-api-secret-token'] || '';
  if (got !== expected) {
    return res.status(403).json({ ok: false, error: 'Invalid webhook secret' });
  }
  return next();
}

function pickTelegramMessage(body) {
  if (!body || typeof body !== 'object') return null;
  return body.message || body.channel_post || body.edited_message || null;
}

router.post('/webhook', verifyTelegramWebhook, async (req, res) => {
  try {
    const msg = pickTelegramMessage(req.body);
    const chatId = msg?.chat?.id;
    const text = msg?.text || msg?.caption || '';

    if (chatId == null) {
      const keys = req.body && typeof req.body === 'object' ? Object.keys(req.body).join(',') : '';
      console.warn('telegram webhook: no chat id (expected message/channel_post/edited_message). body keys:', keys);
      return res.sendStatus(200);
    }

    const bind = await telegramIntegrationService.bindTelegramChat(chatId, text);

    if (bind.ok) {
      await telegramIntegrationService
        .sendTelegramText(chatId, '绑定成功：已关联您的健康档案。您可以在 Hermes 中使用个人化健康对话。')
        .catch((err) => {
          console.error('telegram webhook send (success):', err.message);
        });
    } else if (String(text || '').trim()) {
      await telegramIntegrationService
        .sendTelegramText(
          chatId,
          '请先在 App 内获取 6 位绑定码，再将绑定码单独发给我；或检查码是否过期。'
        )
        .catch((err) => {
          console.error('telegram webhook send (hint):', err.message);
        });
    }

    return res.sendStatus(200);
  } catch (error) {
    console.error('telegram webhook:', error.message);
    return res.sendStatus(200);
  }
});

module.exports = router;
