const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const userSettingsService = require('../services/userSettingsService');

const router = express.Router();

/**
 * @route GET /api/user-settings
 * @desc Get user settings
 * @access Private
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    console.log('🔧 Getting user settings for:', userId);
    
    const result = await userSettingsService.getUserSettings(userId);
    
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
    const userId = req.user.id;
    const settings = req.body;
    
    console.log('🔧 Updating user settings for:', userId);
    console.log('📝 Settings to update:', settings);
    
    const result = await userSettingsService.updateUserSettings(userId, settings);
    
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
    const userId = req.user.id;
    
    console.log('🤖 Getting user AI settings for:', userId);
    
    const result = await userSettingsService.getUserAISettings(userId);
    
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
    const userId = req.user.id;
    const { aiProvider, aiModel } = req.body;
    
    console.log('🤖 Updating user AI settings for:', userId);
    console.log('📝 AI settings to update:', { aiProvider, aiModel });
    
    const result = await userSettingsService.updateUserAISettings(userId, {
      aiProvider,
      aiModel
    });
    
    if (result.success) {
      res.json({
        success: true,
        message: 'User AI settings updated successfully',
        data: {
          aiProvider: result.settings.aiProvider,
          aiModel: result.settings.aiModel
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
    const userId = req.user.id;
    
    console.log('🔄 Resetting user settings for:', userId);
    
    const result = await userSettingsService.resetUserSettings(userId);
    
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
