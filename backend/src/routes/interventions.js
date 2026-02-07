/**
 * 干预历史API路由
 */

const express = require('express');
const router = express.Router();
const firebaseService = require('../services/firebaseService');
const { authenticateToken } = require('../middleware/auth');
const { createInterventionHistory } = require('../models/healthRecordModels');

/**
 * POST /api/interventions
 * 添加干预历史记录
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user?.email;
    if (!userEmail) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const interventionData = createInterventionHistory(req.body);

    const result = await firebaseService.addInterventionHistory(
      userEmail,
      interventionData
    );

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.status(201).json({
      success: true,
      message: 'Intervention history added successfully',
      interventionId: result.interventionId
    });
  } catch (error) {
    console.error('❌ Add intervention history error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to add intervention history.',
      details: error.message 
    });
  }
});

/**
 * PUT /api/interventions/:interventionId
 * 更新干预历史记录
 */
router.put('/:interventionId', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user?.email;
    if (!userEmail) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { interventionId } = req.params;
    const updates = req.body;

    const result = await firebaseService.updateInterventionHistory(
      userEmail,
      interventionId,
      updates
    );

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json({
      success: true,
      message: 'Intervention history updated successfully',
      interventionId: result.interventionId
    });
  } catch (error) {
    console.error('❌ Update intervention history error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update intervention history.',
      details: error.message 
    });
  }
});

/**
 * GET /api/interventions
 * 获取干预历史列表
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user?.email;
    if (!userEmail) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { status } = req.query;

    const result = await firebaseService.getInterventionHistory(
      userEmail,
      status || null
    );

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('❌ Get intervention history error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get intervention history.',
      details: error.message 
    });
  }
});

module.exports = router;
