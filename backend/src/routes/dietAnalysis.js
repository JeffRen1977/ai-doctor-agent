const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const geminiService = require('../services/geminiService');
const { authenticateToken } = require('../middleware/auth');
const { doc, setDoc, getDoc, updateDoc, arrayUnion, collection, query, where, orderBy, limit, getDocs } = require('firebase/firestore');
const { db } = require('../config/firebase');

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

// 保存饮食分析结果到Firebase - 使用userDietAnalysis集合，文档ID为用户邮箱
async function saveDietAnalysis(userEmail, analysisData) {
  try {
    console.log('💾 保存饮食分析结果到userDietAnalysis集合:', { userEmail });
    
    // 使用userDietAnalysis集合，文档ID为用户邮箱
    const userDietAnalysisDocRef = doc(db, 'userDietAnalysis', userEmail);
    const userDietAnalysisDoc = await getDoc(userDietAnalysisDocRef);
    
    const analysisRecord = {
      id: `analysis-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...analysisData,
      timestamp: new Date(),
      createdAt: new Date()
    };
    
    if (!userDietAnalysisDoc.exists()) {
      // 如果用户饮食分析文档不存在，创建一个新的
      await setDoc(userDietAnalysisDocRef, {
        userEmail,
        analyses: [analysisRecord],
        createdAt: new Date(),
        updatedAt: new Date(),
        totalAnalyses: 1
      });
      console.log('✅ 创建新用户饮食分析文档:', userEmail);
    } else {
      // 如果用户饮食分析文档存在，添加新分析到analyses数组
      const currentData = userDietAnalysisDoc.data();
      const currentAnalyses = currentData.analyses || [];
      
      await updateDoc(userDietAnalysisDocRef, {
        analyses: arrayUnion(analysisRecord),
        updatedAt: new Date(),
        totalAnalyses: currentAnalyses.length + 1
      });
      console.log('✅ 更新用户饮食分析文档:', userEmail);
    }
    
    return analysisRecord.id;
  } catch (error) {
    console.error('❌ 保存饮食分析错误:', error);
    throw error;
  }
}

// 获取用户饮食分析历史 - 从userDietAnalysis集合获取
async function getDietAnalysisHistory(userEmail, limitCount = 20) {
  try {
    console.log('🔍 从userDietAnalysis集合查询用户饮食分析历史:', userEmail);
    
    // 从userDietAnalysis集合获取用户的饮食分析文档
    const userDietAnalysisDocRef = doc(db, 'userDietAnalysis', userEmail);
    const userDietAnalysisDoc = await getDoc(userDietAnalysisDocRef);
    
    if (!userDietAnalysisDoc.exists()) {
      console.log('📊 用户饮食分析文档不存在，返回空历史');
      return [];
    }
    
    const userDietAnalysisData = userDietAnalysisDoc.data();
    const analyses = userDietAnalysisData.analyses || [];
    
    // 按时间排序并限制数量
    const sortedAnalyses = analyses
      .sort((a, b) => {
        const timeA = a.timestamp ? (a.timestamp.toDate ? a.timestamp.toDate() : new Date(a.timestamp)) : new Date();
        const timeB = b.timestamp ? (b.timestamp.toDate ? b.timestamp.toDate() : new Date(b.timestamp)) : new Date();
        return timeB - timeA; // 最新的在前
      })
      .slice(0, limitCount);
    
    console.log('📊 找到饮食分析记录数量:', sortedAnalyses.length);
    return sortedAnalyses;
  } catch (error) {
    console.error('❌ 获取饮食分析历史错误:', error);
    console.error('错误代码:', error.code);
    console.error('错误消息:', error.message);
    
    // 如果是Firestore权限错误，返回空数组
    if (error.code === 'permission-denied') {
      console.warn('⚠️   Firestore权限被拒绝，返回空历史');
      return [];
    }
    
    // 如果是其他错误，也返回空数组而不是抛出错误
    console.warn('⚠️  返回空饮食分析历史记录');
    return [];
  }
}

// 使用Gemini AI分析食物图片
async function analyzeFoodImageWithGemini(imagePath, userEmail) {
  try {
    console.log('🤖 使用Gemini AI分析食物图片:', imagePath);
    
    // 读取图片文件并转换为base64
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');
    
    // 构建Gemini AI提示词
    const prompt = `
    你是一个专业的营养师和AI医生助理。请分析这张食物图片并提供详细的营养分析。

    请识别图片中的食物，并提供以下信息：

    1. 食物识别：
       - 主要食物名称（中文）
       - 可能的配料和成分
       - 烹饪方式（如煎、炒、蒸、煮等）

    2. 营养分析：
       - 估计的卡路里含量
       - 蛋白质含量（克）
       - 碳水化合物含量（克）
       - 脂肪含量（克）
       - 纤维含量（克）
       - 血糖指数（GI值）

    3. 健康评估：
       - 对糖尿病患者的血糖影响
       - 营养价值评估
       - 潜在的健康风险
       - 适合的食用量建议

    4. 改进建议：
       - 如何让这餐更健康
       - 推荐的替代食材
       - 搭配建议

    请用中文回答，保持专业、详细和实用。格式要清晰易读。
    `;

    // 调用Gemini AI进行分析
    const aiResult = await geminiService.analyzeImageWithGemini(base64Image, prompt);
    
    if (!aiResult.success) {
      throw new Error(`Gemini AI分析失败: ${aiResult.error}`);
    }

    return {
      success: true,
      analysis: aiResult.analysis,
      recognizedFoods: aiResult.recognizedFoods || []
    };
  } catch (error) {
    console.error('❌ Gemini AI食物图片分析错误:', error);
    throw error;
  }
}

// 分析饮食
router.post('/analyze', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请上传图片' });
    }

    const userEmail = req.user.email;
    const imagePath = req.file.path;

    console.log('📸 开始分析用户上传的食物图片:', { userEmail, imagePath });

    // 使用Gemini AI分析食物图片
    const geminiResult = await analyzeFoodImageWithGemini(imagePath, userEmail);
    
    if (!geminiResult.success) {
      return res.status(500).json({ error: 'AI图片分析失败' });
    }

    // 构建分析结果
    const analysisResult = {
      imagePath: req.file.filename,
      originalFilename: req.file.originalname,
      imageSize: req.file.size,
      aiAnalysis: geminiResult.analysis,
      recognizedFoods: geminiResult.recognizedFoods,
      analysisType: 'image_analysis',
      userEmail: userEmail,
      analysisTimestamp: new Date()
    };

    // 保存分析结果到Firebase
    const analysisId = await saveDietAnalysis(userEmail, analysisResult);
    console.log('✅ 饮食分析结果已保存到Firebase:', analysisId);

    // 清理临时图片文件
    try {
      fs.unlinkSync(imagePath);
      console.log('🗑️  临时图片文件已清理:', imagePath);
    } catch (cleanupError) {
      console.warn('⚠️  清理临时图片文件失败:', cleanupError.message);
    }

    res.json({
      success: true,
      message: '食物图片分析完成',
      data: {
        analysisId,
        analysis: geminiResult.analysis,
        recognizedFoods: geminiResult.recognizedFoods,
        timestamp: analysisResult.analysisTimestamp
      }
    });

  } catch (error) {
    console.error('❌ 饮食分析错误:', error);
    
    // 清理临时图片文件
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
        console.log('🗑️  错误后清理临时图片文件:', req.file.path);
      } catch (cleanupError) {
        console.warn('⚠️  错误后清理临时图片文件失败:', cleanupError.message);
      }
    }
    
    res.status(500).json({ 
      error: '服务器内部错误',
      details: error.message 
    });
  }
});

// 获取饮食分析历史
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user.email;
    const limitCount = parseInt(req.query.limit) || 20;
    
    console.log('🔍 获取用户饮食分析历史:', { userEmail, limitCount });
    
    const history = await getDietAnalysisHistory(userEmail, limitCount);
    
    res.json({
      success: true,
      message: '获取饮食分析历史成功',
      data: {
        analyses: history,
        totalCount: history.length,
        userEmail: userEmail
      }
    });
  } catch (error) {
    console.error('❌ 获取饮食分析历史错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 获取用户饮食分析统计信息
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user.email;
    console.log('📊 获取用户饮食分析统计信息:', userEmail);
    
    // 从userDietAnalysis集合获取用户统计信息
    const userDietAnalysisDocRef = doc(db, 'userDietAnalysis', userEmail);
    const userDietAnalysisDoc = await getDoc(userDietAnalysisDocRef);
    
    if (!userDietAnalysisDoc.exists()) {
      return res.json({
        totalAnalyses: 0,
        lastAnalysis: null,
        createdAt: null,
        updatedAt: null
      });
    }
    
    const userDietAnalysisData = userDietAnalysisDoc.data();
    const analyses = userDietAnalysisData.analyses || [];
    
    res.json({
      totalAnalyses: analyses.length,
      lastAnalysis: analyses.length > 0 ? analyses[0].timestamp : null,
      createdAt: userDietAnalysisData.createdAt,
      updatedAt: userDietAnalysisData.updatedAt
    });
  } catch (error) {
    console.error('❌ 获取饮食分析统计信息错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 清除用户饮食分析历史
router.delete('/history', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user.email;
    console.log('🗑️  清除用户饮食分析历史:', userEmail);
    
    // 清除用户的饮食分析文档（重置为空数组）
    const userDietAnalysisDocRef = doc(db, 'userDietAnalysis', userEmail);
    await setDoc(userDietAnalysisDocRef, {
      userEmail,
      analyses: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      totalAnalyses: 0
    });
    
    res.json({ 
      success: true,
      message: '饮食分析历史已清除' 
    });
  } catch (error) {
    console.error('❌ 清除饮食分析历史错误:', error);
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
    const userEmail = req.user.email;
    
    // 使用Gemini AI生成个性化饮食建议
    const aiResult = await geminiService.analyzeDiet([], {
      userEmail,
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
    console.error('❌ 获取饮食建议错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

module.exports = router; 