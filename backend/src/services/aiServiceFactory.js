const geminiService = require('./adapters/geminiService');
const openaiService = require('./adapters/openaiService');
const ernieService = require('./adapters/ernieService');
const qwenService = require('./adapters/qwenService');

class AIServiceFactory {
  constructor() {
    /** 适配器注册表：按 provider 名取适配器，所有适配器实现统一接口（见 services/adapters/README.md） */
    this.adapters = {
      gemini: geminiService,
      openai: openaiService,
      ernie: ernieService,
      qwen: qwenService
    };

    this.availableServices = this.checkAvailableServices();
    console.log('🏭 AI Service Factory initialized');
    console.log('📋 Available services:', Object.keys(this.availableServices));
  }

  checkAvailableServices() {
    const available = {};
    
    // Check Gemini service
    if (geminiService.isServiceAvailable && geminiService.isServiceAvailable()) {
      const geminiModels = geminiService.getAvailableModels ? geminiService.getAvailableModels() : ['gemini-2.5-flash', 'gemini-1.5-flash'];
      available.gemini = {
        name: 'Google Gemini',
        models: Array.isArray(geminiModels) ? geminiModels : (geminiModels.all || geminiModels.text || ['gemini-2.5-flash', 'gemini-1.5-flash']),
        provider: 'gemini'
      };
    }
    
    // Check OpenAI service
    if (openaiService.isServiceAvailable && openaiService.isServiceAvailable()) {
      const openaiModels = openaiService.getAvailableModels ? openaiService.getAvailableModels() : ['gpt-4', 'gpt-3.5-turbo'];
      available.openai = {
        name: 'OpenAI',
        models: Array.isArray(openaiModels) ? openaiModels : (openaiModels.all || openaiModels.text || ['gpt-4', 'gpt-3.5-turbo']),
        provider: 'openai'
      };
    }
    
    // Check 文心一言 service
    if (ernieService.isServiceAvailable && ernieService.isServiceAvailable()) {
      const ernieModels = ernieService.getAvailableModels ? ernieService.getAvailableModels() : { text: ['ernie-bot'] };
      available.ernie = {
        name: '百度文心一言',
        models: Array.isArray(ernieModels) ? ernieModels : (ernieModels.text || ['ernie-bot']),
        provider: 'ernie'
      };
    }
    
    // Check 通义千问 service
    if (qwenService.isServiceAvailable && qwenService.isServiceAvailable()) {
      const qwenModels = qwenService.getAvailableModels ? qwenService.getAvailableModels() : { text: ['qwen-turbo'] };
      available.qwen = {
        name: '阿里通义千问',
        models: Array.isArray(qwenModels) ? qwenModels : (qwenModels.text || ['qwen-turbo']),
        provider: 'qwen'
      };
    }

    return available;
  }

  getService(provider) {
    const adapter = this.adapters[provider];
    if (!adapter) {
      throw new Error(`AI service provider '${provider}' not found`);
    }
    if (!this.availableServices[provider]) {
      throw new Error(`AI service provider '${provider}' is not available. Please check API keys.`);
    }
    return adapter;
  }

  async analyzeHealthRecords(healthData, options = {}) {
    const { provider = 'gemini', model, ...otherOptions } = options;

    console.log(`🤖 Using AI provider: ${provider}`);
    console.log(`🎯 Model: ${model || 'default'}`);

    const adapter = this.getService(provider);
    const serviceOptions = { ...otherOptions };
    if (model) {
      serviceOptions.model = model;
    }

    const startTime = Date.now();
    const result = await adapter.analyzeHealthRecords(healthData, serviceOptions);
    const endTime = Date.now();

    result.processingTime = endTime - startTime;
    result.provider = provider;
    result.model = model || 'default';
    return result;
  }

  async extractTextFromImage(base64Image, options = {}) {
    const { provider = 'gemini', model, ...otherOptions } = options;

    console.log(`🖼️ Using AI provider for image analysis: ${provider}`);

    const adapter = this.getService(provider);
    const serviceOptions = { ...otherOptions };
    if (model) {
      serviceOptions.model = model;
    }
    return await adapter.extractTextFromImage(base64Image, serviceOptions);
  }

  async analyzePDFDocument(base64PDF, options = {}) {
    const { provider = 'gemini', model, ...otherOptions } = options;

    console.log(`📄 Using AI provider for PDF analysis: ${provider}`);

    const adapter = this.getService(provider);
    const serviceOptions = { ...otherOptions };
    if (model) {
      serviceOptions.model = model;
    }
    return await adapter.analyzePDFDocument(base64PDF, serviceOptions);
  }

  async healthChat(message, context = '', options = {}) {
    const { provider = 'gemini', model, language = 'zh', ...otherOptions } = options;

    console.log(`💬 Using AI provider for health chat: ${provider}, language: ${language}`);

    const adapter = this.getService(provider);
    const serviceOptions = { ...otherOptions };
    if (model) {
      serviceOptions.model = model;
    }
    serviceOptions.language = language;
    return await adapter.healthChat(message, context, serviceOptions);
  }

  async analyzeDiet(foodItems, userHealthData = {}, options = {}) {
    const { provider = 'gemini', model, ...otherOptions } = options;

    console.log(`🍎 Using AI provider for diet analysis: ${provider}`);

    const adapter = this.getService(provider);
    if (typeof adapter.analyzeDiet !== 'function') {
      return { success: false, error: `Provider '${provider}' does not support analyzeDiet` };
    }
    const serviceOptions = { ...otherOptions };
    if (model) {
      serviceOptions.model = model;
    }
    return await adapter.analyzeDiet(foodItems, userHealthData, serviceOptions);
  }

  async analyzeImageWithAI(base64Image, prompt, options = {}) {
    const { provider = 'gemini', model, ...otherOptions } = options;

    console.log(`🖼️ Using AI provider for image analysis: ${provider}`);

    const adapter = this.getService(provider);
    const serviceOptions = { ...otherOptions };
    if (model) {
      serviceOptions.model = model;
    }
    return await adapter.analyzeImageWithAI(base64Image, prompt, serviceOptions);
  }

  async analyzeSymptoms(symptoms, userProfile = {}, options = {}) {
    const { provider = 'gemini', model, ...otherOptions } = options;

    console.log(`🩺 Using AI provider for symptom analysis: ${provider}`);

    const adapter = this.getService(provider);
    if (typeof adapter.analyzeSymptoms !== 'function') {
      return { success: false, error: `Provider '${provider}' does not support analyzeSymptoms` };
    }
    const serviceOptions = { ...otherOptions };
    if (model) {
      serviceOptions.model = model;
    }
    return await adapter.analyzeSymptoms(symptoms, userProfile, serviceOptions);
  }

  async checkDrugInteractions(medications, options = {}) {
    const { provider = 'gemini', model, ...otherOptions } = options;

    console.log(`💊 Using AI provider for drug interaction check: ${provider}`);

    const adapter = this.getService(provider);
    if (typeof adapter.checkDrugInteractions !== 'function') {
      return { success: false, error: `Provider '${provider}' does not support checkDrugInteractions` };
    }
    const serviceOptions = { ...otherOptions };
    if (model) {
      serviceOptions.model = model;
    }
    return await adapter.checkDrugInteractions(medications, serviceOptions);
  }

  getAvailableServices() {
    return this.availableServices;
  }

  getServiceInfo(provider) {
    return this.availableServices[provider] || null;
  }

}

/**
 * 审计装饰器 —— 所有 LLM 调用都经过 AIServiceFactory，所以在这一处包一层，
 * 就等于给 digitalTwin / riskMonitoring / intervention / rehabilitation / reports
 * 全部 AI 路径加上了「谁在什么时候得到了什么结论」的留痕，无需改动各业务服务。
 */
const auditService = require('./auditService');
const consentService = require('./consentService');
const logger = require('../observability/logger');
const { getContext } = require('../observability/requestContext');

/** 需要审计的方法 → 第一个参数在业务上的含义 */
const AUDITED_METHODS = {
  analyzeHealthRecords: 'healthData',
  extractTextFromImage: 'image',
  analyzePDFDocument: 'pdf',
  healthChat: 'message',
  analyzeDiet: 'foodItems',
  analyzeImageWithAI: 'image',
  analyzeSymptoms: 'symptoms',
  checkDrugInteractions: 'medications'
};

/** base64 图片/PDF 这类大字符串不进审计摘要，只留类型与体积描述符 */
const LARGE_INPUT_CHARS = 4096;
function summaryValueFor(kind, value) {
  if (typeof value === 'string' && value.length > LARGE_INPUT_CHARS) {
    return `[${kind}: ${value.length} chars, content hashed in inputDigest]`;
  }
  return value;
}

function withAudit(factory) {
  Object.entries(AUDITED_METHODS).forEach(([method, inputKind]) => {
    if (typeof factory[method] !== 'function') return;
    const original = factory[method].bind(factory);

    factory[method] = async function auditedAiCall(...args) {
      const options = args[args.length - 1];
      const opts = options && typeof options === 'object' && !Array.isArray(options) ? options : {};
      const provider = opts.provider || 'gemini';
      const model = opts.model || 'default';
      const startedAt = Date.now();
      const subjectEmail = opts.userEmail || opts.subjectEmail || getContext().userEmail || null;

      await consentService.assertCanCallAi(subjectEmail, provider);

      let result;
      let failure = null;
      try {
        result = await original(...args);
        return result;
      } catch (error) {
        failure = error;
        throw error;
      } finally {
        // 审计写入 await 而不 fire-and-forget：LLM 调用本就是秒级，
        // 多等一次数据库写入换取「结论产生了就一定有记录」的确定性是划算的。
        // recordAiDecision 内部永不抛错，不会影响主流程。
        try {
          await auditService.recordAiDecision({
            operation: method,
            provider,
            model,
            input: args[0],
            inputSummaryValue: summaryValueFor(inputKind, args[0]),
            output: failure ? null : result,
            latencyMs: Date.now() - startedAt,
            success: !failure,
            errorMessage: failure?.message ?? null,
            subjectEmail,
            metadata: { inputKind }
          });
        } catch (auditError) {
          logger.error({ err: { message: auditError?.message } }, '审计装饰器异常');
        }
      }
    };
  });
  return factory;
}

// Export singleton instance
module.exports = withAudit(new AIServiceFactory());
