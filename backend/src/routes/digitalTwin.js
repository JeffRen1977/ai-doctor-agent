const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const digitalTwinService = require('../services/digitalTwinService');
const { digitalTwinRepo } = require('../repositories');

const router = express.Router();

async function getDigitalTwinDoc(userEmail) {
  return await digitalTwinRepo.getDigitalTwin(userEmail);
}

/**
 * 构建数字孪生模型
 * POST /api/digital-twin/build
 */
router.post('/build', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user?.email;
    
    if (!userEmail) {
      return res.status(401).json({ 
        success: false,
        error: 'User not authenticated' 
      });
    }

    console.log(`🏗️ Building digital twin for user: ${userEmail}`);
    
    const result = await digitalTwinService.buildDigitalTwin(userEmail);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || 'Failed to build digital twin'
      });
    }

    res.json({
      success: true,
      message: 'Digital twin built successfully',
      data: result.digitalTwin
    });
  } catch (error) {
    console.error('❌ Error in build digital twin endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

/**
 * 获取数字孪生模型
 * GET /api/digital-twin/get 或 GET /api/digital-twin
 */
async function handleGetDigitalTwin(req, res) {
  const userEmail = req.user?.email;
  if (!userEmail) {
    return res.status(401).json({ success: false, error: 'User not authenticated' });
  }
  const data = await getDigitalTwinDoc(userEmail);
  if (!data) {
    return res.status(404).json({
      success: false,
      error: 'Digital twin not found. Please build it first.',
      needsBuild: true
    });
  }
  res.json({ success: true, data });
}

router.get('/', authenticateToken, (req, res) => {
  handleGetDigitalTwin(req, res).catch((err) => {
    console.error('❌ Error in get digital twin endpoint:', err);
    res.status(500).json({ success: false, error: 'Internal server error', details: err.message });
  });
});

router.get('/get', authenticateToken, (req, res) => {
  handleGetDigitalTwin(req, res).catch((err) => {
    console.error('❌ Error in get digital twin endpoint:', err);
    res.status(500).json({ success: false, error: 'Internal server error', details: err.message });
  });
});

/**
 * 更新数字孪生模型
 * PUT /api/digital-twin/update
 */
router.put('/update', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user?.email;
    const newData = req.body;
    
    if (!userEmail) {
      return res.status(401).json({ 
        success: false,
        error: 'User not authenticated' 
      });
    }

    console.log(`🔄 Updating digital twin for user: ${userEmail}`);
    
    const result = await digitalTwinService.updateDigitalTwin(userEmail, newData);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || 'Failed to update digital twin'
      });
    }

    res.json({
      success: true,
      message: 'Digital twin updated successfully',
      data: result.digitalTwin
    });
  } catch (error) {
    console.error('❌ Error in update digital twin endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

/**
 * 运行"What-if"模拟
 * POST /api/digital-twin/simulate
 */
router.post('/simulate', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user?.email;
    const { scenario } = req.body;
    
    if (!userEmail) {
      return res.status(401).json({ 
        success: false,
        error: 'User not authenticated' 
      });
    }

    if (!scenario) {
      return res.status(400).json({
        success: false,
        error: 'Scenario is required'
      });
    }

    console.log(`🎮 Running simulation for user: ${userEmail}`);
    console.log('📋 Scenario:', scenario);
    
    const result = await digitalTwinService.runSimulation(userEmail, scenario);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || 'Failed to run simulation'
      });
    }

    res.json({
      success: true,
      message: 'Simulation completed successfully',
      data: result
    });
  } catch (error) {
    console.error('❌ Error in simulate endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

/**
 * 并发症风险评估
 * POST /api/digital-twin/assess-risk
 */
router.post('/assess-risk', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user?.email;
    const { condition, timeframe } = req.body;
    
    if (!userEmail) {
      return res.status(401).json({ 
        success: false,
        error: 'User not authenticated' 
      });
    }

    if (!condition) {
      return res.status(400).json({
        success: false,
        error: 'Condition is required'
      });
    }

    const assessmentTimeframe = timeframe || 12; // 默认12个月
    
    console.log(`⚠️ Assessing risk for user: ${userEmail}`);
    console.log(`🔍 Condition: ${condition}, Timeframe: ${assessmentTimeframe} months`);
    
    const result = await digitalTwinService.assessComplicationRisk(
      userEmail, 
      condition, 
      assessmentTimeframe
    );
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || 'Failed to assess risk'
      });
    }

    res.json({
      success: true,
      message: 'Risk assessment completed successfully',
      data: result
    });
  } catch (error) {
    console.error('❌ Error in assess-risk endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

/**
 * 健康趋势预测
 * POST /api/digital-twin/project
 */
router.post('/project', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user?.email;
    const { timeframe } = req.body;
    
    if (!userEmail) {
      return res.status(401).json({ 
        success: false,
        error: 'User not authenticated' 
      });
    }

    const projectionTimeframe = timeframe || 6; // 默认6个月
    
    console.log(`📈 Generating projection for user: ${userEmail}`);
    console.log(`⏱️ Timeframe: ${projectionTimeframe} months`);
    
    const result = await digitalTwinService.generateHealthProjection(
      userEmail, 
      projectionTimeframe
    );
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || 'Failed to generate projection'
      });
    }

    res.json({
      success: true,
      message: 'Health projection generated successfully',
      data: result
    });
  } catch (error) {
    console.error('❌ Error in project endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

/**
 * 获取整合的健康数据（用于调试和查看）
 * GET /api/digital-twin/health-data
 */
router.get('/health-data', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user?.email;
    
    if (!userEmail) {
      return res.status(401).json({ 
        success: false,
        error: 'User not authenticated' 
      });
    }

    const healthData = await digitalTwinService.aggregateUserHealthData(userEmail);
    
    res.json({
      success: true,
      data: healthData
    });
  } catch (error) {
    console.error('❌ Error in get health-data endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

module.exports = router;
