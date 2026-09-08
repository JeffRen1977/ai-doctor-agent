const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { requireConsent } = require('../middleware/requireConsent');
const { CONSENT_PURPOSES } = require('../models/consent');
const digitalTwinService = require('../services/digitalTwinService');
const { digitalTwinRepo } = require('../repositories');
const auditService = require('../services/auditService');

const router = express.Router();

const send500 = (res, err) => {
  console.error('❌ Digital twin endpoint error:', err);
  res.status(500).json({ success: false, error: 'Internal server error', details: err.message });
};

/**
 * 构建数字孪生模型
 * POST /api/digital-twin/build
 */
router.post('/build', authenticateToken, requireConsent(CONSENT_PURPOSES.AI_INFERENCE), async (req, res) => {
  try {
    const userEmail = req.user?.email;
    if (!userEmail) return res.status(401).json({ success: false, error: 'User not authenticated' });
    const result = await digitalTwinService.buildDigitalTwin(userEmail);
    if (!result.success) return res.status(500).json({ success: false, error: result.error || 'Failed to build digital twin' });
    res.json({ success: true, message: 'Digital twin built successfully', data: result.digitalTwin });
  } catch (error) {
    send500(res, error);
  }
});

/** GET /api/digital-twin or /api/digital-twin/get */
async function handleGetDigitalTwin(req, res) {
  const userEmail = req.user?.email;
  if (!userEmail) return res.status(401).json({ success: false, error: 'User not authenticated' });
  const data = await digitalTwinRepo.getDigitalTwin(userEmail);
  if (!data) {
    return res.status(404).json({ success: false, error: 'Digital twin not found. Please build it first.', needsBuild: true });
  }
  res.json({ success: true, data });
}
router.get('/', authenticateToken, (req, res) => handleGetDigitalTwin(req, res).catch(err => send500(res, err)));
router.get('/get', authenticateToken, (req, res) => handleGetDigitalTwin(req, res).catch(err => send500(res, err)));

/**
 * 更新数字孪生模型
 * PUT /api/digital-twin/update
 */
router.put('/update', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user?.email;
    if (!userEmail) return res.status(401).json({ success: false, error: 'User not authenticated' });
    const result = await digitalTwinService.updateDigitalTwin(userEmail, req.body);
    if (!result.success) return res.status(500).json({ success: false, error: result.error || 'Failed to update digital twin' });
    res.json({ success: true, message: 'Digital twin updated successfully', data: result.digitalTwin });
  } catch (error) {
    send500(res, error);
  }
});

/**
 * 运行"What-if"模拟
 * POST /api/digital-twin/simulate
 */
router.post('/simulate', authenticateToken, requireConsent(CONSENT_PURPOSES.AI_INFERENCE), async (req, res) => {
  try {
    const userEmail = req.user?.email;
    if (!userEmail) return res.status(401).json({ success: false, error: 'User not authenticated' });
    const { scenario } = req.body;
    if (!scenario) return res.status(400).json({ success: false, error: 'Scenario is required' });
    const result = await digitalTwinService.runSimulation(userEmail, scenario);
    if (!result.success) return res.status(500).json({ success: false, error: result.error || 'Failed to run simulation' });
    res.json({ success: true, message: 'Simulation completed successfully', data: result });
  } catch (error) {
    send500(res, error);
  }
});

/**
 * 并发症风险评估
 * POST /api/digital-twin/assess-risk
 */
router.post('/assess-risk', authenticateToken, requireConsent(CONSENT_PURPOSES.AI_INFERENCE), async (req, res) => {
  try {
    const userEmail = req.user?.email;
    if (!userEmail) return res.status(401).json({ success: false, error: 'User not authenticated' });
    const { condition, timeframe = 12 } = req.body;
    if (!condition) return res.status(400).json({ success: false, error: 'Condition is required' });
    const result = await digitalTwinService.assessComplicationRisk(userEmail, condition, timeframe);
    if (!result.success) return res.status(500).json({ success: false, error: result.error || 'Failed to assess risk' });
    res.json({ success: true, message: 'Risk assessment completed successfully', data: result });
  } catch (error) {
    send500(res, error);
  }
});

/**
 * 健康趋势预测
 * POST /api/digital-twin/project
 */
router.post('/project', authenticateToken, requireConsent(CONSENT_PURPOSES.AI_INFERENCE), async (req, res) => {
  try {
    const userEmail = req.user?.email;
    if (!userEmail) return res.status(401).json({ success: false, error: 'User not authenticated' });
    const timeframe = req.body.timeframe ?? 6;
    const result = await digitalTwinService.generateHealthProjection(userEmail, timeframe);
    if (!result.success) return res.status(500).json({ success: false, error: result.error || 'Failed to generate projection' });
    res.json({ success: true, message: 'Health projection generated successfully', data: result });
  } catch (error) {
    send500(res, error);
  }
});

/** GET /api/digital-twin/health-summary - 从数据库读取健康总结 */
router.get('/health-summary', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, error: 'User not authenticated' });
    const result = await digitalTwinService.getHealthSummary(userId);
    if (!result.success) return res.status(500).json({ success: false, error: result.error || 'Failed to get health summary' });
    res.json({ success: true, data: { summary: result.summary, updatedAt: result.updatedAt } });
  } catch (error) {
    send500(res, error);
  }
});

/** POST /api/digital-twin/health-summary/refresh - 重新生成健康总结并写入数据库 */
router.post('/health-summary/refresh', authenticateToken, requireConsent(CONSENT_PURPOSES.AI_INFERENCE), async (req, res) => {
  try {
    const userEmail = req.user?.email;
    const userId = req.user?.id;
    if (!userEmail || !userId) return res.status(401).json({ success: false, error: 'User not authenticated' });
    const result = await digitalTwinService.refreshHealthSummary(userEmail, userId);
    if (!result.success) return res.status(500).json({ success: false, error: result.error || 'Failed to refresh health summary' });
    res.json({ success: true, data: { summary: result.summary, updatedAt: result.updatedAt } });
  } catch (error) {
    send500(res, error);
  }
});

/**
 * 获取整合的健康数据（用于调试和查看）
 * GET /api/digital-twin/health-data
 */
router.get('/health-data', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user?.email;
    if (!userEmail) return res.status(401).json({ success: false, error: 'User not authenticated' });
    const healthData = await digitalTwinService.aggregateUserHealthData(userEmail);
    await auditService.recordAccessed({
      operation: 'digitalTwin.getHealthData',
      subjectEmail: userEmail,
      resourceType: 'healthAggregate'
    });
    res.json({ success: true, data: healthData });
  } catch (error) {
    send500(res, error);
  }
});

module.exports = router;
