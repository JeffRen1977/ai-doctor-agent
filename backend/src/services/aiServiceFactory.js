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

// Export singleton instance
module.exports = new AIServiceFactory();
