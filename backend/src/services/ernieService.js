const axios = require('axios');

class ErnieService {
  constructor() {
    this.isInitialized = false;
    this.accessToken = null;
    this.apiKey = process.env.BAIDU_API_KEY;
    this.secretKey = process.env.BAIDU_SECRET_KEY;
    this.baseUrl = 'https://aip.baidubce.com';
    
    this.initialize();
  }

  async initialize() {
    try {
      if (!this.apiKey || !this.secretKey) {
        console.warn('⚠️ 百度API密钥未配置 (BAIDU_API_KEY, BAIDU_SECRET_KEY)');
        return;
      }

      // 获取访问令牌
      await this.getAccessToken();
      
      this.isInitialized = true;
      console.log('✅ 文心一言服务初始化成功');
    } catch (error) {
      console.error('❌ 文心一言服务初始化失败:', error.message);
      this.isInitialized = false;
    }
  }

  /**
   * 获取访问令牌
   */
  async getAccessToken() {
    try {
      const url = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${this.apiKey}&client_secret=${this.secretKey}`;
      
      const response = await axios.post(url);
      
      if (response.data.access_token) {
        this.accessToken = response.data.access_token;
        console.log('✅ 文心一言访问令牌获取成功');
        
        // 令牌有效期通常为30天，设置定时刷新
        const expiresIn = response.data.expires_in || 2592000; // 默认30天
        setTimeout(() => {
          this.getAccessToken();
        }, (expiresIn - 3600) * 1000); // 提前1小时刷新
      } else {
        throw new Error('获取访问令牌失败: ' + JSON.stringify(response.data));
      }
    } catch (error) {
      console.error('❌ 获取文心一言访问令牌失败:', error.message);
      throw error;
    }
  }

  /**
   * 健康咨询对话
   */
  async healthChat(message, context = '', options = {}) {
    try {
      if (!this.isInitialized || !this.accessToken) {
        await this.getAccessToken();
        if (!this.accessToken) {
          throw new Error('文心一言服务未初始化');
        }
      }

      const url = `${this.baseUrl}/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions?access_token=${this.accessToken}`;
      
      const systemPrompt = '你是一位专业的AI健康助手，具有丰富的医学知识。请用专业、准确、易懂的方式回答用户的健康问题。';
      
      const messages = [];
      if (context) {
        messages.push({
          role: 'system',
          content: `${systemPrompt}\n\n上下文信息：${context}`
        });
      } else {
        messages.push({
          role: 'system',
          content: systemPrompt
        });
      }
      
      messages.push({
        role: 'user',
        content: message
      });

      const response = await axios.post(url, {
        messages: messages,
        temperature: options.temperature || 0.7,
        max_output_tokens: options.max_tokens || 2000
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.error_code) {
        throw new Error(`文心一言API错误: ${response.data.error_msg}`);
      }

      return {
        success: true,
        text: response.data.result,
        model: 'ernie-bot',
        usage: response.data.usage || {}
      };
    } catch (error) {
      console.error('❌ 文心一言对话错误:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 从图片中提取文本（OCR）
   */
  async extractTextFromImage(base64Image, options = {}) {
    try {
      if (!this.isInitialized || !this.accessToken) {
        await this.getAccessToken();
        if (!this.accessToken) {
          throw new Error('文心一言服务未初始化');
        }
      }

      const url = `${this.baseUrl}/rest/2.0/ocr/v1/general_basic?access_token=${this.accessToken}`;
      
      const response = await axios.post(url, {
        image: base64Image
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      if (response.data.error_code) {
        throw new Error(`OCR API错误: ${response.data.error_msg}`);
      }

      if (response.data.words_result) {
        const text = response.data.words_result.map(item => item.words).join('\n');
        return {
          success: true,
          text: text,
          model: 'ernie-ocr'
        };
      }

      throw new Error('OCR识别失败: 未返回识别结果');
    } catch (error) {
      console.error('❌ 文心一言OCR错误:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 分析PDF文档（先OCR提取文本，再分析）
   */
  async analyzePDFDocument(base64PDF, options = {}) {
    try {
      // 先提取文本
      const ocrResult = await this.extractTextFromImage(base64PDF);
      
      if (!ocrResult.success) {
        return ocrResult;
      }

      // 然后分析文本
      const analysisResult = await this.healthChat(
        `请分析以下医疗文档内容，提取关键信息：\n\n${ocrResult.text}`,
        '',
        { temperature: 0.3, max_tokens: 3000 }
      );

      return {
        success: analysisResult.success,
        text: ocrResult.text,
        analysis: analysisResult.text,
        model: 'ernie-bot'
      };
    } catch (error) {
      console.error('❌ 文心一言PDF分析错误:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 分析健康记录
   */
  async analyzeHealthRecords(healthData, options = {}) {
    try {
      if (!this.isInitialized || !this.accessToken) {
        await this.getAccessToken();
        if (!this.accessToken) {
          throw new Error('文心一言服务未初始化');
        }
      }

      const url = `${this.baseUrl}/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions?access_token=${this.accessToken}`;
      
      const prompt = `作为专业的健康分析师，请分析以下健康数据，提供详细的健康评估和建议：

健康数据：
${JSON.stringify(healthData, null, 2)}

请提供以下内容：
1. 健康总结：整体健康状况概述
2. 关键指标分析：重要健康指标的详细分析
3. 风险因素识别：潜在的健康风险
4. 医疗条件：已诊断或疑似医疗状况
5. 个性化建议：基于数据的个性化健康建议
6. 下一步行动：明确的后续行动建议

请以结构化的JSON格式返回分析结果。`;

      const response = await axios.post(url, {
        messages: [
          {
            role: 'system',
            content: '你是一位专业的健康分析师，擅长分析健康数据并提供专业的医疗建议。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: options.temperature || 0.3,
        max_output_tokens: options.max_tokens || 3000
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.error_code) {
        throw new Error(`文心一言API错误: ${response.data.error_msg}`);
      }

      return {
        success: true,
        analysis: response.data.result,
        model: 'ernie-bot'
      };
    } catch (error) {
      console.error('❌ 文心一言健康分析错误:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 饮食分析
   */
  async analyzeDiet(foodItems, userHealthData = {}, options = {}) {
    try {
      if (!this.isInitialized || !this.accessToken) {
        await this.getAccessToken();
        if (!this.accessToken) {
          throw new Error('文心一言服务未初始化');
        }
      }

      const url = `${this.baseUrl}/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions?access_token=${this.accessToken}`;
      
      const prompt = `作为专业的营养专家，请分析以下食物并提供详细的健康建议：

食物信息：${JSON.stringify(foodItems, null, 2)}
用户健康数据：${JSON.stringify(userHealthData, null, 2)}

请提供：
1. 营养成分分析：卡路里、碳水化合物、蛋白质、脂肪等
2. 血糖影响评估：对血糖的影响程度和风险等级
3. 个性化饮食建议：基于用户健康状况的具体建议
4. 注意事项：需要特别注意的事项

请以结构化的方式返回分析结果。`;

      const response = await axios.post(url, {
        messages: [
          {
            role: 'system',
            content: '你是一位专业的营养专家，擅长分析食物营养成分并提供个性化的饮食建议。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: options.temperature || 0.5,
        max_output_tokens: options.max_tokens || 2000
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.error_code) {
        throw new Error(`文心一言API错误: ${response.data.error_msg}`);
      }

      return {
        success: true,
        analysis: response.data.result,
        model: 'ernie-bot'
      };
    } catch (error) {
      console.error('❌ 文心一言饮食分析错误:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 图片分析（多模态）
   */
  async analyzeImageWithErnie(base64Image, prompt, options = {}) {
    try {
      if (!this.isInitialized || !this.accessToken) {
        await this.getAccessToken();
        if (!this.accessToken) {
          throw new Error('文心一言服务未初始化');
        }
      }

      // 使用文心一言的多模态能力
      const url = `${this.baseUrl}/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions?access_token=${this.accessToken}`;
      
      const response = await axios.post(url, {
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
        temperature: options.temperature || 0.5
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.error_code) {
        throw new Error(`文心一言API错误: ${response.data.error_msg}`);
      }

      return {
        success: true,
        result: response.data.result,
        model: 'ernie-vilg-v2'
      };
    } catch (error) {
      console.error('❌ 文心一言图片分析错误:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 症状分析
   */
  async analyzeSymptoms(symptoms, userProfile = {}, options = {}) {
    try {
      const prompt = `作为专业的医疗AI助手，请分析以下症状：

症状描述：${JSON.stringify(symptoms, null, 2)}
用户信息：${JSON.stringify(userProfile, null, 2)}

请提供：
1. 可能的病因分析
2. 建议的检查项目
3. 初步建议
4. 何时需要就医

注意：这仅供参考，不能替代专业医疗诊断。`;

      return await this.healthChat(prompt, '', options);
    } catch (error) {
      console.error('❌ 文心一言症状分析错误:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 药物相互作用检查
   */
  async checkDrugInteractions(medications, options = {}) {
    try {
      const prompt = `作为专业的药师，请检查以下药物的相互作用：

药物列表：${JSON.stringify(medications, null, 2)}

请提供：
1. 药物相互作用分析
2. 潜在风险
3. 使用建议

注意：这仅供参考，不能替代专业药师建议。`;

      return await this.healthChat(prompt, '', options);
    } catch (error) {
      console.error('❌ 文心一言药物检查错误:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 检查服务是否可用
   */
  isServiceAvailable() {
    return this.isInitialized && this.accessToken !== null;
  }

  /**
   * 获取可用模型
   */
  getAvailableModels() {
    return {
      text: ['ernie-bot', 'ernie-bot-turbo'],
      image: ['ernie-vilg-v2'],
      ocr: ['general_basic']
    };
  }
}

module.exports = new ErnieService();
