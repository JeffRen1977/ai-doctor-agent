const { db } = require('../config/firebase');
const { doc, getDoc, updateDoc, collection, query, where, orderBy, limit, addDoc, getDocs } = require('firebase/firestore');
const aiServiceFactory = require('./aiServiceFactory');
const userSettingsService = require('./userSettingsService');
const userContextService = require('./userContextService');
const contextBuilderService = require('./contextBuilderService');
const openaiService = require('./openaiService');
const { createRehabilitationRecord, validateRehabilitationRecord } = require('../models/rehabilitationModels');

/**
 * 生成式AI康复助理服务
 * 利用大语言模型提供专业且有温度的健康咨询、科普解读和心理支持
 */
class RehabilitationAssistantService {
  constructor() {
    console.log('💬 Rehabilitation Assistant Service initialized');
  }

  /**
   * 科普解读临床指标
   * @param {string} userEmail 用户邮箱
   * @param {Object} metrics 临床指标
   * @returns {Promise<Object>} 解读结果
   */
  async explainClinicalMetrics(userEmail, metrics) {
    try {
      console.log(`📊 Explaining clinical metrics for user: ${userEmail}`);
      
      // 获取用户AI设置
      const userSettings = await userSettingsService.getUserAISettings(userEmail);
      const { aiProvider, aiModel } = this.getAIServiceConfig(userSettings);
      const userLanguage = userSettings.success ? (userSettings.language || 'zh') : 'zh';
      
      // 构建科普解读提示
      const prompt = this.buildMetricsExplanationPrompt(metrics, userLanguage);
      
      // 使用LLM进行科普解读
      const aiResult = await aiServiceFactory.healthChat(
        prompt,
        '',
        { provider: aiProvider, model: aiModel, language: userLanguage }
      );
      
      if (!aiResult.success) {
        throw new Error(aiResult.error || 'AI analysis failed');
      }
      
      // 保存解读记录（使用新格式）
      await this.saveRehabilitationRecord(
        userEmail,
        'explanation',
        'metrics',
        { metrics },
        {
          explanation: aiResult.message,
          metrics: metrics
        },
        {
          aiProvider,
          aiModel: aiModel || 'default',
          language: userLanguage
        }
      );
      
      return {
        success: true,
        explanation: aiResult.message,
        metrics: metrics
      };
    } catch (error) {
      console.error('❌ Error explaining clinical metrics:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 情绪与心理支持
   * @param {string} userEmail 用户邮箱
   * @param {Object} context 用户情绪上下文
   * @returns {Promise<Object>} 支持结果
   */
  async provideEmotionalSupport(userEmail, context) {
    try {
      console.log(`💚 Providing emotional support for user: ${userEmail}`);
      
      // 获取用户AI设置
      const userSettings = await userSettingsService.getUserAISettings(userEmail);
      const { aiProvider, aiModel } = this.getAIServiceConfig(userSettings);
      const userLanguage = userSettings.success ? (userSettings.language || 'zh') : 'zh';
      
      // 检测焦虑情绪
      const anxietyLevel = this.detectAnxiety(context);
      
      // 构建心理支持提示
      const prompt = this.buildEmotionalSupportPrompt(context, anxietyLevel, userLanguage);
      
      // 使用LLM提供心理支持
      const aiResult = await aiServiceFactory.healthChat(
        prompt,
        '',
        { provider: aiProvider, model: aiModel, language: userLanguage }
      );
      
      if (!aiResult.success) {
        throw new Error(aiResult.error || 'AI analysis failed');
      }
      
      const recommendations = this.generateEmotionalRecommendations(anxietyLevel, userLanguage);
      
      // 保存支持记录（使用新格式）
      await this.saveRehabilitationRecord(
        userEmail,
        'support',
        'emotional',
        { context },
        {
          support: aiResult.message,
          anxietyLevel: anxietyLevel,
          recommendations: recommendations
        },
        {
          aiProvider,
          aiModel: aiModel || 'default',
          language: userLanguage
        }
      );
      
      return {
        success: true,
        support: aiResult.message,
        anxietyLevel: anxietyLevel,
        recommendations: recommendations
      };
    } catch (error) {
      console.error('❌ Error providing emotional support:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 冥想引导
   * @param {string} userEmail 用户邮箱
   * @param {string} type 冥想类型
   * @returns {Promise<Object>} 引导内容
   */
  async guideMeditation(userEmail, type = 'breathing') {
    try {
      console.log(`🧘 Guiding meditation for user: ${userEmail}, type: ${type}`);
      
      // 获取用户AI设置
      const userSettings = await userSettingsService.getUserAISettings(userEmail);
      const { aiProvider, aiModel } = this.getAIServiceConfig(userSettings);
      const userLanguage = userSettings.success ? (userSettings.language || 'zh') : 'zh';
      
      // 构建冥想引导提示
      const prompt = this.buildMeditationPrompt(type, userLanguage);
      
      // 使用LLM生成冥想引导
      const aiResult = await aiServiceFactory.healthChat(
        prompt,
        '',
        { provider: aiProvider, model: aiModel, language: userLanguage }
      );
      
      if (!aiResult.success) {
        throw new Error(aiResult.error || 'AI analysis failed');
      }
      
      // 保存冥想记录（使用新格式）
      await this.saveRehabilitationRecord(
        userEmail,
        'meditation',
        type,
        { type },
        {
          guidance: aiResult.message,
          duration: this.getMeditationDuration(type)
        },
        {
          aiProvider,
          aiModel: aiModel || 'default',
          language: userLanguage
        }
      );
      
      return {
        success: true,
        type: type,
        guidance: aiResult.message,
        duration: this.getMeditationDuration(type)
      };
    } catch (error) {
      console.error('❌ Error guiding meditation:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 认知行为疗法支持
   * @param {string} userEmail 用户邮箱
   * @param {Object} situation 用户面临的情况
   * @returns {Promise<Object>} CBT支持结果
   */
  async provideCBT(userEmail, situation) {
    try {
      console.log(`🧠 Providing CBT support for user: ${userEmail}`);
      
      // 获取用户AI设置
      const userSettings = await userSettingsService.getUserAISettings(userEmail);
      const { aiProvider, aiModel } = this.getAIServiceConfig(userSettings);
      const userLanguage = userSettings.success ? (userSettings.language || 'zh') : 'zh';
      
      // 构建CBT提示
      const prompt = this.buildCBTPrompt(situation, userLanguage);
      
      // 使用LLM提供CBT支持
      const aiResult = await aiServiceFactory.healthChat(
        prompt,
        '',
        { provider: aiProvider, model: aiModel, language: userLanguage }
      );
      
      if (!aiResult.success) {
        throw new Error(aiResult.error || 'AI analysis failed');
      }
      
      const techniques = this.extractCBTTechniques(aiResult.message);
      
      // 保存CBT记录（使用新格式）
      await this.saveRehabilitationRecord(
        userEmail,
        'support',
        'cbt',
        { situation },
        {
          cbtSupport: aiResult.message,
          techniques: techniques
        },
        {
          aiProvider,
          aiModel: aiModel || 'default',
          language: userLanguage
        }
      );
      
      return {
        success: true,
        cbtSupport: aiResult.message,
        techniques: techniques
      };
    } catch (error) {
      console.error('❌ Error providing CBT:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 健康问答
   * @param {string} userEmail 用户邮箱
   * @param {string} question 用户问题
   * @returns {Promise<Object>} 回答结果
   */
  async answerHealthQuestions(userEmail, question) {
    try {
      console.log(`❓ Answering health question for user: ${userEmail}`);
      
      // 获取用户AI设置
      const userSettings = await userSettingsService.getUserAISettings(userEmail);
      const { aiProvider, aiModel } = this.getAIServiceConfig(userSettings);
      const userLanguage = userSettings.success ? (userSettings.language || 'zh') : 'zh';
      
      // 通过 Context Builder 获取健康档案 + 最近对话（与文档 Step 6 一致）
      const userId = (userEmail || '').replace(/[^a-zA-Z0-9@._-]/g, '_');
      let contextText = '';
      try {
        const payload = await contextBuilderService.buildAIContext(userId, {
          medications: true,
          chatRecent: true,
          language: userLanguage
        });
        contextText = contextBuilderService.formatContextForSystemPrompt(payload);
      } catch (e) {
        console.warn('⚠️ buildAIContext for rehab health QA failed:', e.message);
      }
      
      // 获取用户上下文（用于记录与 fallback）
      const userContext = await userContextService.getUserContext(userEmail);
      
      // 构建问答提示（有温度、专业、个性化）；优先使用 contextText
      const prompt = this.buildHealthQuestionPrompt(question, userContext, userLanguage, contextText);
      
      // 使用LLM回答问题（上下文来自 buildAIContext）
      const aiResult = await aiServiceFactory.healthChat(
        prompt,
        contextText,
        { provider: aiProvider, model: aiModel, language: userLanguage }
      );
      
      if (!aiResult.success) {
        throw new Error(aiResult.error || 'AI analysis failed');
      }
      
      // 保存问答记录（使用新格式）
      await this.saveRehabilitationRecord(
        userEmail,
        'qa',
        null,
        { question, context: userContext },
        {
          answer: aiResult.message
        },
        {
          aiProvider,
          aiModel: aiModel || 'default',
          language: userLanguage
        }
      );
      
      return {
        success: true,
        question: question,
        answer: aiResult.message
      };
    } catch (error) {
      console.error('❌ Error answering health question:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ========== Helper Methods ==========

  /**
   * 获取AI服务配置（优先使用OpenAI）
   * 优先使用OpenAI（如果可用），否则使用用户设置，最后使用Gemini（gemini-2.5）
   * 
   * @param {Object} userSettings 用户AI设置
   * @returns {Object} { aiProvider, aiModel }
   */
  getAIServiceConfig(userSettings) {
    // 优先检查OpenAI是否可用
    if (openaiService.isServiceAvailable && openaiService.isServiceAvailable()) {
      const openaiModels = openaiService.getAvailableModels ? openaiService.getAvailableModels() : ['gpt-4o', 'gpt-4-turbo'];
      const models = Array.isArray(openaiModels) ? openaiModels : (openaiModels.all || ['gpt-4o']);
      return {
        aiProvider: 'openai',
        aiModel: models[0] || 'gpt-4o'
      };
    }
    
    // 如果OpenAI不可用，使用用户设置
    if (userSettings.success && userSettings.aiProvider) {
      // 如果用户选择的是Gemini，使用gemini-2.5模型
      if (userSettings.aiProvider === 'gemini') {
        return {
          aiProvider: 'gemini',
          aiModel: userSettings.aiModel || 'gemini-2.5'
        };
      }
      return {
        aiProvider: userSettings.aiProvider,
        aiModel: userSettings.aiModel || ''
      };
    }
    
    // 最后使用Gemini作为后备，使用gemini-2.5模型
    return {
      aiProvider: 'gemini',
      aiModel: 'gemini-2.5'
    };
  }

  /**
   * 构建临床指标解读提示
   */
  buildMetricsExplanationPrompt(metrics, language = 'zh') {
    if (language === 'en') {
      return `You are a professional medical assistant. Please explain the following clinical metrics in simple, easy-to-understand language:

Clinical Metrics:
${JSON.stringify(metrics, null, 2)}

Please provide:
1. What each metric means in simple terms
2. Whether the values are normal, high, or low
3. What these values indicate about health
4. Any recommendations or next steps

Please respond in a warm, professional, and empathetic tone.`;
    } else {
      return `你是一位专业的医疗AI助手。请用简单易懂的语言解释以下临床指标：

临床指标：
${JSON.stringify(metrics, null, 2)}

请提供：
1. 每个指标的含义（用通俗语言）
2. 数值是否正常、偏高或偏低
3. 这些数值对健康的指示意义
4. 建议或下一步行动

请用有温度、专业且易懂的方式回答。`;
    }
  }

  /**
   * 构建情绪支持提示
   */
  buildEmotionalSupportPrompt(context, anxietyLevel, language = 'zh') {
    if (language === 'en') {
      return `You are a compassionate and professional mental health assistant. A user is experiencing emotional distress:

Context: ${JSON.stringify(context, null, 2)}
Anxiety Level: ${anxietyLevel}

Please provide:
1. Empathetic understanding and validation
2. Emotional support and encouragement
3. Practical coping strategies
4. Gentle guidance and reassurance

Please respond in a warm, caring, and professional tone.`;
    } else {
      return `你是一位富有同理心的专业心理健康助手。用户正在经历情绪困扰：

情况描述：${JSON.stringify(context, null, 2)}
焦虑程度：${anxietyLevel}

请提供：
1. 共情理解和认可
2. 情绪支持和鼓励
3. 实用的应对策略
4. 温和的引导和安慰

请用有温度、关怀且专业的方式回答。`;
    }
  }

  /**
   * 构建冥想引导提示
   */
  buildMeditationPrompt(type, language = 'zh') {
    const types = {
      breathing: language === 'en' ? 'breathing meditation' : '呼吸冥想',
      bodyScan: language === 'en' ? 'body scan meditation' : '身体扫描冥想',
      mindfulness: language === 'en' ? 'mindfulness meditation' : '正念冥想',
      relaxation: language === 'en' ? 'relaxation meditation' : '放松冥想'
    };
    
    if (language === 'en') {
      return `You are a professional meditation guide. Please provide a step-by-step ${types[type] || 'meditation'} guide:

Please provide:
1. Preparation steps
2. Step-by-step meditation instructions
3. Breathing techniques
4. Tips for maintaining focus
5. Closing and reflection

Please respond in a calm, soothing, and gentle tone.`;
    } else {
      return `你是一位专业的冥想引导师。请提供${types[type] || '冥想'}的逐步引导：

请提供：
1. 准备步骤
2. 逐步的冥想指导
3. 呼吸技巧
4. 保持专注的提示
5. 结束和反思

请用平静、舒缓且温和的语调回答。`;
    }
  }

  /**
   * 构建CBT提示
   */
  buildCBTPrompt(situation, language = 'zh') {
    if (language === 'en') {
      return `You are a professional cognitive behavioral therapy (CBT) assistant. A user is facing this situation:

Situation: ${JSON.stringify(situation, null, 2)}

Please provide CBT support:
1. Identify negative thought patterns
2. Challenge and reframe negative thoughts
3. Provide cognitive restructuring techniques
4. Suggest behavioral strategies
5. Offer encouragement and support

Please respond in a professional, supportive, and empowering tone.`;
    } else {
      return `你是一位专业的认知行为疗法（CBT）助手。用户面临以下情况：

情况：${JSON.stringify(situation, null, 2)}

请提供CBT支持：
1. 识别负面思维模式
2. 挑战和重构负面思维
3. 提供认知重构技巧
4. 建议行为策略
5. 给予鼓励和支持

请用专业、支持且赋能的语调回答。`;
    }
  }

  /**
   * 构建健康问答提示
   * @param {string} [contextText] - 来自 buildAIContext + formatContextForSystemPrompt 的上下文；若有则替代下方健康快照/最近对话
   */
  buildHealthQuestionPrompt(question, userContext, language = 'zh', contextText = '') {
    const useContextBuilder = contextText && contextText.trim().length > 0;
    const contextSummary = {
      health: userContext.healthSnapshot ? {
        currentMetrics: userContext.healthSnapshot.currentMetrics,
        medications: userContext.healthSnapshot.medications?.length || 0,
        hasMedicalHistory: !!userContext.healthSnapshot.medicalHistory,
        recentAlerts: userContext.healthSnapshot.recentAlerts?.length || 0
      } : null,
      conversations: userContext.conversationContext?.recentMessages?.length || 0
    };
    const healthAndChatBlock = useContextBuilder
      ? contextText
      : (language === 'en'
          ? `Health Snapshot:\n${userContext.healthSnapshot ? JSON.stringify(userContext.healthSnapshot, null, 2) : 'No health data available'}\n\nRecent Conversations:\n${userContext.conversationContext?.recentMessages ? JSON.stringify(userContext.conversationContext.recentMessages.slice(-3), null, 2) : 'No recent conversations'}`
          : `健康快照：\n${userContext.healthSnapshot ? JSON.stringify(userContext.healthSnapshot, null, 2) : '无健康数据'}\n\n最近对话：\n${userContext.conversationContext?.recentMessages ? JSON.stringify(userContext.conversationContext.recentMessages.slice(-3), null, 2) : '无最近对话'}`);

    if (language === 'en') {
      return `You are a professional, warm, and empathetic AI medical assistant. A user asks:

Question: ${question}

User Context:
${JSON.stringify(contextSummary, null, 2)}

${healthAndChatBlock}

Please provide:
1. Professional and accurate health information
2. Personalized advice based on user context and health data
3. Warm and empathetic tone
4. Clear explanations
5. Next steps or recommendations

Please respond in a warm, professional, and easy-to-understand manner.`;
    } else {
      return `你是一位专业、有温度、富有同理心的AI医疗助手。用户提问：

问题：${question}

用户上下文：
${JSON.stringify(contextSummary, null, 2)}

${healthAndChatBlock}

请提供：
1. 专业准确的健康信息
2. 基于用户上下文和健康数据的个性化建议
3. 有温度且富有同理心的语调
4. 清晰的解释
5. 下一步行动或建议

请用有温度、专业且易懂的方式回答。`;
    }
  }

  /**
   * 检测焦虑情绪
   */
  detectAnxiety(context) {
    const text = JSON.stringify(context).toLowerCase();
    const anxietyKeywords = ['anxious', 'worried', 'stressed', 'nervous', 'panic', 'fear', '焦虑', '担心', '紧张', '恐慌', '害怕'];
    const highAnxietyKeywords = ['panic', 'overwhelmed', 'crisis', 'emergency', '恐慌', '崩溃', '危机', '紧急'];
    
    let score = 0;
    anxietyKeywords.forEach(keyword => {
      if (text.includes(keyword)) score += 1;
    });
    highAnxietyKeywords.forEach(keyword => {
      if (text.includes(keyword)) score += 3;
    });
    
    if (score >= 5) return 'high';
    if (score >= 2) return 'medium';
    return 'low';
  }

  /**
   * 生成情绪建议
   */
  generateEmotionalRecommendations(anxietyLevel, language = 'zh') {
    if (language === 'en') {
      if (anxietyLevel === 'high') {
        return [
          'Consider deep breathing exercises',
          'Try a guided meditation',
          'Reach out to a mental health professional if needed',
          'Practice mindfulness techniques'
        ];
      } else if (anxietyLevel === 'medium') {
        return [
          'Try relaxation techniques',
          'Take a short walk',
          'Practice gratitude',
          'Listen to calming music'
        ];
      } else {
        return [
          'Maintain healthy routines',
          'Practice self-care',
          'Stay connected with loved ones'
        ];
      }
    } else {
      if (anxietyLevel === 'high') {
        return [
          '尝试深呼吸练习',
          '进行引导式冥想',
          '如需要，寻求心理健康专业人士帮助',
          '练习正念技巧'
        ];
      } else if (anxietyLevel === 'medium') {
        return [
          '尝试放松技巧',
          '短距离散步',
          '练习感恩',
          '听舒缓音乐'
        ];
      } else {
        return [
          '保持健康作息',
          '练习自我关爱',
          '与亲人保持联系'
        ];
      }
    }
  }

  /**
   * 获取冥想时长
   */
  getMeditationDuration(type) {
    const durations = {
      breathing: 5,
      bodyScan: 15,
      mindfulness: 10,
      relaxation: 20
    };
    return durations[type] || 10;
  }

  /**
   * 提取CBT技巧
   */
  extractCBTTechniques(response) {
    // 简单的关键词提取，实际可以更复杂
    const techniques = [];
    const text = response.toLowerCase();
    
    if (text.includes('thought') || text.includes('思维')) techniques.push('Cognitive Restructuring');
    if (text.includes('behavior') || text.includes('行为')) techniques.push('Behavioral Activation');
    if (text.includes('challenge') || text.includes('挑战')) techniques.push('Thought Challenging');
    
    return techniques.length > 0 ? techniques : ['General CBT Support'];
  }

  /**
   * 保存康复记录（统一格式）
   * @param {string} userEmail 用户邮箱
   * @param {string} type 记录类型
   * @param {string} subtype 子类型
   * @param {any} input 输入数据
   * @param {any} output 输出数据
   * @param {Object} metadata 元数据
   * @param {Object} references 关联数据
   */
  async saveRehabilitationRecord(userEmail, type, subtype, input, output, metadata, references = {}) {
    try {
      const record = createRehabilitationRecord(userEmail, type, input, output, metadata, references);
      
      // 验证记录
      const validation = validateRehabilitationRecord(record);
      if (!validation.valid) {
        console.warn('⚠️ Rehabilitation record validation warning:', validation.error);
      }
      
      // 保存到 Firestore
      const recordRef = collection(db, 'rehabilitationRecords');
      await addDoc(recordRef, validation.value || record);
      
      console.log(`✅ Saved rehabilitation record: ${record.recordId} (${type}/${subtype || 'none'})`);
    } catch (error) {
      console.error('❌ Error saving rehabilitation record:', error);
    }
  }

  /**
   * 获取康复记录历史
   * @param {string} userEmail 用户邮箱
   * @param {Object} options 查询选项
   * @returns {Promise<Object>} 记录列表
   */
  async getRehabilitationRecords(userEmail, options = {}) {
    // 提取选项参数（在try-catch外部，确保fallback可以访问）
    const {
      type = null,
      subtype = null,
      limitCount = 20,
      startAfter = null
    } = options;

    try {
      const recordsRef = collection(db, 'rehabilitationRecords');
      let q = query(
        recordsRef,
        where('userEmail', '==', userEmail),
        orderBy('timestamp', 'desc')
      );

      // 如果指定了类型，添加类型过滤
      if (type) {
        q = query(q, where('type', '==', type));
      }

      // 如果指定了子类型，添加子类型过滤（需要先有类型过滤）
      if (subtype && type) {
        q = query(q, where('subtype', '==', subtype));
      }

      // 添加限制
      q = query(q, limit(limitCount));

      const querySnapshot = await getDocs(q);
      const records = [];

      querySnapshot.forEach((doc) => {
        records.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return {
        success: true,
        records: records,
        count: records.length
      };
    } catch (error) {
      console.error('❌ Error getting rehabilitation records:', error);
      console.warn('⚠️ Firestore index not found, using fallback query method');
      
      // Fallback: 如果索引不存在，使用内存排序
      try {
        const recordsRef = collection(db, 'rehabilitationRecords');
        const allSnapshot = await getDocs(recordsRef);
        let allRecords = allSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(record => record.userEmail === userEmail);

        // 应用类型和子类型过滤
        if (type) {
          allRecords = allRecords.filter(record => record.type === type);
        }
        if (subtype) {
          allRecords = allRecords.filter(record => record.subtype === subtype);
        }

        // 排序
        allRecords.sort((a, b) => {
          const timeA = a.timestamp ? new Date(a.timestamp) : new Date(0);
          const timeB = b.timestamp ? new Date(b.timestamp) : new Date(0);
          return timeB - timeA;
        });

        // 限制数量
        allRecords = allRecords.slice(0, limitCount);

        return {
          success: true,
          records: allRecords,
          count: allRecords.length
        };
      } catch (fallbackError) {
        console.error('❌ Fallback query also failed:', fallbackError);
        return {
          success: false,
          error: fallbackError.message,
          records: [],
          count: 0
        };
      }
    }
  }

  /**
   * 保存反馈
   * @param {string} userEmail 用户邮箱
   * @param {string} recordId 记录ID
   * @param {Object} feedback 反馈数据
   * @returns {Promise<Object>} 保存结果
   */
  async saveFeedback(userEmail, recordId, feedback) {
    try {
      const feedbackData = {
        recordId,
        userEmail,
        effectiveness: feedback.effectiveness,
        helpful: feedback.helpful || null,
        comments: feedback.comments || '',
        timestamp: new Date().toISOString()
      };

      // 验证反馈
      const { validateFeedback } = require('../models/rehabilitationModels');
      const validation = validateFeedback(feedbackData);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error
        };
      }

      // 保存反馈
      const feedbackRef = collection(db, 'rehabilitationFeedback');
      await addDoc(feedbackRef, validation.value);

      // 更新记录的反馈字段（可选）
      try {
        const recordsRef = collection(db, 'rehabilitationRecords');
        const recordsQuery = query(
          recordsRef,
          where('recordId', '==', recordId),
          where('userEmail', '==', userEmail),
          limit(1)
        );
        const recordsSnapshot = await getDocs(recordsQuery);
        
        if (!recordsSnapshot.empty) {
          const recordDoc = recordsSnapshot.docs[0];
          await updateDoc(recordDoc.ref, {
            feedback: {
              effectiveness: feedback.effectiveness,
              helpful: feedback.helpful,
              comments: feedback.comments,
              timestamp: feedbackData.timestamp
            },
            updatedAt: new Date().toISOString()
          });
        }
      } catch (updateError) {
        console.warn('⚠️ Could not update record with feedback:', updateError.message);
      }

      return {
        success: true,
        message: 'Feedback saved successfully'
      };
    } catch (error) {
      console.error('❌ Error saving feedback:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

}

module.exports = new RehabilitationAssistantService();




