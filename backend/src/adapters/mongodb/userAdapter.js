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

async function deleteByEmail(email) {
  if (!email) return { deletedCount: 0 };
  const col = getCollection(COLLECTION);
  const result = await col.deleteOne({ _id: email });
  return { deletedCount: result.deletedCount };
}

/**
 * 按重置令牌哈希查找用户。明文令牌只出现在邮件里，库里只有 SHA-256。
 * @param {string} hash
 * @returns {Promise<Object | null>}
 */
async function findByPasswordResetHash(hash) {
  if (!hash) return null;
  const col = getCollection(COLLECTION);
  const doc = await col.findOne({ passwordResetTokenHash: hash });
  if (!doc) return null;
  const { _id, ...rest } = doc;
  return { email: rest.email || _id, ...rest };
}

module.exports = {
  getByEmail,
  setByEmail,
  updateByEmail,
  getByUid,
  findByPasswordResetHash,
  deleteByEmail
};
