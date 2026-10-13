const express = require('express');
const Joi = require('joi');
const { authenticateToken } = require('../middleware/auth');
const pushNotificationService = require('../services/pushNotificationService');

const router = express.Router();

const registerSchema = Joi.object({
  token: Joi.string().min(1).max(4096).required(),
  vendor: Joi.string().valid('huawei', 'xiaomi', 'oppo', 'vivo', 'unknown').optional(),
  model: Joi.string().max(200).optional(),
  osVersion: Joi.string().max(50).optional()
});

const testPushSchema = Joi.object({
  title: Joi.string().max(200).optional(),
  body: Joi.string().max(500).optional()
});

router.post('/register-device', authenticateToken, async (req, res) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, error: error.details[0].message });
    }

    const userId = req.user?.email || req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const vendor = value.vendor || pushNotificationService.detectVendor(req.headers['user-agent']);

    const { deviceTokenRepo } = require('../repositories');
    await deviceTokenRepo.registerDevice(userId, {
      token: value.token,
      vendor,
      model: value.model || '',
      osVersion: value.osVersion || ''
    });

    res.json({ success: true, vendor });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/unregister-device', authenticateToken, async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, error: 'token required' });
    }
    const { deviceTokenRepo } = require('../repositories');
    await deviceTokenRepo.removeDevice(token);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/test-push', authenticateToken, async (req, res) => {
  try {
    const { error, value } = testPushSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, error: error.details[0].message });
    }

    const userId = req.user?.email || req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const result = await pushNotificationService.sendPush(userId, {
      title: value.title || 'AI医生测试推送',
      body: value.body || '推送通知配置成功！'
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/devices', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.email || req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }
    const { deviceTokenRepo } = require('../repositories');
    const devices = await deviceTokenRepo.getDevicesByUserId(userId);
    res.json({ success: true, devices });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
