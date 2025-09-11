const geminiService = require('./geminiService');
const openaiService = require('./openaiService');

class AIServiceFactory {
  constructor() {
    this.services = {
      gemini: geminiService,
      openai: openaiService
    };
    
    this.availableServices = this.checkAvailableServices();
    console.log('🏭 AI Service Factory initialized');
    console.log('📋 Available services:', Object.keys(this.availableServices));
  }

  checkAvailableServices() {
    const available = {};
    
    // Check Gemini service
    if (geminiService.isServiceAvailable && geminiService.isServiceAvailable()) {
      const geminiModels = geminiService.getAvailableModels ? geminiService.getAvailableModels() : ['gemini-1.5-pro', 'gemini-1.5-flash'];
      available.gemini = {
        name: 'Google Gemini',
        models: Array.isArray(geminiModels) ? geminiModels : (geminiModels.all || geminiModels.text || ['gemini-1.5-pro', 'gemini-1.5-flash']),
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
    
    return available;
  }

  getService(provider) {
    if (!this.services[provider]) {
      throw new Error(`AI service provider '${provider}' not found`);
    }
    
    if (!this.availableServices[provider]) {
      throw new Error(`AI service provider '${provider}' is not available. Please check API keys.`);
    }
    
    return this.services[provider];
  }

  async analyzeHealthRecords(healthData, options = {}) {
    const { provider = 'gemini', model, ...otherOptions } = options;
    
    console.log(`🤖 Using AI provider: ${provider}`);
    console.log(`🎯 Model: ${model || 'default'}`);
    
    const service = this.getService(provider);
    
    // Add model to options if provided
    const serviceOptions = { ...otherOptions };
    if (model) {
      serviceOptions.model = model;
    }
    
    const startTime = Date.now();
    const result = await service.analyzeHealthRecords(healthData, serviceOptions);
    const endTime = Date.now();
    
    // Add performance metrics
    result.processingTime = endTime - startTime;
    result.provider = provider;
    result.model = model || 'default';
    
    return result;
  }

  async extractTextFromImage(base64Image, options = {}) {
    const { provider = 'gemini', model, ...otherOptions } = options;
    
    console.log(`🖼️ Using AI provider for image analysis: ${provider}`);
    
    const service = this.getService(provider);
    
    const serviceOptions = { ...otherOptions };
    if (model) {
      serviceOptions.model = model;
    }
    
    return await service.extractTextFromImage(base64Image, serviceOptions);
  }

  async analyzePDFDocument(base64PDF, options = {}) {
    const { provider = 'gemini', model, ...otherOptions } = options;
    
    console.log(`📄 Using AI provider for PDF analysis: ${provider}`);
    
    const service = this.getService(provider);
    
    const serviceOptions = { ...otherOptions };
    if (model) {
      serviceOptions.model = model;
    }
    
    return await service.analyzePDFDocument(base64PDF, serviceOptions);
  }

  async healthChat(message, context = '', options = {}) {
    const { provider = 'gemini', model, ...otherOptions } = options;
    
    console.log(`💬 Using AI provider for health chat: ${provider}`);
    
    const service = this.getService(provider);
    
    const serviceOptions = { ...otherOptions };
    if (model) {
      serviceOptions.model = model;
    }
    
    return await service.healthChat(message, context, serviceOptions);
  }

  async analyzeDiet(foodItems, userHealthData = {}, options = {}) {
    const { provider = 'gemini', model, ...otherOptions } = options;
    
    console.log(`🍎 Using AI provider for diet analysis: ${provider}`);
    
    const service = this.getService(provider);
    
    const serviceOptions = { ...otherOptions };
    if (model) {
      serviceOptions.model = model;
    }
    
    return await service.analyzeDiet(foodItems, userHealthData, serviceOptions);
  }

  async analyzeImageWithAI(base64Image, prompt, options = {}) {
    const { provider = 'gemini', model, ...otherOptions } = options;
    
    console.log(`🖼️ Using AI provider for image analysis: ${provider}`);
    
    const service = this.getService(provider);
    
    const serviceOptions = { ...otherOptions };
    if (model) {
      serviceOptions.model = model;
    }
    
    // Use the appropriate method name for each service
    if (provider === 'gemini') {
      return await service.analyzeImageWithGemini(base64Image, prompt, serviceOptions);
    } else {
      return await service.analyzeImageWithOpenAI(base64Image, prompt, serviceOptions);
    }
  }

  async analyzeSymptoms(symptoms, userProfile = {}, options = {}) {
    const { provider = 'gemini', model, ...otherOptions } = options;
    
    console.log(`🩺 Using AI provider for symptom analysis: ${provider}`);
    
    const service = this.getService(provider);
    
    const serviceOptions = { ...otherOptions };
    if (model) {
      serviceOptions.model = model;
    }
    
    return await service.analyzeSymptoms(symptoms, userProfile, serviceOptions);
  }

  async checkDrugInteractions(medications, options = {}) {
    const { provider = 'gemini', model, ...otherOptions } = options;
    
    console.log(`💊 Using AI provider for drug interaction check: ${provider}`);
    
    const service = this.getService(provider);
    
    const serviceOptions = { ...otherOptions };
    if (model) {
      serviceOptions.model = model;
    }
    
    return await service.checkDrugInteractions(medications, serviceOptions);
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
