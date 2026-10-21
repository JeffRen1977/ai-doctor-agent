import { describe, test, expect } from '@jest/globals';
import { metricsExplanationSkill } from './metricsExplanation.mjs';

describe('metricsExplanation skill', () => {
  test('has correct metadata and version', () => {
    expect(metricsExplanationSkill.name).toBe('metrics_explanation');
    expect(metricsExplanationSkill.version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  test('includes query_vitals for actual metrics', () => {
    expect(metricsExplanationSkill.allowedTools).toContain('query_vitals');
  });

  test('includes query_risk_alerts for context', () => {
    expect(metricsExplanationSkill.allowedTools).toContain('query_risk_alerts');
  });

  test('includes query_wearable_stream for device data', () => {
    expect(metricsExplanationSkill.allowedTools).toContain('query_wearable_stream');
  });

  test('systemPrompt emphasizes plain-language explanation', () => {
    const prompt = metricsExplanationSkill.systemPrompt({ language: 'zh' });
    expect(prompt).toContain('通俗易懂');
    expect(prompt).toContain('科普');
  });

  test('systemPrompt adapts to user comprehension level', () => {
    const prompt = metricsExplanationSkill.systemPrompt({ language: 'zh' });
    expect(prompt).toContain('理解水平');
    expect(prompt).toContain('类比');
  });

  test('systemPrompt includes patient profile when provided', () => {
    const prompt = metricsExplanationSkill.systemPrompt({
      patientProfile: { basicInfo: { conditions: ['hypertension'] } },
      language: 'zh',
    });
    expect(prompt).toContain('hypertension');
  });

  test('systemPrompt works without patient profile', () => {
    const prompt = metricsExplanationSkill.systemPrompt({ language: 'zh' });
    expect(prompt).not.toContain('患者档案');
  });

  test('systemPrompt includes relevant memories', () => {
    const prompt = metricsExplanationSkill.systemPrompt({
      relevantMemories: [{ content: '用户不理解HbA1c' }],
      language: 'zh',
    });
    expect(prompt).toContain('用户不理解HbA1c');
  });

  test('systemPrompt supports English', () => {
    const prompt = metricsExplanationSkill.systemPrompt({ language: 'en' });
    expect(prompt).toContain('Respond in English');
  });

  test('postProcess passes text through', () => {
    expect(metricsExplanationSkill.postProcess('血糖正常范围')).toBe('血糖正常范围');
  });

  test('safety rules require disclaimer', () => {
    expect(metricsExplanationSkill.safetyRules.mustIncludeDisclaimer).toBe(true);
  });

  test('safety rules block self-harm topics', () => {
    expect(metricsExplanationSkill.safetyRules.blockedTopics).toContain('自杀');
  });
});
