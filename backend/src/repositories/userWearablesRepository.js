/**
 * Repository 接口契约：UserWearables（用户穿戴设备配置/数据）
 * 实际实现由 Adapter 提供。单文档 per user：userWearables/{userId}。
 *
 * @interface
 * getUserWearables(userId) => Promise<Object | null>
 * setUserWearables(userId, data) => Promise<void>   // merge 语义
 * listHistoryByUser(userEmail, options?) => Promise<Array<{ id, timestamp, ... }>>  // 按 userEmail 查历史，orderBy lastSync desc
 */

function notImplemented() {
  throw new Error('UserWearables repository not implemented: use adapters and repositories/index.js facade');
}

module.exports = {
  getUserWearables: () => notImplemented(),
  setUserWearables: () => notImplemented(),
  listHistoryByUser: () => notImplemented()
};
