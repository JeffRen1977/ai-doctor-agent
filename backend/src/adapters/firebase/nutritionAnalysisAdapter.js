/**
 * Firebase Adapter: NutritionAnalysis
 * 追加文档到 nutritionAnalyses 集合，addDoc 生成 id。
 * 仅依赖 config/firebase 与 models，不依赖 services 或 routes.
 */

const { collection, addDoc } = require('firebase/firestore');
const { db } = require('../../config/firebase');

const COLLECTION = 'nutritionAnalyses';

function toPlainValue(v) {
  if (v && typeof v.toDate === 'function') return v.toDate().toISOString();
  if (v instanceof Date) return v.toISOString();
  return v;
}

/**
 * 追加一条营养分析记录，返回含 id 的对象
 * @param {Object} data - { userEmail, nutrition, feedback?, timestamp? }
 * @returns {Promise<{ id: string, userEmail, nutrition, feedback, timestamp }>}
 */
async function addNutritionAnalysis(data) {
  const ref = collection(db, COLLECTION);
  const now = new Date().toISOString();
  const payload = {
    userEmail: data.userEmail ?? '',
    nutrition: data.nutrition ?? {},
    feedback: data.feedback ?? {},
    timestamp: toPlainValue(data.timestamp) ?? now
  };
  const docRef = await addDoc(ref, payload);
  return { id: docRef.id, ...payload };
}

module.exports = {
  addNutritionAnalysis
};
