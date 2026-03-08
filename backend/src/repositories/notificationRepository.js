/**
 * Repository 接口契约：Notification（通知）
 * 实际实现由 Adapter 提供（见 adapters/firebase/notificationAdapter.js）。
 *
 * @interface
 * addNotification(notification: Object) => Promise<{ id: string, ... }>
 */

function notImplemented() {
  throw new Error('Notification repository not implemented: use adapters and repositories/index.js facade');
}

module.exports = {
  addNotification: () => notImplemented()
};
