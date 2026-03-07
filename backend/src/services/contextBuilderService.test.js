/**
 * Unit tests: Context Builder (colocated with source)
 * See docs/data-format/IMPLEMENTATION_STEPS_DETAILED.md Step 5.4
 */

const mockGetBasicInfoForAgent = jest.fn().mockResolvedValue('【基础信息】张三，30岁');
const mockListActive = jest.fn().mockResolvedValue([]);
const mockGetVitalsDaily = jest.fn().mockResolvedValue(null);
const mockGetRecentTurnsForAgent = jest.fn().mockResolvedValue('');

jest.mock('../repositories', () => ({
  userBasicInfoRepo: { getBasicInfoForAgent: (...args) => mockGetBasicInfoForAgent(...args) },
  medicationRepo: { listActive: (...args) => mockListActive(...args) },
  vitalsDailyRepo: { getVitalsDaily: (...args) => mockGetVitalsDaily(...args) },
  chatSessionRepo: { getRecentTurnsForAgent: (...args) => mockGetRecentTurnsForAgent(...args) }
}));

const { buildAIContext, formatContextForSystemPrompt } = require('./contextBuilderService');

beforeEach(() => {
  mockGetBasicInfoForAgent.mockClear();
  mockListActive.mockClear();
  mockGetVitalsDaily.mockClear();
  mockGetRecentTurnsForAgent.mockClear();
  mockGetBasicInfoForAgent.mockResolvedValue('【基础信息】张三，30岁');
  mockListActive.mockResolvedValue([]);
  mockGetVitalsDaily.mockResolvedValue(null);
  mockGetRecentTurnsForAgent.mockResolvedValue('');
});

describe('buildAIContext', () => {
  test('options={} 时 payload 含 basicInfo，medications/vitalsRecent/chatRecent 未请求则不出现或为空', async () => {
    const payload = await buildAIContext('user_1', {});
    expect(payload.userId).toBe('user_1');
    expect(payload.basicInfo).toBeDefined();
    expect(payload.basicInfo).toContain('张三');
    expect(payload.language).toBe('zh');
    expect(payload.requestedAt).toBeDefined();
    expect(mockGetBasicInfoForAgent).toHaveBeenCalledWith('user_1');
    expect(mockListActive).not.toHaveBeenCalled();
    expect(mockGetVitalsDaily).not.toHaveBeenCalled();
    expect(mockGetRecentTurnsForAgent).not.toHaveBeenCalled();
    expect(payload.medications).toBeUndefined();
    expect(payload.vitalsRecent).toBeUndefined();
    expect(payload.chatRecent).toBeUndefined();
  });

  test('options={ medications: true, vitalsRecent: true } 时 payload 含 basicInfo、medications、vitalsRecent；chatRecent 未请求则无', async () => {
    mockListActive.mockResolvedValue([
      { name: '阿司匹林', dosage: '100mg', frequency: '一日一次' }
    ]);
    mockGetVitalsDaily.mockResolvedValue({
      date: '2025-02-08',
      summary: { heartRate: { avg: 72 }, steps: 5000 },
      anomalies: [],
      trend: 'stable'
    });
    const payload = await buildAIContext('user_1', { medications: true, vitalsRecent: true });
    expect(payload.basicInfo).toBeDefined();
    expect(payload.medications).toContain('阿司匹林');
    expect(payload.vitalsRecent).toEqual({
      date: '2025-02-08',
      summary: { heartRate: { avg: 72 }, steps: 5000 },
      anomalies: [],
      trend: 'stable'
    });
    expect(payload.chatRecent).toBeUndefined();
    expect(mockListActive).toHaveBeenCalledWith('user_1');
    expect(mockGetRecentTurnsForAgent).not.toHaveBeenCalled();
  });

  test('某 repo 返回 null/空时对应维度为占位或空，不抛错', async () => {
    mockGetBasicInfoForAgent.mockResolvedValue('');
    const payload = await buildAIContext('user_1', {});
    expect(payload.basicInfo).toBe('暂无基础档案信息。');
    expect(payload.userId).toBe('user_1');
  });

  test('options.chatRecent 为 true 时拉取 getRecentTurnsForAgent', async () => {
    mockGetRecentTurnsForAgent.mockResolvedValue('User: 头痛\nAssistant: 建议休息');
    const payload = await buildAIContext('user_1', { chatRecent: true });
    expect(payload.chatRecent).toBe('User: 头痛\nAssistant: 建议休息');
    expect(mockGetRecentTurnsForAgent).toHaveBeenCalledWith('user_1', 5);
  });

  test('options.language 为 en 时 payload.language 为 en', async () => {
    const payload = await buildAIContext('user_1', { language: 'en' });
    expect(payload.language).toBe('en');
  });
});

describe('formatContextForSystemPrompt', () => {
  test('正常 payload 返回字符串，包含 basicInfo 等已请求维度内容', () => {
    const payload = {
      userId: 'u1',
      basicInfo: '姓名：李四',
      medications: '阿司匹林 100mg',
      language: 'zh',
      requestedAt: new Date().toISOString()
    };
    const text = formatContextForSystemPrompt(payload);
    expect(text).toContain('[基础档案]');
    expect(text).toContain('李四');
    expect(text).toContain('[当前用药]');
    expect(text).toContain('阿司匹林');
  });

  test('超长 payload + maxChars 限制时输出被截断', () => {
    const payload = {
      userId: 'u1',
      basicInfo: 'x'.repeat(10000),
      language: 'zh',
      requestedAt: new Date().toISOString()
    };
    const text = formatContextForSystemPrompt(payload, { maxChars: 100 });
    expect(text.length).toBeLessThanOrEqual(110);
    expect(text).toContain('(已截断)');
  });
});
