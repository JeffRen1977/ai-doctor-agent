const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const aiServiceFactory = require('../services/aiServiceFactory');
const userSettingsService = require('../services/userSettingsService');
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
      cb(new Error('Only image files are allowed'), false);
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

// 使用AI服务分析食物图片（根据用户设置选择提供商）
async function analyzeFoodImageWithAI(imagePath, userId, userEmail) {
  try {
    console.log('🤖 使用AI服务分析食物图片:', imagePath);
    
    // 获取用户AI设置
    const userAISettings = await userSettingsService.getUserAISettings(userId);
    const userProvider = userAISettings.success ? userAISettings.aiProvider : 'gemini';
    const userModel = userAISettings.success ? userAISettings.aiModel : '';
    // 确保语言设置存在，如果不存在或为空，默认使用中文
    let userLanguage = userAISettings.success && userAISettings.language ? userAISettings.language : 'zh';
    
    // 如果语言设置不是 'zh' 或 'en'，强制使用中文
    if (userLanguage !== 'zh' && userLanguage !== 'en') {
      console.warn(`⚠️ 无效的语言设置 "${userLanguage}"，强制使用中文`);
      userLanguage = 'zh';
    }
    
    console.log(`🎯 使用AI提供商: ${userProvider}, 模型: ${userModel}, 语言: ${userLanguage} (用户设置: ${userAISettings.success ? '已配置' : '默认'})`);
    console.log(`📋 用户AI设置详情:`, {
      success: userAISettings.success,
      aiProvider: userAISettings.aiProvider,
      aiModel: userAISettings.aiModel,
      language: userAISettings.language,
      finalLanguage: userLanguage
    });
    
    // 读取图片文件并转换为base64
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');
    
    // 构建语言感知的AI提示词
    let prompt;
    if (userLanguage === 'en') {
      prompt = `
        You are a nutrition analysis assistant. This image is for dietary tracking only. Identify the dish(es) and ingredients in the image and estimate nutrition. Do not refuse to analyze the image or say you cannot identify "details or people"—we only need food identification. If unsure, give your best estimate based on what the food appears to be.

        ## Food Image Nutritional Analysis

        **1. Food Identification:**
        * **Main food names (in English):** [List all identified foods]
        * **Possible ingredients and components:** [List ingredients for each food]
        * **Cooking method:** [Describe cooking methods]

        **2. Nutritional Analysis:**
        (The following values are rough estimates, actual values depend on specific ingredient quantities and cooking methods)
        Since the image cannot precisely quantify food portions, the following data is estimated based on approximately 150g per serving, for reference only.

        Create a table with the following format:
        | Food | Calories (kcal) | Protein (g) | Carbohydrates (g) | Fat (g) | Fiber (g) | Glycemic Index (GI) |
        |------|-----------------|-------------|-------------------|---------|-----------|---------------------|
        | [Food Name] (150g) | [value] | [value] | [value] | [value] | [value] | [value] |

        **3. Health Assessment:**
        * **Blood sugar impact for diabetes patients:** [Detailed analysis]
        * **Nutritional value assessment:** [Assessment]
        * **Potential health risks:** [List risks]
        * **Recommended serving size:** [Recommendations]

        **4. Improvement Suggestions:**
        * **How to make this meal healthier:** [Suggestions]
        * **Recommended alternative ingredients:** [Alternatives]
        * **Pairing suggestions:** [Pairing advice]

        ## Disease Impact Analysis

        **1. Impact on Diabetes:**
        * **Blood sugar impact:** [Detailed analysis of how this meal affects blood sugar]
        * **Risk level:** [Low/Medium/High]
        * **Recommendations for diabetes patients:** [Specific recommendations]

        **2. Impact on Cardiovascular Disease:**
        * **Cardiovascular impact:** [Detailed analysis of how this meal affects cardiovascular health]
        * **Risk factors:** [List risk factors such as saturated fat, cholesterol, sodium]
        * **Recommendations for cardiovascular patients:** [Specific recommendations]

        **Disclaimer:**
        The above analysis is for reference only and is not professional medical advice. Please consult a professional doctor or registered nutritionist for personalized dietary and health advice.
        The food information provided by the image is limited, and there may be some errors in the analysis results.

        Please respond in English, keeping it professional, detailed, and practical. Format should be clear and readable with proper markdown formatting.
        `;
    } else {
      prompt = `
        你是营养分析助手。本图片仅用于饮食记录。请识别图片中的菜品和食材并估算营养。不要拒绝分析或回答“无法识别具体细节或人物”——我们只需要识别食物。若不确定，请根据视觉上最可能的菜品给出估计即可。

        ## 食物图片营养分析

        **1. 食物识别：**
        * **主要食物名称（中文）：** [列出所有识别的食物]
        * **可能的配料和成分：** [列出每种食物的配料]
        * **烹饪方式：** [描述烹饪方法]

        **2. 营养分析：**
        （以下数值为粗略估计，实际数值取决于具体食材用量和烹饪方法）
        由于图片无法精确量化食物分量，以下数据基于每份约150克的估计，仅供参考。

        请创建一个表格，格式如下：
        | 食物 | 卡路里 (kcal) | 蛋白质 (g) | 碳水化合物 (g) | 脂肪 (g) | 纤维 (g) | 血糖指数 (GI) |
        |------|---------------|------------|----------------|----------|----------|----------------|
        | [食物名称] (150g) | [数值] | [数值] | [数值] | [数值] | [数值] | [数值] |

        **3. 健康评估：**
        * **对糖尿病患者的血糖影响：** [详细分析]
        * **营养价值评估：** [评估]
        * **潜在的健康风险：** [列出风险]
        * **合适的食用量建议：** [建议]

        **4. 改进建议：**
        * **如何让这餐更健康：** [建议]
        * **推荐的替代食材：** [替代品]
        * **搭配建议：** [搭配建议]

        ## 疾病影响分析

        **1. 对糖尿病的影响：**
        * **血糖影响：** [详细分析这餐对血糖的影响]
        * **风险等级：** [低/中/高]
        * **对糖尿病患者的建议：** [具体建议]

        **2. 对心血管病的影响：**
        * **心血管影响：** [详细分析这餐对心血管健康的影响]
        * **风险因素：** [列出风险因素，如饱和脂肪、胆固醇、钠等]
        * **对心血管病患者的建议：** [具体建议]

        **免责声明：**
        以上分析仅供参考，并非专业医学建议。建议您咨询专业医生或注册营养师，获得个性化的饮食和健康建议。
        图片提供的食物信息有限，分析结果存在一定误差。

        请用中文回答，保持专业、详细和实用。格式要清晰易读，使用正确的markdown格式。
        `;
    }

    // 对于食物图片分析，强制使用 Gemini 的图像识别模型（图像识别能力更强）
    // gemini-2.5-flash 支持多模态视觉（2.0-flash 已对新用户不可用）
    const finalProvider = 'gemini';
    const finalModel = 'gemini-2.5-flash';
    
    console.log(`🍎 食物图片分析使用 Gemini 图像模型: ${finalModel}`);
    if (userProvider !== 'gemini') {
      console.log(`ℹ️  用户设置的 AI 提供商是 ${userProvider}，但食物图片分析使用 Gemini（图像识别能力更强）`);
    }
    
    // 使用AI服务工厂进行分析
    const aiResult = await aiServiceFactory.analyzeImageWithAI(base64Image, prompt, {
      provider: finalProvider,
      model: finalModel,
      language: userLanguage
    });
    
    if (!aiResult.success) {
      throw new Error(`${userProvider} AI分析失败: ${aiResult.error}`);
    }

    return {
      success: true,
      analysis: aiResult.analysis,
      recognizedFoods: aiResult.recognizedFoods || [],
      aiProvider: userProvider,
      aiModel: userModel,
      language: userLanguage
    };
  } catch (error) {
    console.error('❌ AI食物图片分析错误:', error);
    throw error;
  }
}

// 分析饮食
router.post('/analyze', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload an image' });
    }

    const userEmail = req.user.email;
    const userId = req.user.id;
    const imagePath = req.file.path;

    // 获取用户AI设置以确定语言
    const userAISettings = await userSettingsService.getUserAISettings(userId);
    const userLanguage = userAISettings.success ? userAISettings.language : 'zh';

    console.log('📸 开始分析用户上传的食物图片:', { userEmail, userId, imagePath, language: userLanguage });

    // 使用AI服务分析食物图片
    const aiResult = await analyzeFoodImageWithAI(imagePath, userId, userEmail);
    
    console.log('🔍 AI分析结果:', {
      success: aiResult.success,
      analysis: aiResult.analysis ? aiResult.analysis.substring(0, 100) + '...' : 'null',
      recognizedFoods: aiResult.recognizedFoods,
      aiProvider: aiResult.aiProvider,
      aiModel: aiResult.aiModel,
      language: aiResult.language,
      error: aiResult.error
    });
    
    if (!aiResult.success) {
      // 检查是否是配额限制错误
      if (aiResult.error && aiResult.error.includes('quota') || aiResult.error.includes('Too Many Requests')) {
        const quotaMessage = userLanguage === 'en' 
          ? 'AI service quota exceeded, please try again later or upgrade your account'
          : 'AI服务配额已用完，请稍后再试或升级您的账户';
        const quotaDetails = userLanguage === 'en'
          ? 'You have reached the daily/minute request limit for free accounts'
          : '您已达到免费账户的每日/每分钟请求限制';
        const retryMessage = userLanguage === 'en'
          ? 'Please wait a few minutes before trying again'
          : '建议等待几分钟后再试';
          
        return res.status(429).json({ 
          error: quotaMessage,
          details: quotaDetails,
          retryAfter: retryMessage,
          code: 'QUOTA_EXCEEDED'
        });
      }
      
      // 其他AI分析错误
      const analysisError = userLanguage === 'en'
        ? 'AI image analysis failed'
        : 'AI图片分析失败';
        
      return res.status(500).json({ 
        error: analysisError,
        details: aiResult.error,
        code: 'AI_ANALYSIS_FAILED'
      });
    }

    // 构建分析结果
    const analysisResult = {
      imagePath: req.file.filename,
      originalFilename: req.file.originalname,
      imageSize: req.file.size,
      aiAnalysis: aiResult.analysis,
      recognizedFoods: aiResult.recognizedFoods,
      analysisType: 'image_analysis',
      userEmail: userEmail,
      analysisTimestamp: new Date(),
      aiProvider: aiResult.aiProvider,
      aiModel: aiResult.aiModel
    };

    console.log('🔍 构建的分析结果:', {
      imagePath: analysisResult.imagePath,
      originalFilename: analysisResult.originalFilename,
      imageSize: analysisResult.imageSize,
      aiAnalysisLength: analysisResult.aiAnalysis ? analysisResult.aiAnalysis.length : 0,
      recognizedFoodsCount: analysisResult.recognizedFoods ? analysisResult.recognizedFoods.length : 0,
      analysisType: analysisResult.analysisType,
      userEmail: analysisResult.userEmail,
      analysisTimestamp: analysisResult.analysisTimestamp
    });

    // 保存分析结果到Firebase
    const analysisId = await saveDietAnalysis(userEmail, analysisResult);
    console.log('✅ 饮食分析结果已保存到Firebase:', analysisId);

    // 构建响应数据
    const responseData = {
      analysisId,
      // Return the complete analysis result structure
      imagePath: req.file.filename,
      originalFilename: req.file.originalname,
      imageSize: req.file.size,
      aiAnalysis: aiResult.analysis,
      recognizedFoods: aiResult.recognizedFoods,
      analysisType: 'image_analysis',
      userEmail: userEmail,
      analysisTimestamp: analysisResult.analysisTimestamp,
      aiProvider: aiResult.aiProvider,
      aiModel: aiResult.aiModel,
      // Include the AI analysis text in the expected field
      analysis: aiResult.analysis
    };

    // 根据用户语言设置响应消息
    const successMessage = userLanguage === 'en' 
      ? 'Food image analysis completed'
      : '食物图片分析完成';

    console.log('🔍 发送给前端的响应数据:', {
      success: true,
      message: successMessage,
      data: responseData
    });

    res.json({
      success: true,
      message: successMessage,
      data: responseData
    });

    // 清理临时图片文件
    try {
      fs.unlinkSync(imagePath);
      console.log('🗑️  临时图片文件已清理:', imagePath);
    } catch (cleanupError) {
      console.warn('⚠️  清理临时图片文件失败:', cleanupError.message);
    }

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
    
    // 获取用户语言设置以确定错误消息语言
    let userLanguage = 'zh'; // 默认中文
    try {
      const userId = req.user?.id;
      if (userId) {
        const userAISettings = await userSettingsService.getUserAISettings(userId);
        userLanguage = userAISettings.success ? userAISettings.language : 'zh';
      }
    } catch (settingsError) {
      console.warn('⚠️ 获取用户语言设置失败:', settingsError.message);
    }
    
    const errorMessage = userLanguage === 'en' 
      ? 'Internal server error'
      : '服务器内部错误';
    
    res.status(500).json({ 
      error: errorMessage,
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
    const userId = req.user.id;
    
    // 获取用户AI设置
    const userAISettings = await userSettingsService.getUserAISettings(userId);
    const userProvider = userAISettings.success ? userAISettings.aiProvider : 'gemini';
    const userModel = userAISettings.success ? userAISettings.aiModel : '';
    const userLanguage = userAISettings.success ? userAISettings.language : 'zh';
    
    console.log(`🎯 使用AI提供商生成饮食建议: ${userProvider}, 模型: ${userModel}, 语言: ${userLanguage} (用户设置: ${userAISettings.success ? '已配置' : '默认'})`);
    
    // 使用AI服务工厂生成个性化饮食建议
    const aiResult = await aiServiceFactory.analyzeDiet([], {
      userEmail,
      type: 'recommendations'
    }, {
      provider: userProvider,
      model: userModel,
      language: userLanguage
    });

    if (!aiResult.success) {
      const errorMessage = userLanguage === 'en' 
        ? 'AI recommendation generation failed'
        : 'AI建议生成失败';
      return res.status(500).json({ error: errorMessage });
    }

    res.json({
      success: true,
      data: {
        recommendations: aiResult.analysis,
        timestamp: new Date(),
        aiProvider: userProvider,
        aiModel: userModel,
        language: userLanguage
      }
    });
  } catch (error) {
    console.error('❌ 获取饮食建议错误:', error);
    
    // 获取用户语言设置以确定错误消息语言
    let userLanguage = 'zh'; // 默认中文
    try {
      const userId = req.user?.id;
      if (userId) {
        const userAISettings = await userSettingsService.getUserAISettings(userId);
        userLanguage = userAISettings.success ? userAISettings.language : 'zh';
      }
    } catch (settingsError) {
      console.warn('⚠️ 获取用户语言设置失败:', settingsError.message);
    }
    
    const errorMessage = userLanguage === 'en' 
      ? 'Internal server error'
      : '服务器内部错误';
    
    res.status(500).json({ error: errorMessage });
  }
});

module.exports = router; 