/**
 * Authenticated API: WeChat OA binding.
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const wechatIntegrationService = require('../services/wechatIntegrationService');

router.post('/bind-code', authenticateToken, async (req, res) => {
  try {
    const email = req.user?.email;
    if (!email) {
      return res.status(401).json({ success: false, error: 'No email on session' });
    }
    const result = await wechatIntegrationService.createWeChatBindCode(email);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.status(200).json(result);
  } catch (error) {
    console.error('wechat bind-code:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
