/**
 * 紧急求助API路由
 */

const express = require('express');
const router = express.Router();
const emergencyService = require('../services/emergencyService');
const { authenticateToken } = require('../middleware/auth');

// ========== 紧急联系人管理 ==========

/**
 * POST /api/emergency/contacts
 * 创建紧急联系人
 */
router.post('/contacts', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user?.email;
    if (!userEmail) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const result = await emergencyService.createEmergencyContact(userEmail, req.body);

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.status(201).json({
      success: true,
      message: 'Emergency contact created successfully',
      contact: result.contact
    });
  } catch (error) {
    console.error('❌ Create emergency contact error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create emergency contact.',
      details: error.message 
    });
  }
});

/**
 * GET /api/emergency/contacts
 * 获取用户的所有紧急联系人
 */
router.get('/contacts', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user?.email;
    if (!userEmail) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const result = await emergencyService.getUserEmergencyContacts(userEmail);

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json({
      success: true,
      contacts: result.contacts
    });
  } catch (error) {
    console.error('❌ Get emergency contacts error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get emergency contacts.',
      details: error.message 
    });
  }
});

/**
 * GET /api/emergency/contacts/:contactId
 * 获取单个紧急联系人
 */
router.get('/contacts/:contactId', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user?.email;
    if (!userEmail) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { contactId } = req.params;

    const result = await emergencyService.getEmergencyContact(contactId);

    if (!result.success) {
      return res.status(404).json({ error: result.error });
    }

    // 验证联系人属于当前用户
    if (result.contact.userEmail !== userEmail) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      success: true,
      contact: result.contact
    });
  } catch (error) {
    console.error('❌ Get emergency contact error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get emergency contact.',
      details: error.message 
    });
  }
});

/**
 * PUT /api/emergency/contacts/:contactId
 * 更新紧急联系人
 */
router.put('/contacts/:contactId', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user?.email;
    if (!userEmail) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { contactId } = req.params;

    // 验证联系人属于当前用户
    const contactResult = await emergencyService.getEmergencyContact(contactId);
    if (!contactResult.success || contactResult.contact.userEmail !== userEmail) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await emergencyService.updateEmergencyContact(contactId, req.body);

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json({
      success: true,
      message: 'Emergency contact updated successfully',
      contactId: result.contactId
    });
  } catch (error) {
    console.error('❌ Update emergency contact error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update emergency contact.',
      details: error.message 
    });
  }
});

/**
 * DELETE /api/emergency/contacts/:contactId
 * 删除紧急联系人
 */
router.delete('/contacts/:contactId', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user?.email;
    if (!userEmail) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { contactId } = req.params;

    // 验证联系人属于当前用户
    const contactResult = await emergencyService.getEmergencyContact(contactId);
    if (!contactResult.success || contactResult.contact.userEmail !== userEmail) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await emergencyService.deleteEmergencyContact(contactId);

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json({
      success: true,
      message: 'Emergency contact deleted successfully'
    });
  } catch (error) {
    console.error('❌ Delete emergency contact error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete emergency contact.',
      details: error.message 
    });
  }
});

// ========== 紧急警报 ==========

/**
 * POST /api/emergency/alert
 * 触发紧急警报
 */
router.post('/alert', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user?.email;
    if (!userEmail) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { eventType, location, message, details, severity } = req.body;

    if (!eventType) {
      return res.status(400).json({ error: 'eventType is required' });
    }

    const result = await emergencyService.triggerEmergencyAlert(userEmail, eventType, {
      location,
      message,
      details,
      severity
    });

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.status(201).json({
      success: true,
      message: 'Emergency alert triggered successfully',
      alert: result.alert
    });
  } catch (error) {
    console.error('❌ Trigger emergency alert error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to trigger emergency alert.',
      details: error.message 
    });
  }
});

/**
 * GET /api/emergency/alerts
 * 获取用户的紧急警报历史
 */
router.get('/alerts', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user?.email;
    if (!userEmail) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { status, severity, limit } = req.query;
    const filters = {};
    if (status) filters.status = status;
    if (severity) filters.severity = severity;
    if (limit) filters.limit = parseInt(limit);

    const result = await emergencyService.getUserEmergencyAlerts(userEmail, filters);

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json({
      success: true,
      alerts: result.alerts
    });
  } catch (error) {
    console.error('❌ Get emergency alerts error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get emergency alerts.',
      details: error.message 
    });
  }
});

/**
 * PUT /api/emergency/alerts/:alertId
 * 更新紧急警报状态
 */
router.put('/alerts/:alertId', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user?.email;
    if (!userEmail) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { alertId } = req.params;

    // 验证警报属于当前用户
    const alertsResult = await emergencyService.getUserEmergencyAlerts(userEmail, { limit: 1000 });
    const alert = alertsResult.alerts?.find(a => a.alertId === alertId);
    if (!alert) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await emergencyService.updateEmergencyAlert(alertId, req.body);

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json({
      success: true,
      message: 'Emergency alert updated successfully',
      alertId: result.alertId
    });
  } catch (error) {
    console.error('❌ Update emergency alert error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update emergency alert.',
      details: error.message 
    });
  }
});

// ========== 紧急消息 ==========

/**
 * POST /api/emergency/message
 * 发送紧急消息
 */
router.post('/message', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user?.email;
    if (!userEmail) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const result = await emergencyService.sendEmergencyMessage(userEmail, req.body);

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json({
      success: true,
      message: result.message,
      contactsNotified: result.contactsNotified
    });
  } catch (error) {
    console.error('❌ Send emergency message error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to send emergency message.',
      details: error.message 
    });
  }
});

module.exports = router;
