/**
 * Repository 接口契约：User（users 集合）
 * 实际实现由 Adapter 提供。文档 ID = email。
 *
 * @interface
 * getByEmail(email) => Promise<Object | null>
 * setByEmail(email, data) => Promise<void>
 * updateByEmail(email, updates) => Promise<void>
 * getByUid(uid) => Promise<Object | null>
 */

function notImplemented() {
  throw new Error('User repository not implemented: use adapters and repositories/index.js facade');
}

module.exports = {
  getByEmail: () => notImplemented(),
  setByEmail: () => notImplemented(),
  updateByEmail: () => notImplemented(),
  getByUid: () => notImplemented()
};
