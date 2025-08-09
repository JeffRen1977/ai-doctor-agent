const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const geminiService = require('../services/geminiService');
const { authenticateToken } = require('../middleware/auth');
const { doc, setDoc, collection, query, where, orderBy, limit, getDocs } = require('firebase/firestore');
const { db, isMock } = require('../config/firebase');

const router = express.Router();

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
    // 只允许图片文件
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('只允许上传图片文件'), false);
    }
  }
});

// 模拟饮食分析历史存储
const mockDietAnalysisHistory = new Map();

// 保存饮食分析结果到Firebase
async function saveDietAnalysis(userId, analysisData) {
  try {
    if (isMock) {
      // 模拟保存
      if (!mockDietAnalysisHistory.has(userId)) {
        mockDietAnalysisHistory.set(userId, []);
      }
      
      const analysisId = `mock-${Date.now()}`;
      const analysis = {
        id: analysisId,
        userId,
        ...analysisData,
        timestamp: new Date(),
        createdAt: new Date()
      };
      
      mockDietAnalysisHistory.get(userId).push(analysis);
      return analysisId;
    }

    const analysisRef = doc(collection(db, 'dietAnalysis'));
    await setDoc(analysisRef, {
      userId,
      ...analysisData,
      timestamp: new Date(),
      createdAt: new Date()
    });
    return analysisRef.id;
  } catch (error) {
    console.error('保存饮食分析错误:', error);
    throw error;
  }
}

// 获取用户饮食分析历史
async function getDietAnalysisHistory(userId, limit = 20) {
  try {
    if (isMock) {
      // 模拟获取历史
      const history = mockDietAnalysisHistory.get(userId) || [];
      return history.slice(-limit);
    }

    const analysisRef = collection(db, 'dietAnalysis');
    const q = query(
      analysisRef,
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(limit)
    );
    
    const querySnapshot = await getDocs(q);
    const history = [];
    
    querySnapshot.forEach((doc) => {
      history.push({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate()
      });
    });
    
    return history;
  } catch (error) {
    console.error('获取饮食分析历史错误:', error);
    throw error;
  }
}

// 模拟食物识别（实际项目中应该使用真实的AI图像识别服务）
const simulateFoodRecognition = (imagePath) => {
  // 这里应该集成真实的图像识别API
  // 目前使用模拟数据
  const foods = [
    {
      name: '白米饭',
      calories: 130,
      carbs: 28,
      protein: 2.7,
      fat: 0.3,
      fiber: 0.4,
      glycemicIndex: 73,
      servingSize: '100g',
      confidence: 0.95
    },
    {
      name: '蔬菜',
      calories: 25,
      carbs: 5,
      protein: 2,
      fat: 0.2,
      fiber: 3,
      glycemicIndex: 15,
      servingSize: '100g',
      confidence: 0.88
    }
  ];

  return foods;
};

// 分析饮食
router.post('/analyze', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请上传图片' });
    }

    const userId = req.user.id;
    const imagePath = req.file.path;

    // 模拟食物识别
    const recognizedFoods = simulateFoodRecognition(imagePath);

    // 使用Gemini AI进行营养分析
    const aiResult = await geminiService.analyzeDiet(recognizedFoods, {
      userId,
      timestamp: new Date()
    });

    if (!aiResult.success) {
      return res.status(500).json({ error: 'AI分析失败' });
    }

    // 计算营养分析
    const nutritionAnalysis = {
      totalCalories: recognizedFoods.reduce((sum, food) => sum + food.calories, 0),
      totalCarbs: recognizedFoods.reduce((sum, food) => sum + food.carbs, 0),
      totalProtein: recognizedFoods.reduce((sum, food) => sum + food.protein, 0),
      totalFat: recognizedFoods.reduce((sum, food) => sum + food.fat, 0),
      totalFiber: recognizedFoods.reduce((sum, food) => sum + food.fiber, 0),
      averageGlycemicIndex: recognizedFoods.reduce((sum, food) => sum + food.glycemicIndex, 0) / recognizedFoods.length
    };

    // 糖尿病风险评估
    const diabetesRisk = {
      riskLevel: nutritionAnalysis.averageGlycemicIndex > 70 ? 'high' : nutritionAnalysis.averageGlycemicIndex > 55 ? 'medium' : 'low',
      riskScore: Math.min(100, Math.max(0, nutritionAnalysis.averageGlycemicIndex * 1.2)),
      recommendations: aiResult.analysis
    };

    const analysisResult = {
      recognizedFoods,
      nutritionAnalysis,
      diabetesRisk,
      aiAnalysis: aiResult.analysis,
      imagePath: req.file.filename
    };

    // 保存分析结果到Firebase
    await saveDietAnalysis(userId, analysisResult);

    res.json({
      success: true,
      data: analysisResult
    });

  } catch (error) {
    console.error('饮食分析错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 获取饮食分析历史
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const history = await getDietAnalysisHistory(userId);
    
    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('获取饮食分析历史错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 获取食物数据库
router.get('/foods', (req, res) => {
  const foods = [
    {
      name: '白米饭',
      calories: 130,
      carbs: 28,
      protein: 2.7,
      fat: 0.3,
      fiber: 0.4,
      glycemicIndex: 73,
      servingSize: '100g'
    },
    {
      name: '面条',
      calories: 138,
      carbs: 25,
      protein: 4.5,
      fat: 1.1,
      fiber: 1.2,
      glycemicIndex: 55,
      servingSize: '100g'
    },
    {
      name: '蔬菜',
      calories: 25,
      carbs: 5,
      protein: 2,
      fat: 0.2,
      fiber: 3,
      glycemicIndex: 15,
      servingSize: '100g'
    },
    {
      name: '肉类',
      calories: 250,
      carbs: 0,
      protein: 26,
      fat: 15,
      fiber: 0,
      glycemicIndex: 0,
      servingSize: '100g'
    },
    {
      name: '鱼类',
      calories: 120,
      carbs: 0,
      protein: 22,
      fat: 3,
      fiber: 0,
      glycemicIndex: 0,
      servingSize: '100g'
    }
  ];

  res.json({
    success: true,
    data: foods
  });
});

// 获取饮食建议
router.get('/recommendations', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // 使用Gemini AI生成个性化饮食建议
    const aiResult = await geminiService.analyzeDiet([], {
      userId,
      type: 'recommendations'
    });

    if (!aiResult.success) {
      return res.status(500).json({ error: 'AI建议生成失败' });
    }

    res.json({
      success: true,
      data: {
        recommendations: aiResult.analysis,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('获取饮食建议错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

module.exports = router; 