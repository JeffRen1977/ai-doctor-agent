/**
 * 健康总览：Firestore 集合 healthSummaries/{userId}，每用户一文档。
 */
const { doc, getDoc, setDoc } = require('firebase/firestore');
const { db } = require('../../config/firebase');

const COLLECTION = 'healthSummaries';

function toPlainValue(v) {
  if (v && typeof v.toDate === 'function') return v.toDate().toISOString();
  if (v instanceof Date) return v.toISOString();
  return v;
}

function sanitize(data) {
  if (!data || typeof data !== 'object') return null;
  const out = { ...data };
  if (out.updatedAt != null) out.updatedAt = toPlainValue(out.updatedAt) || out.updatedAt;
  return out;
}

async function getHealthSummary(userId) {
  if (!userId) return null;
  const snap = await getDoc(doc(db, COLLECTION, userId));
  if (!snap.exists()) return null;
  return sanitize(snap.data());
}

async function setHealthSummary(userId, data) {
  if (!userId) throw new Error('userId required');
  const updatedAt = data.updatedAt || new Date().toISOString();
  await setDoc(doc(db, COLLECTION, userId), { ...data, updatedAt }, { merge: true });
}

module.exports = {
  getHealthSummary,
  setHealthSummary
};
