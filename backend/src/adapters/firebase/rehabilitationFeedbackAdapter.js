/**
 * Firebase Adapter: RehabilitationFeedback
 * 追加文档到 rehabilitationFeedback 集合，addDoc 生成 id。
 * 仅依赖 config/firebase，不依赖 services 或 routes.
 */

const { collection, addDoc } = require('firebase/firestore');
const { db } = require('../../config/firebase');

const COLLECTION = 'rehabilitationFeedback';

function toPlainValue(v) {
  if (v && typeof v.toDate === 'function') return v.toDate().toISOString();
  if (v instanceof Date) return v.toISOString();
  return v;
}

/**
 * @param {Object} feedback - { recordId, userEmail, effectiveness, helpful?, comments?, timestamp }
 * @returns {Promise<{ id: string, ... }>}
 */
async function addRehabilitationFeedback(feedback) {
  const ref = collection(db, COLLECTION);
  const now = new Date().toISOString();
  const payload = {
    recordId: feedback.recordId ?? '',
    userEmail: feedback.userEmail ?? '',
    effectiveness: feedback.effectiveness,
    helpful: feedback.helpful ?? null,
    comments: feedback.comments ?? '',
    timestamp: toPlainValue(feedback.timestamp) ?? now
  };
  const docRef = await addDoc(ref, payload);
  return { id: docRef.id, ...payload };
}

module.exports = {
  addRehabilitationFeedback
};
