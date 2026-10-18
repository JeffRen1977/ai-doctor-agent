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

  beforeEach(() => {
    jest.clearAllMocks();
    mockMemory.loadPatientProfile.mockResolvedValue(null);
    mockMemory.searchRelevant.mockResolvedValue([]);
    mockMemory.getRecentMessages.mockReturnValue([]);
  });

  test('calls generateText with correct structure and returns response', async () => {
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
    expect(result.steps).toBe(2);
    expect(result.usage).toBeDefined();

    expect(mockGenerateText).toHaveBeenCalledTimes(1);
    const callArgs = mockGenerateText.mock.calls[0][0];
    expect(callArgs.model).toEqual({ modelId: 'gpt-4o' });
    expect(callArgs.system).toContain('健康管家');
    expect(callArgs.messages).toHaveLength(1);
    expect(callArgs.messages[0]).toEqual({ role: 'user', content: '血糖怎么样' });
    expect(callArgs.stopWhen).toBe('stepCount:5');
  });

  test('builds toolsContext with userId and userEmail per tool', async () => {
    mockToolReg.getForSkill.mockReturnValue({
      query_vitals: {},
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
    expect(mockMemory.appendToSession).toHaveBeenCalledWith('s1', 'user', '你好');
    expect(mockMemory.appendToSession).toHaveBeenCalledWith('s1', 'assistant', '回复内容');
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
