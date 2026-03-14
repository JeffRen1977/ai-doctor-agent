const axios = require('axios');

/** DashScope 区域与端点：API Key 与 endpoint 必须同区域，否则会 401 */
const DASHSCOPE_HOSTS = {
  cn: 'https://dashscope.aliyuncs.com',
  intl: 'https://dashscope-intl.aliyuncs.com',   // Singapore / Model Studio 国际
  us: 'https://dashscope-us.aliyuncs.com'
};

/** 解析 DashScope 区域：DASHSCOPE_REGION 优先，否则用 DEPLOYMENT_REGION（cn/intl/us），再默认 cn */
function getDashScopeRegion() {
  const r = (process.env.DASHSCOPE_REGION || process.env.DEPLOYMENT_REGION || 'cn').toLowerCase();
  return DASHSCOPE_HOSTS[r] ? r : 'cn';
}

/**
 * 从 DashScope/Model Studio API 响应中安全解析首条文本内容。
 * 兼容 output.choices[0].message.content 的多种返回格式（字符串、数组、output.text、顶层 choices）。
 */
function parseDashScopeContent(response) {
  if (!response || !response.data) return '';
  const data = response.data;
  const output = data.output;
  const choices = output && output.choices;
  const firstChoice = Array.isArray(choices) && choices.length > 0 ? choices[0] : null;
  const msg = firstChoice && firstChoice.message;
  let content = msg && msg.content;
  if (typeof content === 'string') return content;
  if (Array.isArray(content) && content.length > 0) {
    if (content[0] && typeof content[0].text === 'string') return content.map(c => c && c.text).filter(Boolean).join('');
    if (typeof content[0] === 'string') return content.join('');
  }
  if (content && typeof content === 'object' && typeof content.text === 'string') return content.text;
  if (output && typeof output.text === 'string') return output.text;
  const topChoices = data.choices;
  if (Array.isArray(topChoices) && topChoices[0] && topChoices[0].message) {
    const c = topChoices[0].message.content;
    if (typeof c === 'string') return c;
  }
  return '';
}

class QwenService {
  constructor() {
    this.isInitialized = false;
    this.apiKey = process.env.DASHSCOPE_API_KEY;
    const region = getDashScopeRegion();
    this.baseHost = DASHSCOPE_HOSTS[region];
    this.baseUrl = `${this.baseHost}/api/v1/services/aigc/text-generation/generation`;
    this.multimodalUrl = `${this.baseHost}/api/v1/services/aigc/multimodal-generation/generation`;

    this.initialize();
  }

  initialize() {
    try {
      if (!this.apiKey) {
        console.warn('⚠️ 通义千问API密钥未配置 (DASHSCOPE_API_KEY)');
        return;
      }

      this.isInitialized = true;
      const region = getDashScopeRegion();
      console.log('✅ 通义千问服务初始化成功', region !== 'cn' ? `(region: ${region})` : '');
    } catch (error) {
      console.error('❌ 通义千问服务初始化失败:', error.message);
      this.isInitialized = false;
    }
  }

  /**
   * 健康咨询对话
   */
  async healthChat(message, context = '', options = {}) {
    try {
      if (!this.isInitialized) {
        throw new Error('通义千问服务未初始化');
      }

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

      const response = await axios.post(
        this.baseUrl,
        {
          model: options.model || 'qwen-turbo',
          input: {
            messages: messages
          },
          parameters: {
            temperature: options.temperature || 0.7,
            max_tokens: options.max_tokens || 2000
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.code) {
        throw new Error(`通义千问API错误: ${response.data.message}`);
      }

      const text = parseDashScopeContent(response);
      return {
        success: true,
        text: text || '',
        model: options.model || 'qwen-turbo',
        usage: response.data.usage || {}
      };
    } catch (error) {
      console.error('❌ 通义千问对话错误:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 从图片中提取文本（使用多模态模型）
   */
  async extractTextFromImage(base64Image, options = {}) {
    try {
      if (!this.isInitialized) {
        throw new Error('通义千问服务未初始化');
      }

      const response = await axios.post(
        this.multimodalUrl,
        {
          model: 'qwen-vl-plus',
          input: {
            messages: [
              {
                role: 'user',
                content: [
                  {
                    image: `data:image/jpeg;base64,${base64Image}`
                  },
                  {
                    text: '请提取这张图片中的所有文字内容，包括医疗报告、检查结果、诊断意见、药物名称等。请保持原有格式和结构。'
                  }
                ]
              }
            ]
          },
          parameters: {
            max_tokens: options.max_tokens || 2000
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.code) {
        throw new Error(`通义千问API错误: ${response.data.message}`);
      }

      return {
        success: true,
        text: parseDashScopeContent(response),
        model: 'qwen-vl-plus'
      };
    } catch (error) {
      console.error('❌ 通义千问图片文本提取错误:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 分析PDF文档
   */
  async analyzePDFDocument(base64PDF, options = {}) {
    try {
      // 先提取文本
      const extractResult = await this.extractTextFromImage(base64PDF, options);
      
      if (!extractResult.success) {
        return extractResult;
      }

      // 然后分析文本
      const analysisResult = await this.healthChat(
        `请分析以下医疗文档内容，提取关键信息并提供健康评估：\n\n${extractResult.text}`,
        '',
        { ...options, temperature: 0.3, max_tokens: 3000 }
      );

      return {
        success: analysisResult.success,
        text: extractResult.text,
        analysis: analysisResult.text,
        model: 'qwen-plus'
      };
    } catch (error) {
      console.error('❌ 通义千问PDF分析错误:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 分析健康记录
   * 若传入 documents[0].text（如数字孪生 simulate/project 的完整 prompt），则直接使用该内容，不套用固定模板。
   */
  async analyzeHealthRecords(healthData, options = {}) {
    try {
      if (!this.isInitialized) {
        throw new Error('通义千问服务未初始化');
      }

      const documents = healthData && healthData.documents;
      const firstDocText = Array.isArray(documents) && documents[0] && (documents[0].text || documents[0].content);
      const useCallerPrompt = typeof firstDocText === 'string' && firstDocText.trim().length > 0;

      const userContent = useCallerPrompt
        ? firstDocText.trim()
        : `作为专业的健康分析师，请分析以下健康数据，提供详细的健康评估和建议：

健康数据：
${JSON.stringify(healthData, null, 2)}

请提供以下内容：
1. 健康总结：整体健康状况概述
2. 关键指标分析：重要健康指标的详细分析
3. 风险因素识别：潜在的健康风险
4. 医疗条件：已诊断或疑似医疗状况
5. 个性化建议：基于数据的个性化健康建议
6. 下一步行动：明确的后续行动建议

请以结构化的方式返回分析结果。`;

      const systemContent = useCallerPrompt
        ? '你是一位专业的医疗AI助手。请严格按照用户要求的内容和格式回答（若要求返回 JSON 则只返回 JSON，不要额外说明）。'
        : '你是一位专业的健康分析师，擅长分析健康数据并提供专业的医疗建议。';

      const response = await axios.post(
        this.baseUrl,
        {
          model: options.model || 'qwen-turbo',
          input: {
            messages: [
              { role: 'system', content: systemContent },
              { role: 'user', content: userContent }
            ]
          },
          parameters: {
            temperature: options.temperature || 0.3,
            max_tokens: options.max_tokens || 3000
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.code) {
        throw new Error(`通义千问API错误: ${response.data.message}`);
      }

      return {
        success: true,
        analysis: parseDashScopeContent(response),
        model: options.model || 'qwen-turbo'
      };
    } catch (error) {
      console.error('❌ 通义千问健康分析错误:', error.message);
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
      if (!this.isInitialized) {
        throw new Error('通义千问服务未初始化');
      }

      const prompt = `作为专业的营养专家，请分析以下食物并提供详细的健康建议：

食物信息：${JSON.stringify(foodItems, null, 2)}
用户健康数据：${JSON.stringify(userHealthData, null, 2)}

请提供：
1. 营养成分分析：卡路里、碳水化合物、蛋白质、脂肪等
2. 血糖影响评估：对血糖的影响程度和风险等级
3. 个性化饮食建议：基于用户健康状况的具体建议
4. 注意事项：需要特别注意的事项

请以结构化的方式返回分析结果。`;

      const response = await axios.post(
        this.baseUrl,
        {
          model: options.model || 'qwen-turbo',
          input: {
            messages: [
              {
                role: 'system',
                content: '你是一位专业的营养专家，擅长分析食物营养成分并提供个性化的饮食建议。'
              },
              {
                role: 'user',
                content: prompt
              }
            ]
          },
          parameters: {
            temperature: options.temperature || 0.5,
            max_tokens: options.max_tokens || 2000
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.code) {
        throw new Error(`通义千问API错误: ${response.data.message}`);
      }

      return {
        success: true,
        analysis: parseDashScopeContent(response),
        model: options.model || 'qwen-turbo'
      };
    } catch (error) {
      console.error('❌ 通义千问饮食分析错误:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 统一接口：图像+提示分析（委托给 analyzeImageWithQwen，统一返回 analysis 字段）
   * @see backend/src/services/adapters/README.md
   */
  async analyzeImageWithAI(base64Image, prompt, options = {}) {
    const out = await this.analyzeImageWithQwen(base64Image, prompt, options);
    if (out.success && out.result != null && out.analysis == null) {
      return { ...out, analysis: out.result };
    }
    return out;
  }

  /**
   * 图片分析（多模态）
   */
  async analyzeImageWithQwen(base64Image, prompt, options = {}) {
    try {
      if (!this.isInitialized) {
        throw new Error('通义千问服务未初始化');
      }

      const response = await axios.post(
        this.multimodalUrl,
        {
          model: 'qwen-vl-plus',
          input: {
            messages: [
              {
                role: 'user',
                content: [
                  {
                    image: `data:image/jpeg;base64,${base64Image}`
                  },
                  {
                    text: prompt
                  }
                ]
              }
            ]
          },
          parameters: {
            temperature: options.temperature || 0.5,
            max_tokens: options.max_tokens || 2000
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.code) {
        throw new Error(`通义千问API错误: ${response.data.message}`);
      }

      return {
        success: true,
        result: parseDashScopeContent(response),
        model: 'qwen-vl-plus'
      };
    } catch (error) {
      console.error('❌ 通义千问图片分析错误:', error.message);
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
      console.error('❌ 通义千问症状分析错误:', error.message);
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
      console.error('❌ 通义千问药物检查错误:', error.message);
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
    return this.isInitialized;
  }

  /**
   * 获取可用模型
   */
  getAvailableModels() {
    return {
      text: ['qwen-turbo', 'qwen-plus', 'qwen-max'],
      image: ['qwen-vl-plus', 'qwen-vl-max']
    };
  }
}

module.exports = new QwenService();
