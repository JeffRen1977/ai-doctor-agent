/**
 * Repository 接口契约：UserProfile（userProfile 集合）
 * 实际实现由 Adapter 提供。文档 ID = email。
 *
 * @interface
 * getByEmail(email) => Promise<Object | null>
 * setByEmail(email, data) => Promise<void>
 * updateByEmail(email, updates) => Promise<void>
 */

function notImplemented() {
  throw new Error('UserProfile repository not implemented: use adapters and repositories/index.js facade');
}

module.exports = {
  getByEmail: () => notImplemented(),
  setByEmail: () => notImplemented(),
  updateByEmail: () => notImplemented()
};
