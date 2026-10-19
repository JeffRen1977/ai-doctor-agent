import { describe, test, expect, jest, beforeEach } from '@jest/globals';

const mockGenerateText = jest.fn();
const mockGetAgentModel = jest.fn(() => ({ modelId: 'gpt-4o' }));

jest.unstable_mockModule('ai', () => ({
  generateText: mockGenerateText,
  isStepCount: (n) => `stepCount:${n}`,
}));

jest.unstable_mockModule('./config/agentProvider.mjs', () => ({
  getAgentModel: mockGetAgentModel,
}));

const { chat } = await import('./orchestrator.mjs');

describe('orchestrator.chat', () => {
  const mockMemory = {
    loadPatientProfile: jest.fn().mockResolvedValue(null),
    searchRelevant: jest.fn().mockResolvedValue([]),
    getRecentMessages: jest.fn().mockReturnValue([]),
    appendToSession: jest.fn(),
  };
  const mockToolReg = {
    getForSkill: jest.fn().mockReturnValue({
      query_vitals: { description: 'vitals' },
      query_medications: { description: 'meds' },
    }),
  };

  const mockSkillReg = {
    get: jest.fn(),
    getDefault: jest.fn(),
    has: jest.fn(() => true),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockMemory.loadPatientProfile.mockResolvedValue(null);
    mockMemory.searchRelevant.mockResolvedValue([]);
    mockMemory.getRecentMessages.mockReturnValue([]);
  });

  test('falls back to healthChat when no skillRegistry provided', async () => {
    mockGenerateText.mockResolvedValue({
      text: '您的血糖最近控制得不错',
      steps: [{ toolCalls: [] }, { toolCalls: [] }],
      usage: { inputTokens: 200, outputTokens: 100 },
    });

    const result = await chat({
      userId: 'u1',
      userEmail: 'u1@test.com',
      message: '血糖怎么样',
      sessionId: 's1',
      language: 'zh',
      toolRegistry: mockToolReg,
      memoryManager: mockMemory,
    });

    expect(result.message).toContain('血糖');
    expect(result.skillName).toBe('health_chat');
    expect(result.steps).toBe(2);

    const callArgs = mockGenerateText.mock.calls[0][0];
    expect(callArgs.system).toContain('健康管家');
    expect(callArgs.stopWhen).toBe('stepCount:5');
  });

  test('uses intent router to select skill when skillRegistry provided', async () => {
    const symptomSkill = {
      name: 'symptom_analysis',
      allowedTools: ['query_vitals'],
      systemPrompt: () => '症状分析专用提示',
      postProcess: (t) => t,
      safetyRules: {},
    };
    mockSkillReg.get.mockReturnValue(symptomSkill);
    mockSkillReg.getDefault.mockReturnValue({ name: 'health_chat' });
    mockGenerateText.mockResolvedValue({
      text: 'symptom answer', steps: [], usage: {},
    });

    const result = await chat({
      userId: 'u1',
      userEmail: 'u1@test.com',
      message: '我头疼',
      sessionId: 's1',
      language: 'zh',
      toolRegistry: mockToolReg,
      memoryManager: mockMemory,
      skillRegistry: mockSkillReg,
    });

    expect(result.skillName).toBe('symptom_analysis');
    const callArgs = mockGenerateText.mock.calls[0][0];
    expect(callArgs.system).toBe('症状分析专用提示');
  });

  test('builds toolsContext with userEmail for wearable_stream tool', async () => {
    mockToolReg.getForSkill.mockReturnValue({
      query_vitals: {},
      query_wearable_stream: {},
      query_risk_alerts: {},
    });
    mockGenerateText.mockResolvedValue({
      text: 'ok', steps: [], usage: {},
    });

    await chat({
      userId: 'u1',
      userEmail: 'u1@test.com',
      message: 'test',
      sessionId: 's1',
      language: 'zh',
      toolRegistry: mockToolReg,
      memoryManager: mockMemory,
    });

    const callArgs = mockGenerateText.mock.calls[0][0];
    expect(callArgs.toolsContext.query_vitals).toEqual({ userId: 'u1' });
    expect(callArgs.toolsContext.query_risk_alerts).toEqual({ userEmail: 'u1@test.com' });
    expect(callArgs.toolsContext.query_wearable_stream).toEqual({ userEmail: 'u1@test.com' });
  });

  test('calls skill.postProcess on the answer', async () => {
    const customSkill = {
      name: 'custom',
      allowedTools: [],
      systemPrompt: () => 'prompt',
      postProcess: (t) => `[processed] ${t}`,
      safetyRules: {},
    };
    mockSkillReg.get.mockReturnValue(customSkill);
    mockSkillReg.getDefault.mockReturnValue(customSkill);
    mockGenerateText.mockResolvedValue({
      text: 'raw answer', steps: [], usage: {},
    });

    const result = await chat({
      userId: 'u1',
      userEmail: 'u1@test.com',
      message: 'test',
      sessionId: 's1',
      language: 'zh',
      toolRegistry: mockToolReg,
      memoryManager: mockMemory,
      skillRegistry: mockSkillReg,
    });

    expect(result.message).toBe('[processed] raw answer');
  });

  test('updates short-term memory after response', async () => {
    mockGenerateText.mockResolvedValue({
      text: '回复内容', steps: [], usage: {},
    });

    await chat({
      userId: 'u1',
      userEmail: 'u1@test.com',
      message: '你好',
      sessionId: 's1',
      language: 'zh',
      toolRegistry: mockToolReg,
      memoryManager: mockMemory,
    });

    expect(mockMemory.appendToSession).toHaveBeenCalledTimes(2);
    expect(mockMemory.appendToSession).toHaveBeenCalledWith('u1', 's1', 'user', '你好');
    expect(mockMemory.appendToSession).toHaveBeenCalledWith('u1', 's1', 'assistant', '回复内容');
  });

  test('prepends recent messages from memory', async () => {
    mockMemory.getRecentMessages.mockReturnValue([
      { role: 'user', content: '之前的问题' },
      { role: 'assistant', content: '之前的回答' },
    ]);
    mockGenerateText.mockResolvedValue({
      text: 'ok', steps: [], usage: {},
    });

    await chat({
      userId: 'u1',
      userEmail: 'u1@test.com',
      message: '继续',
      sessionId: 's1',
      language: 'zh',
      toolRegistry: mockToolReg,
      memoryManager: mockMemory,
    });

    const callArgs = mockGenerateText.mock.calls[0][0];
    expect(callArgs.messages).toHaveLength(3);
    expect(callArgs.messages[0].content).toBe('之前的问题');
    expect(callArgs.messages[2].content).toBe('继续');
  });

  test('passes patient profile and memories to system prompt', async () => {
    mockMemory.loadPatientProfile.mockResolvedValue({ conditions: ['diabetes'] });
    mockMemory.searchRelevant.mockResolvedValue([{ content: '建议减少碳水' }]);
    mockGenerateText.mockResolvedValue({
      text: 'ok', steps: [], usage: {},
    });

    await chat({
      userId: 'u1',
      userEmail: 'u1@test.com',
      message: 'test',
      sessionId: 's1',
      language: 'zh',
      toolRegistry: mockToolReg,
      memoryManager: mockMemory,
    });

    const callArgs = mockGenerateText.mock.calls[0][0];
    expect(callArgs.system).toContain('diabetes');
    expect(callArgs.system).toContain('建议减少碳水');
  });
});
