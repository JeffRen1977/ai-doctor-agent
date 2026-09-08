/**
 * MongoDB Adapter: UserProfile（与 firebase/userProfileAdapter 同接口）
 * 集合 userProfile，文档 _id = email。
 */
const { getCollection } = require('./connection');

const COLLECTION = 'userProfile';

async function getByEmail(email) {
  if (!email) return null;
  const col = getCollection(COLLECTION);
  const doc = await col.findOne({ _id: email });
  if (!doc) return null;
  const { _id, ...rest } = doc;
  return rest;
}

async function setByEmail(email, data) {
  if (!email) throw new Error('email required');
  const col = getCollection(COLLECTION);
  await col.updateOne({ _id: email }, { $set: data }, { upsert: true });
}

async function updateByEmail(email, updates) {
  if (!email) throw new Error('email required');
  const col = getCollection(COLLECTION);
  await col.updateOne({ _id: email }, { $set: updates });
}

async function deleteByEmail(email) {
  if (!email) return { deletedCount: 0 };
  const col = getCollection(COLLECTION);
  const result = await col.deleteOne({ _id: email });
  return { deletedCount: result.deletedCount };
}

module.exports = {
  getByEmail,
  setByEmail,
  updateByEmail,
  deleteByEmail
};
