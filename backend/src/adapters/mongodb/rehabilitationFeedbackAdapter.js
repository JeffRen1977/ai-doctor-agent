/**
 * MongoDB Adapter: RehabilitationFeedback（与 firebase/rehabilitationFeedbackAdapter 同接口）
 * 集合 rehabilitationFeedback，insertOne 生成 id。
 */
const { getCollection } = require('./connection');

const COLLECTION = 'rehabilitationFeedback';

function toPlainValue(v) {
  if (v && typeof v.toDate === 'function') return v.toDate().toISOString();
  if (v instanceof Date) return v.toISOString();
  return v;
}

async function addRehabilitationFeedback(feedback) {
  const col = getCollection(COLLECTION);
  const now = new Date().toISOString();
  const payload = {
    recordId: feedback.recordId ?? '',
    userEmail: feedback.userEmail ?? '',
    effectiveness: feedback.effectiveness,
    helpful: feedback.helpful ?? null,
    comments: feedback.comments ?? '',
    timestamp: toPlainValue(feedback.timestamp) ?? now
  };
  const result = await col.insertOne(payload);
  const id = result.insertedId ? result.insertedId.toString() : '';
  return { id, ...payload };
}

module.exports = {
  addRehabilitationFeedback
};
