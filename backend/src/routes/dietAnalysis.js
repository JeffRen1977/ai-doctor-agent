const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
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

// 食物数据库
const foodDatabase = {
  'rice': {
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
  'noodles': {
    name: '面条',
    calories: 138,
    carbs: 25,
    protein: 4.5,
    fat: 1.1,
    fiber: 1.2,
    glycemicIndex: 55,
    servingSize: '100g',
    confidence: 0.92
  },
  'vegetables': {
    name: '蔬菜',
    calories: 25,
    carbs: 5,
    protein: 2,
    fat: 0.2,
    fiber: 3,
    glycemicIndex: 15,
    servingSize: '100g',
    confidence: 0.88
  },
  'meat': {
    name: '肉类',
    calories: 250,
    carbs: 0,
    protein: 26,
    fat: 15,
    fiber: 0,
    glycemicIndex: 0,
    servingSize: '100g',
    confidence: 0.90
  },
  'fish': {
    name: '鱼类',
    calories: 120,
    carbs: 0,
    protein: 22,
    fat: 3,
    fiber: 0,
    glycemicIndex: 0,
    servingSize: '100g',
    confidence: 0.87
  },
  'bread': {
    name: '面包',
    calories: 265,
    carbs: 49,
    protein: 9,
    fat: 3.2,
    fiber: 2.7,
    glycemicIndex: 70,
    servingSize: '100g',
    confidence: 0.93
  },
  'fruit': {
    name: '水果',
    calories: 60,
    carbs: 15,
    protein: 0.5,
    fat: 0.2,
    fiber: 2.5,
    glycemicIndex: 40,
    servingSize: '100g',
    confidence: 0.85
  },
  'eggs': {
    name: '鸡蛋',
    calories: 155,
    carbs: 1.1,
    protein: 13,
    fat: 11,
    fiber: 0,
    glycemicIndex: 0,
    servingSize: '100g',
    confidence: 0.89
  },
  'milk': {
    name: '牛奶',
    calories: 42,
    carbs: 5,
    protein: 3.4,
    fat: 1,
    fiber: 0,
    glycemicIndex: 30,
    servingSize: '100ml',
    confidence: 0.86
  },
  'tofu': {
    name: '豆腐',
    calories: 76,
    carbs: 1.9,
    protein: 8,
    fat: 4.8,
    fiber: 0.3,
    glycemicIndex: 15,
    servingSize: '100g',
    confidence: 0.84
  }
};

// 模拟AI食物识别
const simulateFoodRecognition = (imagePath) => {
  // 这里应该集成真实的AI模型，如Google Vision API, Azure Computer Vision等
  // 目前使用模拟数据
  const possibleFoods = Object.keys(foodDatabase);
  const numFoods = Math.floor(Math.random() * 3) + 1; // 1-3种食物
  const recognizedFoods = [];
  
  for (let i = 0; i < numFoods; i++) {
    const randomFood = possibleFoods[Math.floor(Math.random() * possibleFoods.length)];
    if (!recognizedFoods.find(food => food.name === foodDatabase[randomFood].name)) {
      recognizedFoods.push(foodDatabase[randomFood]);
    }
  }
  
  return recognizedFoods;
};

// 计算营养分析
const calculateNutritionAnalysis = (recognizedFoods) => {
  const totalCalories = recognizedFoods.reduce((sum, food) => sum + food.calories, 0);
  const totalCarbs = recognizedFoods.reduce((sum, food) => sum + food.carbs, 0);
  const totalProtein = recognizedFoods.reduce((sum, food) => sum + food.protein, 0);
  const totalFat = recognizedFoods.reduce((sum, food) => sum + food.fat, 0);
  const totalFiber = recognizedFoods.reduce((sum, food) => sum + food.fiber, 0);
  const averageGlycemicIndex = recognizedFoods.reduce((sum, food) => sum + food.glycemicIndex, 0) / recognizedFoods.length;

  // 评估血糖影响
  let estimatedBloodSugarImpact = '';
  let diabetesRisk = 'low';
  let recommendations = [];

  if (averageGlycemicIndex > 70) {
    estimatedBloodSugarImpact = '高 - 可能导致血糖快速上升';
    diabetesRisk = 'high';
    recommendations = [
      '建议减少高升糖指数食物的摄入',
      '可以搭配富含纤维的蔬菜',
      '餐后建议适量运动',
      '考虑分餐进食'
    ];
  } else if (averageGlycemicIndex > 55) {
    estimatedBloodSugarImpact = '中等 - 血糖上升适中';
    diabetesRisk = 'medium';
    recommendations = [
      '注意控制总碳水化合物摄入',
      '建议搭配蛋白质食物',
      '餐后监测血糖水平'
    ];
  } else {
    estimatedBloodSugarImpact = '低 - 对血糖影响较小';
    diabetesRisk = 'low';
    recommendations = [
      '这是糖尿病友好的饮食选择',
      '继续保持健康的饮食习惯',
      '建议定期监测血糖'
    ];
  }

  return {
    totalCalories,
    totalCarbs,
    totalProtein,
    totalFat,
    totalFiber,
    averageGlycemicIndex: Math.round(averageGlycemicIndex),
    estimatedBloodSugarImpact,
    recommendations,
    diabetesRisk
  };
};

// 上传图片并分析饮食
router.post('/analyze', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: '请上传图片文件' 
      });
    }

    // 模拟AI分析过程
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 模拟食物识别
    const recognizedFoods = simulateFoodRecognition(req.file.path);

    // 计算营养分析
    const analysis = calculateNutritionAnalysis(recognizedFoods);

    // 清理上传的文件
    fs.unlink(req.file.path, (err) => {
      if (err) console.error('删除文件失败:', err);
    });

    res.json({
      success: true,
      data: {
        recognizedFoods,
        analysis
      }
    });

  } catch (error) {
    console.error('饮食分析错误:', error);
    res.status(500).json({
      success: false,
      message: '分析过程中出现错误',
      error: error.message
    });
  }
});

// 获取食物数据库
router.get('/foods', (req, res) => {
  res.json({
    success: true,
    data: foodDatabase
  });
});

// 获取饮食建议
router.get('/recommendations', (req, res) => {
  const recommendations = {
    diabetes: [
      '控制碳水化合物摄入，特别是精制糖和淀粉',
      '选择低升糖指数的食物',
      '增加膳食纤维摄入',
      '适量运动，帮助控制血糖',
      '定期监测血糖水平',
      '分餐进食，避免暴饮暴食'
    ],
    general: [
      '保持均衡饮食，包含蛋白质、碳水化合物和健康脂肪',
      '多吃蔬菜水果，补充维生素和矿物质',
      '控制盐分摄入，预防高血压',
      '适量饮水，保持身体水分',
      '规律作息，保证充足睡眠',
      '定期体检，关注身体健康'
    ]
  };

  res.json({
    success: true,
    data: recommendations
  });
});

module.exports = router; 