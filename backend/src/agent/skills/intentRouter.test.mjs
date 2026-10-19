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
});
