/**
 * Repository 接口契约：RehabilitationRecord（康复记录）
 * 实际实现由 Adapter 提供（见 adapters/firebase/rehabilitationRecordAdapter.js）。
 *
 * @interface
 * addRehabilitationRecord(record: Object) => Promise<{ id: string, ... }>
 * getRehabilitationRecords(userEmail: string, options?: { type?, subtype?, limitCount?, startAfter? }) => Promise<{ records: Array, count: number }>
 * updateRehabilitationRecordFeedback(recordId: string, userEmail: string, feedback: Object) => Promise<void>
 */

function notImplemented() {
  throw new Error('RehabilitationRecord repository not implemented: use adapters and repositories/index.js facade');
}

module.exports = {
  addRehabilitationRecord: () => notImplemented(),
  getRehabilitationRecords: () => notImplemented(),
  updateRehabilitationRecordFeedback: () => notImplemented()
};
