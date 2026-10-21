import { describe, test, expect } from '@jest/globals';
import { exercisePlanningSkill } from './exercisePlanning.mjs';

describe('exercisePlanning skill', () => {
  test('has correct metadata and version', () => {
    expect(exercisePlanningSkill.name).toBe('exercise_planning');
    expect(exercisePlanningSkill.version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  test('includes query_vitals for fitness baseline', () => {
    expect(exercisePlanningSkill.allowedTools).toContain('query_vitals');
  });

  test('includes query_medications for contraindications', () => {
    expect(exercisePlanningSkill.allowedTools).toContain('query_medications');
  });

  test('includes query_wearable_stream for activity data', () => {
    expect(exercisePlanningSkill.allowedTools).toContain('query_wearable_stream');
  });

  test('systemPrompt includes exercise guidance', () => {
    const prompt = exercisePlanningSkill.systemPrompt({ language: 'zh' });
    expect(prompt).toContain('运动');
    expect(prompt).toContain('强度');
  });

  test('systemPrompt warns about hypoglycemia risk with exercise', () => {
    const prompt = exercisePlanningSkill.systemPrompt({ language: 'zh' });
    expect(prompt).toContain('低血糖');
  });

  test('systemPrompt warns about cardiovascular safety', () => {
    const prompt = exercisePlanningSkill.systemPrompt({ language: 'zh' });
    expect(prompt).toContain('心血管');
  });

  test('systemPrompt considers medication timing', () => {
    const prompt = exercisePlanningSkill.systemPrompt({ language: 'zh' });
    expect(prompt).toContain('用药时间');
  });

  test('systemPrompt includes patient profile when provided', () => {
    const prompt = exercisePlanningSkill.systemPrompt({
      patientProfile: { basicInfo: { age: 60 } },
      language: 'zh',
    });
    expect(prompt).toContain('60');
  });

  test('systemPrompt works without patient profile', () => {
    const prompt = exercisePlanningSkill.systemPrompt({ language: 'zh' });
    expect(prompt).not.toContain('患者档案');
  });

  test('systemPrompt includes relevant memories', () => {
    const prompt = exercisePlanningSkill.systemPrompt({
      relevantMemories: [{ content: '用户偏好游泳' }],
      language: 'zh',
    });
    expect(prompt).toContain('用户偏好游泳');
  });

  test('systemPrompt supports English', () => {
    const prompt = exercisePlanningSkill.systemPrompt({ language: 'en' });
    expect(prompt).toContain('Respond in English');
  });

  test('postProcess passes text through', () => {
    expect(exercisePlanningSkill.postProcess('每周3次快走')).toBe('每周3次快走');
  });

  test('safety rules require disclaimer', () => {
    expect(exercisePlanningSkill.safetyRules.mustIncludeDisclaimer).toBe(true);
  });
});
