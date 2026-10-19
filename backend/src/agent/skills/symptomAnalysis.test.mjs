import { describe, test, expect } from '@jest/globals';
import { symptomAnalysisSkill } from './symptomAnalysis.mjs';

describe('symptomAnalysisSkill', () => {
  test('has correct name', () => {
    expect(symptomAnalysisSkill.name).toBe('symptom_analysis');
  });

  test('allowedTools contains all four query tools', () => {
    expect(symptomAnalysisSkill.allowedTools).toEqual(
      expect.arrayContaining(['query_vitals', 'query_medications', 'query_health_records', 'query_risk_alerts']),
    );
    expect(symptomAnalysisSkill.allowedTools).toHaveLength(4);
  });

  test('systemPrompt includes patient profile when provided', () => {
    const prompt = symptomAnalysisSkill.systemPrompt({ patientProfile: { conditions: ['diabetes'] } });
    expect(prompt).toContain('diabetes');
  });

  test('systemPrompt includes instruction to query meds first', () => {
    const prompt = symptomAnalysisSkill.systemPrompt();
    expect(prompt).toContain('查询用户当前用药');
  });

  test('systemPrompt includes severity assessment', () => {
    const prompt = symptomAnalysisSkill.systemPrompt();
    expect(prompt).toContain('严重程度');
  });

  test('systemPrompt supports English', () => {
    const prompt = symptomAnalysisSkill.systemPrompt({ language: 'en' });
    expect(prompt).toContain('Respond in English');
  });

  test('systemPrompt works with no arguments', () => {
    const prompt = symptomAnalysisSkill.systemPrompt();
    expect(prompt).toContain('症状分析');
  });
});
