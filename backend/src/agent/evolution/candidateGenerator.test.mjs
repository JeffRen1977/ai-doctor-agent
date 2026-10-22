import { describe, test, expect, jest, beforeEach } from '@jest/globals';

const mockGenerateObject = jest.fn();

jest.unstable_mockModule('ai', () => ({
  generateObject: mockGenerateObject,
}));

jest.unstable_mockModule('../config/agentProvider.mjs', () => ({
  getLightModel: jest.fn(() => ({ modelId: 'gpt-4o-mini' })),
}));

const {
  CandidateGenerator,
  validateSafetyRulesImmutable,
  assertProtectedFieldsUnchanged,
} = await import('./candidateGenerator.mjs');

describe('CandidateGenerator', () => {
  const mockLogger = { warn: jest.fn(), error: jest.fn() };
  let generator;

  const skill = {
    name: 'symptom_analysis',
    version: '1.0.0',
    description: '症状分析与初步评估',
    systemPrompt: () => '你是一位症状分析助手。',
    allowedTools: ['query_vitals', 'query_medications'],
    safetyRules: {
      mustIncludeDisclaimer: true,
      maxSeverityWithoutEscalation: 'low',
      blockedTopics: ['自杀', '自残'],
    },
  };

  const evaluation = {
    overallScore: 7.2,
    scores: { relevance: 7, safety: 9, toolUsage: 6, disclaimer: 8, clarity: 6 },
    gradients: [
      { type: 'weakness', text: '工具调用不够充分', frequency: 0.8 },
      { type: 'suggestion', text: '增加用药查询步骤', frequency: 0.6 },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    generator = new CandidateGenerator({
      model: { modelId: 'gpt-4o-mini' },
      logger: mockLogger,
      generateObjectFn: mockGenerateObject,
    });
  });

  test('generate produces a candidate with correct metadata', async () => {
    mockGenerateObject.mockResolvedValue({
      object: {
        systemPrompt: '你是一位经验丰富的症状分析助手。分析前请先查询用药信息。',
        changes: ['增加了用药查询步骤的明确要求', '优化了分析流程描述'],
        reasoning: '评估发现工具调用不足，改进 prompt 明确要求先查询用药。',
      },
    });

    const candidate = await generator.generate(skill, evaluation);

    expect(candidate.skill).toBe('symptom_analysis');
    expect(candidate.version).toBe('1.0.1-candidate');
    expect(candidate.parentVersion).toBe('1.0.0');
    expect(candidate.status).toBe('candidate');
    expect(candidate.systemPrompt).toContain('症状分析');
    expect(candidate.changes).toHaveLength(2);
    expect(candidate.safetyRules).toEqual(skill.safetyRules);
    expect(candidate.metadata.evaluationScore).toBe(7.2);
    expect(candidate.metadata.reasoning).toContain('用药');
  });

  test('generate returns null when no gradients', async () => {
    const noGradients = { overallScore: 9, scores: {}, gradients: [] };
    const result = await generator.generate(skill, noGradients);
    expect(result).toBeNull();
    expect(mockGenerateObject).not.toHaveBeenCalled();
  });

  test('generate returns null for null evaluation', async () => {
    expect(await generator.generate(skill, null)).toBeNull();
  });

  test('generate preserves safetyRules from original skill', async () => {
    mockGenerateObject.mockResolvedValue({
      object: {
        systemPrompt: 'new prompt content here that is long enough to pass validation',
        changes: ['改进'],
        reasoning: '原因',
      },
    });

    const candidate = await generator.generate(skill, evaluation);
    expect(candidate.safetyRules).toStrictEqual(skill.safetyRules);
    expect(candidate.allowedTools).toStrictEqual(skill.allowedTools);
    expect(candidate.name).toBe(skill.name);
  });

  test('generate passes skill description and prompt to LLM', async () => {
    mockGenerateObject.mockResolvedValue({
      object: { systemPrompt: 'x'.repeat(60), changes: ['c'], reasoning: 'r' },
    });

    await generator.generate(skill, evaluation);

    const prompt = mockGenerateObject.mock.calls[0][0].prompt;
    expect(prompt).toContain('symptom_analysis');
    expect(prompt).toContain('症状分析与初步评估');
    expect(prompt).toContain('7.2');
    expect(prompt).toContain('工具调用不够充分');
    expect(prompt).toContain('80%');
  });

  test('bumpVersion increments patch for semver', () => {
    expect(generator.bumpVersion('1.0.0')).toBe('1.0.1-candidate');
    expect(generator.bumpVersion('2.3.5')).toBe('2.3.6-candidate');
    expect(generator.bumpVersion('1.0.0-candidate')).toBe('1.0.1-candidate');
  });

  test('handles string systemPrompt (not function)', async () => {
    const staticSkill = { ...skill, systemPrompt: '静态 prompt 内容' };
    mockGenerateObject.mockResolvedValue({
      object: { systemPrompt: 'x'.repeat(60), changes: ['c'], reasoning: 'r' },
    });

    await generator.generate(staticSkill, evaluation);
    const prompt = mockGenerateObject.mock.calls[0][0].prompt;
    expect(prompt).toContain('静态 prompt 内容');
  });
});

describe('validateSafetyRulesImmutable', () => {
  test('passes when safetyRules match', () => {
    const original = { safetyRules: { mustIncludeDisclaimer: true } };
    const candidate = { safetyRules: { mustIncludeDisclaimer: true } };
    expect(() => validateSafetyRulesImmutable(original, candidate)).not.toThrow();
  });

  test('throws when safetyRules differ', () => {
    const original = { safetyRules: { mustIncludeDisclaimer: true } };
    const candidate = { safetyRules: { mustIncludeDisclaimer: false } };
    expect(() => validateSafetyRulesImmutable(original, candidate)).toThrow(
      /safetyRules must not be modified/,
    );
  });

  test('passes when original has no safetyRules', () => {
    expect(() => validateSafetyRulesImmutable({}, { safetyRules: { x: 1 } })).not.toThrow();
  });

  test('passes when candidate has no safetyRules field', () => {
    expect(() => validateSafetyRulesImmutable({ safetyRules: { x: 1 } }, {})).not.toThrow();
  });
});

describe('assertProtectedFieldsUnchanged', () => {
  test('passes when all protected fields match', () => {
    const original = { name: 'x', safetyRules: { a: 1 }, allowedTools: ['t1'] };
    const candidate = { name: 'x', safetyRules: { a: 1 }, allowedTools: ['t1'] };
    expect(() => assertProtectedFieldsUnchanged(original, candidate)).not.toThrow();
  });

  test('throws when name changes', () => {
    const original = { name: 'x' };
    const candidate = { name: 'y' };
    expect(() => assertProtectedFieldsUnchanged(original, candidate)).toThrow(
      /Protected field "name"/,
    );
  });

  test('throws when allowedTools change', () => {
    const original = { allowedTools: ['t1'] };
    const candidate = { allowedTools: ['t1', 't2'] };
    expect(() => assertProtectedFieldsUnchanged(original, candidate)).toThrow(
      /Protected field "allowedTools"/,
    );
  });

  test('passes when candidate omits protected fields', () => {
    const original = { name: 'x', safetyRules: { a: 1 } };
    expect(() => assertProtectedFieldsUnchanged(original, {})).not.toThrow();
  });
});
