/**
 * MongoDB: one-time Telegram bind codes (_id = code).
 */

const { getCollection } = require('./connection');

const COLLECTION = 'telegramBindingCodes';

async function putBindingCode(code, payload) {
  if (!code) throw new Error('code required');
  const col = getCollection(COLLECTION);
  const id = String(code).toUpperCase().replace(/[^A-Z0-9]/g, '');
  await col.updateOne(
    { _id: id },
    {
      $set: {
        userId: payload.userId,
        expiresAt: payload.expiresAt,
        createdAt: new Date().toISOString()
      }
    },
    { upsert: true }
  );
}

/**
 * @returns {Promise<{ userId: string } | null>}
 */
async function takeBindingCode(code) {
  if (!code) return null;
  const id = String(code).toUpperCase().replace(/[^A-Z0-9]/g, '');
  const col = getCollection(COLLECTION);
  const now = new Date().toISOString();
  const doc = await col.findOne({ _id: id, expiresAt: { $gt: now } });
  if (!doc || !doc.userId) return null;
  await col.deleteOne({ _id: id });
  return { userId: doc.userId };
}

module.exports = {
  putBindingCode,
  takeBindingCode
};
