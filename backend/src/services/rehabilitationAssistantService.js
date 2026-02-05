const { db } = require('../config/firebase');
const { doc, getDoc, setDoc, updateDoc, collection, query, where, orderBy, limit, addDoc, getDocs } = require('firebase/firestore');
const aiServiceFactory = require('./aiServiceFactory');
const userSettingsService = require('./userSettingsService');

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
      const aiProvider = userSettings.success ? (userSettings.aiProvider || 'gemini') : 'gemini';
      const aiModel = userSettings.success ? (userSettings.aiModel || '') : '';
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
      
      // 保存解读记录
      await this.saveExplanation(userEmail, 'metrics', metrics, aiResult.message);
      
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
      const aiProvider = userSettings.success ? (userSettings.aiProvider || 'gemini') : 'gemini';
      const aiModel = userSettings.success ? (userSettings.aiModel || '') : '';
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
      
      // 保存支持记录
      await this.saveSupportRecord(userEmail, 'emotional', context, aiResult.message);
      
      return {
        success: true,
        support: aiResult.message,
        anxietyLevel: anxietyLevel,
        recommendations: this.generateEmotionalRecommendations(anxietyLevel, userLanguage)
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
      const aiProvider = userSettings.success ? (userSettings.aiProvider || 'gemini') : 'gemini';
      const aiModel = userSettings.success ? (userSettings.aiModel || '') : '';
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
      
      // 保存冥想记录
      await this.saveMeditationRecord(userEmail, type, aiResult.message);
      
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
      const aiProvider = userSettings.success ? (userSettings.aiProvider || 'gemini') : 'gemini';
      const aiModel = userSettings.success ? (userSettings.aiModel || '') : '';
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
      
      // 保存CBT记录
      await this.saveSupportRecord(userEmail, 'cbt', situation, aiResult.message);
      
      return {
        success: true,
        cbtSupport: aiResult.message,
        techniques: this.extractCBTTechniques(aiResult.message)
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
      const aiProvider = userSettings.success ? (userSettings.aiProvider || 'gemini') : 'gemini';
      const aiModel = userSettings.success ? (userSettings.aiModel || '') : '';
      const userLanguage = userSettings.success ? (userSettings.language || 'zh') : 'zh';
      
      // 获取用户历史对话上下文
      const context = await this.getUserContext(userEmail);
      
      // 构建问答提示（有温度、专业、个性化）
      const prompt = this.buildHealthQuestionPrompt(question, context, userLanguage);
      
      // 使用LLM回答问题
      const aiResult = await aiServiceFactory.healthChat(
        prompt,
        context,
        { provider: aiProvider, model: aiModel, language: userLanguage }
      );
      
      if (!aiResult.success) {
        throw new Error(aiResult.error || 'AI analysis failed');
      }
      
      // 保存问答记录
      await this.saveQARecord(userEmail, question, aiResult.message);
      
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
   */
  buildHealthQuestionPrompt(question, context, language = 'zh') {
    if (language === 'en') {
      return `You are a professional, warm, and empathetic AI medical assistant. A user asks:

Question: ${question}

User Context:
${context ? JSON.stringify(context, null, 2) : 'No previous context'}

Please provide:
1. Professional and accurate health information
2. Personalized advice based on user context
3. Warm and empathetic tone
4. Clear explanations
5. Next steps or recommendations

Please respond in a warm, professional, and easy-to-understand manner.`;
    } else {
      return `你是一位专业、有温度、富有同理心的AI医疗助手。用户提问：

问题：${question}

用户上下文：
${context ? JSON.stringify(context, null, 2) : '无历史上下文'}

请提供：
1. 专业准确的健康信息
2. 基于用户上下文的个性化建议
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
   * 获取用户上下文
   */
  async getUserContext(userEmail) {
    try {
      // 获取最近的对话历史
      const chatRef = collection(db, 'chatMessages');
      const q = query(
        chatRef,
        where('userEmail', '==', userEmail),
        orderBy('timestamp', 'desc'),
        limit(5)
      );
      
      const querySnapshot = await getDocs(q);
      const recentMessages = [];
      
      querySnapshot.forEach((doc) => {
        recentMessages.push(doc.data());
      });
      
      return recentMessages.length > 0 ? JSON.stringify(recentMessages.reverse()) : null;
    } catch (error) {
      console.error('❌ Error getting user context:', error);
      return null;
    }
  }

  /**
   * 保存解读记录
   */
  async saveExplanation(userEmail, type, data, explanation) {
    try {
      const recordRef = collection(db, 'rehabilitationRecords');
      await addDoc(recordRef, {
        userEmail,
        type: 'explanation',
        subtype: type,
        data,
        explanation,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Error saving explanation:', error);
    }
  }

  /**
   * 保存支持记录
   */
  async saveSupportRecord(userEmail, type, context, support) {
    try {
      const recordRef = collection(db, 'rehabilitationRecords');
      await addDoc(recordRef, {
        userEmail,
        type: 'support',
        subtype: type,
        context,
        support,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Error saving support record:', error);
    }
  }

  /**
   * 保存冥想记录
   */
  async saveMeditationRecord(userEmail, type, guidance) {
    try {
      const recordRef = collection(db, 'rehabilitationRecords');
      await addDoc(recordRef, {
        userEmail,
        type: 'meditation',
        subtype: type,
        guidance,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Error saving meditation record:', error);
    }
  }

  /**
   * 保存问答记录
   */
  async saveQARecord(userEmail, question, answer) {
    try {
      const recordRef = collection(db, 'rehabilitationRecords');
      await addDoc(recordRef, {
        userEmail,
        type: 'qa',
        question,
        answer,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Error saving QA record:', error);
    }
  }
}

module.exports = new RehabilitationAssistantService();
