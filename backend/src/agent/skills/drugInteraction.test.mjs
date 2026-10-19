import { describe, test, expect } from '@jest/globals';
import { drugInteractionSkill } from './drugInteraction.mjs';

describe('drugInteractionSkill', () => {
  test('has correct name', () => {
    expect(drugInteractionSkill.name).toBe('drug_interaction');
  });

  test('allowedTools is medications and health records only', () => {
    expect(drugInteractionSkill.allowedTools).toEqual(['query_medications', 'query_health_records']);
  });

  test('systemPrompt includes patient profile when provided', () => {
    const prompt = drugInteractionSkill.systemPrompt({ patientProfile: { allergies: ['penicillin'] } });
    expect(prompt).toContain('penicillin');
  });

  test('systemPrompt includes instruction to query full med list', () => {
    const prompt = drugInteractionSkill.systemPrompt();
    expect(prompt).toContain('完整用药列表');
  });

  test('systemPrompt includes instruction to check allergies', () => {
    const prompt = drugInteractionSkill.systemPrompt();
    expect(prompt).toContain('过敏史');
  });

  test('systemPrompt supports English', () => {
    const prompt = drugInteractionSkill.systemPrompt({ language: 'en' });
    expect(prompt).toContain('Respond in English');
  });

  test('systemPrompt works with no arguments', () => {
    const prompt = drugInteractionSkill.systemPrompt();
    expect(prompt).toContain('药物相互作用');
  });
});
