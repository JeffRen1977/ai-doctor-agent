const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { requireConsent } = require('../middleware/requireConsent');
const { CONSENT_PURPOSES } = require('../models/consent');
const riskMonitoringService = require('../services/riskMonitoringService');
const { riskAlertRepo } = require('../repositories');

/**
 * POST /api/risk-monitoring/process-stream
 * 处理实时流数据
 */
router.post('/process-stream', authenticateToken, requireConsent(CONSENT_PURPOSES.AI_INFERENCE), async (req, res) => {
  try {
    const userEmail = req.user?.email;
    if (!userEmail) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { deviceType, data } = req.body;
    
    if (!deviceType || !data) {
      return res.status(400).json({ error: 'deviceType and data are required' });
    }

    const result = await riskMonitoringService.processStreamData(userEmail, deviceType, data);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    console.error('Process stream data error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process stream data',
      details: error.message
    });
  }
});

/**
 * POST /api/risk-monitoring/detect-anomalies
 * 异常检测。支持可选时间窗口与设备类型过滤。
 */
router.post('/detect-anomalies', authenticateToken, requireConsent(CONSENT_PURPOSES.AI_INFERENCE), async (req, res) => {
  try {
    const userEmail = req.user?.email;
    if (!userEmail) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { dataStream, timeRange, deviceType } = req.body || {};
    const options = {};
    if (timeRange && ['1h', '6h', '24h'].includes(timeRange)) options.timeRange = timeRange;
    if (deviceType && typeof deviceType === 'string') options.deviceType = deviceType;

    const result = await riskMonitoringService.detectAnomalies(userEmail, dataStream || [], options);

    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Detect anomalies error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to detect anomalies',
      details: error.message
    });
  }
});

/**
 * POST /api/risk-monitoring/predict-hypoglycemia
 * 血糖预测
 */
router.post('/predict-hypoglycemia', authenticateToken, requireConsent(CONSENT_PURPOSES.AI_INFERENCE), async (req, res) => {
  try {
    const userEmail = req.user?.email;
    if (!userEmail) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { glucoseData } = req.body;
    
    if (!glucoseData || !Array.isArray(glucoseData)) {
      return res.status(400).json({ error: 'glucoseData array is required' });
    }

    const result = await riskMonitoringService.predictHypoglycemia(userEmail, glucoseData);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Predict hypoglycemia error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to predict hypoglycemia',
      details: error.message
    });
  }
});

/**
 * POST /api/risk-monitoring/analyze-hrv
 * 心率变异性分析
 */
router.post('/analyze-hrv', authenticateToken, requireConsent(CONSENT_PURPOSES.AI_INFERENCE), async (req, res) => {
  try {
    const userEmail = req.user?.email;
    if (!userEmail) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { heartRateData } = req.body;
    
    if (!heartRateData || !Array.isArray(heartRateData)) {
      return res.status(400).json({ error: 'heartRateData array is required' });
    }

    const result = await riskMonitoringService.analyzeHRVTrend(userEmail, heartRateData);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Analyze HRV error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze HRV trend',
      details: error.message
    });
  }
});

/**
 * GET /api/risk-monitoring/status
 * 获取实时监测状态
 */
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user?.email;
    if (!userEmail) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const result = await riskMonitoringService.getMonitoringStatus(userEmail);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Get monitoring status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get monitoring status',
      details: error.message
    });
  }
});

/**
 * GET /api/risk-monitoring/alerts
 * 获取最近的预警
 */
router.get('/alerts', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user?.email;
    if (!userEmail) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const limitCount = parseInt(req.query.limit) || 20;
    const alerts = await riskMonitoringService.getRecentAlerts(userEmail, limitCount);
    
    res.status(200).json({
      success: true,
      alerts: alerts
    });
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get alerts',
      details: error.message
    });
  }
});

/**
 * POST /api/risk-monitoring/alerts/:alertId/acknowledge
 * 确认预警
 */
router.post('/alerts/:alertId/acknowledge', authenticateToken, async (req, res) => {
  try {
    if (!req.user?.email) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const { alertId } = req.params;
    await riskAlertRepo.acknowledgeAlert(alertId, {
      acknowledged: true,
      acknowledgedAt: new Date().toISOString()
    });
    res.status(200).json({ success: true, message: 'Alert acknowledged' });
  } catch (error) {
    console.error('Acknowledge alert error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to acknowledge alert',
      details: error.message
    });
  }
});

module.exports = router;
