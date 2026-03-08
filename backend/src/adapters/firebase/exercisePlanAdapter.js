/**
 * Firebase Adapter: ExercisePlan
 * 读写 exercisePlans/{userId} 单文档；merge 语义。
 * 仅依赖 config/firebase 与 models，不依赖 services 或 routes.
 */

const { doc, getDoc, setDoc } = require('firebase/firestore');
const { db } = require('../../config/firebase');

const COLLECTION = 'exercisePlans';

function toPlainValue(v) {
  if (v && typeof v.toDate === 'function') return v.toDate().toISOString();
  if (v instanceof Date) return v.toISOString();
  return v;
}

/**
 * @param {string} userId - 文档 ID（一般为 sanitized email）
 * @returns {Promise<Object | null>} 内层 plan 对象或 null
 */
async function getExercisePlan(userId) {
  const ref = doc(db, COLLECTION, userId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data();
  if (!data || !data.plan) return null;
  return typeof data.plan === 'object' ? data.plan : null;
}

/**
 * 写入或合并运动计划文档（merge: true）
 * @param {string} userId
 * @param {Object} data - 至少含 plan；可选 userEmail；createdAt/updatedAt 未传则自动填充
 */
async function setExercisePlan(userId, data) {
  const ref = doc(db, COLLECTION, userId);
  const now = new Date().toISOString();
  const payload = {
    userEmail: data.userEmail ?? userId,
    plan: data.plan ?? {},
    createdAt: toPlainValue(data.createdAt) ?? now,
    updatedAt: now
  };
  await setDoc(ref, payload, { merge: true });
}

module.exports = {
  getExercisePlan,
  setExercisePlan
};
