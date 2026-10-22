import { generateObject } from 'ai';
import { z } from 'zod';
import { getLightModel } from '../config/agentProvider.mjs';

const CandidateSchema = z.object({
  systemPrompt: z.string().min(50),
  changes: z.array(z.string()),
  reasoning: z.string(),
});

const PROTECTED_FIELDS = new Set(['safetyRules', 'allowedTools', 'name']);

export function validateSafetyRulesImmutable(original, candidate) {
  if (!original.safetyRules) return;
  if (candidate.safetyRules === undefined) return;
  const origJson = JSON.stringify(original.safetyRules);
  const candJson = JSON.stringify(candidate.safetyRules);
  if (origJson !== candJson) {
    throw new Error(
      `safetyRules must not be modified by evolution. Original: ${origJson}, Candidate: ${candJson}`,
    );
  }
}

export function assertProtectedFieldsUnchanged(original, candidate) {
  for (const field of PROTECTED_FIELDS) {
    if (candidate[field] === undefined) continue;
    if (JSON.stringify(original[field]) !== JSON.stringify(candidate[field])) {
      throw new Error(`Protected field "${field}" must not be modified by evolution`);
    }
  }
}

export class CandidateGenerator {
  constructor({ model, logger, generateObjectFn } = {}) {
    this._model = model;
    this.logger = logger;
    this._generateObject = generateObjectFn ?? generateObject;
  }

  get model() {
    return this._model ?? getLightModel();
  }

  bumpVersion(version) {
    const base = version.replace(/-\w+$/, '');
    const parts = base.split('.').map(Number);
    parts[2] = (parts[2] || 0) + 1;
    return parts.join('.') + '-candidate';
  }

  async generate(skill, evaluation) {
    if (!evaluation?.gradients?.length) {
      return null;
    }

    const currentPromptText = typeof skill.systemPrompt === 'function'
      ? skill.systemPrompt({})
      : skill.systemPrompt;

    const prompt = [
      '你是一位 AI Prompt 工程专家。请根据评估反馈改进以下技能的 systemPrompt。',
      '',
      `技能名称：${skill.name}`,
      `技能描述：${skill.description}`,
      '当前 systemPrompt：',
      currentPromptText,
      '',
      '评估结果：',
      `综合评分：${evaluation.overallScore?.toFixed(1) ?? 'N/A'}/10`,
      `维度评分：${JSON.stringify(evaluation.scores)}`,
      '',
      '改进方向：',
      ...evaluation.gradients.map((g) =>
        `- [${g.type}] ${g.text}（出现频率：${(g.frequency * 100).toFixed(0)}%）`,
      ),
      '',
      '要求：',
      '1. 保留所有安全相关指令（免责声明、工具使用要求、紧急就医提示等）',
      '2. 不要改变技能的核心功能定位',
      '3. 只优化 prompt 表达，使 AI 更好地遵循指令',
      '4. 用中文撰写 systemPrompt',
      '5. 列出具体的 changes（做了哪些修改）和 reasoning（为什么这样改）',
    ].join('\n');

    const { object } = await this._generateObject({
      model: this.model,
      schema: CandidateSchema,
      prompt,
    });

    const candidate = {
      skill: skill.name,
      version: this.bumpVersion(skill.version),
      parentVersion: skill.version,
      status: 'candidate',
      systemPrompt: object.systemPrompt,
      changes: object.changes,
      safetyRules: skill.safetyRules,
      allowedTools: skill.allowedTools,
      name: skill.name,
      metadata: {
        reasoning: object.reasoning,
        evaluationScore: evaluation.overallScore,
        generatedAt: new Date().toISOString(),
      },
    };

    assertProtectedFieldsUnchanged(skill, candidate);

    return candidate;
  }
}
