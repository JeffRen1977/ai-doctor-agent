const SkillConfig = require('./skillConfig');

describe('SkillConfig model', () => {
  test('validates required fields', () => {
    const doc = new SkillConfig({});
    const err = doc.validateSync();
    expect(err.errors.skill).toBeDefined();
    expect(err.errors.version).toBeDefined();
  });

  test('accepts valid config', () => {
    const doc = new SkillConfig({
      skill: 'symptom_analysis',
      version: '1.2.0',
      parentVersion: '1.1.0',
      status: 'active',
      systemPrompt: '你是一位全科医生...',
      changes: ['增加用药检查规则'],
    });
    const err = doc.validateSync();
    expect(err).toBeUndefined();
    expect(doc.status).toBe('active');
  });

  test('accepts candidate version format', () => {
    const doc = new SkillConfig({
      skill: 'health_chat', version: '1.3.0-candidate',
    });
    const err = doc.validateSync();
    expect(err).toBeUndefined();
  });

  test('rejects invalid version format', () => {
    const doc = new SkillConfig({
      skill: 'health_chat', version: 'v1.0',
    });
    const err = doc.validateSync();
    expect(err.errors.version).toBeDefined();
  });

  test('rejects invalid status', () => {
    const doc = new SkillConfig({
      skill: 'health_chat', version: '1.0.0', status: 'invalid',
    });
    const err = doc.validateSync();
    expect(err.errors.status).toBeDefined();
  });

  test('defaults status to candidate', () => {
    const doc = new SkillConfig({
      skill: 'health_chat', version: '1.0.0',
    });
    expect(doc.status).toBe('candidate');
  });

  test('accepts safetyRulesHash field', () => {
    const doc = new SkillConfig({
      skill: 'health_chat',
      version: '1.0.0',
      safetyRulesHash: 'abc123',
    });
    const err = doc.validateSync();
    expect(err).toBeUndefined();
    expect(doc.safetyRulesHash).toBe('abc123');
  });

  test('safetyRulesHash defaults to undefined', () => {
    const doc = new SkillConfig({
      skill: 'health_chat', version: '1.0.0',
    });
    expect(doc.safetyRulesHash).toBeUndefined();
  });
});
