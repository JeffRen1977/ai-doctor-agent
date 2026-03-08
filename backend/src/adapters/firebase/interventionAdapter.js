/**
 * Firebase Adapter: Intervention（干预方案）
 * 读写 interventions/{userId} 单文档；merge 语义。
 * 仅依赖 config/firebase 与 models，不依赖 services 或 routes.
 */

const { doc, getDoc, setDoc } = require('firebase/firestore');
const { db } = require('../../config/firebase');

const COLLECTION = 'interventions';

function toPlainValue(v) {
  if (v && typeof v.toDate === 'function') return v.toDate().toISOString();
  if (v instanceof Date) return v.toISOString();
  return v;
}

/**
 * Firestore 文档 → 纯对象（无 Timestamp）
 * @param {Object} data - doc.data()
 * @returns {Object}
 */
function fromFirestore(data) {
  if (!data || typeof data !== 'object') return null;
  return {
    userEmail: data.userEmail,
    medication: data.medication || { adjustments: [], currentPlan: { medications: [], schedule: {}, targets: {} } },
    nutrition: data.nutrition || { adjustments: [], mealPlan: {}, dailyTargets: {} },
    exercise: data.exercise || { adjustments: [], weeklyPlan: {}, progression: {}, targets: {} },
    lastAdjusted: toPlainValue(data.lastAdjusted) || new Date().toISOString(),
    feedback: data.feedback || {},
    version: data.version ?? 1
  };
}

/**
 * @param {string} userId - 文档 ID（一般为 sanitized email）
 * @returns {Promise<Object | null>}
 */
async function getIntervention(userId) {
  const ref = doc(db, COLLECTION, userId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return fromFirestore(snap.data());
}

/**
 * 写入或合并干预方案（merge: true）
 * @param {string} userId
 * @param {Object} data - 干预方案对象（纯 JS，可含部分字段）
 */
async function setIntervention(userId, data) {
  const ref = doc(db, COLLECTION, userId);
  const payload = typeof data === 'object' && data !== null ? data : {};
  await setDoc(ref, payload, { merge: true });
}

module.exports = {
  getIntervention,
  setIntervention,
  fromFirestore
};
