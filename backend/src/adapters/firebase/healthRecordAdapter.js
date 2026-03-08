/**
 * Firebase Adapter: HealthRecord
 * 读写 healthRecords/{documentId}，documentId = sanitized email（单文档 per user）。
 */

const { doc, getDoc, setDoc, collection, query, where, orderBy, limit, getDocs } = require('firebase/firestore');
const { db } = require('../../config/firebase');

const COLLECTION = 'healthRecords';

function sanitizeEmail(email) {
  return (email || '').replace(/[^a-zA-Z0-9@._-]/g, '_');
}

function toPlainValue(v) {
  if (v && typeof v.toDate === 'function') return v.toDate().toISOString();
  if (v instanceof Date) return v.toISOString();
  return v;
}

function fromFirestore(data) {
  if (!data || typeof data !== 'object') return data;
  const out = { ...data };
  if (out.createdAt != null) out.createdAt = toPlainValue(out.createdAt) || out.createdAt;
  if (out.updatedAt != null) out.updatedAt = toPlainValue(out.updatedAt) || out.updatedAt;
  if (out.lastAnalysisDate != null) out.lastAnalysisDate = toPlainValue(out.lastAnalysisDate) || out.lastAnalysisDate;
  return out;
}

/**
 * @param {string} sanitizedEmail - 文档 ID（sanitized email）
 * @returns {Promise<Object | null>}
 */
async function getByUser(sanitizedEmail) {
  const id = sanitizeEmail(sanitizedEmail);
  const ref = doc(db, COLLECTION, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return fromFirestore({ id: snap.id, ...snap.data() });
}

/**
 * @param {string} sanitizedEmail
 * @param {Object} data
 * @param {boolean} [merge=true]
 */
async function setByUser(sanitizedEmail, data, merge = true) {
  const id = sanitizeEmail(sanitizedEmail);
  const ref = doc(db, COLLECTION, id);
  await setDoc(ref, data, { merge });
}

/**
 * 按 userEmail 查询，按 createdAt 降序，限制条数（digitalTwin 等用）
 * @param {string} userEmail - 原始邮箱
 * @param {{ limit?: number }} [options]
 * @returns {Promise<Array<{ id: string, ...Object }>>}
 */
async function listByUser(userEmail, options = {}) {
  const { limit: limitCount = 20 } = options;
  const ref = collection(db, COLLECTION);
  const q = query(
    ref,
    where('userEmail', '==', userEmail),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  try {
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => fromFirestore({ id: d.id, ...d.data() }));
  } catch (error) {
    if (error.code === 'failed-precondition') {
      return [];
    }
    throw error;
  }
}

module.exports = {
  getByUser,
  setByUser,
  listByUser,
  sanitizeEmail,
  fromFirestore
};
