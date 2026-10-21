import { describe, test, expect } from '@jest/globals';
import { nutritionAnalysisSkill } from './nutritionAnalysis.mjs';

describe('nutritionAnalysis skill', () => {
  test('has correct metadata and version', () => {
    expect(nutritionAnalysisSkill.name).toBe('nutrition_analysis');
    expect(nutritionAnalysisSkill.version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  test('includes query_vitals for blood sugar context', () => {
    expect(nutritionAnalysisSkill.allowedTools).toContain('query_vitals');
  });

  test('includes query_medications for drug-food interactions', () => {
    expect(nutritionAnalysisSkill.allowedTools).toContain('query_medications');
  });

  test('includes query_health_records', () => {
    expect(nutritionAnalysisSkill.allowedTools).toContain('query_health_records');
  });

  test('systemPrompt includes nutrition analysis guidance', () => {
    const prompt = nutritionAnalysisSkill.systemPrompt({ language: 'zh' });
    expect(prompt).toContain('营养');
    expect(prompt).toContain('饮食');
  });

  test('systemPrompt mentions blood sugar impact for diabetic users', () => {
    const prompt = nutritionAnalysisSkill.systemPrompt({ language: 'zh' });
    expect(prompt).toContain('血糖');
    expect(prompt).toContain('碳水化合物');
  });

  test('systemPrompt includes patient profile when provided', () => {
    const prompt = nutritionAnalysisSkill.systemPrompt({
      patientProfile: { conditions: ['diabetes'] },
      language: 'zh',
    });
    expect(prompt).toContain('diabetes');
  });

  test('systemPrompt works without patient profile', () => {
    const prompt = nutritionAnalysisSkill.systemPrompt({ language: 'zh' });
    expect(prompt).not.toContain('患者档案');
  });

  test('systemPrompt includes relevant memories', () => {
    const prompt = nutritionAnalysisSkill.systemPrompt({
      relevantMemories: [{ content: '上次建议减少碳水' }],
      language: 'zh',
    });
    expect(prompt).toContain('上次建议减少碳水');
  });

  test('systemPrompt supports English', () => {
    const prompt = nutritionAnalysisSkill.systemPrompt({ language: 'en' });
    expect(prompt).toContain('Respond in English');
  });

  test('postProcess passes text through', () => {
    const input = '建议减少高GI食物摄入';
    expect(nutritionAnalysisSkill.postProcess(input)).toBe(input);
  });

  test('safety rules require disclaimer', () => {
    expect(nutritionAnalysisSkill.safetyRules.mustIncludeDisclaimer).toBe(true);
  });

  test('safety rules block self-harm topics', () => {
    expect(nutritionAnalysisSkill.safetyRules.blockedTopics).toContain('自杀');
  });
});
