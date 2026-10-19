import { describe, test, expect } from '@jest/globals';
import { riskAssessmentSkill } from './riskAssessment.mjs';

describe('riskAssessmentSkill', () => {
  test('has correct name', () => {
    expect(riskAssessmentSkill.name).toBe('risk_assessment');
  });

  test('allowedTools contains all 5 tools including wearable stream', () => {
    expect(riskAssessmentSkill.allowedTools).toEqual(
      expect.arrayContaining([
        'query_vitals', 'query_medications', 'query_health_records',
        'query_risk_alerts', 'query_wearable_stream',
      ]),
    );
    expect(riskAssessmentSkill.allowedTools).toHaveLength(5);
  });

  test('systemPrompt includes patient profile when provided', () => {
    const prompt = riskAssessmentSkill.systemPrompt({ patientProfile: { conditions: ['hypertension'] } });
    expect(prompt).toContain('hypertension');
  });

  test('systemPrompt includes data units', () => {
    const prompt = riskAssessmentSkill.systemPrompt();
    expect(prompt).toContain('mg/dL');
    expect(prompt).toContain('mmHg');
  });

  test('systemPrompt includes high-risk escalation instruction', () => {
    const prompt = riskAssessmentSkill.systemPrompt();
    expect(prompt).toContain('立即就医');
  });

  test('systemPrompt supports English', () => {
    const prompt = riskAssessmentSkill.systemPrompt({ language: 'en' });
    expect(prompt).toContain('Respond in English');
  });

  test('systemPrompt works with no arguments', () => {
    const prompt = riskAssessmentSkill.systemPrompt();
    expect(prompt).toContain('风险评估');
  });

  test('safetyRules has low escalation threshold', () => {
    expect(riskAssessmentSkill.safetyRules.maxSeverityWithoutEscalation).toBe('low');
  });
});
