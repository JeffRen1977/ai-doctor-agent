/**
 * Unit tests: repositories facade (colocated with source)
 * See docs/data-format/IMPLEMENTATION_STEPS_DETAILED.md Step 1.4
 */

jest.mock('../adapters', () => ({
  userBasicInfoRepo: {
    getBasicInfo: jest.fn(),
    getBasicInfoForAgent: jest.fn(),
    saveBasicInfo: jest.fn(),
    getFullHealthRecord: jest.fn()
  },
  medicationRepo: null,
  vitalsDailyRepo: null,
  chatSessionRepo: null
}));

describe('repositories/index.js facade', () => {
  test('require 得到对象且含 userBasicInfoRepo', () => {
    const repos = require('./index');
    expect(typeof repos).toBe('object');
    expect(repos.userBasicInfoRepo).toBeDefined();
  });

  test('userBasicInfoRepo 有 getBasicInfo、getBasicInfoForAgent、saveBasicInfo、getFullHealthRecord 方法', () => {
    const repos = require('./index');
    expect(typeof repos.userBasicInfoRepo.getBasicInfo).toBe('function');
    expect(typeof repos.userBasicInfoRepo.getBasicInfoForAgent).toBe('function');
    expect(typeof repos.userBasicInfoRepo.saveBasicInfo).toBe('function');
    expect(typeof repos.userBasicInfoRepo.getFullHealthRecord).toBe('function');
  });

  test('导出 medicationRepo、vitalsDailyRepo、chatSessionRepo（可为 null）', () => {
    const repos = require('./index');
    expect('medicationRepo' in repos).toBe(true);
    expect('vitalsDailyRepo' in repos).toBe(true);
    expect('chatSessionRepo' in repos).toBe(true);
  });
});
