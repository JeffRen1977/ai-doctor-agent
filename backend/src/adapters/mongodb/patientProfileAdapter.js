const { getCollection } = require('./connection');

const COLLECTION = 'patient_profiles';

const ARRAY_FIELDS = ['conditions', 'allergies', 'contraindications', 'goals', 'concerns'];

function normalize(doc) {
  if (!doc) return null;
  const out = { userId: doc._id ? String(doc._id) : doc.userId };
  for (const f of ARRAY_FIELDS) {
    out[f] = doc[f] || [];
  }
  out.preferences = doc.preferences || {};
  out.lastUpdatedBy = doc.lastUpdatedBy || 'agent';
  out.metadata = doc.metadata || {};
  out.createdAt = doc.createdAt;
  out.updatedAt = doc.updatedAt;
  return out;
}

async function getByUser(userId) {
  const col = getCollection(COLLECTION);
  const doc = await col.findOne({ _id: userId });
  return normalize(doc);
}

async function upsert(userId, updates) {
  const col = getCollection(COLLECTION);
  const now = new Date().toISOString();

  const addToSet = {};
  const set = { updatedAt: now };

  for (const f of ARRAY_FIELDS) {
    if (Array.isArray(updates[f]) && updates[f].length > 0) {
      addToSet[f] = { $each: updates[f] };
    }
  }
  if (updates.preferences) set.preferences = updates.preferences;
  if (updates.lastUpdatedBy) set.lastUpdatedBy = updates.lastUpdatedBy;
  if (updates.metadata) set.metadata = updates.metadata;

  const ops = { $set: set, $setOnInsert: { _id: userId, createdAt: now } };
  if (Object.keys(addToSet).length > 0) {
    ops.$addToSet = addToSet;
  }

  await col.updateOne({ _id: userId }, ops, { upsert: true });
}

async function deleteByUser(userId) {
  const col = getCollection(COLLECTION);
  await col.deleteOne({ _id: userId });
}

module.exports = { getByUser, upsert, deleteByUser };
