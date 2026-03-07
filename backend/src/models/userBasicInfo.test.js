/**
 * Unit tests: UserBasicInfo (colocated with source)
 * See docs/data-format/IMPLEMENTATION_STEPS_DETAILED.md Step 0.4
 */

const { validateUserBasicInfo } = require('./userBasicInfo');

describe('UserBasicInfo', () => {
  test('合法对象（含 basicInfo、medicalHistory 等）通过校验', () => {
    const data = {
      userId: 'user_1',
      userEmail: 'test@example.com',
      basicInfo: { name: '张三', age: 30 },
      medicalHistory: '既往高血压',
      familyHistory: '父亲糖尿病',
      allergies: '青霉素'
    };
    const result = validateUserBasicInfo(data);
    expect(result.error).toBeUndefined();
    expect(result.value.userId).toBe('user_1');
    expect(result.value.medicalHistory).toBe('既往高血压');
  });

  test('缺少必填字段 userId 时校验失败', () => {
    const data = { userEmail: 'test@example.com' };
    const result = validateUserBasicInfo(data);
    expect(result.error).toBeDefined();
    expect(result.error.details[0].path).toContain('userId');
  });

  test('缺少必填字段 userEmail 时校验失败', () => {
    const data = { userId: 'user_1' };
    const result = validateUserBasicInfo(data);
    expect(result.error).toBeDefined();
  });

  test('与现有 personalHealthRecords 根文档形状兼容', () => {
    const fixture = {
      userId: 'test_user_replace_dot',
      userEmail: 'test@example.com',
      basicInfo: { name: 'Test', gender: 'male', age: 40 },
      medicalHistory: '无',
      familyHistory: '无',
      allergies: '无',
      updatedAt: new Date()
    };
    const result = validateUserBasicInfo(fixture);
    expect(result.error).toBeUndefined();
  });
});
