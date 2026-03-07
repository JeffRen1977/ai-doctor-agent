/**
 * Unit tests: AIContextPayload (colocated with source)
 * See docs/data-format/IMPLEMENTATION_STEPS_DETAILED.md Step 0.4
 */

const { validateAIContextPayload } = require('./aiContextPayload');

describe('AIContextPayload', () => {
  test('仅有 basicInfo、userId、language、requestedAt 时通过', () => {
    const data = {
      userId: 'user_1',
      basicInfo: '用户基础信息摘要',
      language: 'zh',
      requestedAt: new Date().toISOString()
    };
    const result = validateAIContextPayload(data);
    expect(result.error).toBeUndefined();
    expect(result.value.basicInfo).toBe('用户基础信息摘要');
  });

  test('缺少 basicInfo 时不通过', () => {
    const data = {
      userId: 'user_1',
      language: 'zh',
      requestedAt: new Date().toISOString()
    };
    const result = validateAIContextPayload(data);
    expect(result.error).toBeDefined();
    expect(result.error.details[0].path).toContain('basicInfo');
  });

  test('可选 medications、vitalsRecent、chatRecent 可省略', () => {
    const data = {
      userId: 'u1',
      basicInfo: '摘要',
      language: 'en',
      requestedAt: '2025-02-08T00:00:00.000Z'
    };
    const result = validateAIContextPayload(data);
    expect(result.error).toBeUndefined();
    expect(result.value.medications).toBeUndefined();
    expect(result.value.vitalsRecent).toBeUndefined();
    expect(result.value.chatRecent).toBeUndefined();
  });

  test('language 仅允许 zh 或 en', () => {
    expect(validateAIContextPayload({
      userId: 'u1', basicInfo: 'x', language: 'zh', requestedAt: new Date().toISOString()
    }).error).toBeUndefined();
    expect(validateAIContextPayload({
      userId: 'u1', basicInfo: 'x', language: 'fr', requestedAt: new Date().toISOString()
    }).error).toBeDefined();
  });
});
