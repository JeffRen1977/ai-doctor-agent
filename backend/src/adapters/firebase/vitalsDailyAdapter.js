/**
 * Firebase Adapter: VitalsDaily（单日体征聚合）
 * 子集合 personalHealthRecords/{userId}/vitals_daily/{date}，文档 ID = 日期 YYYY-MM-DD。
 * 仅依赖 config/firebase 与 models/vitalsDaily。
 */

const { doc, getDoc, setDoc } = require('firebase/firestore');
const { db } = require('../../config/firebase');
const { validateVitalsDaily } = require('../../models/vitalsDaily');

const ROOT_COLLECTION = 'personalHealthRecords';
const VITALS_DAILY_SUB = 'vitals_daily';

/**
 * Firestore 文档转为 VitalsDaily 领域对象
 */
function fromFirestoreDoc(data, dateId) {
  if (!data) return null;
  const toDate = (v) => (v && typeof v.toDate === 'function' ? v.toDate() : v);
  const item = {
    userId: data.userId,
    userEmail: data.userEmail,
    date: data.date || dateId,
    source: data.source,
    summary: data.summary || {},
    anomalies: data.anomalies || [],
    trend: data.trend ?? null,
    updatedAt: data.updatedAt ? toDate(data.updatedAt) : undefined,
    createdAt: data.createdAt ? toDate(data.createdAt) : undefined
  };
  const result = validateVitalsDaily(item);
  if (result.error) return null;
  return result.value;
}

/**
 * 领域对象转为可写 Firestore 的 plain object
 */
function toFirestoreDoc(payload) {
  const o = { ...payload };
  if (o.updatedAt instanceof Date) o.updatedAt = o.updatedAt;
  if (o.createdAt instanceof Date) o.createdAt = o.createdAt;
  return o;
}

/**
 * @param {string} userId - 文档 ID（一般为 sanitized email）
 * @param {string} date - YYYY-MM-DD
 * @returns {Promise<import('../../models/vitalsDaily').VitalsDaily | null>}
 */
async function getVitalsDaily(userId, date) {
  const ref = doc(db, ROOT_COLLECTION, userId, VITALS_DAILY_SUB, date);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return fromFirestoreDoc(snap.data(), date);
}

/**
 * 幂等写入：同一 user+date 多次调用以最后一次为准（merge）
 * @param {string} userId
 * @param {string} date - YYYY-MM-DD
 * @param {Object} payload - VitalsDaily 领域对象
 */
async function upsertVitalsDaily(userId, date, payload) {
  const normalized = {
    ...payload,
    date,
    userId: payload.userId || userId,
    userEmail: payload.userEmail,
    updatedAt: payload.updatedAt || new Date(),
    createdAt: payload.createdAt || payload.updatedAt || new Date()
  };
  const result = validateVitalsDaily(normalized);
  if (result.error) throw new Error(result.error.message);
  const ref = doc(db, ROOT_COLLECTION, userId, VITALS_DAILY_SUB, date);
  await setDoc(ref, toFirestoreDoc(result.value), { merge: true });
}

module.exports = {
  getVitalsDaily,
  upsertVitalsDaily,
  fromFirestoreDoc,
  toFirestoreDoc
};
