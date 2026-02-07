const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const interventionEngineService = require('../services/interventionEngineService');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 配置文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB限制
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

/**
 * GET /api/intervention/medication
 * 获取用药管理数据
 */
router.get('/medication', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user?.email;
    if (!userEmail) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const result = await interventionEngineService.manageMedication(userEmail);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Get medication management error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get medication management',
      details: error.message
    });
  }
});

/**
 * POST /api/intervention/medication/effectiveness
 * 分析药效
 */
router.post('/medication/effectiveness', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user?.email;
    if (!userEmail) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { medication, timeframe } = req.body;
    
    if (!medication || !timeframe) {
      return res.status(400).json({ error: 'medication and timeframe are required' });
    }

    const result = await interventionEngineService.analyzeMedicationEffectiveness(
      userEmail,
      medication,
      timeframe
    );
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Analyze medication effectiveness error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze medication effectiveness',
      details: error.message
    });
  }
});

/**
 * POST /api/intervention/nutrition
 * 动态营养分析（使用饮食分析API的逻辑）
 */
router.post('/nutrition', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const userEmail = req.user?.email;
    if (!userEmail) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Please upload an image' });
    }

    const imagePath = req.file.path;
    const currentMetrics = req.body.currentMetrics ? JSON.parse(req.body.currentMetrics) : {};

    // 使用干预引擎服务进行营养分析
    const result = await interventionEngineService.generateNutritionAdvice(
      userEmail,
      imagePath,
      currentMetrics
    );
    
    // 清理临时文件
    try {
      fs.unlinkSync(imagePath);
    } catch (unlinkError) {
      console.warn('Failed to delete temporary file:', unlinkError);
    }
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Nutrition analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze nutrition',
      details: error.message
    });
  }
});

/**
 * POST /api/intervention/exercise
 * 生成个性化运动计划
 */
router.post('/exercise', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user?.email;
    if (!userEmail) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { healthState } = req.body;
    
    const result = await interventionEngineService.generateExercisePlan(
      userEmail,
      healthState || {}
    );
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Generate exercise plan error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate exercise plan',
      details: error.message
    });
  }
});

/**
 * POST /api/intervention/adjust
 * 动态调整干预方案
 */
router.post('/adjust', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user?.email;
    if (!userEmail) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { feedback } = req.body;
    
    if (!feedback) {
      return res.status(400).json({ error: 'feedback is required' });
    }

    const result = await interventionEngineService.adjustIntervention(
      userEmail,
      feedback
    );
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Adjust intervention error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to adjust intervention',
      details: error.message
    });
  }
});

/**
 * POST /api/intervention/medication/add
 * 添加或更新用药记录
 */
router.post('/medication/add', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user?.email;
    if (!userEmail) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { medication } = req.body;
    
    if (!medication) {
      return res.status(400).json({ error: 'medication is required' });
    }

    const result = await interventionEngineService.addOrUpdateMedication(
      userEmail,
      medication
    );
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Add/update medication error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add/update medication',
      details: error.message
    });
  }
});

/**
 * POST /api/intervention/medication/record
 * 记录用药历史（标记为已服用/未服用）
 */
router.post('/medication/record', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user?.email;
    if (!userEmail) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { medicationId, date, time, status, notes } = req.body;
    
    if (!medicationId || !date || !time || !status) {
      return res.status(400).json({ 
        error: 'medicationId, date, time, and status are required' 
      });
    }

    if (!['taken', 'missed'].includes(status)) {
      return res.status(400).json({ 
        error: 'status must be "taken" or "missed"' 
      });
    }

    const result = await interventionEngineService.recordMedicationHistory(
      userEmail,
      medicationId,
      date,
      time,
      status,
      notes
    );
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Record medication history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record medication history',
      details: error.message
    });
  }
});

/**
 * POST /api/intervention/init
 * 初始化或确保干预方案数据结构完整
 */
router.post('/init', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user?.email;
    if (!userEmail) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const result = await interventionEngineService.ensureInterventionStructure(userEmail);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Initialize intervention structure error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initialize intervention structure',
      details: error.message
    });
  }
});

module.exports = router;
