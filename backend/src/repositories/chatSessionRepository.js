/**
 * Repository 接口契约：ChatSession（对话会话）
 * 实际实现由 Adapter 提供（见 adapters/firebase/chatSessionAdapter.js）。
 * 业务层应通过 repositories/index.js 门面获取实现。
 *
 * @interface
 * getOrCreateSession(userId: string) => Promise<{ sessionId: string, session: Object }>
 *   userId 一般为 sanitized email；无会话则新建 session_${timestamp}
 * getLatestSession(userId: string) => Promise<{ sessionId: string, session: Object } | null>
 *   取最新会话，不创建；无会话返回 null（供 history 等用）
 * appendMessage(userId: string, sessionId: string, role: 'user'|'assistant', content: string) => Promise<void>
 * getRecentTurnsForAgent(userId: string, maxTurns: number) => Promise<string>
 *   按 lastMessageAt 取最新会话，取尾 maxTurns 条格式化为 "User: ...\nAssistant: ..." 字符串；无会话返回 '' 或占位
 * clearLatestSession(userId: string) => Promise<void>
 *   将最新会话的 messages 清空（供「清除历史」用）
 */

function notImplemented() {
  throw new Error('ChatSession repository not implemented: use adapters and repositories/index.js facade');
}

module.exports = {
  getOrCreateSession: () => notImplemented(),
  getLatestSession: () => notImplemented(),
  appendMessage: () => notImplemented(),
  getRecentTurnsForAgent: () => notImplemented(),
  clearLatestSession: () => notImplemented()
};
