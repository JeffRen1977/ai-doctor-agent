/**
 * MongoDB Adapter: EmergencyContact（与 firebase/emergencyContactAdapter 同接口）
 * 集合 emergencyContacts；_id = contactId；list by userEmail，unsetPrimaryForUser。
 */
const { ObjectId } = require('mongodb');
const { getCollection } = require('./connection');

const COLLECTION = 'emergencyContacts';

function toPlainValue(v) {
  if (v && typeof v.toDate === 'function') return v.toDate().toISOString();
  if (v instanceof Date) return v.toISOString();
  return v;
}

function stripUndefined(obj) {
  if (obj === undefined) return null;
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(stripUndefined);
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = stripUndefined(v);
    else out[k] = null;
  }
  return out;
}

function sanitize(data) {
  if (!data || typeof data !== 'object') return null;
  const out = { ...data };
  ['createdAt', 'updatedAt'].forEach((k) => {
    if (out[k] != null) out[k] = toPlainValue(out[k]) || out[k];
  });
  return out;
}

async function saveContact(contact) {
  const col = getCollection(COLLECTION);
  const contactId = contact.contactId;
  const payload = stripUndefined({ ...contact });
  await col.updateOne(
    { _id: contactId },
    { $set: payload },
    { upsert: true }
  );
}

async function getContact(contactId) {
  const col = getCollection(COLLECTION);
  const doc = await col.findOne({ _id: contactId });
  if (!doc) return null;
  const idStr = doc._id instanceof ObjectId ? doc._id.toString() : String(doc._id || '');
  return sanitize({ contactId: idStr, ...doc });
}

async function listByUser(userEmail) {
  const col = getCollection(COLLECTION);
  const docs = await col
    .find({ userEmail: userEmail || '' })
    .sort({ isPrimary: -1, createdAt: -1 })
    .toArray();
  return docs.map((d) => {
    const idStr = d._id instanceof ObjectId ? d._id.toString() : String(d._id || '');
    return sanitize({ contactId: idStr, ...d });
  }).filter(Boolean);
}

async function updateContact(contactId, updates) {
  const col = getCollection(COLLECTION);
  const payload = stripUndefined({ ...updates, updatedAt: new Date().toISOString() });
  await col.updateOne({ _id: contactId }, { $set: payload });
}

async function deleteContact(contactId) {
  const col = getCollection(COLLECTION);
  await col.deleteOne({ _id: contactId });
}

async function unsetPrimaryForUser(userEmail) {
  const col = getCollection(COLLECTION);
  await col.updateMany(
    { userEmail: userEmail || '', isPrimary: true },
    { $set: { isPrimary: false, updatedAt: new Date().toISOString() } }
  );
}

module.exports = {
  saveContact,
  getContact,
  listByUser,
  updateContact,
  deleteContact,
  unsetPrimaryForUser,
  sanitize
};
