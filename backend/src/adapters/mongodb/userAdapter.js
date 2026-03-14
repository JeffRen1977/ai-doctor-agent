/**
 * MongoDB Adapter: User（与 firebase/userAdapter 同接口）
 * 集合 users，文档 _id = email；getByUid 用 findOne({ uid })。
 */
const { getCollection } = require('./connection');

const COLLECTION = 'users';

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

async function getByUid(uid) {
  if (!uid) return null;
  const col = getCollection(COLLECTION);
  const doc = await col.findOne({ uid });
  if (!doc) return null;
  const { _id, ...rest } = doc;
  return rest;
}

module.exports = {
  getByEmail,
  setByEmail,
  updateByEmail,
  getByUid
};
