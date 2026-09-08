const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const userSettingsService = require('../services/userSettingsService');
const consentService = require('../services/consentService');
const { CONSENT_PURPOSES } = require('../models/consent');

const router = express.Router();

/**
 * @route GET /api/user-settings
 * @desc Get user settings
 * @access Private
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await userSettingsService.getUserSettings(req.user.id);
    
    if (result.success) {
      res.json({
        success: true,
        data: result.settings
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to get user settings',
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Get user settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user settings',
      error: error.message
    });
  }
});

/**
 * @route PUT /api/user-settings
 * @desc Update user settings
 * @access Private
 */
router.put('/', authenticateToken, async (req, res) => {
  try {
    const incoming = { ...req.body };
    // dataSharing 历史上未真正生效，也不表示「交给厂商训练」。忽略以免虚假控制。
    if (incoming.privacy && typeof incoming.privacy === 'object') {
      if (typeof incoming.privacy.analytics === 'boolean') {
        await consentService.recordConsent({
          subjectEmail: req.user.email,
          purpose: CONSENT_PURPOSES.ANALYTICS,
          granted: incoming.privacy.analytics,
          source: 'settings'
        });
      }
      delete incoming.privacy.dataSharing;
    }
    const result = await userSettingsService.updateUserSettings(req.user.id, incoming);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'User settings updated successfully',
        data: result.settings
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to update user settings',
        error: result.error
      });
    }
  } catch (error) {
    if (error.code === 'CONSENT_REQUIRED') {
      return res.status(403).json({
        success: false,
        error: error.message,
        code: error.code,
        purpose: error.purpose
      });
    }
    console.error('❌ Update user settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user settings',
      error: error.message
    });
  }
});

/**
 * @route GET /api/user-settings/ai
 * @desc Get user AI settings
 * @access Private
 */
router.get('/ai', authenticateToken, async (req, res) => {
  try {
    const result = await userSettingsService.getUserAISettings(req.user.id);
    
    if (result.success) {
      res.json({
        success: true,
        data: {
          aiProvider: result.aiProvider,
          aiModel: result.aiModel,
          language: result.language
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to get user AI settings',
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Get user AI settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user AI settings',
      error: error.message
    });
  }
});

/**
 * @route PUT /api/user-settings/ai
 * @desc Update user AI settings
 * @access Private
 */
router.put('/ai', authenticateToken, async (req, res) => {
  try {
    const { aiProvider, aiModel, language } = req.body;
    if (consentService.CROSS_BORDER_PROVIDERS.has(String(aiProvider || '').toLowerCase())) {
      await consentService.assertConsent(req.user.email, CONSENT_PURPOSES.CROSS_BORDER);
    }
    const result = await userSettingsService.updateUserAISettings(req.user.id, { aiProvider, aiModel, language });
    
    if (result.success) {
      res.json({
        success: true,
        message: 'User AI settings updated successfully',
        data: {
          aiProvider: result.settings.aiProvider,
          aiModel: result.settings.aiModel,
          language: result.settings.language
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to update user AI settings',
        error: result.error
      });
    }
  } catch (error) {
    if (error.code === 'CONSENT_REQUIRED') {
      return res.status(403).json({
        success: false,
        error: error.message,
        code: error.code,
        purpose: error.purpose
      });
    }
    console.error('❌ Update user AI settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user AI settings',
      error: error.message
    });
  }
});

/**
 * @route POST /api/user-settings/reset
 * @desc Reset user settings to default
 * @access Private
 */
router.post('/reset', authenticateToken, async (req, res) => {
  try {
    const result = await userSettingsService.resetUserSettings(req.user.id);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'User settings reset to default successfully',
        data: result.settings
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to reset user settings',
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Reset user settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset user settings',
      error: error.message
    });
  }
});

module.exports = router;
