/**
 * 时间序列数据API路由
 */

const express = require('express');
const router = express.Router();
const firebaseService = require('../services/firebaseService');
const { authenticateToken } = require('../middleware/auth');
const { requireConsent } = require('../middleware/requireConsent');
const { CONSENT_PURPOSES } = require('../models/consent');

/**
 * POST /api/time-series/data-point
 * 添加时间序列数据点
 */
router.post('/data-point', authenticateToken, requireConsent(CONSENT_PURPOSES.HEALTH_STORAGE), async (req, res) => {
  try {
    const userEmail = req.user?.email;
    if (!userEmail) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { metric, unit, dataPoint } = req.body;

    if (!metric || !unit || !dataPoint || dataPoint.value === undefined) {
      return res.status(400).json({ 
        error: 'Missing required fields: metric, unit, dataPoint.value' 
      });
    }

    const result = await firebaseService.addTimeSeriesDataPoint(
      userEmail,
      metric,
      unit,
      dataPoint
    );

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.status(201).json({
      success: true,
      message: 'Time series data point added successfully',
      metric: result.metric
    });
  } catch (error) {
    console.error('❌ Add time series data point error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to add time series data point.',
      details: error.message 
    });
  }
});

/**
 * GET /api/time-series/data
 * 获取时间序列数据
 */
router.get('/data', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user?.email;
    if (!userEmail) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { metric, startDate, endDate } = req.query;

    const result = await firebaseService.getTimeSeriesData(
      userEmail,
      metric || null,
      startDate || null,
      endDate || null
    );

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('❌ Get time series data error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get time series data.',
      details: error.message 
    });
  }
});

module.exports = router;
