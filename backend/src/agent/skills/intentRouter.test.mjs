import { describe, test, expect } from '@jest/globals';
import { classifyIntent } from './intentRouter.mjs';
import { SkillRegistry } from './skillRegistry.mjs';

function buildRegistry() {
  const reg = new SkillRegistry();
  const make = (name, isDefault = false) => ({
    name, allowedTools: [], systemPrompt: () => '', postProcess: t => t, safetyRules: {}, isDefault,
  });
  reg.register(make('health_chat', true));
  reg.register(make('symptom_analysis'));
  reg.register(make('drug_interaction'));
  reg.register(make('risk_assessment'));
  reg.register(make('nutrition_analysis'));
  reg.register(make('exercise_planning'));
  reg.register(make('emotional_support'));
  reg.register(make('metrics_explanation'));
  return reg;
}

describe('classifyIntent', () => {
  const reg = buildRegistry();

  test('routes Chinese symptom message', () => {
    expect(classifyIntent('我最近头疼得厉害', reg)).toBe('symptom_analysis');
  });

  test('routes Chinese drug interaction message', () => {
    expect(classifyIntent('二甲双胍和阿司匹林能一起吃吗', reg)).toBe('drug_interaction');
  });

  test('routes Chinese risk assessment message', () => {
    expect(classifyIntent('我的健康风险评估怎么样', reg)).toBe('risk_assessment');
  });

  test('routes generic message to default', () => {
    expect(classifyIntent('你好', reg)).toBe('health_chat');
  });

  test('routes English symptom message', () => {
    expect(classifyIntent('I have a terrible headache', reg)).toBe('symptom_analysis');
  });

  test('routes English drug interaction message', () => {
    expect(classifyIntent('check drug interactions for metformin', reg)).toBe('drug_interaction');
  });

  test('falls back to default if matched skill is not registered', () => {
    const partial = new SkillRegistry();
    partial.register({ name: 'health_chat', allowedTools: [], isDefault: true, systemPrompt: () => '', postProcess: t => t, safetyRules: {} });
    expect(classifyIntent('我头疼', partial)).toBe('health_chat');
  });

  test('case-insensitive matching', () => {
    expect(classifyIntent('HRV analysis please', reg)).toBe('risk_assessment');
  });

  // --- Cases from the priority/safety analysis ---

  test('drug name + symptom → drug_interaction (aspirin + stomach)', () => {
    expect(classifyIntent('吃了阿司匹林胃不舒服，是副作用吗', reg)).toBe('drug_interaction');
  });

  test('drug name + symptom → drug_interaction (cephalosporin + alcohol + headache)', () => {
    expect(classifyIntent('头孢和酒能一起吃吗？喝完头疼', reg)).toBe('drug_interaction');
  });

  test('pure drug interaction without symptom keywords', () => {
    expect(classifyIntent('布洛芬和阿司匹林能一起吃吗', reg)).toBe('drug_interaction');
  });

  test('blood pressure keyword → risk_assessment', () => {
    expect(classifyIntent('我最近血压有点高', reg)).toBe('risk_assessment');
  });

  test('generic advice → health_chat', () => {
    expect(classifyIntent('我想减肥，有什么建议', reg)).toBe('health_chat');
  });

  test('standalone 异常 without health context → default', () => {
    expect(classifyIntent('我的报告有异常吗', reg)).toBe('health_chat');
  });

  test('心率异常 still routes to risk_assessment', () => {
    expect(classifyIntent('我的心率异常了', reg)).toBe('risk_assessment');
  });

  test('English drug + symptom combo routes to drug_interaction', () => {
    expect(classifyIntent('I took ibuprofen and now I feel nauseous', reg)).toBe('drug_interaction');
  });

  test('drug_interaction wins over symptom_analysis by priority', () => {
    expect(classifyIntent('吃了这个药副作用让我头疼', reg)).toBe('drug_interaction');
  });

  // --- Nutrition analysis ---

  test('routes nutrition query in Chinese', () => {
    expect(classifyIntent('糖尿病人早餐吃什么好', reg)).toBe('nutrition_analysis');
  });

  test('routes diet advice in Chinese', () => {
    expect(classifyIntent('我想控制饮食减肥', reg)).toBe('nutrition_analysis');
  });

  test('routes calorie question in English', () => {
    expect(classifyIntent('how many calories should I eat per meal', reg)).toBe('nutrition_analysis');
  });

  // --- Exercise planning ---

  test('routes exercise query in Chinese', () => {
    expect(classifyIntent('我适合做什么运动', reg)).toBe('exercise_planning');
  });

  test('routes fitness plan request', () => {
    expect(classifyIntent('帮我制定一个运动计划', reg)).toBe('exercise_planning');
  });

  test('routes exercise query in English', () => {
    expect(classifyIntent('what exercise is good for diabetes', reg)).toBe('exercise_planning');
  });

  // --- Emotional support ---

  test('routes anxiety query in Chinese', () => {
    expect(classifyIntent('我最近很焦虑，压力很大', reg)).toBe('emotional_support');
  });

  test('routes depression query in Chinese', () => {
    expect(classifyIntent('心情不好，情绪低落', reg)).toBe('emotional_support');
  });

  test('routes emotional query in English', () => {
    expect(classifyIntent('I feel so stressed and overwhelmed', reg)).toBe('emotional_support');
  });

  test('emotional_support wins over symptom_analysis for insomnia + mood', () => {
    expect(classifyIntent('心情不好睡不着', reg)).toBe('emotional_support');
  });

  // --- Metrics explanation ---

  test('routes metrics explanation query in Chinese', () => {
    expect(classifyIntent('我的检查结果什么意思', reg)).toBe('metrics_explanation');
  });

  test('routes HbA1c explanation query', () => {
    expect(classifyIntent('什么是HbA1c', reg)).toBe('metrics_explanation');
  });

  test('routes lab results query in English', () => {
    expect(classifyIntent('can you explain my lab results', reg)).toBe('metrics_explanation');
  });

  test('routes normal range question', () => {
    expect(classifyIntent('血脂的正常范围是多少', reg)).toBe('metrics_explanation');
  });
});
