/**
 * Repository 接口契约：ChatHistory（聊天历史，chatHistory 集合）
 * 实际实现由 Adapter 提供。doc id 通常为 userEmail；测试等可用 addDocument 生成 id。
 *
 * @interface
 * addDocument(data) => Promise<{ id: string }>
 * getDocument(id) => Promise<Object | null>
 * listAll() => Promise<Array<{ id, ... }>>
 * getByUser(userEmail) => Promise<Object | null>
 * setByUser(userEmail, data) => Promise<void>
 */

function notImplemented() {
  throw new Error('ChatHistory repository not implemented: use adapters and repositories/index.js facade');
}

module.exports = {
  addDocument: () => notImplemented(),
  getDocument: () => notImplemented(),
  listAll: () => notImplemented(),
  getByUser: () => notImplemented(),
  setByUser: () => notImplemented()
};
