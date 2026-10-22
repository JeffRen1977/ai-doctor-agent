import { generateText, generateObject } from 'ai';
import { z } from 'zod';
import { getAgentModel, getLightModel } from '../config/agentProvider.mjs';

const ComparisonSchema = z.object({
  winner: z.enum(['candidate', 'original', 'tie']),
  candidateScore: z.number().min(0).max(10),
  originalScore: z.number().min(0).max(10),
  reasoning: z.string(),
});

const MIN_WIN_RATE = 0.5;

export class ReplayValidator {
  constructor({ model, judgeModel, logger, generateTextFn, generateObjectFn } = {}) {
    this._model = model;
    this._judgeModel = judgeModel;
    this.logger = logger;
    this._generateText = generateTextFn ?? generateText;
    this._generateObject = generateObjectFn ?? generateObject;
  }

  get model() {
    return this._model ?? getAgentModel();
  }

  get judgeModel() {
    return this._judgeModel ?? getLightModel();
  }

  async replay(candidatePrompt, userMessage) {
    const result = await this._generateText({
      model: this.model,
      system: candidatePrompt,
      messages: [{ role: 'user', content: userMessage }],
      maxTokens: 2048,
    });
    return result.text;
  }

  async compareAnswers(question, originalAnswer, candidateAnswer) {
    const prompt = [
      '你是一位医疗 AI 质量评审员。请比较两个回答的质量。',
      '',
      `用户问题：${question}`,
      '',
      '回答 A（原版）：',
      originalAnswer,
      '',
      '回答 B（候选版）：',
      candidateAnswer,
      '',
      '评价维度：相关性、准确性、安全性、清晰度、免责声明完整性。',
      '请给出各自的分数（0-10）和胜者（candidate 表示 B 更好，original 表示 A 更好，tie 表示持平）。',
    ].join('\n');

    const { object } = await this._generateObject({
      model: this.judgeModel,
      schema: ComparisonSchema,
      prompt,
    });

    return object;
  }

  async validate(candidate, traces, _originalSkill) {
    if (!traces?.length) {
      return { passed: false, reason: 'no_traces', comparisons: [] };
    }

    const sample = traces.slice(0, 10);
    const comparisons = [];
    let wins = 0;
    let losses = 0;
    let ties = 0;

    for (const trace of sample) {
      try {
        const candidateAnswer = await this.replay(candidate.systemPrompt, trace.userMessage);
        const comparison = await this.compareAnswers(
          trace.userMessage,
          trace.finalAnswer,
          candidateAnswer,
        );
        comparisons.push({
          userMessage: trace.userMessage,
          ...comparison,
        });

        if (comparison.winner === 'candidate') wins++;
        else if (comparison.winner === 'original') losses++;
        else ties++;
      } catch (err) {
        this.logger?.warn?.({ err: { message: err?.message } }, 'Replay comparison failed');
      }
    }

    if (comparisons.length === 0) {
      return { passed: false, reason: 'all_comparisons_failed', comparisons: [] };
    }

    const avgCandidateScore =
      comparisons.reduce((s, c) => s + c.candidateScore, 0) / comparisons.length;
    const avgOriginalScore =
      comparisons.reduce((s, c) => s + c.originalScore, 0) / comparisons.length;
    const winRate = wins / comparisons.length;

    const passed = winRate >= MIN_WIN_RATE && avgCandidateScore >= avgOriginalScore;

    return {
      passed,
      wins,
      losses,
      ties,
      winRate,
      avgCandidateScore,
      avgOriginalScore,
      sampleSize: comparisons.length,
      comparisons,
    };
  }
}
