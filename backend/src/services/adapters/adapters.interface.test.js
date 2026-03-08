/**
 * Unit tests: AI adapters implement the required interface (see README.md and docs/AI_PROVIDER_SWITCH_DESIGN.md §4).
 * Does not call real APIs; only checks that required methods exist.
 */

const requiredMethods = [
  'isServiceAvailable',
  'getAvailableModels',
  'analyzeHealthRecords',
  'healthChat',
  'analyzePDFDocument',
  'extractTextFromImage',
  'analyzeImageWithAI'
];

const optionalMethods = ['analyzeDiet', 'analyzeSymptoms', 'checkDrugInteractions'];

describe('AI adapter interface', () => {
  test.each([
    ['geminiService', require('./geminiService')],
    ['openaiService', require('./openaiService')],
    ['ernieService', require('./ernieService')],
    ['qwenService', require('./qwenService')]
  ])('%s has all required methods', (_name, adapter) => {
    for (const method of requiredMethods) {
      expect(adapter[method]).toBeDefined();
      expect(typeof adapter[method]).toBe('function');
    }
  });

  test.each([
    ['geminiService', require('./geminiService')],
    ['openaiService', require('./openaiService')],
    ['ernieService', require('./ernieService')],
    ['qwenService', require('./qwenService')]
  ])('%s has optional methods (analyzeDiet, analyzeSymptoms, checkDrugInteractions)', (_name, adapter) => {
    for (const method of optionalMethods) {
      expect(adapter[method]).toBeDefined();
      expect(typeof adapter[method]).toBe('function');
    }
  });
});
