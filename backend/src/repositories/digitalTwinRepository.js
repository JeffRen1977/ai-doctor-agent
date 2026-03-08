/**
 * Repository 接口契约：DigitalTwin（数字孪生）
 * 实际实现由 Adapter 提供。单文档 per user：digitalTwins/{userId}。
 *
 * @interface
 * getDigitalTwin(userId) => Promise<Object | null>
 * setDigitalTwin(userId, data) => Promise<void>   // merge 语义
 */

function notImplemented() {
  throw new Error('DigitalTwin repository not implemented: use adapters and repositories/index.js facade');
}

module.exports = {
  getDigitalTwin: () => notImplemented(),
  setDigitalTwin: () => notImplemented()
};
