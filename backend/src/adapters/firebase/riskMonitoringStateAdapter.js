/**
 * Firebase Adapter: RiskMonitoringState
 * 读写 riskMonitoringState/{userId}，单文档 per user，set 使用 merge: true。
 */

const { doc, getDoc, setDoc } = require('firebase/firestore');
const { db } = require('../../config/firebase');

const COLLECTION = 'riskMonitoringState';

function toPlainValue(v) {
  if (v && typeof v.toDate === 'function') return v.toDate().toISOString();
  if (v instanceof Date) return v.toISOString();
  return v;
}

function fromFirestore(data) {
  if (!data || typeof data !== 'object') return null;
  return {
    lastAutoDetectAt: data.lastAutoDetectAt != null ? toPlainValue(data.lastAutoDetectAt) : undefined,
    userEmail: data.userEmail
  };
}

/**
 * @param {string} userId - 文档 id（一般为 userEmail 的 sanitized 形式）
 * @returns {Promise<Object | null>}
 */
async function getRiskMonitoringState(userId) {
  const ref = doc(db, COLLECTION, userId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return fromFirestore(snap.data());
}

/**
 * 合并写入（merge: true）
 * @param {string} userId
 * @param {Object} data - 如 { lastAutoDetectAt, userEmail }
 */
async function setRiskMonitoringState(userId, data) {
  const ref = doc(db, COLLECTION, userId);
  await setDoc(ref, data, { merge: true });
}

module.exports = {
  getRiskMonitoringState,
  setRiskMonitoringState,
  fromFirestore
};
