const { getCollection } = require('./connection');

const COLLECTION = 'deviceTokens';

async function registerDevice(userId, { token, vendor, model, osVersion }) {
  if (!userId || !token) throw new Error('userId and token required');
  const col = getCollection(COLLECTION);
  await col.updateOne(
    { _id: token },
    {
      $set: {
        userId,
        vendor: vendor || 'unknown',
        model: model || '',
        osVersion: osVersion || '',
        updatedAt: new Date().toISOString()
      },
      $setOnInsert: { createdAt: new Date().toISOString() }
    },
    { upsert: true }
  );
}

async function getDevicesByUserId(userId) {
  if (!userId) return [];
  const col = getCollection(COLLECTION);
  const docs = await col.find({ userId }).toArray();
  return docs.map(({ _id, ...rest }) => ({ token: _id, ...rest }));
}

async function removeDevice(token) {
  if (!token) return { deletedCount: 0 };
  const col = getCollection(COLLECTION);
  const result = await col.deleteOne({ _id: token });
  return { deletedCount: result.deletedCount };
}

async function removeAllByUserId(userId) {
  if (!userId) return { deletedCount: 0 };
  const col = getCollection(COLLECTION);
  const result = await col.deleteMany({ userId });
  return { deletedCount: result.deletedCount };
}

module.exports = { registerDevice, getDevicesByUserId, removeDevice, removeAllByUserId };
