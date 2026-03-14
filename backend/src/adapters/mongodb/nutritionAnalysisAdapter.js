/**
 * MongoDB Adapter: NutritionAnalysis（与 firebase/nutritionAnalysisAdapter 同接口）
 * 集合 nutritionAnalyses，insertOne 生成 id。
 */
const { getCollection } = require('./connection');

const COLLECTION = 'nutritionAnalyses';

function toPlainValue(v) {
  if (v && typeof v.toDate === 'function') return v.toDate().toISOString();
  if (v instanceof Date) return v.toISOString();
  return v;
}

async function addNutritionAnalysis(data) {
  const col = getCollection(COLLECTION);
  const now = new Date().toISOString();
  const payload = {
    userEmail: data.userEmail ?? '',
    nutrition: data.nutrition ?? {},
    feedback: data.feedback ?? {},
    timestamp: toPlainValue(data.timestamp) ?? now
  };
  const result = await col.insertOne(payload);
  const id = result.insertedId ? result.insertedId.toString() : '';
  return { id, ...payload };
}

module.exports = {
  addNutritionAnalysis
};
