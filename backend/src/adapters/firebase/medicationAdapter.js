/**
 * Firebase Adapter: Medication
 * 仅使用子集合 personalHealthRecords/{userId}/medications/{medicationId}，不读写旧集合。
 * 仅依赖 config/firebase 与 models/medication。
 */

const { doc, getDoc, setDoc, deleteDoc, collection, query, where, getDocs } = require('firebase/firestore');
const { db } = require('../../config/firebase');
const { validateMedication } = require('../../models/medication');

const ROOT_COLLECTION = 'personalHealthRecords';
const MEDICATIONS_SUB = 'medications';

/**
 * 将 Firestore 文档转为 Medication 领域对象（含 status 归一化）
 */
function fromFirestoreDoc(data) {
  if (!data) return null;
  const toDate = (v) => (v && typeof v.toDate === 'function' ? v.toDate() : v);
  const item = {
    id: data.id,
    name: data.name || '',
    dosage: data.dosage,
    frequency: data.frequency,
    time: data.time || [],
    route: data.route,
    startDate: data.startDate,
    endDate: data.endDate,
    status: data.status === 'completed' || data.status === 'discontinued' ? 'stopped' : (data.status || 'active'),
    purpose: data.purpose,
    prescribingDoctor: data.prescribingDoctor,
    schedule: data.schedule || [],
    history: data.history || [],
    updatedAt: toDate(data.updatedAt),
    createdAt: toDate(data.createdAt)
  };
  const result = validateMedication(item);
  if (result.error) return null;
  return result.value;
}

/**
 * 领域对象转为可写 Firestore 的 plain object（含 id）
 */
function toFirestoreDoc(med) {
  const m = { ...med };
  if (m.updatedAt instanceof Date) m.updatedAt = m.updatedAt;
  if (m.createdAt instanceof Date) m.createdAt = m.createdAt;
  return m;
}

/**
 * @param {string} userId - 文档 ID（sanitized email）
 * @returns {Promise<import('../../models/medication').Medication[]>}
 */
async function listActive(userId) {
  const subRef = collection(db, ROOT_COLLECTION, userId, MEDICATIONS_SUB);
  const q = query(subRef, where('status', '==', 'active'));
  const snap = await getDocs(q);
  if (snap.empty) return [];
  return snap.docs.map(d => fromFirestoreDoc({ id: d.id, ...d.data() })).filter(Boolean);
}

/**
 * @param {string} userId
 * @param {Object} item - Medication 形态，id 可无（会生成）
 * @returns {Promise<Object>} 含 id 的 Medication
 */
async function add(userId, item) {
  const id = item.id || `med_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date();
  const med = {
    ...item,
    id,
    status: item.status || 'active',
    schedule: item.schedule || [],
    history: item.history || [],
    updatedAt: now,
    createdAt: item.createdAt || now
  };
  const validated = validateMedication(med);
  if (validated.error) throw new Error(validated.error.message);
  const subDocRef = doc(db, ROOT_COLLECTION, userId, MEDICATIONS_SUB, id);
  await setDoc(subDocRef, toFirestoreDoc(validated.value));
  return validated.value;
}

/**
 * @param {string} userId
 * @param {string} medicationId
 * @param {Object} patch - 部分字段
 */
async function update(userId, medicationId, patch) {
  const subDocRef = doc(db, ROOT_COLLECTION, userId, MEDICATIONS_SUB, medicationId);
  const snap = await getDoc(subDocRef);
  if (!snap.exists()) return;
  const current = snap.data();
  const updated = { ...current, ...patch, id: medicationId, updatedAt: new Date() };
  await setDoc(subDocRef, toFirestoreDoc(updated), { merge: true });
}

/**
 * @param {string} userId
 * @param {string} medicationId
 */
async function remove(userId, medicationId) {
  const subDocRef = doc(db, ROOT_COLLECTION, userId, MEDICATIONS_SUB, medicationId);
  await deleteDoc(subDocRef);
}

module.exports = {
  listActive,
  add,
  update,
  remove,
  fromFirestoreDoc,
  toFirestoreDoc
};
