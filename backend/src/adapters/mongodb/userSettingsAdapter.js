/**
 * MongoDB Adapter: UserSettings（与 firebase/userSettingsAdapter 同接口）
 * 集合 userSettings，文档 _id = userId。
 */
const { getCollection } = require('./connection');

const COLLECTION = 'userSettings';

function toPlainValue(v) {
  if (v && typeof v.toDate === 'function') return v.toDate().toISOString();
  if (v instanceof Date) return v.toISOString();
  return v;
}

function sanitize(data) {
  if (!data || typeof data !== 'object') return null;
  const out = { ...data };
  if (out.createdAt != null) out.createdAt = toPlainValue(out.createdAt) || out.createdAt;
  if (out.updatedAt != null) out.updatedAt = toPlainValue(out.updatedAt) || out.updatedAt;
  return out;
}

async function getUserSettings(userId) {
  if (!userId) return null;
  const col = getCollection(COLLECTION);
  const doc = await col.findOne({ _id: userId });
  if (!doc) return null;
  const { _id, ...rest } = doc;
  return sanitize(rest);
}

async function setUserSettings(userId, data) {
  if (!userId) throw new Error('userId required');
  const col = getCollection(COLLECTION);
  await col.updateOne({ _id: userId }, { $set: data }, { upsert: true });
}

async function deleteUserSettings(userId) {
  if (!userId) return { deletedCount: 0 };
  const col = getCollection(COLLECTION);
  const result = await col.deleteOne({ _id: userId });
  return { deletedCount: result.deletedCount };
}

/**
 * @param {string|number} telegramChatId
 * @returns {Promise<string|null>} userId = document _id
 */
async function findUserIdByTelegramChatId(telegramChatId) {
  if (telegramChatId == null || telegramChatId === '') return null;
  const sid = String(telegramChatId);
  const col = getCollection(COLLECTION);
  const doc = await col.findOne({ 'integrations.telegramChatId': sid });
  if (!doc || !doc._id) return null;
  return String(doc._id);
}

module.exports = {
  getUserSettings,
  setUserSettings,
  deleteUserSettings,
  findUserIdByTelegramChatId,
  sanitize
};
