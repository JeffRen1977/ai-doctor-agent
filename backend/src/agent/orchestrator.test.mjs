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
    getRecentMessages: jest.fn().mockResolvedValue([]),
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
    mockMemory.getRecentMessages.mockResolvedValue([]);
    mockToolReg.getForSkill.mockReturnValue({
      query_vitals: { description: 'vitals' },
      query_medications: { description: 'meds' },
    });
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
    mockMemory.getRecentMessages.mockResolvedValue([
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

  test('deduplicates when hydrated history ends with the incoming user message', async () => {
    mockMemory.getRecentMessages.mockResolvedValue([
      { role: 'user', content: '昨天头疼' },
      { role: 'assistant', content: '建议休息' },
      { role: 'user', content: '今天还疼' },
    ]);
    mockGenerateText.mockResolvedValue({
      text: 'ok', steps: [], usage: {},
    });

    await chat({
      userId: 'u1',
      userEmail: 'u1@test.com',
      message: '今天还疼',
      sessionId: 's1',
      language: 'zh',
      toolRegistry: mockToolReg,
      memoryManager: mockMemory,
    });

    const callArgs = mockGenerateText.mock.calls[0][0];
    expect(callArgs.messages).toHaveLength(3);
    expect(callArgs.messages[0].content).toBe('昨天头疼');
    expect(callArgs.messages[1].content).toBe('建议休息');
    expect(callArgs.messages[2]).toEqual({ role: 'user', content: '今天还疼' });
  });

  test('skips duplicate user append so turn 2 memory stays clean', async () => {
    mockMemory.getRecentMessages.mockResolvedValue([
      { role: 'user', content: '今天还疼' },
    ]);
    mockGenerateText.mockResolvedValue({
      text: '多喝水', steps: [], usage: {},
    });

    await chat({
      userId: 'u1',
      userEmail: 'u1@test.com',
      message: '今天还疼',
      sessionId: 's1',
      language: 'zh',
      toolRegistry: mockToolReg,
      memoryManager: mockMemory,
    });

    expect(mockMemory.appendToSession).toHaveBeenCalledTimes(1);
    expect(mockMemory.appendToSession).toHaveBeenCalledWith('u1', 's1', 'assistant', '多喝水');
  });

  test('does not strip trailing message when content differs', async () => {
    mockMemory.getRecentMessages.mockResolvedValue([
      { role: 'user', content: '旧消息' },
    ]);
    mockGenerateText.mockResolvedValue({
      text: 'ok', steps: [], usage: {},
    });

    await chat({
      userId: 'u1',
      userEmail: 'u1@test.com',
      message: '新消息',
      sessionId: 's1',
      language: 'zh',
      toolRegistry: mockToolReg,
      memoryManager: mockMemory,
    });

    const callArgs = mockGenerateText.mock.calls[0][0];
    expect(callArgs.messages).toHaveLength(2);
    expect(callArgs.messages[0].content).toBe('旧消息');
    expect(callArgs.messages[1].content).toBe('新消息');
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

  test('two-turn cold-start: no duplicate in prompt or memory on turn 2', async () => {
    const { MemoryManager } = await import('./memoryManager.mjs');
    const mockSessionRepo = {
      getLatestSession: jest.fn().mockResolvedValue({
        sessionId: 's1',
        session: {
          messages: [
            { role: 'user', content: '昨天头疼' },
            { role: 'assistant', content: '建议休息' },
            { role: 'user', content: '今天还疼' },
          ],
        },
      }),
    };
    const realMM = new MemoryManager({ chatSessionRepo: mockSessionRepo });

    mockGenerateText.mockResolvedValue({ text: '多喝水', steps: [], usage: {} });
    await chat({
      userId: 'u1', userEmail: 'u1@test.com', message: '今天还疼',
      sessionId: 's1', language: 'zh', toolRegistry: mockToolReg, memoryManager: realMM,
    });

    const turn1 = mockGenerateText.mock.calls[0][0].messages;
    const turn1User = turn1.filter(m => m.role === 'user' && m.content === '今天还疼');
    expect(turn1User).toHaveLength(1);

    mockGenerateText.mockResolvedValue({ text: '建议就医', steps: [], usage: {} });
    await chat({
      userId: 'u1', userEmail: 'u1@test.com', message: '还是疼',
      sessionId: 's1', language: 'zh', toolRegistry: mockToolReg, memoryManager: realMM,
    });

    const turn2 = mockGenerateText.mock.calls[1][0].messages;
    const turn2Dup = turn2.filter(m => m.role === 'user' && m.content === '今天还疼');
    expect(turn2Dup).toHaveLength(1);
    expect(turn2[turn2.length - 1]).toEqual({ role: 'user', content: '还是疼' });
  });

  // --- Phase 5: Safety integration tests ---

  test('intercepts crisis messages and returns safe response without calling LLM', async () => {
    const mockSafety = {
      interceptSensitiveTopics: jest.fn().mockReturnValue('请拨打 400-161-9995'),
    };
    const result = await chat({
      userId: 'u1', userEmail: 'u1@test.com', message: '我不想活了',
      sessionId: 's1', language: 'zh',
      toolRegistry: mockToolReg, memoryManager: mockMemory, safety: mockSafety,
    });

    expect(result.intercepted).toBe('crisis');
    expect(result.message).toContain('400-161-9995');
    expect(mockGenerateText).not.toHaveBeenCalled();
  });

  test('does not intercept normal messages', async () => {
    const mockSafety = {
      interceptSensitiveTopics: jest.fn().mockReturnValue(null),
      detectHallucination: jest.fn().mockReturnValue({ flagged: false }),
      assertWritePermission: jest.fn(),
    };
    mockGenerateText.mockResolvedValue({ text: 'ok', steps: [], usage: {} });
    const result = await chat({
      userId: 'u1', userEmail: 'u1@test.com', message: '我头疼',
      sessionId: 's1', language: 'zh',
      toolRegistry: mockToolReg, memoryManager: mockMemory, safety: mockSafety,
    });

    expect(result.intercepted).toBeUndefined();
    expect(mockGenerateText).toHaveBeenCalledTimes(1);
  });

  test('appends hallucination warning when flagged', async () => {
    const mockSafety = {
      interceptSensitiveTopics: jest.fn().mockReturnValue(null),
      detectHallucination: jest.fn().mockReturnValue({ flagged: true, reason: 'numeric_without_tool_call' }),
      assertWritePermission: jest.fn(),
    };
    mockGenerateText.mockResolvedValue({
      text: '您的血压是 120mmHg', steps: [{ toolCalls: [] }], usage: {},
    });

    const result = await chat({
      userId: 'u1', userEmail: 'u1@test.com', message: '我的血压',
      sessionId: 's1', language: 'zh',
      toolRegistry: mockToolReg, memoryManager: mockMemory, safety: mockSafety,
    });

    expect(result.message).toContain('⚠️');
    expect(result.message).toContain('未经您的健康记录核实');
  });

  test('returns budget fallback when token limit exceeded', async () => {
    mockGenerateText.mockRejectedValue(
      Object.assign(new Error('max_tokens exceeded'), { code: 'max_tokens' }),
    );

    const result = await chat({
      userId: 'u1', userEmail: 'u1@test.com', message: '很长的问题',
      sessionId: 's1', language: 'zh',
      toolRegistry: mockToolReg, memoryManager: mockMemory,
    });

    expect(result.budgetExceeded).toBe(true);
    expect(result.message).toContain('超出了处理预算');
  });

  test('returns English budget fallback', async () => {
    mockGenerateText.mockRejectedValue(new Error('max_tokens'));

    const result = await chat({
      userId: 'u1', userEmail: 'u1@test.com', message: 'long question',
      sessionId: 's1', language: 'en',
      toolRegistry: mockToolReg, memoryManager: mockMemory,
    });

    expect(result.budgetExceeded).toBe(true);
    expect(result.message).toContain('processing budget');
  });

  test('rethrows non-budget errors', async () => {
    mockGenerateText.mockRejectedValue(new Error('network error'));
    await expect(chat({
      userId: 'u1', userEmail: 'u1@test.com', message: 'test',
      sessionId: 's1', language: 'zh',
      toolRegistry: mockToolReg, memoryManager: mockMemory,
    })).rejects.toThrow('network error');
  });

  test('calls traceRecorder.record after successful response', async () => {
    const mockTraceRecorder = { record: jest.fn().mockResolvedValue({}) };
    mockGenerateText.mockResolvedValue({
      text: 'ok', steps: [{ toolCalls: [] }], usage: { inputTokens: 100 },
    });

    await chat({
      userId: 'u1', userEmail: 'u1@test.com', message: 'test',
      sessionId: 's1', language: 'zh',
      toolRegistry: mockToolReg, memoryManager: mockMemory,
      traceRecorder: mockTraceRecorder,
    });

    expect(mockTraceRecorder.record).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'u1', sessionId: 's1', skill: 'health_chat', userMessage: 'test',
      }),
    );
  });

  test('assertWritePermission is called for each tool', async () => {
    const mockSafety = {
      interceptSensitiveTopics: jest.fn().mockReturnValue(null),
      detectHallucination: jest.fn().mockReturnValue({ flagged: false }),
      assertWritePermission: jest.fn(),
    };
    mockGenerateText.mockResolvedValue({ text: 'ok', steps: [], usage: {} });

    await chat({
      userId: 'u1', userEmail: 'u1@test.com', message: 'test',
      sessionId: 's1', language: 'zh',
      toolRegistry: mockToolReg, memoryManager: mockMemory, safety: mockSafety,
    });

    expect(mockSafety.assertWritePermission).toHaveBeenCalledTimes(2);
  });

  test('passes maxTokens to generateText', async () => {
    mockGenerateText.mockResolvedValue({ text: 'ok', steps: [], usage: {} });
    await chat({
      userId: 'u1', userEmail: 'u1@test.com', message: 'test',
      sessionId: 's1', language: 'zh',
      toolRegistry: mockToolReg, memoryManager: mockMemory,
    });
    expect(mockGenerateText.mock.calls[0][0].maxTokens).toBe(4096);
  });
});
