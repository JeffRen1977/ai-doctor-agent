import { describe, test, expect } from '@jest/globals';
import { emotionalSupportSkill } from './emotionalSupport.mjs';

describe('emotionalSupport skill', () => {
  test('has correct metadata and version', () => {
    expect(emotionalSupportSkill.name).toBe('emotional_support');
    expect(emotionalSupportSkill.version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  test('includes query_health_records for medical context', () => {
    expect(emotionalSupportSkill.allowedTools).toContain('query_health_records');
  });

  test('includes query_vitals for stress indicators', () => {
    expect(emotionalSupportSkill.allowedTools).toContain('query_vitals');
  });

  test('does not include write tools', () => {
    for (const tool of emotionalSupportSkill.allowedTools) {
      expect(tool).toMatch(/^query_/);
    }
  });

  test('systemPrompt emphasizes empathy', () => {
    const prompt = emotionalSupportSkill.systemPrompt({ language: 'zh' });
    expect(prompt).toContain('同理心');
    expect(prompt).toContain('共情');
  });

  test('systemPrompt includes crisis escalation instructions', () => {
    const prompt = emotionalSupportSkill.systemPrompt({ language: 'zh' });
    expect(prompt).toContain('危机拦截');
    expect(prompt).toContain('400-161-9995');
  });

  test('systemPrompt includes suicide/self-harm crisis protocol', () => {
    const prompt = emotionalSupportSkill.systemPrompt({ language: 'zh' });
    expect(prompt).toContain('自杀');
    expect(prompt).toContain('自残');
    expect(prompt).toContain('紧急求助热线');
  });

  test('systemPrompt acknowledges chronic disease psychological burden', () => {
    const prompt = emotionalSupportSkill.systemPrompt({ language: 'zh' });
    expect(prompt).toContain('慢性病');
    expect(prompt).toContain('心理负担');
  });

  test('systemPrompt includes patient profile when provided', () => {
    const prompt = emotionalSupportSkill.systemPrompt({
      patientProfile: { conditions: ['depression'] },
      language: 'zh',
    });
    expect(prompt).toContain('depression');
  });

  test('systemPrompt works without patient profile', () => {
    const prompt = emotionalSupportSkill.systemPrompt({ language: 'zh' });
    expect(prompt).not.toContain('患者档案');
  });

  test('systemPrompt includes relevant memories', () => {
    const prompt = emotionalSupportSkill.systemPrompt({
      relevantMemories: [{ content: '上次情绪低落时散步有帮助' }],
      language: 'zh',
    });
    expect(prompt).toContain('上次情绪低落时散步有帮助');
  });

  test('systemPrompt supports English', () => {
    const prompt = emotionalSupportSkill.systemPrompt({ language: 'en' });
    expect(prompt).toContain('Respond in English');
  });

  test('postProcess passes text through', () => {
    expect(emotionalSupportSkill.postProcess('我理解你的感受')).toBe('我理解你的感受');
  });

  test('safety rules set low escalation threshold', () => {
    expect(emotionalSupportSkill.safetyRules.maxSeverityWithoutEscalation).toBe('low');
  });

  test('safety rules enable crisis escalation', () => {
    expect(emotionalSupportSkill.safetyRules.crisisEscalation).toBe(true);
  });

  test('safety rules block self-harm topics', () => {
    expect(emotionalSupportSkill.safetyRules.blockedTopics).toContain('自杀');
    expect(emotionalSupportSkill.safetyRules.blockedTopics).toContain('自残');
  });
});
