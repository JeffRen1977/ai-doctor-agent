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

module.exports = {
  getByEmail,
  setByEmail,
  updateByEmail
};
