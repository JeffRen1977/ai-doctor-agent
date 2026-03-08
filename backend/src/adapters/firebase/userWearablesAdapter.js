/**
 * Firebase Adapter: UserWearables
 * 读写 userWearables/{userId}，单文档 per user，merge 语义。
 * 另支持按 userEmail 查询历史（listHistoryByUser）。
 */

const { doc, getDoc, setDoc, collection, query, where, orderBy, limit, getDocs } = require('firebase/firestore');
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
  ['createdAt', 'updatedAt', 'lastSync', 'fitbitLastSync', 'appleLastSync'].forEach((k) => {
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

/**
 * 按 userEmail 查询穿戴历史，按 lastSync 降序，限制条数（如数字孪生聚合用）
 * @param {string} userEmail
 * @param {{ limit?: number }} [options]
 * @returns {Promise<Array<{ id: string, timestamp: string, ... }>>}
 */
async function listHistoryByUser(userEmail, options = {}) {
  const { limit: limitCount = 30 } = options;
  const ref = collection(db, COLLECTION);
  const q = query(
    ref,
    where('userEmail', '==', userEmail),
    orderBy('lastSync', 'desc'),
    limit(limitCount)
  );
  try {
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => {
      const data = sanitize(d.data());
      return {
        id: d.id,
        timestamp: (data && data.lastSync) || null,
        ...data
      };
    });
  } catch (error) {
    if (error.code === 'failed-precondition') return [];
    throw error;
  }
}

module.exports = {
  getUserWearables,
  setUserWearables,
  listHistoryByUser,
  sanitize
};
