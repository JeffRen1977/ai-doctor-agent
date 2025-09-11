const OpenAI = require('openai');

class OpenAIService {
  constructor() {
    this.client = null;
    this.isInitialized = false;
    this.initialize();
  }

  initialize() {
    try {
      if (!process.env.OPENAI_API_KEY) {
        console.warn('⚠️ OPENAI_API_KEY not found in environment variables');
        return;
      }

      this.client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      this.isInitialized = true;
      console.log('✅ OpenAI service initialized successfully');
      console.log('🤖 Available models: gpt-4o, gpt-4-turbo, gpt-4, gpt-3.5-turbo');
    } catch (error) {
      console.error('❌ Failed to initialize OpenAI service:', error);
      this.isInitialized = false;
    }
  }

  async analyzeHealthRecords(healthData, options = {}) {
    if (!this.isInitialized) {
      throw new Error('OpenAI service not initialized. Please check OPENAI_API_KEY.');
    }

    try {
      const {
        model = 'gpt-4o',
        temperature = 0.7,
        maxTokens = 2000
      } = options;

      console.log('🤖 OpenAI analyzing health records with model:', model);
      console.log('📊 Documents to analyze:', healthData.documents?.length || 0);

      // Prepare the prompt for health analysis
      const prompt = this.buildHealthAnalysisPrompt(healthData);

      const response = await this.client.chat.completions.create({
        model: model,
        messages: [
          {
            role: 'system',
            content: 'You are a professional medical AI assistant. Analyze the provided health documents and provide comprehensive health insights, risk assessments, and recommendations. Respond in Chinese.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: temperature,
        max_tokens: maxTokens,
      });

      const analysis = response.choices[0]?.message?.content;
      
      if (!analysis) {
        throw new Error('No analysis received from OpenAI');
      }

      console.log('✅ OpenAI analysis completed successfully');
      console.log('📝 Analysis length:', analysis.length);

      return {
        success: true,
        analysis: analysis,
        model: model,
        provider: 'openai',
        usage: response.usage,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ OpenAI analysis error:', error);
      return {
        success: false,
        error: error.message,
        provider: 'openai'
      };
    }
  }

  async extractTextFromImage(base64Image, options = {}) {
    if (!this.isInitialized) {
      throw new Error('OpenAI service not initialized. Please check OPENAI_API_KEY.');
    }

    try {
      const {
        model = 'gpt-4o',
        maxTokens = 1000
      } = options;

      console.log('🖼️ OpenAI extracting text from image with model:', model);

      const response = await this.client.chat.completions.create({
        model: model,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Please extract all text from this image. If it contains medical information, provide a detailed analysis.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_tokens: maxTokens,
      });

      const extractedText = response.choices[0]?.message?.content;
      
      if (!extractedText) {
        throw new Error('No text extracted from image');
      }

      console.log('✅ OpenAI image text extraction completed');
      return {
        success: true,
        text: extractedText,
        model: model,
        provider: 'openai'
      };

    } catch (error) {
      console.error('❌ OpenAI image text extraction error:', error);
      return {
        success: false,
        error: error.message,
        provider: 'openai'
      };
    }
  }

  async analyzePDFDocument(base64PDF, options = {}) {
    if (!this.isInitialized) {
      throw new Error('OpenAI service not initialized. Please check OPENAI_API_KEY.');
    }

    try {
      const {
        model = 'gpt-4o',
        maxTokens = 2000
      } = options;

      console.log('📄 OpenAI analyzing PDF document with model:', model);

      const response = await this.client.chat.completions.create({
        model: model,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Please analyze this PDF document. Extract all text and provide a comprehensive health analysis if it contains medical information.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:application/pdf;base64,${base64PDF}`
                }
              }
            ]
          }
        ],
        max_tokens: maxTokens,
      });

      const analysis = response.choices[0]?.message?.content;
      
      if (!analysis) {
        throw new Error('No analysis received from OpenAI for PDF');
      }

      console.log('✅ OpenAI PDF analysis completed');
      return {
        success: true,
        text: analysis,
        model: model,
        provider: 'openai'
      };

    } catch (error) {
      console.error('❌ OpenAI PDF analysis error:', error);
      return {
        success: false,
        error: error.message,
        provider: 'openai'
      };
    }
  }

  buildHealthAnalysisPrompt(healthData) {
    const { documents, userProfile } = healthData;
    
    let prompt = `请分析以下健康文档并提供专业的健康建议：

            用户信息：
            - 邮箱: ${userProfile.email}
            - 分析日期: ${userProfile.analysisDate}

            文档内容：
            `;

                documents.forEach((doc, index) => {
                prompt += `
            文档 ${index + 1}: ${doc.filename}
            类型: ${doc.type}
            内容: ${doc.content}
            `;
    });

    prompt += `
            请提供以下分析：
            1. 健康总结
            2. 风险因素识别
            3. 医疗条件分析
            4. 用药建议
            5. 健康建议
            6. 下一步行动
            7. 健康评分（1-10分）

            请用中文回答，并提供详细的分析和建议。`;

    return prompt;
  }

  getAvailableModels() {
    return {
      text: ['gpt-4o', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'],
      vision: ['gpt-4o', 'gpt-4-turbo'],
      all: ['gpt-4o', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo']
    };
  }

  async healthChat(message, context = '') {
    if (!this.isInitialized) {
      throw new Error('OpenAI service not initialized. Please check OPENAI_API_KEY.');
    }

    try {
      console.log('💬 OpenAI health chat analysis...');
      
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

      const response = await this.client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: '你是一个专业的AI医生助理，请根据用户的健康问题进行专业的回答。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });

      const aiResponse = response.choices[0]?.message?.content;
      
      if (!aiResponse) {
        throw new Error('No response received from OpenAI');
      }

      console.log('✅ OpenAI health chat completed');
      return {
        success: true,
        message: aiResponse
      };

    } catch (error) {
      console.error('❌ OpenAI health chat error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async analyzeDiet(foodItems, userHealthData = {}) {
    if (!this.isInitialized) {
      throw new Error('OpenAI service not initialized. Please check OPENAI_API_KEY.');
    }

    try {
      console.log('🍎 OpenAI diet analysis...');
      
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

      const response = await this.client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: '你是一个专业的营养师和AI医生助理，请分析饮食信息并提供健康建议。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1500
      });

      const analysis = response.choices[0]?.message?.content;
      
      if (!analysis) {
        throw new Error('No analysis received from OpenAI');
      }

      console.log('✅ OpenAI diet analysis completed');
      return {
        success: true,
        analysis: analysis
      };

    } catch (error) {
      console.error('❌ OpenAI diet analysis error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async analyzeImageWithOpenAI(base64Image, prompt, retryCount = 0) {
    if (!this.isInitialized) {
      throw new Error('OpenAI service not initialized. Please check OPENAI_API_KEY.');
    }

    try {
      console.log('🖼️ OpenAI image analysis...');
      
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_tokens: 1000
      });

      const analysis = response.choices[0]?.message?.content;
      
      if (!analysis) {
        throw new Error('No analysis received from OpenAI');
      }

      console.log('✅ OpenAI image analysis completed');
      return {
        success: true,
        analysis: analysis
      };

    } catch (error) {
      console.error('❌ OpenAI image analysis error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async analyzeSymptoms(symptoms, userProfile = {}) {
    if (!this.isInitialized) {
      throw new Error('OpenAI service not initialized. Please check OPENAI_API_KEY.');
    }

    try {
      console.log('🩺 OpenAI symptom analysis...');
      
      const prompt = `
            你是一个专业的AI医生助理，请分析以下症状并提供专业的医疗建议。

            症状描述: ${symptoms}
            用户信息: ${JSON.stringify(userProfile)}

            请提供:
            1. 可能的疾病或原因分析
            2. 症状严重程度评估
            3. 建议的检查项目
            4. 紧急程度判断
            5. 建议的下一步行动
            6. 注意事项和预防措施

            请用中文回答，保持专业和详细。
            `;

      const response = await this.client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: '你是一个专业的AI医生助理，请分析症状并提供专业的医疗建议。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1500
      });

      const analysis = response.choices[0]?.message?.content;
      
      if (!analysis) {
        throw new Error('No analysis received from OpenAI');
      }

      console.log('✅ OpenAI symptom analysis completed');
      return {
        success: true,
        analysis: analysis
      };

    } catch (error) {
      console.error('❌ OpenAI symptom analysis error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async checkDrugInteractions(medications) {
    if (!this.isInitialized) {
      throw new Error('OpenAI service not initialized. Please check OPENAI_API_KEY.');
    }

    try {
      console.log('💊 OpenAI drug interaction check...');
      
      const prompt = `
            你是一个专业的AI医生助理，请检查以下药物的相互作用。

            药物列表: ${JSON.stringify(medications)}

            请提供:
            1. 药物相互作用分析
            2. 潜在的风险和副作用
            3. 建议的用药时间间隔
            4. 需要避免的药物组合
            5. 建议的替代方案
            6. 注意事项和警告

            请用中文回答，保持专业和详细。
            `;

      const response = await this.client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: '你是一个专业的AI医生助理，请检查药物相互作用并提供专业建议。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1500
      });

      const analysis = response.choices[0]?.message?.content;
      
      if (!analysis) {
        throw new Error('No analysis received from OpenAI');
      }

      console.log('✅ OpenAI drug interaction check completed');
      return {
        success: true,
        analysis: analysis
      };

    } catch (error) {
      console.error('❌ OpenAI drug interaction check error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  isServiceAvailable() {
    return this.isInitialized && this.client !== null;
  }
}

// Export singleton instance
module.exports = new OpenAIService();
