const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const digitalTwinService = require('../services/digitalTwinService');
const { digitalTwinRepo } = require('../repositories');

const router = express.Router();

const send500 = (res, err) => {
  console.error('❌ Digital twin endpoint error:', err);
  res.status(500).json({ success: false, error: 'Internal server error', details: err.message });
};

/**
 * 构建数字孪生模型
 * POST /api/digital-twin/build
 */
router.post('/build', authenticateToken, async (req, res) => {
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
router.post('/simulate', authenticateToken, async (req, res) => {
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
router.post('/assess-risk', authenticateToken, async (req, res) => {
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
router.post('/project', authenticateToken, async (req, res) => {
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

/**
 * 获取整合的健康数据（用于调试和查看）
 * GET /api/digital-twin/health-data
 */
router.get('/health-data', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user?.email;
    if (!userEmail) return res.status(401).json({ success: false, error: 'User not authenticated' });
    const healthData = await digitalTwinService.aggregateUserHealthData(userEmail);
    res.json({ success: true, data: healthData });
  } catch (error) {
    send500(res, error);
  }
});

module.exports = router;
