/**
 * MongoDB Adapter: ExercisePlan（与 firebase/exercisePlanAdapter 同接口）
 * 集合 exercisePlans，文档 _id = userId，内层 plan 字段。
 */
const { getCollection } = require('./connection');

const COLLECTION = 'exercisePlans';

function toPlainValue(v) {
  if (v && typeof v.toDate === 'function') return v.toDate().toISOString();
  if (v instanceof Date) return v.toISOString();
  return v;
}

async function getExercisePlan(userId) {
  if (!userId) return null;
  const col = getCollection(COLLECTION);
  const doc = await col.findOne({ _id: userId });
  if (!doc || !doc.plan) return null;
  return typeof doc.plan === 'object' ? doc.plan : null;
}

async function setExercisePlan(userId, data) {
  if (!userId) throw new Error('userId required');
  const col = getCollection(COLLECTION);
  const now = new Date().toISOString();
  const payload = {
    userEmail: data.userEmail ?? userId,
    plan: data.plan ?? {},
    createdAt: toPlainValue(data.createdAt) ?? now,
    updatedAt: now
  };
  await col.updateOne({ _id: userId }, { $set: payload }, { upsert: true });
}

module.exports = {
  getExercisePlan,
  setExercisePlan
};
