const aiServiceFactory = require('./aiServiceFactory');
const userSettingsService = require('./userSettingsService');

/**
 * PDF病例提取服务
 * 从PDF病例文件中提取既往病史和用药记录
 */
class PDFCaseExtractionService {
  constructor() {
    console.log('📋 PDF Case Extraction Service initialized');
  }

  /**
   * 从PDF文件中提取医疗信息
   * @param {Buffer} pdfBuffer PDF文件缓冲区
   * @param {string} userEmail 用户邮箱
   * @returns {Promise<Object>} 提取的医疗信息
   */
  async extractMedicalInfoFromPDF(pdfBuffer, userEmail) {
    try {
      console.log('📄 Extracting medical information from PDF...');
      
      // 获取用户AI设置
      const userAISettings = await userSettingsService.getUserAISettings(userEmail);
      const userLanguage = userAISettings.success ? (userAISettings.language || 'zh') : 'zh';
      
      // 优先使用 OpenAI（如果可用），否则使用用户设置的 provider
      let aiProvider = 'openai'; // 默认使用 OpenAI
      let aiModel = '';
      
      // 检查 OpenAI 是否可用（优先使用 OpenAI，因为它对 PDF 支持更好）
      const openaiService = require('./openaiService');
      
      // 检查 OpenAI 服务是否可用
      if (openaiService.isServiceAvailable && openaiService.isServiceAvailable()) {
        aiProvider = 'openai';
        // 尝试使用 gpt-4o 或 gpt-4-turbo（这些模型对 PDF 支持更好）
        const openaiModels = openaiService.getAvailableModels ? openaiService.getAvailableModels() : { all: ['gpt-4o', 'gpt-4-turbo'] };
        const models = Array.isArray(openaiModels) ? openaiModels : (openaiModels.all || ['gpt-4o']);
        aiModel = models[0] || 'gpt-4o';
        console.log(`✅ Using OpenAI (${aiModel}) for PDF analysis`);
      } else if (userAISettings.success && userAISettings.aiProvider && userAISettings.aiProvider !== 'gemini') {
        // 如果 OpenAI 不可用，使用用户设置的其他 provider（排除 gemini，因为不支持 PDF）
        aiProvider = userAISettings.aiProvider;
        aiModel = userAISettings.aiModel || '';
        console.log(`⚠️ OpenAI not available, using ${aiProvider} for PDF analysis`);
      } else {
        // 如果只有 gemini 可用，我们仍然尝试，但主要依赖文本分析
        aiProvider = 'gemini';
        aiModel = '';
        console.log('⚠️ Using Gemini as fallback (will rely on text analysis)');
      }

      // 使用 pdf-parse 作为回退方案先提取文本
      let pdfText = '';
      try {
        const pdfParse = require('pdf-parse');
        const pdfData = await pdfParse(pdfBuffer);
        pdfText = pdfData.text;
        console.log('📄 PDF text extracted using pdf-parse, length:', pdfText.length);
      } catch (parseError) {
        console.warn('⚠️ pdf-parse failed, will try AI analysis:', parseError.message);
      }

      // 将PDF转换为base64（用于AI分析）
      const base64PDF = pdfBuffer.toString('base64');

      // 构建提取提示词 - 要求提取核心信息和时间点
      const prompt = userLanguage === 'en' 
        ? `You are a professional medical information extraction assistant. Please carefully analyze this PDF medical case document and extract ONLY the CORE and ESSENTIAL information with TIMELINES in a structured JSON format.

**IMPORTANT REQUIREMENTS:**
1. Extract ONLY key information, not every detail
2. Include dates/timelines for each medical event or medication
3. Summarize and condense information, avoid verbatim copying
4. Focus on actionable medical information

1. **Medical History (既往病史)**: Extract ONLY the core past medical conditions, diseases, surgical history, and health issues. For each item, include:
   - Condition name
   - Date/time of occurrence (if mentioned)
   - Brief description (1-2 sentences max)
   Format as a concise, timeline-organized text.

2. **Medication Records (用药记录)**: Extract ONLY current and recent medications with:
   - Medication name
   - Dosage
   - Frequency
   - Start date (if mentioned)
   - Purpose/indication (brief)
   Format as a concise list with dates.

3. **Key Medical Information**: Extract ONLY critical information:
   - Major diagnoses (with dates)
   - Significant test results (with dates, only abnormal values)
   - Current treatment plans (brief summary)
   - Known allergies (list only)
   - Family history (only if significant)

Please return the result in the following JSON format:
{
  "medicalHistory": "concise medical history with timelines",
  "medications": "concise medication list with dates and dosages",
  "additionalInfo": "only critical additional medical information"
}

**Rules:**
- Keep each section under 500 words
- Use bullet points or short sentences
- Include dates in format: YYYY-MM-DD or relative time (e.g., "3 years ago")
- If information is not found, use "Not mentioned" for English`
        : `你是一个专业的医疗信息提取助手。请仔细分析这个PDF病例文档，提取**核心关键信息**和**时间点**，并以结构化的JSON格式返回。

**重要要求：**
1. 只提取关键信息，不要提取所有细节
2. 每个医疗事件或用药都要包含日期/时间点
3. 总结和浓缩信息，避免逐字复制
4. 重点关注可操作的医疗信息

1. **既往病史 (Medical History)**: 只提取核心的既往疾病、手术史、健康问题。每个项目包括：
   - 疾病名称
   - 发生日期/时间（如有提及）
   - 简要描述（最多1-2句话）
   格式化为简洁的、按时间线组织的文本。

2. **用药记录 (Medication Records)**: 只提取当前和最近的用药，包括：
   - 药物名称
   - 剂量
   - 频率
   - 开始日期（如有提及）
   - 用途/适应症（简要）
   格式化为带日期的简洁列表。

3. **关键医疗信息**: 只提取关键信息：
   - 主要诊断（带日期）
   - 重要检查结果（带日期，仅异常值）
   - 当前治疗方案（简要总结）
   - 已知过敏（仅列表）
   - 家族史（仅重要信息）

请以以下JSON格式返回结果：
{
  "medicalHistory": "带时间线的简洁既往病史",
  "medications": "带日期和剂量的简洁用药列表",
  "additionalInfo": "仅关键的其他医疗信息"
}

**规则：**
- 每个部分控制在500字以内
- 使用要点或短句
- 日期格式：YYYY-MM-DD 或相对时间（如"3年前"）
- 如果未找到信息，使用"未提及"`;

      // 使用AI服务分析PDF
      // 注意：OpenAI Vision API 不支持 PDF，所以我们需要先提取文本
      let aiAnalysisText = '';
      let aiAnalysisSuccess = false;
      
      // 如果使用 OpenAI，需要先提取文本（因为 OpenAI 不支持直接分析 PDF）
      if (aiProvider === 'openai' && pdfText) {
        try {
          console.log('📝 OpenAI: Using extracted PDF text for analysis');
          const aiResult = await aiServiceFactory.analyzePDFDocument(base64PDF, {
            provider: aiProvider,
            model: aiModel,
            pdfText: pdfText // 传递提取的文本
          });

          if (aiResult.success) {
            aiAnalysisText = aiResult.text;
            aiAnalysisSuccess = true;
            console.log('✅ OpenAI PDF text analysis successful');
          } else {
            console.warn('⚠️ OpenAI PDF analysis failed:', aiResult.error);
          }
        } catch (aiError) {
          console.warn('⚠️ OpenAI PDF analysis error:', aiError.message);
        }
      } else if (aiProvider !== 'openai') {
        // 对于其他 provider（如 Gemini），尝试直接分析 PDF
        try {
          const aiResult = await aiServiceFactory.analyzePDFDocument(base64PDF, {
            provider: aiProvider,
            model: aiModel
          });

          if (aiResult.success) {
            aiAnalysisText = aiResult.text;
            aiAnalysisSuccess = true;
            console.log('✅ AI PDF analysis successful');
          } else {
            console.warn('⚠️ AI PDF analysis failed:', aiResult.error);
          }
        } catch (aiError) {
          console.warn('⚠️ AI PDF analysis error:', aiError.message);
        }
      }

      // 如果AI分析失败，使用pdf-parse提取的文本
      const textToAnalyze = aiAnalysisSuccess ? aiAnalysisText : pdfText;
      
      if (!textToAnalyze || textToAnalyze.trim().length === 0) {
        throw new Error('无法从PDF中提取文本内容');
      }

      // 如果只有pdf-parse的文本，使用LLM分析文本内容
      let finalAnalysisText = textToAnalyze;
      if (!aiAnalysisSuccess && pdfText) {
        // 使用LLM分析提取的文本 - 要求提取核心信息和时间点
        const analysisPrompt = userLanguage === 'en'
          ? `You are a professional medical information extraction assistant. Extract ONLY CORE and ESSENTIAL information with TIMELINES from the following medical document text.

**IMPORTANT REQUIREMENTS:**
1. Extract ONLY key information, not every detail
2. Include dates/timelines for each medical event or medication
3. Summarize and condense information, avoid verbatim copying
4. Focus on actionable medical information

1. **Medical History**: Extract ONLY core past medical conditions, diseases, surgical history. For each item include: condition name, date/time, brief description (1-2 sentences max). Format as concise timeline-organized text.

2. **Medication Records**: Extract ONLY current and recent medications with: medication name, dosage, frequency, start date (if mentioned), purpose. Format as concise list with dates.

3. **Additional Information**: Extract ONLY critical information: major diagnoses (with dates), significant test results (with dates, only abnormal values), current treatment plans (brief), known allergies (list only), family history (only if significant).

Return the result in JSON format:
{
  "medicalHistory": "concise medical history with timelines",
  "medications": "concise medication list with dates and dosages",
  "additionalInfo": "only critical additional medical information"
}

**Rules:**
- Keep each section under 500 words
- Use bullet points or short sentences
- Include dates in format: YYYY-MM-DD or relative time (e.g., "3 years ago")
- If information is not found, use "Not mentioned"

Medical document text:
${pdfText.substring(0, 10000)}` // 限制长度
          : `你是一个专业的医疗信息提取助手。请从以下医疗文档文本中提取**核心关键信息**和**时间点**。

**重要要求：**
1. 只提取关键信息，不要提取所有细节
2. 每个医疗事件或用药都要包含日期/时间点
3. 总结和浓缩信息，避免逐字复制
4. 重点关注可操作的医疗信息

1. **既往病史**: 只提取核心的既往疾病、手术史、健康问题。每个项目包括：疾病名称、发生日期/时间、简要描述（最多1-2句话）。格式化为简洁的、按时间线组织的文本。

2. **用药记录**: 只提取当前和最近的用药，包括：药物名称、剂量、频率、开始日期（如有提及）、用途。格式化为带日期的简洁列表。

3. **关键医疗信息**: 只提取关键信息：主要诊断（带日期）、重要检查结果（带日期，仅异常值）、当前治疗方案（简要）、已知过敏（仅列表）、家族史（仅重要信息）。

请以JSON格式返回结果：
{
  "medicalHistory": "带时间线的简洁既往病史",
  "medications": "带日期和剂量的简洁用药列表",
  "additionalInfo": "仅关键的其他医疗信息"
}

**规则：**
- 每个部分控制在500字以内
- 使用要点或短句
- 日期格式：YYYY-MM-DD 或相对时间（如"3年前"）
- 如果未找到信息，使用"未提及"

医疗文档文本：
${pdfText.substring(0, 10000)}`; // 限制长度

        try {
          // 构建正确的数据结构，包含用户信息（如果可用）
          const healthDataForAnalysis = {
            documents: [{ 
              text: analysisPrompt,
              content: analysisPrompt,
              type: 'medical-document',
              filename: 'extracted-medical-record.pdf'
            }]
          };
          
          // 如果可能，添加用户信息
          if (userEmail) {
            healthDataForAnalysis.userProfile = {
              email: userEmail,
              analysisDate: new Date().toISOString()
            };
          }
          
          const textAnalysisResult = await aiServiceFactory.analyzeHealthRecords(
            healthDataForAnalysis,
            { provider: aiProvider, model: aiModel }
          );
          
          if (textAnalysisResult.success) {
            finalAnalysisText = textAnalysisResult.analysis || textAnalysisResult.text || pdfText;
            console.log('✅ Text-based analysis successful');
          }
        } catch (textAnalysisError) {
          console.warn('⚠️ Text-based analysis failed:', textAnalysisError.message);
        }
      }

      // 解析提取的信息
      const extractedInfo = this.parseExtractedInfo(finalAnalysisText, userLanguage);

      console.log('✅ Medical information extracted successfully');
      return {
        success: true,
        medicalHistory: extractedInfo.medicalHistory || '',
        medications: extractedInfo.medications || '',
        additionalInfo: extractedInfo.additionalInfo || '',
        rawText: finalAnalysisText, // 使用最终分析文本
        provider: aiProvider,
        model: aiModel,
        extractionMethod: aiAnalysisSuccess ? 'ai-pdf-analysis' : (pdfText ? 'pdf-parse+text-analysis' : 'text-analysis-only')
      };

    } catch (error) {
      console.error('❌ Error extracting medical info from PDF:', error);
      return {
        success: false,
        error: error.message,
        medicalHistory: '',
        medications: ''
      };
    }
  }

  /**
   * 解析AI返回的文本，提取结构化信息
   * @param {string} aiText AI返回的文本
   * @param {string} language 语言
   * @returns {Object} 解析后的信息
   */
  parseExtractedInfo(aiText, language = 'zh') {
    try {
      // 尝试直接解析JSON
      const jsonMatch = aiText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          medicalHistory: parsed.medicalHistory || parsed.既往病史 || '',
          medications: parsed.medications || parsed.用药记录 || '',
          additionalInfo: parsed.additionalInfo || parsed.其他信息 || ''
        };
      }

      // 如果无法解析JSON，尝试从文本中提取
      const notMentioned = language === 'en' ? 'Not mentioned' : '未提及';
      
      let medicalHistory = '';
      let medications = '';
      let additionalInfo = '';

      // 提取既往病史
      const medicalHistoryPatterns = [
        /既往病史[：:]\s*([^\n]+(?:\n(?!用药|诊断|检查)[^\n]+)*)/i,
        /Medical History[：:]\s*([^\n]+(?:\n(?!Medication|Diagnosis|Test)[^\n]+)*)/i,
        /病史[：:]\s*([^\n]+(?:\n(?!用药|诊断)[^\n]+)*)/i
      ];
      
      for (const pattern of medicalHistoryPatterns) {
        const match = aiText.match(pattern);
        if (match && match[1]) {
          medicalHistory = match[1].trim();
          break;
        }
      }

      // 提取用药记录
      const medicationPatterns = [
        /用药记录[：:]\s*([^\n]+(?:\n(?!既往|诊断|检查)[^\n]+)*)/i,
        /Medication[：:]\s*([^\n]+(?:\n(?!History|Diagnosis|Test)[^\n]+)*)/i,
        /药物[：:]\s*([^\n]+(?:\n(?!既往|诊断)[^\n]+)*)/i,
        /处方[：:]\s*([^\n]+(?:\n(?!既往|诊断)[^\n]+)*)/i
      ];
      
      for (const pattern of medicationPatterns) {
        const match = aiText.match(pattern);
        if (match && match[1]) {
          medications = match[1].trim();
          break;
        }
      }

      // 如果都没有找到，使用整个文本作为参考
      if (!medicalHistory && !medications) {
        // 尝试智能分割
        const lines = aiText.split('\n');
        let inMedicalHistory = false;
        let inMedications = false;

        for (const line of lines) {
          if (line.match(/既往|病史|Medical History/i)) {
            inMedicalHistory = true;
            inMedications = false;
            continue;
          }
          if (line.match(/用药|药物|处方|Medication/i)) {
            inMedicalHistory = false;
            inMedications = true;
            continue;
          }
          
          if (inMedicalHistory) {
            medicalHistory += (medicalHistory ? '\n' : '') + line.trim();
          }
          if (inMedications) {
            medications += (medications ? '\n' : '') + line.trim();
          }
        }
      }

      return {
        medicalHistory: medicalHistory || notMentioned,
        medications: medications || notMentioned,
        additionalInfo: additionalInfo || ''
      };

    } catch (error) {
      console.error('❌ Error parsing extracted info:', error);
      const notMentioned = language === 'en' ? 'Not mentioned' : '未提及';
      return {
        medicalHistory: notMentioned,
        medications: notMentioned,
        additionalInfo: ''
      };
    }
  }
}

module.exports = new PDFCaseExtractionService();
