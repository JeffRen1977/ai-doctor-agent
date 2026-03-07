/**
 * Unit tests: ChatSession Firebase Adapter (colocated with source)
 */

const mockGetDoc = jest.fn();
const mockSetDoc = jest.fn();
const mockGetDocs = jest.fn();
jest.mock('../../config/firebase', () => ({ db: {} }));
jest.mock('firebase/firestore', () => ({
  doc: jest.fn((db, c, id, sub, subId) => ({ _c: c, _id: id, _sub: sub, _subId: subId })),
  getDoc: (...args) => mockGetDoc(...args),
  setDoc: (...args) => mockSetDoc(...args),
  collection: jest.fn(() => ({ _col: true })),
  query: jest.fn(() => ({ _q: true })),
  orderBy: jest.fn(() => {}),
  limit: jest.fn(() => {}),
  getDocs: (...args) => mockGetDocs(...args)
}));

const {
  getOrCreateSession,
  getLatestSession,
  appendMessage,
  getRecentTurnsForAgent,
  clearLatestSession
} = require('./chatSessionAdapter');

beforeEach(() => {
  mockGetDoc.mockReset();
  mockSetDoc.mockReset();
  mockGetDocs.mockReset();
});

describe('getOrCreateSession', () => {
  test('首次调用创建新 session 并返回 sessionId 与 session', async () => {
    mockGetDocs.mockResolvedValue({ empty: true });
    const result = await getOrCreateSession('user_1');
    expect(result.sessionId).toMatch(/^session_\d+$/);
    expect(result.session).toBeDefined();
    expect(result.session.messages).toEqual([]);
    expect(mockSetDoc).toHaveBeenCalledTimes(1);
  });

  test('已有会话时返回最新会话，不新建', async () => {
    const now = new Date();
    mockGetDocs.mockResolvedValue({
      empty: false,
      docs: [
        {
          id: 'session_123',
          data: () => ({
            sessionId: 'session_123',
            userId: 'user_1',
            startedAt: now,
            lastMessageAt: now,
            messages: [{ id: 'm1', role: 'user', content: 'hi', timestamp: now }]
          })
        }
      ]
    });
    const result = await getOrCreateSession('user_1');
    expect(result.sessionId).toBe('session_123');
    expect(result.session.messages).toHaveLength(1);
    expect(mockSetDoc).not.toHaveBeenCalled();
  });
});

describe('getLatestSession', () => {
  test('无会话时返回 null', async () => {
    mockGetDocs.mockResolvedValue({ empty: true });
    const result = await getLatestSession('user_1');
    expect(result).toBeNull();
  });

  test('有会话时返回最新会话', async () => {
    const now = new Date();
    mockGetDocs.mockResolvedValue({
      empty: false,
      docs: [
        {
          id: 'session_456',
          data: () => ({
            sessionId: 'session_456',
            messages: [{ id: 'm1', role: 'user', content: 'hello' }]
          })
        }
      ]
    });
    const result = await getLatestSession('user_1');
    expect(result).not.toBeNull();
    expect(result.sessionId).toBe('session_456');
    expect(result.session.messages[0].content).toBe('hello');
  });
});

describe('appendMessage', () => {
  test('连续 append 两条后会话 messages 长度为 2，lastMessageAt 更新', async () => {
    const now = new Date();
    const initialMessages = [];
    mockGetDoc
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          messages: [...initialMessages],
          lastMessageAt: now
        })
      })
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          messages: [{ id: 'm1', role: 'user', content: 'first', timestamp: now }],
          lastMessageAt: now
        })
      });
    mockSetDoc.mockResolvedValue(undefined);
    await appendMessage('user_1', 'session_1', 'user', 'first');
    await appendMessage('user_1', 'session_1', 'assistant', 'second');
    expect(mockSetDoc).toHaveBeenCalledTimes(2);
    const secondCallData = mockSetDoc.mock.calls[1][1];
    expect(secondCallData.messages).toHaveLength(2);
    expect(secondCallData.messages[1].role).toBe('assistant');
    expect(secondCallData.messages[1].content).toBe('second');
  });
});

describe('getRecentTurnsForAgent', () => {
  test('会话有 10 条消息，maxTurns=5 时返回最后 5 条的格式化字符串', async () => {
    const messages = Array.from({ length: 10 }, (_, i) => ({
      id: `m${i}`,
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `msg${i}`,
      timestamp: new Date()
    }));
    mockGetDocs.mockResolvedValue({
      empty: false,
      docs: [
        {
          id: 's1',
          data: () => ({ sessionId: 's1', messages, lastMessageAt: new Date() })
        }
      ]
    });
    const result = await getRecentTurnsForAgent('user_1', 5);
    expect(result).toContain('Assistant: msg5');
    expect(result).toContain('User: msg6');
    expect(result).toContain('msg9');
    expect(result).not.toContain('msg0');
  });

  test('无会话时返回空字符串', async () => {
    mockGetDocs.mockResolvedValue({ empty: true });
    const result = await getRecentTurnsForAgent('user_1', 5);
    expect(result).toBe('');
  });
});

describe('clearLatestSession', () => {
  test('有最新会话时清空其 messages', async () => {
    mockGetDocs.mockResolvedValue({
      empty: false,
      docs: [
        {
          id: 'session_clear',
          data: () => ({ sessionId: 'session_clear', messages: [{ id: 'm1', role: 'user', content: 'x' }] })
        }
      ]
    });
    mockSetDoc.mockResolvedValue(undefined);
    await clearLatestSession('user_1');
    expect(mockSetDoc).toHaveBeenCalledTimes(1);
    const [, data] = mockSetDoc.mock.calls[0];
    expect(data.messages).toEqual([]);
  });

  test('无会话时不调用 setDoc', async () => {
    mockGetDocs.mockResolvedValue({ empty: true });
    await clearLatestSession('user_1');
    expect(mockSetDoc).not.toHaveBeenCalled();
  });
});
