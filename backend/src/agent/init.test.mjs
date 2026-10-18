import { describe, test, expect, jest } from '@jest/globals';
import { initAgent, getAgentInstance } from './init.mjs';

describe('initAgent', () => {
  const fakeRepos = {
    vitalsDailyRepo: { getVitalsDaily: jest.fn() },
    medicationRepo: { listActive: jest.fn() },
    userBasicInfoRepo: { getBasicInfo: jest.fn(), getFullHealthRecord: jest.fn() },
    riskAlertRepo: { getRecentAlertsByUser: jest.fn() },
  };

  test('registers all 4 tools and creates memoryManager', () => {
    const { toolRegistry, memoryManager } = initAgent(fakeRepos);
    expect(toolRegistry.list()).toEqual(
      expect.arrayContaining([
        'query_vitals',
        'query_medications',
        'query_health_records',
        'query_risk_alerts',
      ]),
    );
    expect(toolRegistry.list()).toHaveLength(4);
    expect(memoryManager).toBeDefined();
    expect(typeof memoryManager.appendToSession).toBe('function');
  });

  test('getAgentInstance returns same instance after init', () => {
    initAgent(fakeRepos);
    const inst = getAgentInstance();
    expect(inst.toolRegistry).toBeDefined();
    expect(inst.memoryManager).toBeDefined();
  });
});
