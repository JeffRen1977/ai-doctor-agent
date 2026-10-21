import { describe, test, expect, jest } from '@jest/globals';
import { initAgent, getAgentInstance } from './init.mjs';

describe('initAgent', () => {
  const fakeRepos = {
    vitalsDailyRepo: { getVitalsDaily: jest.fn() },
    medicationRepo: { listActive: jest.fn() },
    userBasicInfoRepo: { getBasicInfo: jest.fn(), getFullHealthRecord: jest.fn() },
    riskAlertRepo: { getRecentAlertsByUser: jest.fn() },
    wearableStreamDataRepo: { getRecentByUser: jest.fn() },
  };

  test('registers all 5 tools and creates memoryManager', () => {
    const { toolRegistry, memoryManager } = initAgent(fakeRepos);
    expect(toolRegistry.list()).toEqual(
      expect.arrayContaining([
        'query_vitals',
        'query_medications',
        'query_health_records',
        'query_risk_alerts',
        'query_wearable_stream',
      ]),
    );
    expect(toolRegistry.list()).toHaveLength(5);
    expect(memoryManager).toBeDefined();
    expect(typeof memoryManager.appendToSession).toBe('function');
  });

  test('registers all 8 skills with healthChat as default', () => {
    const { skillRegistry } = initAgent(fakeRepos);
    expect(skillRegistry.list()).toEqual(
      expect.arrayContaining([
        'health_chat', 'symptom_analysis', 'drug_interaction', 'risk_assessment',
        'nutrition_analysis', 'exercise_planning', 'emotional_support', 'metrics_explanation',
      ]),
    );
    expect(skillRegistry.list()).toHaveLength(8);
    expect(skillRegistry.getDefault().name).toBe('health_chat');
  });

  test('getAgentInstance returns same instance with all three registries', () => {
    initAgent(fakeRepos);
    const inst = getAgentInstance();
    expect(inst.toolRegistry).toBeDefined();
    expect(inst.memoryManager).toBeDefined();
    expect(inst.skillRegistry).toBeDefined();
  });
});
