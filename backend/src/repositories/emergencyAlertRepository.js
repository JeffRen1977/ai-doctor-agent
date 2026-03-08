/**
 * Repository 接口契约：EmergencyAlert（紧急警报）
 * 实际实现由 Adapter 提供。
 *
 * @interface
 * saveAlert(alert) => Promise<void>
 * getAlert(alertId) => Promise<Object | null>
 * listByUser(userEmail, options?) => Promise<Object[]>
 * updateAlert(alertId, updates) => Promise<void>
 */

function notImplemented() {
  throw new Error('EmergencyAlert repository not implemented: use adapters and repositories/index.js facade');
}

module.exports = {
  saveAlert: () => notImplemented(),
  getAlert: () => notImplemented(),
  listByUser: () => notImplemented(),
  updateAlert: () => notImplemented()
};
