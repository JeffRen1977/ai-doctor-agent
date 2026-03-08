/**
 * Repository 接口契约：Conversation（遗留对话，只读）
 * 实际实现由 Adapter 提供（见 adapters/firebase/conversationAdapter.js）。
 * 对应旧版 conversations 集合；若弃用可返回 []。
 *
 * @interface
 * getActiveConversationsByUser(userEmail: string, limit: number) => Promise<Conversation[]>
 */

function notImplemented() {
  throw new Error('Conversation repository not implemented: use adapters and repositories/index.js facade');
}

module.exports = {
  getActiveConversationsByUser: () => notImplemented()
};
