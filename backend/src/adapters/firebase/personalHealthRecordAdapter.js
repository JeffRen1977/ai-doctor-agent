/**
 * Firebase Adapter: PersonalHealthRecord
 * 读写 personalHealthRecords/{userId} 根文档。与 userBasicInfo 同集合，本 adapter 负责整文档 get/set/update。
 */

const { doc, getDoc, setDoc, updateDoc, deleteDoc } = require('firebase/firestore');
const { db } = require('../../config/firebase');

const COLLECTION = 'personalHealthRecords';

function sanitizeUserId(emailOrId) {
  return (emailOrId || '').replace(/[^a-zA-Z0-9@._-]/g, '_');
}

function toPlainValue(v) {
  if (v && typeof v.toDate === 'function') return v.toDate().toISOString();
  if (v instanceof Date) return v.toISOString();
  return v;
}

function recursivelyConvertTimestamps(obj) {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(recursivelyConvertTimestamps);
  if (obj && typeof obj.toDate === 'function') return toPlainValue(obj);
  if (typeof obj === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      out[k] = recursivelyConvertTimestamps(v);
    }
    return out;
  }
  return obj;
}

/**
 * @param {string} userId - 文档 ID（一般为 sanitized email）
 * @returns {Promise<Object | null>} 根文档 data，Timestamp 已转 ISO
 */
async function get(userId) {
  const id = sanitizeUserId(userId);
  const ref = doc(db, COLLECTION, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return recursivelyConvertTimestamps(snap.data());
}

/**
 * @param {string} userId
 * @param {Object} data
 * @param {boolean} [merge=true]
 */
async function set(userId, data, merge = true) {
  const id = sanitizeUserId(userId);
  const ref = doc(db, COLLECTION, id);
  await setDoc(ref, data, { merge });
}

/**
 * @param {string} userId
 * @param {Object} updates - 部分字段更新，与 Firestore updateDoc 一致
 */
async function update(userId, updates) {
  const id = sanitizeUserId(userId);
  const ref = doc(db, COLLECTION, id);
  await updateDoc(ref, updates);
}

async function deleteRecord(userId) {
  const id = sanitizeUserId(userId);
  await deleteDoc(doc(db, COLLECTION, id));
  return { deletedCount: 1 };
}

module.exports = {
  get,
  set,
  update,
  delete: deleteRecord,
  sanitizeUserId
};
