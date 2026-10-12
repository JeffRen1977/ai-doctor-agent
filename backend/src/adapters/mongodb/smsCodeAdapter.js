/**
 * MongoDB: SMS verification codes (_id = phone).
 * Stores one-time codes with TTL and attempt tracking.
 */

const { getCollection } = require('./connection');

const COLLECTION = 'smsCodes';

async function putSmsCode(phone, payload) {
  if (!phone) throw new Error('phone required');
  const col = getCollection(COLLECTION);
  const id = String(phone).replace(/\D/g, '');
  await col.updateOne(
    { _id: id },
    {
      $set: {
        code: payload.code,
        expiresAt: payload.expiresAt,
        attempts: 0,
        createdAt: new Date().toISOString()
      }
    },
    { upsert: true }
  );
}

async function getSmsCode(phone) {
  if (!phone) return null;
  const id = String(phone).replace(/\D/g, '');
  const col = getCollection(COLLECTION);
  const now = new Date().toISOString();
  const doc = await col.findOne({ _id: id, expiresAt: { $gt: now } });
  if (!doc) return null;
  return { code: doc.code, expiresAt: doc.expiresAt, attempts: doc.attempts || 0 };
}

async function deleteSmsCode(phone) {
  if (!phone) return;
  const id = String(phone).replace(/\D/g, '');
  const col = getCollection(COLLECTION);
  await col.deleteOne({ _id: id });
}

async function incrementAttempts(phone) {
  if (!phone) return;
  const id = String(phone).replace(/\D/g, '');
  const col = getCollection(COLLECTION);
  await col.updateOne({ _id: id }, { $inc: { attempts: 1 } });
}

module.exports = {
  putSmsCode,
  getSmsCode,
  deleteSmsCode,
  incrementAttempts
};
