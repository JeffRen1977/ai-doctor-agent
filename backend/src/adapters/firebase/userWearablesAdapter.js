/**
 * Firebase Adapter: UserWearables
 * 读写 userWearables/{userId}，单文档 per user，merge 语义。
 */

const { doc, getDoc, setDoc } = require('firebase/firestore');
const { db } = require('../../config/firebase');

const COLLECTION = 'userWearables';

function toPlainValue(v) {
  if (v && typeof v.toDate === 'function') return v.toDate().toISOString();
  if (v instanceof Date) return v.toISOString();
  return v;
}

function sanitize(data) {
  if (!data || typeof data !== 'object') return null;
  const out = { ...data };
  ['createdAt', 'updatedAt', 'fitbitLastSync', 'appleLastSync'].forEach((k) => {
    if (out[k] != null) out[k] = toPlainValue(out[k]) || out[k];
  });
  if (out.fitbitTokens?.created_at != null) out.fitbitTokens = { ...out.fitbitTokens, created_at: toPlainValue(out.fitbitTokens.created_at) || out.fitbitTokens.created_at };
  return out;
}

async function getUserWearables(userId) {
  const ref = doc(db, COLLECTION, userId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return sanitize(snap.data());
}

async function setUserWearables(userId, data) {
  const ref = doc(db, COLLECTION, userId);
  const payload = typeof data === 'object' && data !== null ? data : {};
  await setDoc(ref, payload, { merge: true });
}

module.exports = {
  getUserWearables,
  setUserWearables,
  sanitize
};
