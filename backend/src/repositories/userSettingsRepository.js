/**
 * Repository 接口契约：UserSettings（用户设置）
 * 实际实现由 Adapter 提供。
 *
 * @interface
 * getUserSettings(userId) => Promise<Object | null>
 * setUserSettings(userId, data) => Promise<void>   // merge 语义
 */

function notImplemented() {
  throw new Error('UserSettings repository not implemented: use adapters and repositories/index.js facade');
}

module.exports = {
  getUserSettings: () => notImplemented(),
  setUserSettings: () => notImplemented()
};
