const { db } = require('../config/firebase');
const { doc, getDoc, setDoc, collection, addDoc } = require('firebase/firestore');
const fs = require('fs');
const aiServiceFactory = require('./aiServiceFactory');
const userSettingsService = require('./userSettingsService');
const wearableService = require('./wearableService');
const openaiService = require('./openaiService');
const { userBasicInfoRepo, medicationRepo } = require('../repositories');
const {
  createInterventionCollection,
  validateInterventionCollection
} = require('../models/interventionModels');

/**
 * 精准干预引擎服务
 * 基于AI的个性化健康干预系统，根据实时数据动态调整用药、营养和运动建议
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
      
      const sanitizedEmail = userEmail.replace(/[^a-zA-Z0-9@._-]/g, '_');
      let medications = await medicationRepo.listActive(sanitizedEmail);
      medications = medications.map(med => ({
        ...med,
        schedule: med.schedule || [],
        history: med.history || [],
        time: med.time || this.inferMedicationTimes(med.frequency)
      }));
      
      const adherenceData = this.calculateAdherence(medications);
      const reminders = this.generateMedicationReminders(medications);
      
      // 完善输出格式：为每个medication添加adherence, nextDose, status
      const medicationsWithDetails = medications.map(med => {
        const medAdherence = adherenceData.byMedication.find(m => m.medication === med.name);
        const nextReminder = reminders.find(r => r.medicationId === med.id);
        const today = new Date().toISOString().split('T')[0];
        const todaySchedule = med.schedule?.filter(s => s.date === today) || [];
        const pendingToday = todaySchedule.filter(s => s.status === 'pending').length > 0;
        
        return {
          id: med.id,
          name: med.name,
          dosage: med.dosage,
          frequency: med.frequency,
          time: med.time,
          adherence: medAdherence?.adherence || 0,
          nextDose: nextReminder?.time || null,
          status: pendingToday ? 'pending' : (todaySchedule.length > 0 ? 'taken' : 'pending')
        };
      });
      
      return {
        success: true,
        medications: medicationsWithDetails,
        adherence: adherenceData,
        reminders: reminders.map(r => ({
          medication: r.medication,
          time: r.time,
          message: `请在${new Date(r.time).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}服用${r.medication} ${r.dosage}`
        }))
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
   * @param {string} timeframe 评估时间段
   * @returns {Promise<Object>} 评估结果
   */
  async analyzeMedicationEffectiveness(userEmail, medication, timeframe) {
    try {
      console.log(`🔍 Analyzing medication effectiveness: ${medication} (${timeframe})`);
      
      const userSettings = await userSettingsService.getUserAISettings(userEmail);
      const { aiProvider, aiModel } = this.getAIServiceConfig(userSettings);
      
      const sanitizedEmail = userEmail.replace(/[^a-zA-Z0-9@._-]/g, '_');
      const medicationsList = await medicationRepo.listActive(sanitizedEmail);
      const medicationData = { medications: medicationsList };
      
      const wearableData = await wearableService.getUserWearableData(userEmail, 'fitbit');
      
      // 通过 Repository 获取健康档案（便于今后换国内数据库）
      const basicInfo = await userBasicInfoRepo.getBasicInfo(sanitizedEmail);
      const healthRecord = basicInfo ? { ...basicInfo, medications: medicationsList } : null;
      
      const prompt = this.buildMedicationEffectivenessPrompt(
        medication, 
        timeframe, 
        medicationData, 
        wearableData,
        healthRecord
      );
      
      const aiResult = await aiServiceFactory.healthChat(
        prompt,
        '',
        { provider: aiProvider, model: aiModel }
      );
      
      if (!aiResult.success) {
        throw new Error(aiResult.error || 'AI analysis failed');
      }
      
      const effectiveness = this.parseEffectivenessAnalysis(
        aiResult.response ?? aiResult.message ?? '',
        medicationData,
        wearableData
      );
      
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
      
      const userSettings = await userSettingsService.getUserAISettings(userEmail);
      const userLanguage = userSettings.success ? (userSettings.language || 'zh') : 'zh';
      
      // 营养分析优先使用 Gemini 图像模型（识别效果更好，与饮食分析接口一致）
      const nutritionProvider = 'gemini';
      const nutritionModel = 'gemini-2.5-flash';
      
      // 通过 Repository 获取用户健康档案（便于今后换国内数据库）
      const sanitizedEmail = userEmail.replace(/[^a-zA-Z0-9@._-]/g, '_');
      const basicInfo = await userBasicInfoRepo.getBasicInfo(sanitizedEmail);
      const medicationsList = await medicationRepo.listActive(sanitizedEmail);
      const healthRecord = basicInfo ? { ...basicInfo, medications: medicationsList } : null;
      
      const imageBuffer = fs.readFileSync(mealImagePath);
      const base64Image = imageBuffer.toString('base64');
      
      const prompt = this.buildNutritionAnalysisPrompt(currentMetrics, healthRecord, userLanguage);
      
      const aiResult = await aiServiceFactory.analyzeImageWithAI(
        base64Image,
        prompt,
        { provider: nutritionProvider, model: nutritionModel, language: userLanguage }
      );
      
      if (!aiResult.success) {
        throw new Error(aiResult.error || 'AI analysis failed');
      }
      
      const nutritionAnalysis = this.parseNutritionAnalysis(aiResult.analysis || aiResult.response);
      const instantFeedback = this.generateInstantFeedback(nutritionAnalysis, currentMetrics);
      
      await this.saveNutritionAnalysis(userEmail, nutritionAnalysis, instantFeedback);
      
      return {
        success: true,
        nutrition: nutritionAnalysis,
        instantFeedback: instantFeedback,
        recommendations: instantFeedback.recommendations || [],
        aiAnalysis: aiResult.analysis || aiResult.response,
        recognizedFoods: aiResult.recognizedFoods || nutritionAnalysis.foods || []
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
  async generateExercisePlan(userEmail, healthState = {}) {
    try {
      console.log(`🏃 Generating exercise plan for user: ${userEmail}`);
      
      const userSettings = await userSettingsService.getUserAISettings(userEmail);
      const { aiProvider, aiModel } = this.getAIServiceConfig(userSettings);
      
      const healthData = await this.getUserHealthData(userEmail);
      
      const prompt = this.buildExercisePlanPrompt(healthState, healthData);
      
      const aiResult = await aiServiceFactory.healthChat(
        prompt,
        '',
        { provider: aiProvider, model: aiModel }
      );
      
      if (!aiResult.success) {
        throw new Error(aiResult.error || 'AI analysis failed');
      }
      
      const rawText = aiResult.response ?? aiResult.message ?? '';
      const exercisePlan = this.parseExercisePlan(rawText, healthState);
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
      
      const userSettings = await userSettingsService.getUserAISettings(userEmail);
      const { aiProvider, aiModel } = this.getAIServiceConfig(userSettings);
      
      const sanitizedEmail = userEmail.replace(/[^a-zA-Z0-9@._-]/g, '_');
      const interventionRef = doc(db, 'interventions', sanitizedEmail);
      const interventionDoc = await getDoc(interventionRef);
      
      let currentIntervention = null;
      if (interventionDoc.exists()) {
        currentIntervention = this.normalizeInterventionStructure(interventionDoc.data());
      } else {
        currentIntervention = createInterventionCollection(userEmail, {});
        await setDoc(interventionRef, currentIntervention, { merge: true });
      }
      
      // 获取用户健康数据用于调整分析
      const healthData = await this.getUserHealthData(userEmail);
      
      // 聚合当前实际用药与运动计划，供 AI 参考
      let currentMedications = [];
      let currentExercisePlan = null;
      try {
        currentMedications = await medicationRepo.listActive(sanitizedEmail);
      } catch (e) {
        console.warn('⚠️ Failed to load medications for adjustment:', e.message);
      }
      try {
        const planRef = doc(db, 'exercisePlans', sanitizedEmail);
        const planDoc = await getDoc(planRef);
        if (planDoc.exists() && planDoc.data().plan) {
          currentExercisePlan = planDoc.data().plan;
        }
      } catch (e) {
        console.warn('⚠️ Failed to load exercise plan for adjustment:', e.message);
      }
      
      const aggregatedContext = { currentMedications, currentExercisePlan };
      const prompt = this.buildAdjustmentPrompt(currentIntervention, feedback, healthData, aggregatedContext);
      
      const aiResult = await aiServiceFactory.healthChat(
        prompt,
        '',
        { provider: aiProvider, model: aiModel }
      );
      
      if (!aiResult.success) {
        throw new Error(aiResult.error || 'AI analysis failed');
      }
      
      const adjustments = this.parseAdjustments(
        aiResult.response ?? aiResult.message ?? '',
        currentIntervention,
        feedback
      );
      
      const updatedIntervention = {
        ...currentIntervention,
        medication: {
          ...currentIntervention.medication,
          adjustments: [...(currentIntervention.medication?.adjustments || []), ...(adjustments.medication?.adjustments || [])],
          currentPlan: adjustments.medication?.currentPlan || currentIntervention.medication?.currentPlan
        },
        nutrition: {
          ...currentIntervention.nutrition,
          adjustments: [...(currentIntervention.nutrition?.adjustments || []), ...(adjustments.nutrition?.adjustments || [])],
          mealPlan: adjustments.nutrition?.mealPlan || currentIntervention.nutrition?.mealPlan,
          dailyTargets: adjustments.nutrition?.dailyTargets || currentIntervention.nutrition?.dailyTargets
        },
        exercise: {
          ...currentIntervention.exercise,
          adjustments: [...(currentIntervention.exercise?.adjustments || []), ...(adjustments.exercise?.adjustments || [])],
          weeklyPlan: adjustments.exercise?.weeklyPlan || currentIntervention.exercise?.weeklyPlan,
          progression: adjustments.exercise?.progression || currentIntervention.exercise?.progression
        },
        lastAdjusted: new Date().toISOString(),
        feedback: feedback,
        version: (currentIntervention.version || 1) + 1
      };
      
      const validation = validateInterventionCollection(updatedIntervention);
      if (!validation.valid) {
        console.warn('⚠️ Intervention validation warning:', validation.error);
      }
      
      await setDoc(interventionRef, validation.value || updatedIntervention, { merge: true });
      
      return {
        success: true,
        intervention: updatedIntervention,
        adjustments: {
          summary: adjustments.summary || '干预方案已根据反馈进行调整',
          changes: adjustments.changes || [],
          expectedOutcomes: adjustments.expectedOutcomes || {
            shortTerm: '预期在短期内看到改善',
            longTerm: '长期坚持将获得更好的健康效果'
          }
        }
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
   * 计算用药依从性
   */
  calculateAdherence(medications) {
    if (!medications || medications.length === 0) {
      return { overall: 0, byMedication: [] };
    }
    
    const adherenceByMed = medications.map(med => {
      const totalDoses = med.schedule?.length || 0;
      const takenDoses = med.history?.filter(h => h.status === 'taken').length || 0;
      const missedDoses = med.history?.filter(h => h.status === 'missed').length || 0;
      const adherence = totalDoses > 0 ? (takenDoses / totalDoses) * 100 : 0;
      
      return {
        medication: med.name,
        adherence: Math.round(adherence),
        missedDoses: missedDoses,
        totalDoses: totalDoses
      };
    });
    
    const overall = adherenceByMed.length > 0
      ? Math.round(adherenceByMed.reduce((sum, m) => sum + m.adherence, 0) / adherenceByMed.length)
      : 0;
    
    return {
      overall: overall,
      byMedication: adherenceByMed
    };
  }

  /**
   * 从频率推断服药时间
   */
  inferMedicationTimes(frequency) {
    if (!frequency) return ['08:00', '20:00'];
    
    const times = [];
    const lowerFreq = frequency.toLowerCase();
    const match = lowerFreq.match(/(\d+)/);
    const count = match ? parseInt(match[1]) : 2;
    
    if (count === 1) {
      times.push('08:00');
    } else if (count === 2) {
      times.push('08:00', '20:00');
    } else if (count === 3) {
      times.push('08:00', '14:00', '20:00');
    } else if (count === 4) {
      times.push('08:00', '12:00', '18:00', '22:00');
    } else {
      const interval = 24 / count;
      for (let i = 0; i < count; i++) {
        const hour = Math.floor(8 + i * interval);
        const minute = Math.floor((8 + i * interval - hour) * 60);
        times.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
      }
    }
    
    return times;
  }

  /**
   * 生成用药提醒
   */
  generateMedicationReminders(medications) {
    const now = new Date();
    const reminders = [];
    const today = now.toISOString().split('T')[0];
    
    medications.forEach(med => {
      if (med.status !== 'active') return;
      
      const times = med.time && med.time.length > 0 ? med.time : this.inferMedicationTimes(med.frequency);
      
      times.forEach(timeStr => {
        const existingSchedule = med.schedule?.find(s => s.date === today && s.time === timeStr);
        
        if (!existingSchedule || existingSchedule.status === 'pending') {
          const [hours, minutes] = timeStr.split(':');
          const reminderTime = new Date();
          reminderTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
          
          if (reminderTime < now) {
            reminderTime.setDate(reminderTime.getDate() + 1);
          }
          
          reminders.push({
            medication: med.name,
            medicationId: med.id,
            dosage: med.dosage,
            time: reminderTime.toISOString(),
            status: 'pending'
          });
        }
      });
    });
    
    return reminders.sort((a, b) => new Date(a.time) - new Date(b.time));
  }

  /**
   * 构建药效评估提示
   */
  buildMedicationEffectivenessPrompt(medication, timeframe, medicationData, wearableData, healthRecord) {
    return `作为专业的医疗AI助手，请评估以下药物的效果：

药物名称：${medication}
评估时间段：${timeframe}

用药记录：
${JSON.stringify(medicationData, null, 2)}

可穿戴设备数据（用于评估药效）：
${JSON.stringify(wearableData, null, 2)}

用户健康档案：
${JSON.stringify(healthRecord, null, 2)}

请分析：
1. 药物依从性：患者是否按时服药（0-100分）
2. 效果评估：基于传感器数据评估药物效果（good/fair/poor）
3. 趋势分析：对比用药前后的健康指标（心率、血压、血糖等）
4. 改善情况：计算各项指标的改善百分比
5. 调整建议：如果效果不佳，提供具体的调整建议（剂量、时间、药物更换等）

请以JSON格式返回，包括：
- score: number (0-100) - 效果评分
- level: string (good/fair/poor) - 效果等级
- adherence: number (0-100) - 依从性
- trends: object - 趋势分析
  - before: object - 用药前指标
  - after: object - 用药后指标
  - improvement: object - 改善百分比
- analysis: string - 效果分析文本
- recommendations: array - 调整建议列表
  - type: string (dose/timing/medication/lifestyle)
  - suggestion: string
  - reason: string`;
  }

  /**
   * 构建营养分析提示
   * 明确要求识别盘中食物、估算热量等，并仅返回 JSON，避免模型拒绝或输出“无法识别人物/细节”
   */
  buildNutritionAnalysisPrompt(currentMetrics, healthRecord, language = 'zh') {
    const healthInfo = healthRecord ? `
用户健康档案：
- 疾病史：${healthRecord.medicalHistory || '无'}
- 用药记录：${healthRecord.medications || '无'}
- 过敏史：${healthRecord.allergies || '无'}
` : '';
    
    const jsonSchema = `
Respond with ONLY a single JSON object (no markdown, no extra text before or after). Use this exact structure:
{
  "foodIdentification": [{"name": "食物名称", "quantity": "约多少克或份量描述"}],
  "nutritionalContent": {"calories": number, "carbohydrates": number, "protein": number, "fat": number, "fiber": number, "sugars": number},
  "bloodSugarImpact": {"impactLevel": "low|medium|high", "estimatedBloodSugarValue": number, "peakTime": "string"},
  "immediateFeedback": {"advice": "string"},
  "improvementSuggestions": {"advice": "string"}
}`;
    const jsonSchemaZh = `
请只返回一个 JSON 对象（不要 markdown、不要前后多余文字），结构必须严格如下：
{
  "foodIdentification": [{"name": "食物名称", "quantity": "约多少克或份量"}],
  "nutritionalContent": {"calories": 数字, "carbohydrates": 数字, "protein": 数字, "fat": 数字, "fiber": 数字, "sugars": 数字},
  "bloodSugarImpact": {"impactLevel": "low|medium|high", "estimatedBloodSugarValue": 数字, "peakTime": "字符串"},
  "immediateFeedback": {"advice": "建议文字"},
  "improvementSuggestions": {"advice": "改进建议"}
}`;

    if (language === 'en') {
      return `You are a nutrition analysis assistant. The user has uploaded an image of their meal for dietary tracking.

Your task: Identify the dish(es) and ingredients visible in the image, then estimate nutritional content. You must analyze the food in the image. Do not refuse or say you cannot identify "details or people" — we only need food/dish identification. If you are not 100% certain, give your best estimate based on what the food appears to be and note it is an estimate.

Current health metrics (for personalized advice):
${JSON.stringify(currentMetrics, null, 2)}
${healthInfo}
${jsonSchema}`;
    } else {
      return `你是营养分析助手。用户上传了一张餐食图片用于饮食记录。

你的任务：根据图片识别盘中出现的菜品和食材，并估算营养数据。你必须对图片中的食物进行分析，不要拒绝或回答“无法识别具体细节或人物”——我们只需要识别食物。若无法完全确定，请根据视觉上最可能的菜品给出估计即可。

当前健康指标（用于个性化建议）：
${JSON.stringify(currentMetrics, null, 2)}
${healthInfo}
${jsonSchemaZh}`;
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
1. 运动类型：推荐适合的运动类型（包含描述、益处、针对目标）
2. 每周运动计划：详细的每日运动安排
3. 运动强度：基于用户健康状况的强度建议（low/medium/high）
4. 运动时长：每次运动的时长（分钟）
5. 运动频率：每周运动次数
6. 进阶计划：分阶段的进阶计划（week1_2, week3_4等）
7. 注意事项：需要特别注意的事项（针对健康问题）
8. 目标设定：血糖控制、体重管理、心血管健康等目标

请以JSON格式返回，包括：
- exerciseTypes: array
- weeklyPlan: array
- intensity: string (low/medium/high)
- duration: number (分钟)
- frequency: number (每周次数)
- progression: object
- precautions: array
- targetGoals: object`;
  }

  /**
   * 构建调整提示
   * @param {Object} aggregatedContext - 可选，{ currentMedications, currentExercisePlan } 来自 medications / exercisePlans 集合
   */
  buildAdjustmentPrompt(currentIntervention, feedback, healthData, aggregatedContext = {}) {
    const { currentMedications = [], currentExercisePlan = null } = aggregatedContext;
    return `作为专业的医疗AI助手，请根据用户反馈调整干预方案。

当前干预方案（历史调整记录）：
${JSON.stringify(currentIntervention, null, 2)}

当前实际用药记录（来自用药管理，请优先参考）：
${JSON.stringify(currentMedications, null, 2)}

当前运动计划（来自运动计划，请优先参考）：
${currentExercisePlan ? JSON.stringify(currentExercisePlan, null, 2) : '（暂无）'}

用户反馈：
${JSON.stringify(feedback, null, 2)}

用户健康数据（可穿戴、档案等）：
${JSON.stringify(healthData, null, 2)}

请分析：
1. 效果评估：当前方案的效果如何
2. 问题识别：用户反馈中反映的问题
3. 调整建议：具体的调整建议（用药、营养、运动），请结合上述实际用药与运动计划
4. 优化方案：优化后的干预方案

请以JSON格式返回调整建议，包括：
- summary: string - 调整摘要
- changes: array - 具体变化
- medication: object - 用药调整
- nutrition: object - 营养调整
- exercise: object - 运动调整
- expectedOutcomes: object - 预期效果（shortTerm, longTerm）`;
  }

  /**
   * 生成即时反馈
   */
  generateInstantFeedback(nutritionAnalysis, currentMetrics) {
    const feedback = {
      status: 'safe',
      message: '',
      recommendations: []
    };
    
    const glucose = currentMetrics.glucose || 0;
    const carbs = nutritionAnalysis.total?.carbs || nutritionAnalysis.totalCarbs || 0;
    
    if (glucose > 140 && carbs > 60) {
      feedback.status = 'warning';
      feedback.message = '该餐碳水偏高，建议餐后增加20分钟散步';
      feedback.recommendations.push({
        type: 'immediate',
        action: '餐后30分钟进行15-20分钟散步',
        reason: '帮助降低餐后血糖'
      });
      feedback.recommendations.push({
        type: 'next-meal',
        action: '下次减少碳水摄入',
        reason: '控制总碳水摄入量'
      });
    } else if (glucose > 140) {
      feedback.status = 'caution';
      feedback.message = '当前血糖偏高，建议餐后适当运动';
      feedback.recommendations.push({
        type: 'immediate',
        action: '餐后30分钟进行15分钟散步',
        reason: '帮助降低餐后血糖'
      });
    } else if (carbs > 60) {
      feedback.status = 'safe';
      feedback.message = '该餐碳水适中，建议餐后30分钟进行15分钟散步';
      feedback.recommendations.push({
        type: 'immediate',
        action: '餐后30分钟进行15分钟散步',
        reason: '维持血糖稳定'
      });
    } else {
      feedback.status = 'safe';
      feedback.message = '营养搭配合理，继续保持';
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
      const sanitizedEmail = userEmail.replace(/[^a-zA-Z0-9@._-]/g, '_');
      const planRef = doc(db, 'exercisePlans', sanitizedEmail);
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
   * 获取当前用户的运动计划
   * @param {string} userEmail 用户邮箱
   * @returns {Promise<Object>} { success, plan | null }
   */
  async getExercisePlan(userEmail) {
    try {
      const sanitizedEmail = userEmail.replace(/[^a-zA-Z0-9@._-]/g, '_');
      const planRef = doc(db, 'exercisePlans', sanitizedEmail);
      const planDoc = await getDoc(planRef);
      if (planDoc.exists() && planDoc.data().plan) {
        return { success: true, plan: planDoc.data().plan };
      }
      return { success: true, plan: null };
    } catch (error) {
      console.error('❌ Error getting exercise plan:', error);
      return { success: false, plan: null, error: error.message };
    }
  }

  /**
   * 获取用户健康数据
   */
  async getUserHealthData(userEmail) {
    try {
      const sanitizedEmail = userEmail.replace(/[^a-zA-Z0-9@._-]/g, '_');
      const healthData = {
        wearableData: null,
        healthRecords: null
      };
      
      try {
        healthData.wearableData = await wearableService.getUserWearableData(userEmail, 'fitbit');
      } catch (error) {
        console.error('Error fetching wearable data:', error);
      }
      
      try {
        healthData.healthRecords = await userBasicInfoRepo.getFullHealthRecord(sanitizedEmail);
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
  parseEffectivenessAnalysis(aiResponse, medicationData, wearableData) {
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        // 如果没有trends数据，尝试从wearableData计算
        if (!parsed.trends && wearableData) {
          parsed.trends = {
            before: {
              heartRate: wearableData.heartRate || 0,
              bloodPressure: wearableData.bloodPressure || { systolic: 0, diastolic: 0 },
              glucose: wearableData.glucose || 0
            },
            after: {
              heartRate: wearableData.heartRate || 0,
              bloodPressure: wearableData.bloodPressure || { systolic: 0, diastolic: 0 },
              glucose: wearableData.glucose || 0
            },
            improvement: {
              heartRate: 0,
              bloodPressure: 0,
              glucose: 0
            }
          };
        }
        
        return {
          score: parsed.score || 75,
          level: parsed.level || 'fair',
          adherence: parsed.adherence || 85,
          trends: parsed.trends || {},
          analysis: parsed.analysis || '药效评估完成',
          recommendations: parsed.recommendations || []
        };
      }
      
      return {
        score: 75,
        level: 'fair',
        adherence: 85,
        trends: {},
        analysis: '药效评估完成',
        recommendations: []
      };
    } catch (error) {
      console.error('❌ Error parsing effectiveness analysis:', error);
      return {
        score: 75,
        level: 'fair',
        adherence: 85,
        trends: {},
        analysis: '药效评估完成',
        recommendations: []
      };
    }
  }

  /**
   * 解析营养分析结果
   * 支持两种结构：foodIdentification+nutritionalContent 或 foods+total
   */
  parseNutritionAnalysis(aiResponse) {
    const emptyTotal = { calories: 0, carbs: 0, protein: 0, fat: 0, fiber: 0, sugar: 0 };
    const emptyBloodSugar = { level: 'medium', estimatedGlucose: 0, timeToPeak: '30-60分钟', recommendation: '' };
    try {
      const text = (aiResponse && typeof aiResponse === 'string') ? aiResponse : String(aiResponse || '');
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        // 新结构：foodIdentification + nutritionalContent
        if (parsed.foodIdentification && parsed.nutritionalContent) {
          const nc = parsed.nutritionalContent;
          return {
            foods: parsed.foodIdentification.map(f => ({ name: f.name, quantity: f.quantity })),
            total: {
              calories: nc.calories ?? 0,
              carbs: nc.carbohydrates ?? nc.carbs ?? 0,
              protein: nc.protein ?? 0,
              fat: nc.fat ?? 0,
              fiber: nc.fiber ?? 0,
              sugar: nc.sugars ?? nc.sugar ?? 0
            },
            bloodSugarImpact: {
              level: parsed.bloodSugarImpact?.impactLevel ?? 'medium',
              estimatedGlucose: parsed.bloodSugarImpact?.estimatedBloodSugarValue ?? 0,
              timeToPeak: parsed.bloodSugarImpact?.peakTime ?? '30-60分钟',
              recommendation: parsed.immediateFeedback?.advice ?? parsed.improvementSuggestions?.advice ?? ''
            },
            immediateFeedback: parsed.immediateFeedback,
            improvementSuggestions: parsed.improvementSuggestions
          };
        }
        // 旧结构：foods + total
        return {
          foods: parsed.foods || [],
          total: parsed.total || {
            calories: parsed.totalCalories ?? 0,
            carbs: parsed.totalCarbs ?? 0,
            protein: parsed.totalProtein ?? 0,
            fat: parsed.totalFat ?? 0,
            fiber: parsed.totalFiber ?? 0,
            sugar: parsed.totalSugar ?? 0
          },
          bloodSugarImpact: parsed.bloodSugarImpact || {
            level: 'medium',
            estimatedGlucose: 0,
            timeToPeak: '30-60分钟',
            recommendation: ''
          }
        };
      }
      return { foods: [], total: emptyTotal, bloodSugarImpact: emptyBloodSugar };
    } catch (error) {
      console.error('❌ Error parsing nutrition analysis:', error);
      return { foods: [], total: emptyTotal, bloodSugarImpact: emptyBloodSugar };
    }
  }

  /**
   * 解析运动计划
   */
  parseExercisePlan(aiResponse, healthState) {
    const normalizeExerciseType = (item) => {
      if (item == null || typeof item !== 'object') return { type: String(item), description: '', benefits: [], targetGoals: [] };
      const toStrArr = (v) => {
        if (Array.isArray(v)) return v.map(x => (x != null && typeof x === 'string' ? x : String(x)));
        return v != null ? [String(v)] : [];
      };
      return {
        type: item.type || item.name || '',
        description: item.description != null ? String(item.description) : '',
        benefits: toStrArr(item.benefits),
        targetGoals: toStrArr(item.targetGoals)
      };
    };
    try {
      const text = (aiResponse && typeof aiResponse === 'string') ? aiResponse : '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const rawTypes = parsed.exerciseTypes || [];
        return {
          exerciseTypes: rawTypes.map(normalizeExerciseType),
          weeklyPlan: parsed.weeklyPlan || [],
          intensity: parsed.intensity || 'medium',
          duration: parsed.duration || 30,
          frequency: parsed.frequency || 5,
          progression: parsed.progression || {},
          precautions: Array.isArray(parsed.precautions) ? parsed.precautions : [],
          targetGoals: parsed.targetGoals && typeof parsed.targetGoals === 'object' ? parsed.targetGoals : {}
        };
      }
      
      return {
        exerciseTypes: [{ type: 'walking', description: '快走', benefits: ['改善心血管健康'], targetGoals: ['weight_loss'] }],
        weeklyPlan: [],
        intensity: 'medium',
        duration: 30,
        frequency: 5,
        progression: {},
        precautions: [],
        targetGoals: {}
      };
    } catch (error) {
      console.error('❌ Error parsing exercise plan:', error);
      return {
        exerciseTypes: [{ type: 'walking', description: '快走', benefits: ['改善心血管健康'], targetGoals: ['weight_loss'] }],
        weeklyPlan: [],
        intensity: 'medium',
        duration: 30,
        frequency: 5,
        progression: {},
        precautions: [],
        targetGoals: {}
      };
    }
  }

  /**
   * 解析调整建议
   */
  parseAdjustments(aiResponse, currentIntervention, feedback) {
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return {
        summary: '干预方案已根据反馈进行调整',
        changes: [],
        medication: { adjustments: [] },
        nutrition: { adjustments: [] },
        exercise: { adjustments: [] },
        expectedOutcomes: {
          shortTerm: '预期在短期内看到改善',
          longTerm: '长期坚持将获得更好的健康效果'
        }
      };
    } catch (error) {
      console.error('❌ Error parsing adjustments:', error);
      return {
        summary: '干预方案已根据反馈进行调整',
        changes: [],
        medication: { adjustments: [] },
        nutrition: { adjustments: [] },
        exercise: { adjustments: [] },
        expectedOutcomes: {
          shortTerm: '预期在短期内看到改善',
          longTerm: '长期坚持将获得更好的健康效果'
        }
      };
    }
  }

  /**
   * 规范化干预方案数据结构（确保所有必需字段存在）
   */
  normalizeInterventionStructure(interventionData) {
    return {
      ...interventionData,
      medication: interventionData.medication || {
        adjustments: [],
        currentPlan: { medications: [], schedule: {}, targets: {} }
      },
      nutrition: interventionData.nutrition || {
        adjustments: [],
        mealPlan: { breakfast: {}, lunch: {}, dinner: {}, snacks: [] },
        dailyTargets: { calories: 0, carbs: 0, protein: 0, fat: 0, fiber: 0, sugar: 0 }
      },
      exercise: interventionData.exercise || {
        adjustments: [],
        weeklyPlan: {},
        progression: {},
        targets: { steps: 0, calories: 0, duration: 0, frequency: 0 }
      },
      lastAdjusted: interventionData.lastAdjusted || new Date().toISOString(),
      version: interventionData.version || 1
    };
  }

  /**
   * 添加或更新用药记录（通过 Medication Repository，双写子集合与旧集合）
   */
  async addOrUpdateMedication(userEmail, medication) {
    try {
      const sanitizedEmail = userEmail.replace(/[^a-zA-Z0-9@._-]/g, '_');
      const medications = await medicationRepo.listActive(sanitizedEmail);
      const existingIndex = medications.findIndex(
        m => m.id === medication.id || (m.name === medication.name && m.status === 'active')
      );

      if (existingIndex >= 0) {
        const merged = {
          ...medications[existingIndex],
          ...medication,
          schedule: medication.schedule ?? medications[existingIndex].schedule ?? [],
          history: medication.history ?? medications[existingIndex].history ?? []
        };
        await medicationRepo.update(sanitizedEmail, medications[existingIndex].id, merged);
        return { success: true, medication: merged };
      }
      const added = await medicationRepo.add(sanitizedEmail, {
        ...medication,
        schedule: medication.schedule || [],
        history: medication.history || []
      });
      return { success: true, medication: added };
    } catch (error) {
      console.error('❌ Error adding/updating medication:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 记录用药历史
   */
  async recordMedicationHistory(userEmail, medicationId, date, time, status, notes = null) {
    try {
      const sanitizedEmail = userEmail.replace(/[^a-zA-Z0-9@._-]/g, '_');
      const medications = await medicationRepo.listActive(sanitizedEmail);
      const med = medications.find(m => m.id === medicationId);
      if (!med) {
        return { success: false, error: 'Medication not found' };
      }
      const schedule = med.schedule || [];
      const history = med.history || [];
      const scheduleItem = { date, time, status, timestamp: new Date().toISOString() };
      const scheduleIndex = schedule.findIndex(s => s.date === date && s.time === time);
      if (scheduleIndex >= 0) {
        schedule[scheduleIndex] = scheduleItem;
      } else {
        schedule.push(scheduleItem);
      }
      history.push({
        date,
        time,
        status,
        timestamp: new Date().toISOString(),
        notes: notes
      });
      await medicationRepo.update(sanitizedEmail, medicationId, { schedule, history });
      return { success: true, medication: { ...med, schedule, history } };
    } catch (error) {
      console.error('❌ Error recording medication history:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 初始化或确保干预方案数据结构完整
   */
  async ensureInterventionStructure(userEmail) {
    try {
      const sanitizedEmail = userEmail.replace(/[^a-zA-Z0-9@._-]/g, '_');
      const interventionRef = doc(db, 'interventions', sanitizedEmail);
      const interventionDoc = await getDoc(interventionRef);
      
      let interventionData = null;
      
      if (interventionDoc.exists()) {
        interventionData = this.normalizeInterventionStructure(interventionDoc.data());
        await setDoc(interventionRef, interventionData, { merge: true });
      } else {
        interventionData = createInterventionCollection(userEmail, {});
        await setDoc(interventionRef, interventionData, { merge: true });
      }
      
      return { success: true, intervention: interventionData };
    } catch (error) {
      console.error('❌ Error ensuring intervention structure:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new InterventionEngineService();
