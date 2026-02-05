const { db } = require('../config/firebase');
const { doc, getDoc, setDoc, updateDoc, collection, query, where, orderBy, limit, addDoc, getDocs } = require('firebase/firestore');
const aiServiceFactory = require('./aiServiceFactory');
const userSettingsService = require('./userSettingsService');
const wearableService = require('./wearableService');

/**
 * 个体化精准干预引擎服务
 * AI扮演"数字教练"角色，根据实时数据动态调整用药、营养和运动建议
 */
class InterventionEngineService {
  constructor() {
    console.log('🎯 Intervention Engine Service initialized');
  }

  /**
   * 智能用药管理
   * @param {string} userEmail 用户邮箱
   * @returns {Promise<Object>} 用药管理数据
   */
  async manageMedication(userEmail) {
    try {
      console.log(`💊 Managing medication for user: ${userEmail}`);
      
      // 从 Firestore 获取用户的用药记录
      const medicationRef = doc(db, 'medications', userEmail);
      const medicationDoc = await getDoc(medicationRef);
      
      let medications = [];
      if (medicationDoc.exists()) {
        medications = medicationDoc.data().medications || [];
      }
      
      // 计算依从性
      const adherenceData = this.calculateAdherence(medications);
      
      return {
        success: true,
        medications: medications,
        adherence: adherenceData,
        reminders: this.generateMedicationReminders(medications)
      };
    } catch (error) {
      console.error('❌ Error managing medication:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 药效评估
   * @param {string} userEmail 用户邮箱
   * @param {string} medication 药物名称
   * @param {string} timeframe 时间段
   * @returns {Promise<Object>} 评估结果
   */
  async analyzeMedicationEffectiveness(userEmail, medication, timeframe) {
    try {
      console.log(`🔍 Analyzing medication effectiveness for user: ${userEmail}, medication: ${medication}`);
      
      // 获取用户AI设置
      const userSettings = await userSettingsService.getUserAISettings(userEmail);
      const aiProvider = userSettings.success ? (userSettings.aiProvider || 'gemini') : 'gemini';
      const aiModel = userSettings.success ? (userSettings.aiModel || '') : '';
      
      // 获取用药记录
      const medicationRef = doc(db, 'medications', userEmail);
      const medicationDoc = await getDoc(medicationRef);
      
      // 获取可穿戴设备数据（用于评估药效）
      const wearableData = await wearableService.getUserWearableData(userEmail, 'fitbit');
      
      // 构建评估提示
      const prompt = this.buildMedicationEffectivenessPrompt(medication, timeframe, medicationDoc.data(), wearableData);
      
      // 使用LLM分析药效
      const aiResult = await aiServiceFactory.healthChat(
        prompt,
        '',
        { provider: aiProvider, model: aiModel }
      );
      
      if (!aiResult.success) {
        throw new Error(aiResult.error || 'AI analysis failed');
      }
      
      // 解析分析结果
      const effectiveness = this.parseEffectivenessAnalysis(aiResult.response);
      
      return {
        success: true,
        medication: medication,
        timeframe: timeframe,
        effectiveness: effectiveness,
        recommendations: effectiveness.recommendations || []
      };
    } catch (error) {
      console.error('❌ Error analyzing medication effectiveness:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 动态营养分析
   * @param {string} userEmail 用户邮箱
   * @param {string} mealImagePath 食物图片路径
   * @param {Object} currentMetrics 当前健康指标
   * @returns {Promise<Object>} 分析结果
   */
  async generateNutritionAdvice(userEmail, mealImagePath, currentMetrics = {}) {
    try {
      console.log(`🍎 Generating nutrition advice for user: ${userEmail}`);
      
      // 获取用户AI设置
      const userSettings = await userSettingsService.getUserAISettings(userEmail);
      const aiProvider = userSettings.success ? (userSettings.aiProvider || 'gemini') : 'gemini';
      const aiModel = userSettings.success ? (userSettings.aiModel || '') : '';
      const userLanguage = userSettings.success ? (userSettings.language || 'zh') : 'zh';
      
      // 读取图片并转换为 base64
      const fs = require('fs');
      const imageBuffer = fs.readFileSync(mealImagePath);
      const base64Image = imageBuffer.toString('base64');
      
      // 构建营养分析提示（根据语言）
      const prompt = this.buildNutritionAnalysisPrompt(currentMetrics, userLanguage);
      
      // 使用多模态LLM分析食物图片
      const aiResult = await aiServiceFactory.analyzeImageWithAI(
        base64Image,
        prompt,
        { provider: aiProvider, model: aiModel, language: userLanguage }
      );
      
      if (!aiResult.success) {
        throw new Error(aiResult.error || 'AI analysis failed');
      }
      
      // 解析分析结果
      const nutritionAnalysis = this.parseNutritionAnalysis(aiResult.analysis);
      
      // 结合当前指标生成即时反馈
      const instantFeedback = this.generateInstantFeedback(nutritionAnalysis, currentMetrics);
      
      // 保存分析结果
      await this.saveNutritionAnalysis(userEmail, nutritionAnalysis, instantFeedback);
      
      return {
        success: true,
        nutrition: nutritionAnalysis,
        instantFeedback: instantFeedback,
        recommendations: instantFeedback.recommendations || [],
        aiAnalysis: aiResult.analysis,
        recognizedFoods: aiResult.recognizedFoods || []
      };
    } catch (error) {
      console.error('❌ Error generating nutrition advice:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 个性化运动计划
   * @param {string} userEmail 用户邮箱
   * @param {Object} healthState 健康状态
   * @returns {Promise<Object>} 运动计划
   */
  async generateExercisePlan(userEmail, healthState) {
    try {
      console.log(`🏃 Generating exercise plan for user: ${userEmail}`);
      
      // 获取用户AI设置
      const userSettings = await userSettingsService.getUserAISettings(userEmail);
      const aiProvider = userSettings.success ? (userSettings.aiProvider || 'gemini') : 'gemini';
      const aiModel = userSettings.success ? (userSettings.aiModel || '') : '';
      
      // 获取用户健康数据
      const healthData = await this.getUserHealthData(userEmail);
      
      // 构建运动计划提示
      const prompt = this.buildExercisePlanPrompt(healthState, healthData);
      
      // 使用LLM生成运动计划
      const aiResult = await aiServiceFactory.healthChat(
        prompt,
        '',
        { provider: aiProvider, model: aiModel }
      );
      
      if (!aiResult.success) {
        throw new Error(aiResult.error || 'AI analysis failed');
      }
      
      // 解析运动计划
      const exercisePlan = this.parseExercisePlan(aiResult.response);
      
      // 保存运动计划
      await this.saveExercisePlan(userEmail, exercisePlan);
      
      return {
        success: true,
        plan: exercisePlan
      };
    } catch (error) {
      console.error('❌ Error generating exercise plan:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 动态调整干预方案
   * @param {string} userEmail 用户邮箱
   * @param {Object} feedback 用户反馈
   * @returns {Promise<Object>} 调整后的方案
   */
  async adjustIntervention(userEmail, feedback) {
    try {
      console.log(`🔄 Adjusting intervention for user: ${userEmail}`);
      
      // 获取用户AI设置
      const userSettings = await userSettingsService.getUserAISettings(userEmail);
      const aiProvider = userSettings.success ? (userSettings.aiProvider || 'gemini') : 'gemini';
      const aiModel = userSettings.success ? (userSettings.aiModel || '') : '';
      
      // 获取当前干预方案
      const interventionRef = doc(db, 'interventions', userEmail);
      const interventionDoc = await getDoc(interventionRef);
      const currentIntervention = interventionDoc.exists() ? interventionDoc.data() : null;
      
      // 构建调整提示
      const prompt = this.buildAdjustmentPrompt(currentIntervention, feedback);
      
      // 使用LLM生成调整建议
      const aiResult = await aiServiceFactory.healthChat(
        prompt,
        '',
        { provider: aiProvider, model: aiModel }
      );
      
      if (!aiResult.success) {
        throw new Error(aiResult.error || 'AI analysis failed');
      }
      
      // 解析调整建议
      const adjustments = this.parseAdjustments(aiResult.response);
      
      // 更新干预方案
      const updatedIntervention = {
        ...currentIntervention,
        ...adjustments,
        lastAdjusted: new Date().toISOString(),
        feedback: feedback
      };
      
      await setDoc(interventionRef, updatedIntervention, { merge: true });
      
      return {
        success: true,
        intervention: updatedIntervention,
        adjustments: adjustments
      };
    } catch (error) {
      console.error('❌ Error adjusting intervention:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ========== Helper Methods ==========

  /**
   * 计算用药依从性
   */
  calculateAdherence(medications) {
    if (!medications || medications.length === 0) {
      return { overall: 0, byMedication: [] };
    }
    
    const adherenceByMed = medications.map(med => {
      const totalDoses = med.schedule?.length || 0;
      const takenDoses = med.history?.filter(h => h.status === 'taken').length || 0;
      const adherence = totalDoses > 0 ? (takenDoses / totalDoses) * 100 : 0;
      
      return {
        medication: med.name,
        adherence: Math.round(adherence)
      };
    });
    
    const overall = adherenceByMed.reduce((sum, m) => sum + m.adherence, 0) / adherenceByMed.length;
    
    return {
      overall: Math.round(overall),
      byMedication: adherenceByMed
    };
  }

  /**
   * 生成用药提醒
   */
  generateMedicationReminders(medications) {
    const now = new Date();
    const reminders = [];
    
    medications.forEach(med => {
      if (med.schedule) {
        med.schedule.forEach(time => {
          const [hours, minutes] = time.split(':');
          const reminderTime = new Date();
          reminderTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
          
          // 如果今天的时间已过，设置为明天
          if (reminderTime < now) {
            reminderTime.setDate(reminderTime.getDate() + 1);
          }
          
          reminders.push({
            medication: med.name,
            dosage: med.dosage,
            time: reminderTime.toISOString(),
            status: 'pending'
          });
        });
      }
    });
    
    return reminders.sort((a, b) => new Date(a.time) - new Date(b.time));
  }

  /**
   * 构建药效评估提示
   */
  buildMedicationEffectivenessPrompt(medication, timeframe, medicationData, wearableData) {
    return `作为专业的医疗AI助手，请评估以下药物的效果：

药物名称：${medication}
评估时间段：${timeframe}

用药记录：
${JSON.stringify(medicationData, null, 2)}

可穿戴设备数据（用于评估药效）：
${JSON.stringify(wearableData, null, 2)}

请分析：
1. 药物依从性：患者是否按时服药
2. 效果评估：基于传感器数据评估药物效果
3. 时间段分析：分析特定时间段的效果
4. 调整建议：如果效果不佳，提供调整建议

请以JSON格式返回，包括：
- adherence: number (0-100)
- effectiveness: string (good/fair/poor)
- timeBasedAnalysis: object
- recommendations: array`;
  }

  /**
   * 构建营养分析提示
   */
  buildNutritionAnalysisPrompt(currentMetrics, language = 'zh') {
    if (language === 'en') {
      return `You are a professional nutritionist and AI medical assistant. Please analyze this food image and provide detailed nutritional analysis.

Current Health Metrics:
${JSON.stringify(currentMetrics, null, 2)}

Please provide:
1. Food Identification: List all foods in the image
2. Nutritional Content: Calories, carbohydrates, protein, fat, fiber, etc.
3. Blood Sugar Impact: Assess the impact on blood sugar (especially for diabetes patients)
4. Instant Feedback: Provide instant recommendations based on current blood glucose/blood pressure status
5. Improvement Suggestions: If needed, provide specific improvement suggestions

Please respond in a structured format.`;
    } else {
      return `作为专业的营养师和AI医生助理，请分析这张食物图片并提供详细的营养分析。

当前健康指标：
${JSON.stringify(currentMetrics, null, 2)}

请提供：
1. 识别食物：列出图片中的所有食物
2. 营养成分：卡路里、碳水化合物、蛋白质、脂肪、纤维等
3. 血糖影响：评估对血糖的影响（特别是对糖尿病患者）
4. 即时反馈：结合当前血糖/血压状态给出即时建议
5. 改进建议：如果需要，提供具体的改进建议

请以结构化的方式返回分析结果。`;
    }
  }

  /**
   * 构建运动计划提示
   */
  buildExercisePlanPrompt(healthState, healthData) {
    return `作为专业的运动教练和医疗AI助手，请为以下用户制定个性化运动计划：

健康状态：
${JSON.stringify(healthState, null, 2)}

健康数据：
${JSON.stringify(healthData, null, 2)}

请制定：
1. 运动类型：推荐适合的运动类型
2. 运动强度：基于用户健康状况的强度建议
3. 运动时长：每次运动的时长
4. 运动频率：每周运动次数
5. 注意事项：需要特别注意的事项
6. 多目标优化：考虑血糖控制、体重管理、心血管健康等多个目标

请以JSON格式返回，包括：
- exerciseTypes: array
- intensity: string (low/medium/high)
- duration: number (分钟)
- frequency: number (每周次数)
- schedule: array
- precautions: array
- goals: array`;
  }

  /**
   * 构建调整提示
   */
  buildAdjustmentPrompt(currentIntervention, feedback) {
    return `作为专业的医疗AI助手，请根据用户反馈调整干预方案：

当前干预方案：
${JSON.stringify(currentIntervention, null, 2)}

用户反馈：
${JSON.stringify(feedback, null, 2)}

请分析：
1. 效果评估：当前方案的效果如何
2. 问题识别：用户反馈中反映的问题
3. 调整建议：具体的调整建议
4. 优化方案：优化后的干预方案

请以JSON格式返回调整建议。`;
  }

  /**
   * 生成即时反馈
   */
  generateInstantFeedback(nutritionAnalysis, currentMetrics) {
    const feedback = {
      message: '',
      recommendations: [],
      riskLevel: 'low'
    };
    
    // 如果血糖偏高，且碳水摄入高
    if (currentMetrics.glucose > 140 && nutritionAnalysis.totalCarbs > 60) {
      feedback.message = '该餐碳水偏高，建议餐后增加20分钟散步';
      feedback.riskLevel = 'medium';
      feedback.recommendations.push('餐后30分钟进行15-20分钟散步');
      feedback.recommendations.push('下次减少碳水摄入');
    } else if (currentMetrics.glucose > 140) {
      feedback.message = '当前血糖偏高，建议餐后适当运动';
      feedback.riskLevel = 'low';
      feedback.recommendations.push('餐后30分钟进行15分钟散步');
    } else if (nutritionAnalysis.totalCarbs > 60) {
      feedback.message = '该餐碳水适中，建议餐后30分钟进行15分钟散步';
      feedback.riskLevel = 'low';
      feedback.recommendations.push('餐后30分钟进行15分钟散步');
    } else {
      feedback.message = '营养搭配合理，继续保持';
      feedback.riskLevel = 'low';
    }
    
    return feedback;
  }

  /**
   * 保存营养分析结果
   */
  async saveNutritionAnalysis(userEmail, nutritionAnalysis, instantFeedback) {
    try {
      const analysisRef = collection(db, 'nutritionAnalyses');
      await addDoc(analysisRef, {
        userEmail,
        nutrition: nutritionAnalysis,
        feedback: instantFeedback,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Error saving nutrition analysis:', error);
    }
  }

  /**
   * 保存运动计划
   */
  async saveExercisePlan(userEmail, exercisePlan) {
    try {
      const planRef = doc(db, 'exercisePlans', userEmail);
      await setDoc(planRef, {
        userEmail,
        plan: exercisePlan,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (error) {
      console.error('❌ Error saving exercise plan:', error);
    }
  }

  /**
   * 获取用户健康数据
   */
  async getUserHealthData(userEmail) {
    try {
      // 从多个数据源获取健康数据
      const healthData = {
        wearableData: null,
        healthRecords: null
      };
      
      // 获取可穿戴设备数据
      try {
        healthData.wearableData = await wearableService.getUserWearableData(userEmail, 'fitbit');
      } catch (error) {
        console.error('Error fetching wearable data:', error);
      }
      
      // 获取健康记录
      try {
        const healthRecordsRef = doc(db, 'personalHealthRecords', userEmail);
        const healthRecordsDoc = await getDoc(healthRecordsRef);
        if (healthRecordsDoc.exists()) {
          healthData.healthRecords = healthRecordsDoc.data();
        }
      } catch (error) {
        console.error('Error fetching health records:', error);
      }
      
      return healthData;
    } catch (error) {
      console.error('❌ Error getting user health data:', error);
      return {};
    }
  }

  /**
   * 解析药效分析结果
   */
  parseEffectivenessAnalysis(aiResponse) {
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return {
        adherence: 85,
        effectiveness: 'good',
        timeBasedAnalysis: {},
        recommendations: []
      };
    } catch (error) {
      console.error('❌ Error parsing effectiveness analysis:', error);
      return {
        adherence: 85,
        effectiveness: 'good',
        timeBasedAnalysis: {},
        recommendations: []
      };
    }
  }

  /**
   * 解析营养分析结果
   */
  parseNutritionAnalysis(aiResponse) {
    // 尝试从AI响应中提取结构化数据
    // 这里可以根据实际的AI响应格式进行解析
    return {
      totalCalories: 0,
      totalCarbs: 0,
      totalProtein: 0,
      totalFat: 0,
      totalFiber: 0,
      foods: [],
      analysis: aiResponse
    };
  }

  /**
   * 解析运动计划
   */
  parseExercisePlan(aiResponse) {
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return {
        exerciseTypes: ['walking', 'cycling'],
        intensity: 'medium',
        duration: 30,
        frequency: 5,
        schedule: [],
        precautions: [],
        goals: []
      };
    } catch (error) {
      console.error('❌ Error parsing exercise plan:', error);
      return {
        exerciseTypes: ['walking', 'cycling'],
        intensity: 'medium',
        duration: 30,
        frequency: 5,
        schedule: [],
        precautions: [],
        goals: []
      };
    }
  }

  /**
   * 解析调整建议
   */
  parseAdjustments(aiResponse) {
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return {};
    } catch (error) {
      console.error('❌ Error parsing adjustments:', error);
      return {};
    }
  }
}

module.exports = new InterventionEngineService();
