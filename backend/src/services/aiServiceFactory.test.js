/**
 * Unit tests: AI Service Factory (adapter registry, unified analyzeImageWithAI, optional method guards)
 * See docs/AI_PROVIDER_SWITCH_DESIGN.md Phase 2.
 */

const createMockAdapter = () => ({
  isServiceAvailable: jest.fn(() => true),
  getAvailableModels: jest.fn(() => ['model1']),
  analyzeImageWithAI: jest.fn().mockResolvedValue({ success: true, analysis: 'ok' }),
  analyzeHealthRecords: jest.fn().mockResolvedValue({ success: true }),
  extractTextFromImage: jest.fn().mockResolvedValue({ success: true }),
  analyzePDFDocument: jest.fn().mockResolvedValue({ success: true }),
  healthChat: jest.fn().mockResolvedValue({ success: true }),
  analyzeDiet: jest.fn().mockResolvedValue({ success: true }),
  analyzeSymptoms: jest.fn().mockResolvedValue({ success: true }),
  checkDrugInteractions: jest.fn().mockResolvedValue({ success: true })
});

jest.mock('./adapters/geminiService', () => createMockAdapter());
jest.mock('./adapters/openaiService', () => createMockAdapter());
jest.mock('./adapters/ernieService', () => createMockAdapter());
jest.mock('./adapters/qwenService', () => createMockAdapter());

const geminiService = require('./adapters/geminiService');
const openaiService = require('./adapters/openaiService');
const aiServiceFactory = require('./aiServiceFactory');

describe('AIServiceFactory', () => {
  describe('adapter registry', () => {
    test('has adapters for gemini, openai, ernie, qwen', () => {
      expect(aiServiceFactory.adapters).toBeDefined();
      expect(aiServiceFactory.adapters.gemini).toBe(geminiService);
      expect(aiServiceFactory.adapters.openai).toBe(openaiService);
      expect(aiServiceFactory.adapters.ernie).toBeDefined();
      expect(aiServiceFactory.adapters.qwen).toBeDefined();
    });

    test('getService(provider) returns adapter when provider is available', () => {
      const adapter = aiServiceFactory.getService('gemini');
      expect(adapter).toBe(geminiService);
    });

    test('getService(unknown) throws', () => {
      expect(() => aiServiceFactory.getService('unknown')).toThrow(/not found/);
    });
  });

  describe('analyzeImageWithAI', () => {
    test('calls adapter.analyzeImageWithAI with base64Image, prompt, options', async () => {
      geminiService.analyzeImageWithAI.mockClear();
      await aiServiceFactory.analyzeImageWithAI('base64data', 'analyze this', { provider: 'gemini' });
      expect(geminiService.analyzeImageWithAI).toHaveBeenCalledWith(
        'base64data',
        'analyze this',
        expect.objectContaining({})
      );
    });

    test('passes model in options when provided', async () => {
      geminiService.analyzeImageWithAI.mockClear();
      await aiServiceFactory.analyzeImageWithAI('img', 'p', { provider: 'gemini', model: 'gemini-2.5-flash' });
      expect(geminiService.analyzeImageWithAI).toHaveBeenCalledWith(
        'img',
        'p',
        expect.objectContaining({ model: 'gemini-2.5-flash' })
      );
    });

    test('returns adapter result', async () => {
      geminiService.analyzeImageWithAI.mockResolvedValue({ success: true, analysis: 'result text' });
      const out = await aiServiceFactory.analyzeImageWithAI('x', 'y', { provider: 'gemini' });
      expect(out).toEqual({ success: true, analysis: 'result text' });
    });
  });

  describe('analyzeHealthRecords', () => {
    test('calls adapter.analyzeHealthRecords and adds provider/model/processingTime', async () => {
      geminiService.analyzeHealthRecords.mockClear();
      geminiService.analyzeHealthRecords.mockResolvedValue({ success: true });
      const out = await aiServiceFactory.analyzeHealthRecords(
        { documents: [{ text: 'hello' }] },
        { provider: 'gemini' }
      );
      expect(geminiService.analyzeHealthRecords).toHaveBeenCalled();
      expect(out.provider).toBe('gemini');
      expect(out.model).toBeDefined();
      expect(out.processingTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('optional method guards', () => {
    test('analyzeDiet returns error when adapter has no analyzeDiet', async () => {
      const hadAnalyzeDiet = geminiService.analyzeDiet;
      delete geminiService.analyzeDiet;
      const out = await aiServiceFactory.analyzeDiet([], {}, { provider: 'gemini' });
      geminiService.analyzeDiet = hadAnalyzeDiet;
      expect(out.success).toBe(false);
      expect(out.error).toContain('does not support analyzeDiet');
    });

    test('analyzeSymptoms returns error when adapter has no analyzeSymptoms', async () => {
      const had = geminiService.analyzeSymptoms;
      delete geminiService.analyzeSymptoms;
      const out = await aiServiceFactory.analyzeSymptoms('headache', {}, { provider: 'gemini' });
      geminiService.analyzeSymptoms = had;
      expect(out.success).toBe(false);
      expect(out.error).toContain('does not support analyzeSymptoms');
    });

    test('checkDrugInteractions returns error when adapter has no checkDrugInteractions', async () => {
      const had = geminiService.checkDrugInteractions;
      delete geminiService.checkDrugInteractions;
      const out = await aiServiceFactory.checkDrugInteractions([], { provider: 'gemini' });
      geminiService.checkDrugInteractions = had;
      expect(out.success).toBe(false);
      expect(out.error).toContain('does not support checkDrugInteractions');
    });
  });
});
