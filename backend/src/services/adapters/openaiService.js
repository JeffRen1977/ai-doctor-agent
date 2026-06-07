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
      const language = options.language === 'en' ? 'en' : 'zh';
      const directText = healthData?.documents?.[0]?.text;

      console.log('🤖 OpenAI analyzing health records with model:', model);
      console.log('📊 Documents to analyze:', healthData.documents?.length || 0);

      const prompt =
        options.promptMode === 'direct' && directText
          ? directText
          : this.buildHealthAnalysisPrompt(healthData);

      const systemContent =
        language === 'en'
          ? 'You are a professional medical AI assistant. Analyze the provided health information and provide comprehensive health insights, risk assessments, and recommendations. Respond in English only.'
          : 'You are a professional medical AI assistant. Analyze the provided health documents and provide comprehensive health insights, risk assessments, and recommendations. Respond in Chinese.';

      const userContent =
        options.promptMode === 'direct' && directText
          ? prompt +
            (language === 'en'
              ? '\n\nIMPORTANT: Write the entire report in English only.'
              : '\n\n请用中文回答，保持专业和详细。')
          : prompt;

      const response = await this.client.chat.completions.create({
        model: model,
        messages: [
          {
            role: 'system',
            content: systemContent
          },
          {
            role: 'user',
            content: userContent
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
        maxTokens = 4000,
        pdfText = null // 如果提供了提取的文本，直接使用
      } = options;

      console.log('📄 OpenAI analyzing PDF document with model:', model);

      // OpenAI Vision API 不支持 PDF，只能处理图像
      // 如果提供了提取的文本，直接使用文本分析
      if (pdfText) {
        console.log('📝 Using extracted PDF text for OpenAI analysis');
        const response = await this.client.chat.completions.create({
          model: model,
          messages: [
            {
              role: 'system',
              content: 'You are a professional medical AI assistant. Extract ONLY CORE and ESSENTIAL medical information with TIMELINES from medical documents. Focus on actionable information, summarize and condense, avoid verbatim copying. Respond in JSON format with fields: medicalHistory, medications, additionalInfo. Keep each section concise (under 500 words) and include dates/timelines.'
            },
            {
              role: 'user',
              content: `Please analyze this medical document text and extract ONLY CORE information with TIMELINES:

1. Medical History (既往病史): Extract ONLY key past medical conditions, diseases, surgical history. For each item include: condition name, date/time, brief description (1-2 sentences max). Format as concise timeline-organized text.

2. Medications (用药记录): Extract ONLY current and recent medications with: medication name, dosage, frequency, start date (if mentioned), purpose. Format as concise list with dates.

3. Additional Information: Extract ONLY critical information: major diagnoses (with dates), significant test results (with dates, only abnormal values), current treatment plans (brief), known allergies (list only), family history (only if significant).

**Rules:**
- Keep each section under 500 words
- Use bullet points or short sentences
- Include dates in format: YYYY-MM-DD or relative time (e.g., "3 years ago")
- If information is not found, use "Not mentioned"

Medical Document Text:
${pdfText.substring(0, 15000)}` // 限制长度以适应 token 限制
            }
          ],
          max_tokens: maxTokens,
          temperature: 0.3, // 降低温度以获得更准确的结构化输出
        });

        const analysis = response.choices[0]?.message?.content;
        
        if (!analysis) {
          throw new Error('No analysis received from OpenAI for PDF text');
        }

        console.log('✅ OpenAI PDF text analysis completed');
        return {
          success: true,
          text: analysis,
          model: model,
          provider: 'openai'
        };
      }

      // 如果没有提供文本，返回错误提示
      throw new Error('OpenAI Vision API does not support PDF files. Please provide extracted text using pdf-parse.');

    } catch (error) {
      console.error('❌ OpenAI PDF analysis error:', error);
      return {
        success: false,
        error: error.message,
        provider: 'openai'
      };
    }
  }

  /**
   * 将数字孪生对象转为可读文本，供健康总结 prompt 使用（与 refreshHealthSummary 传入的 healthData.digitalTwin 对应）
   */
  _digitalTwinToPromptText(digitalTwin) {
    if (!digitalTwin || typeof digitalTwin !== 'object') return '';
    const lines = [];
    const p = digitalTwin.profile || {};
    const c = digitalTwin.currentState || {};
    if (p.demographics && Object.keys(p.demographics).length > 0) {
      lines.push('【基本信息】' + JSON.stringify(p.demographics, null, 2));
    }
    if (p.medicalHistory) lines.push('【既往病史】' + String(p.medicalHistory));
    if (p.lifestyle && typeof p.lifestyle === 'object') {
      const med = p.lifestyle.medications;
      const fam = p.lifestyle.familyHistory;
      const all = p.lifestyle.allergies;
      if (med) lines.push('【用药/生活方式】' + med);
      if (fam) lines.push('【家族史】' + fam);
      if (all) lines.push('【过敏史】' + all);
    }
    if (p.geneticInfo && typeof p.geneticInfo === 'object' && Object.keys(p.geneticInfo).length > 0) {
      lines.push('【遗传/家族风险】' + JSON.stringify(p.geneticInfo, null, 2));
    }
    if (c.medications && Array.isArray(c.medications) && c.medications.length > 0) {
      lines.push('【当前用药明细】' + JSON.stringify(c.medications, null, 2));
    }
    if (c.vitalSigns && Object.keys(c.vitalSigns).length > 0) {
      lines.push('【生命体征】' + JSON.stringify(c.vitalSigns, null, 2));
    }
    if (c.labResults && Array.isArray(c.labResults) && c.labResults.length > 0) {
      lines.push('【检验结果】' + JSON.stringify(c.labResults, null, 2));
    }
    if (c.riskFactors && Array.isArray(c.riskFactors) && c.riskFactors.length > 0) {
      lines.push('【风险因素】' + JSON.stringify(c.riskFactors, null, 2));
    }
    if (digitalTwin.userId) lines.push('【用户标识】' + digitalTwin.userId);
    return lines.join('\n\n');
  }

  buildHealthAnalysisPrompt(healthData) {
    const { documents, userProfile, digitalTwin } = healthData || {};
    
    let prompt = `请分析以下健康文档并提供专业的健康建议：

            `;

    // 如果有用户信息，添加用户信息
    if (userProfile && userProfile.email) {
      prompt += `用户信息：
            - 邮箱: ${userProfile.email}
            - 分析日期: ${userProfile.analysisDate || new Date().toISOString()}

            `;
    }

    prompt += `文档内容：
            `;

    // 优先使用数字孪生（健康总结刷新时传入的是 { digitalTwin }）
    const digitalTwinText = this._digitalTwinToPromptText(digitalTwin);
    if (digitalTwinText.trim()) {
      prompt += `
            ${digitalTwinText}
            `;
    }

    // 处理文档数组
    if (Array.isArray(documents) && documents.length > 0) {
      documents.forEach((doc, index) => {
        const docText = doc.text || doc.content || '';
        const docFilename = doc.filename || doc.name || `文档 ${index + 1}`;
        const docType = doc.type || 'text';
        prompt += `
            文档 ${index + 1}: ${docFilename}
            类型: ${docType}
            内容: ${docText}
            `;
      });
    } else if (documents && typeof documents === 'object' && (documents.text || documents.content)) {
      const docText = documents.text || documents.content || '';
      prompt += `
            内容: ${docText}
            `;
    }

    if (!digitalTwinText.trim() && !(Array.isArray(documents) && documents.length > 0) && !(documents && (documents.text || documents.content))) {
      prompt += `
            （当前未提供个人健康档案或文档，请提示用户先在「个人健康档案」中填写并保存基本信息、既往病史、用药记录等后再生成健康总结。）
            `;
    }

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

  async healthChat(message, context = '', options = {}) {
    if (!this.isInitialized) {
      throw new Error('OpenAI service not initialized. Please check OPENAI_API_KEY.');
    }

    try {
      const { language = 'zh', model } = options;
      console.log(`💬 OpenAI health chat analysis... (language: ${language})`);
      
      let systemPrompt, userPrompt;
      if (language === 'en') {
        systemPrompt = 'You are a professional AI medical assistant. Please provide professional responses based on the user\'s health questions.';
        userPrompt = `
            User question: ${message}
            ${context ? `Context information: ${context}` : ''}

            Please provide:
            1. Professional health advice
            2. Possible symptom analysis
            3. Suggested next steps
            4. Important notes and precautions

            Please respond in English, keeping it professional, friendly, and easy to understand.
            `;
      } else {
        systemPrompt = '你是一个专业的AI医生助理，请根据用户的健康问题进行专业的回答。';
        userPrompt = `
            用户问题: ${message}
            ${context ? `上下文信息: ${context}` : ''}

            请提供:
            1. 专业的健康建议
            2. 可能的症状分析
            3. 建议的下一步行动
            4. 注意事项

            请用中文回答，保持专业、友好和易懂。
            `;
      }

      const response = await this.client.chat.completions.create({
        model: model || 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
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

  /**
   * 统一接口：图像+提示分析（委托给 analyzeImageWithOpenAI）
   * @see backend/src/services/adapters/README.md
   */
  async analyzeImageWithAI(base64Image, prompt, options = {}) {
    const retryCount = options.retryCount ?? 0;
    return this.analyzeImageWithOpenAI(base64Image, prompt, retryCount);
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
