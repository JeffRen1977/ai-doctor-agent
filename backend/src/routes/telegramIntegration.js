/**
 * Authenticated API: Telegram binding (scheme B).
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const telegramIntegrationService = require('../services/telegramIntegrationService');

/**
 * POST /api/integrations/telegram/bind-code
 * Returns a 6-char code; user sends it to the Telegram bot that hits /internal/telegram/webhook.
 */
router.post('/bind-code', authenticateToken, async (req, res) => {
  try {
    const email = req.user?.email;
    if (!email) {
      return res.status(401).json({ success: false, error: 'No email on session' });
    }
    const result = await telegramIntegrationService.createTelegramBindCode(email);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.status(200).json(result);
  } catch (error) {
    console.error('telegram bind-code:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
