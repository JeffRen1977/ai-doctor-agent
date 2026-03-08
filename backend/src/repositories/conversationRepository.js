/**
 * Repository 接口契约：Conversation（对话）
 * 实际实现由 Adapter 提供（见 adapters/firebase/conversationAdapter.js）。
 * conversations 集合：getActiveConversationsByUser 供 userContextService；其余供 conversationService。
 *
 * @interface
 * getActiveConversationsByUser(userEmail, limit) => Promise<Conversation[]>
 * saveConversation(conversation) => Promise<void>
 * getConversation(conversationId) => Promise<Object | null>
 * listByUser(userEmail, limit?) => Promise<Array>
 * updateConversation(conversationId, updates) => Promise<void>
 * deleteConversation(conversationId) => Promise<void>
 */

function notImplemented() {
  throw new Error('Conversation repository not implemented: use adapters and repositories/index.js facade');
}

module.exports = {
  getActiveConversationsByUser: () => notImplemented(),
  saveConversation: () => notImplemented(),
  getConversation: () => notImplemented(),
  listByUser: () => notImplemented(),
  updateConversation: () => notImplemented(),
  deleteConversation: () => notImplemented()
};
