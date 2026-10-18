import { describe, test, expect } from '@jest/globals';
import { healthChatSkill } from './healthChat.mjs';

describe('healthChat skill', () => {
  test('has correct metadata', () => {
    expect(healthChatSkill.name).toBe('health_chat');
    expect(healthChatSkill.allowedTools).toContain('query_vitals');
    expect(healthChatSkill.allowedTools).toContain('query_medications');
    expect(healthChatSkill.allowedTools).toContain('query_health_records');
    expect(healthChatSkill.allowedTools).toContain('query_risk_alerts');
  });

  test('systemPrompt includes patient profile when provided', () => {
    const prompt = healthChatSkill.systemPrompt({
      patientProfile: { name: '测试', conditions: ['diabetes'] },
      language: 'zh',
    });
    expect(prompt).toContain('diabetes');
    expect(prompt).toContain('请用中文回答');
  });

  test('systemPrompt works without patient profile', () => {
    const prompt = healthChatSkill.systemPrompt({ language: 'zh' });
    expect(prompt).toContain('健康管家');
    expect(prompt).not.toContain('患者档案');
  });

  test('systemPrompt includes relevant memories', () => {
    const prompt = healthChatSkill.systemPrompt({
      relevantMemories: [{ content: '上次建议减少碳水' }],
      language: 'zh',
    });
    expect(prompt).toContain('上次建议减少碳水');
  });

  test('includes instruction to query meds before analysis', () => {
    const prompt = healthChatSkill.systemPrompt({ language: 'zh' });
    expect(prompt).toContain('先查询当前用药');
  });

  test('includes disclaimer instruction', () => {
    const prompt = healthChatSkill.systemPrompt({ language: 'zh' });
    expect(prompt).toContain('免责声明');
  });

  test('supports English language', () => {
    const prompt = healthChatSkill.systemPrompt({ language: 'en' });
    expect(prompt).toContain('Respond in English');
    expect(prompt).not.toContain('请用中文');
  });

  test('works with no arguments', () => {
    const prompt = healthChatSkill.systemPrompt();
    expect(prompt).toContain('健康管家');
  });
});
