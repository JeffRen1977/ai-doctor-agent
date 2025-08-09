const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiService {
  constructor() {
    this.isMock = !process.env.GEMINI_API_KEY;
    if (this.isMock) {
      console.log('⚠️  使用模拟Gemini AI服务');
    } else {
      // 初始化Gemini AI
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      this.model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    }
  }

  // 健康咨询对话
  async healthChat(message, context = '') {
    try {
      if (this.isMock) {
        // 模拟AI回复
        const mockResponses = {
          '头痛': '根据您描述的症状，可能是偏头痛或紧张性头痛。建议您：\n1. 保持充足的休息\n2. 避免长时间用眼\n3. 适当进行放松运动\n4. 如果症状持续，建议及时就医',
          '感冒': '感冒是常见疾病，建议您：\n1. 多休息，保持充足睡眠\n2. 多喝温水，保持水分\n3. 适当服用感冒药\n4. 注意保暖，避免受凉\n5. 如果症状加重，请及时就医',
          '发烧': '发烧需要引起重视，建议您：\n1. 测量体温，记录变化\n2. 多喝温水，保持水分\n3. 适当物理降温\n4. 如果体温超过38.5°C，建议服用退烧药\n5. 如果症状持续或加重，请及时就医',
          '咳嗽': '咳嗽可能由多种原因引起，建议您：\n1. 保持室内空气湿润\n2. 多喝温水\n3. 避免刺激性食物\n4. 如果咳嗽持续或伴有其他症状，请及时就医',
          '失眠': '失眠会影响健康，建议您：\n1. 建立规律的作息时间\n2. 睡前避免使用电子设备\n3. 保持卧室环境安静舒适\n4. 适当进行放松活动\n5. 如果长期失眠，建议咨询医生'
        };

        // 简单的关键词匹配
        for (const [keyword, response] of Object.entries(mockResponses)) {
          if (message.includes(keyword)) {
            return {
              success: true,
              message: response
            };
          }
        }

        // 默认回复
        return {
          success: true,
          message: `感谢您的咨询。我理解您描述的症状，但为了给您更准确的建议，建议您：\n\n1. 详细描述症状的具体表现\n2. 说明症状的持续时间\n3. 是否有其他伴随症状\n4. 是否有相关病史\n\n如果症状严重或持续不缓解，建议及时就医。`
        };
      }

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

      const result = await this.model.generateContent(prompt);
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
      if (this.isMock) {
        // 模拟饮食分析
        const mockAnalysis = `
营养分析：
- 总卡路里：${foodItems.reduce((sum, food) => sum + food.calories, 0)} 卡路里
- 总碳水化合物：${foodItems.reduce((sum, food) => sum + food.carbs, 0)}g
- 总蛋白质：${foodItems.reduce((sum, food) => sum + food.protein, 0)}g
- 总脂肪：${foodItems.reduce((sum, food) => sum + food.fat, 0)}g
- 总纤维：${foodItems.reduce((sum, food) => sum + food.fiber, 0)}g

血糖影响评估：
- 平均升糖指数：${foodItems.reduce((sum, food) => sum + food.glycemicIndex, 0) / foodItems.length}
- 对糖尿病患者的影响：中等

健康建议：
1. 建议搭配富含纤维的蔬菜
2. 控制总碳水化合物摄入
3. 餐后建议适量运动
4. 定期监测血糖水平
        `;

        return {
          success: true,
          analysis: mockAnalysis
        };
      }

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

      const result = await this.model.generateContent(prompt);
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

  // 健康记录分析
  async analyzeHealthRecords(healthData) {
    try {
      if (this.isMock) {
        // 模拟健康记录分析
        return {
          success: true,
          analysis: `
健康趋势分析：
- 整体健康状况良好
- 建议继续保持健康的生活方式

潜在健康风险：
- 无明显风险

改善建议：
1. 保持规律运动
2. 均衡饮食
3. 充足睡眠
4. 定期体检

需要关注的指标：
- 血压
- 血糖
- 体重

预防措施建议：
1. 定期体检
2. 健康饮食
3. 适量运动
4. 戒烟限酒
        `
        };
      }

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

      const result = await this.model.generateContent(prompt);
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
      if (this.isMock) {
        // 模拟症状分析
        return {
          success: true,
          analysis: `
可能的疾病或状况分析：
- 需要更多信息进行准确分析

严重程度评估：
- 建议咨询专业医生

建议的下一步行动：
1. 详细记录症状
2. 咨询专业医生
3. 进行相关检查

需要立即就医的警告信号：
- 症状持续加重
- 出现新的症状
- 影响日常生活

自我护理建议：
1. 保持休息
2. 注意饮食
3. 避免过度劳累
        `
        };
      }

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

      const result = await this.model.generateContent(prompt);
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
      if (this.isMock) {
        // 模拟药物相互作用检查
        return {
          success: true,
          analysis: `
药物相互作用分析：
- 需要专业药剂师评估

潜在风险：
- 建议咨询医生或药剂师

建议的用药时间安排：
- 按医嘱服用

需要避免的药物组合：
- 请咨询专业医生

替代药物建议：
- 请咨询专业医生或药剂师
        `
        };
      }

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

      const result = await this.model.generateContent(prompt);
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