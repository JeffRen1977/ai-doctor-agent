/**
 * MongoDB Adapter: Intervention（与 firebase/interventionAdapter 同接口）
 * 集合 interventions，文档 _id = userId。
 */
const { getCollection } = require('./connection');

const COLLECTION = 'interventions';

function toPlainValue(v) {
  if (v && typeof v.toDate === 'function') return v.toDate().toISOString();
  if (v instanceof Date) return v.toISOString();
  return v;
}

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

async function getIntervention(userId) {
  if (!userId) return null;
  const col = getCollection(COLLECTION);
  const doc = await col.findOne({ _id: userId });
  if (!doc) return null;
  return fromFirestore(doc);
}

async function setIntervention(userId, data) {
  if (!userId) throw new Error('userId required');
  const col = getCollection(COLLECTION);
  const payload = typeof data === 'object' && data !== null ? data : {};
  await col.updateOne({ _id: userId }, { $set: payload }, { upsert: true });
}

module.exports = {
  getIntervention,
  setIntervention,
  fromFirestore
};
