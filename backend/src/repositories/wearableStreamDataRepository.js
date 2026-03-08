/**
 * Repository 接口契约：WearableStreamData（流式穿戴数据）
 * 实际实现由 Adapter 提供（见 adapters/firebase/wearableStreamDataAdapter.js）。
 *
 * @interface
 * addDataPoint(dataPoint: Object) => Promise<{ id: string }>
 * getRecentByUser(userEmail: string, options?: { limit?, timeRange?, deviceType? }) => Promise<Array>
 * listByUserInTimeRange(userEmail: string, startMs: number, endMs: number, limit?) => Promise<Array>
 */

function notImplemented() {
  throw new Error('WearableStreamData repository not implemented: use adapters and repositories/index.js facade');
}

module.exports = {
  addDataPoint: () => notImplemented(),
  getRecentByUser: () => notImplemented(),
  listByUserInTimeRange: () => notImplemented()
};
