/**
 * Repository 接口契约：RehabilitationFeedback（康复反馈）
 * 实际实现由 Adapter 提供（见 adapters/firebase/rehabilitationFeedbackAdapter.js）。
 *
 * @interface
 * addRehabilitationFeedback(feedback: Object) => Promise<{ id: string, ... }>
 */

function notImplemented() {
  throw new Error('RehabilitationFeedback repository not implemented: use adapters and repositories/index.js facade');
}

module.exports = {
  addRehabilitationFeedback: () => notImplemented()
};
