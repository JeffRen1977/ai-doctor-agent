const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiService {
  constructor() {
    // 初始化Gemini AI
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // 文本任务使用flash模型（更快、更经济）
    this.textModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    // 图片任务使用pro模型（更好的图片理解能力）
    this.imageModel = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    
    console.log('✅ Gemini AI 服务初始化成功');
    console.log('📝 文本模型: gemini-1.5-flash');
    console.log('🖼️  图片模型: gemini-1.5-pro');
  }

  // 健康咨询对话
  async healthChat(message, context = '') {
    try {
      const prompt = `
            你是一个专业的AI医生助理，请根据用户的健康问题进行专业的回答。

            用户问题: ${message}
            ${context ? `上下文信息: ${context}` : ''}

            请提供:
            1. 专业的健康建议
            2. 可能的症状分析
            3. 建议的下一步行动
            4. 注意事项

            请用中文回答，保持专业、友好和易懂。
            `;

      const result = await this.textModel.generateContent(prompt);
      const response = await result.response;
      return {
        success: true,
        message: response.text()
      };
    } catch (error) {
      console.error('Gemini AI错误:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 饮食分析
  async analyzeDiet(foodItems, userHealthData = {}) {
    try {
      const prompt = `
            你是一个专业的营养师和AI医生助理，请分析以下饮食信息并提供健康建议。

            食物列表: ${JSON.stringify(foodItems)}
            用户健康数据: ${JSON.stringify(userHealthData)}

            请提供:
            1. 营养分析（卡路里、蛋白质、脂肪、碳水化合物、纤维等）
            2. 血糖影响评估（特别是对糖尿病患者）
            3. 健康建议和改进建议
            4. 潜在的健康风险
            5. 推荐的替代食物

            请用中文回答，保持专业和详细。
            `;

      const result = await this.textModel.generateContent(prompt);
      const response = await result.response;
      return {
        success: true,
        analysis: response.text()
      };
    } catch (error) {
      console.error('饮食分析错误:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 图片分析（支持饮食分析）- 使用专门的图片模型，带fallback到flash模型
  async analyzeImageWithGemini(base64Image, prompt, retryCount = 0) {
    try {
      console.log('🤖 开始使用Gemini AI Pro分析图片');
      
      // 创建图片数据
      const imageData = {
        inlineData: {
          data: base64Image,
          mimeType: 'image/jpeg' // 可以根据实际图片类型调整
        }
      };

      // 首先尝试使用Pro模型
      try {
        const result = await this.imageModel.generateContent([prompt, imageData]);
        const response = await result.response;
        
        console.log('✅ Gemini AI Pro图片分析完成');
        
        return {
          success: true,
          analysis: response.text(),
          recognizedFoods: [], // 可以在这里解析识别出的食物
          modelUsed: 'gemini-1.5-pro'
        };
      } catch (proError) {
        // 如果Pro模型失败（通常是配额限制），fallback到Flash模型
        if (proError.status === 429 || proError.message.includes('quota') || proError.message.includes('Too Many Requests')) {
          console.log('⚠️  Pro模型配额限制，fallback到Flash模型');
          
          try {
            const result = await this.textModel.generateContent([prompt, imageData]);
            const response = await result.response;
            
            console.log('✅ Gemini AI Flash图片分析完成（fallback）');
            
            return {
              success: true,
              analysis: response.text(),
              recognizedFoods: [],
              modelUsed: 'gemini-1.5-flash (fallback)'
            };
          } catch (flashError) {
            console.error('❌ Flash模型也失败:', flashError.message);
            
            // 如果是配额问题且有重试次数，等待后重试
            if ((flashError.status === 429 || flashError.message.includes('quota')) && retryCount < 2) {
              const waitTime = Math.pow(2, retryCount) * 5; // 5s, 10s, 20s
              console.log(`⏳ 等待 ${waitTime} 秒后重试...`);
              
              await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
              
              return this.analyzeImageWithGemini(base64Image, prompt, retryCount + 1);
            }
            
            throw new Error(`所有模型都失败: Pro(${proError.message}), Flash(${flashError.message})`);
          }
        } else {
          // 如果不是配额问题，直接抛出Pro模型的错误
          throw proError;
        }
      }
    } catch (error) {
      console.error('❌ Gemini AI图片分析错误:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 健康记录分析
  async analyzeHealthRecords(healthData) {
    try {
      const prompt = `
            你是一个专业的AI医生助理，请分析以下健康记录数据。

            健康数据: ${JSON.stringify(healthData)}

            请提供:
            1. 健康趋势分析
            2. 潜在健康风险识别
            3. 改善建议
            4. 需要关注的指标
            5. 预防措施建议

            请用中文回答，保持专业和详细。
            `;

      const result = await this.textModel.generateContent(prompt);
      const response = await result.response;
      return {
        success: true,
        analysis: response.text()
      };
    } catch (error) {
      console.error('健康记录分析错误:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 症状分析
  async analyzeSymptoms(symptoms, userProfile = {}) {
    try {
      const prompt = `
            你是一个专业的AI医生助理，请分析以下症状信息。

            症状描述: ${symptoms}
            用户档案: ${JSON.stringify(userProfile)}

            请提供:
            1. 可能的疾病或状况分析
            2. 严重程度评估
            3. 建议的下一步行动
            4. 需要立即就医的警告信号
            5. 自我护理建议

            请用中文回答，保持专业和谨慎。
            注意：这仅供参考，不能替代专业医疗诊断。
            `;

      const result = await this.textModel.generateContent(prompt);
      const response = await result.response;
      return {
        success: true,
        analysis: response.text()
      };
    } catch (error) {
      console.error('症状分析错误:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 药物相互作用检查
  async checkDrugInteractions(medications) {
    try {
      const prompt = `
            你是一个专业的AI药剂师，请检查以下药物的相互作用。

            药物列表: ${JSON.stringify(medications)}

            请提供:
            1. 药物相互作用分析
            2. 潜在风险
            3. 建议的用药时间安排
            4. 需要避免的药物组合
            5. 替代药物建议

            请用中文回答，保持专业和详细。
            注意：这仅供参考，请咨询专业医生或药剂师。
            `;

      const result = await this.textModel.generateContent(prompt);
      const response = await result.response;
      return {
        success: true,
        analysis: response.text()
      };
    } catch (error) {
      console.error('药物相互作用检查错误:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new GeminiService(); 