/**
 * Unit tests: ChatSession (colocated with source)
 * See docs/data-format/IMPLEMENTATION_STEPS_DETAILED.md Step 0.4
 */

const { validateChatSession } = require('./chatSession');

describe('ChatSession', () => {
  test('messages 含 role user 与 content 通过', () => {
    const data = {
      sessionId: 's1',
      startedAt: new Date(),
      lastMessageAt: new Date(),
      messages: [
        { id: 'msg1', role: 'user', content: '你好' },
        { id: 'msg2', role: 'assistant', content: '您好，有什么可以帮您？' }
      ]
    };
    const result = validateChatSession(data);
    expect(result.error).toBeUndefined();
    expect(result.value.messages).toHaveLength(2);
  });

  test('缺少 sessionId 时失败', () => {
    const result = validateChatSession({
      startedAt: new Date(),
      lastMessageAt: new Date(),
      messages: []
    });
    expect(result.error).toBeDefined();
  });
});
