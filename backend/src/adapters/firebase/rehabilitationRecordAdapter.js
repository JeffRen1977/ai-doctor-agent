/**
 * Firebase Adapter: RehabilitationRecord
 * 读写 rehabilitationRecords 集合；查询 by userEmail、可选 type/subtype、orderBy timestamp、limit；更新单条 feedback。
 * 仅依赖 config/firebase，不依赖 services 或 routes.
 */

const { collection, addDoc, getDocs, updateDoc, query, where, orderBy, limit } = require('firebase/firestore');
const { db } = require('../../config/firebase');

const COLLECTION = 'rehabilitationRecords';

function toPlainValue(v) {
  if (v && typeof v.toDate === 'function') return v.toDate().toISOString();
  if (v instanceof Date) return v.toISOString();
  return v;
}

function docToRecord(docSnap) {
  const data = docSnap.data();
  if (!data) return null;
  return {
    id: docSnap.id,
    ...data,
    timestamp: toPlainValue(data.timestamp) || data.timestamp,
    createdAt: toPlainValue(data.createdAt) || data.createdAt,
    updatedAt: toPlainValue(data.updatedAt) || data.updatedAt
  };
}

/**
 * @param {Object} record - 康复记录对象（含 recordId, userEmail, type, ...）
 * @returns {Promise<{ id: string, ... }>}
 */
async function addRehabilitationRecord(record) {
  const ref = collection(db, COLLECTION);
  const docRef = await addDoc(ref, record);
  return { id: docRef.id, ...record };
}

/**
 * @param {string} userEmail
 * @param {Object} options - { type?, subtype?, limitCount?, startAfter? }
 * @returns {Promise<{ records: Array, count: number }>}
 */
async function getRehabilitationRecords(userEmail, options = {}) {
  const { type = null, subtype = null, limitCount = 20 } = options;
  const recordsRef = collection(db, COLLECTION);
  try {
    const constraints = [where('userEmail', '==', userEmail)];
    if (type) constraints.push(where('type', '==', type));
    if (subtype && type) constraints.push(where('subtype', '==', subtype));
    constraints.push(orderBy('timestamp', 'desc'), limit(limitCount));
    const q = query(recordsRef, ...constraints);
    const snapshot = await getDocs(q);
    const records = snapshot.docs.map(docToRecord).filter(Boolean);
    return { records, count: records.length };
  } catch (indexError) {
    if (indexError.code === 'failed-precondition') {
      console.warn('⚠️ RehabilitationRecords index not found, using fallback');
      const fallbackQuery = query(recordsRef, where('userEmail', '==', userEmail));
      const snapshot = await getDocs(fallbackQuery);
      let records = snapshot.docs.map(docToRecord).filter(Boolean);
      if (type) records = records.filter((r) => r.type === type);
      if (subtype) records = records.filter((r) => r.subtype === subtype);
      records.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
      records = records.slice(0, limitCount);
      return { records, count: records.length };
    }
    throw indexError;
  }
}

/**
 * @param {string} recordId - record.recordId 字段值
 * @param {string} userEmail
 * @param {Object} feedback - { effectiveness, helpful?, comments?, timestamp }
 */
async function updateRehabilitationRecordFeedback(recordId, userEmail, feedback) {
  const recordsRef = collection(db, COLLECTION);
  const q = query(
    recordsRef,
    where('recordId', '==', recordId),
    where('userEmail', '==', userEmail),
    limit(1)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return;
  const docRef = snapshot.docs[0].ref;
  const now = new Date().toISOString();
  await updateDoc(docRef, {
    feedback: {
      effectiveness: feedback.effectiveness,
      helpful: feedback.helpful ?? null,
      comments: feedback.comments ?? '',
      timestamp: feedback.timestamp || now
    },
    updatedAt: now
  });
}

module.exports = {
  addRehabilitationRecord,
  getRehabilitationRecords,
  updateRehabilitationRecordFeedback,
  docToRecord
};
