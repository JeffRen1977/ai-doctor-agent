/**
 * MongoDB Adapter: Consent（与 firebase/consentAdapter 同接口）
 */
const { ObjectId } = require('mongodb');
const { getCollection } = require('./connection');

const COLLECTION = 'consents';

function docToConsent(doc) {
  if (!doc) return null;
  const id = doc._id instanceof ObjectId ? doc._id.toString() : String(doc._id || '');
  return {
    id,
    subjectEmail: doc.subjectEmail ?? '',
    purpose: doc.purpose ?? '',
    granted: !!doc.granted,
    policyVersion: doc.policyVersion ?? '',
    timestamp: doc.timestamp ?? '',
    requestId: doc.requestId ?? null,
    actorId: doc.actorId ?? null,
    source: doc.source ?? null
  };
}

async function appendConsent(event) {
  const col = getCollection(COLLECTION);
  const payload = { ...event, timestamp: event.timestamp || new Date().toISOString() };
  const result = await col.insertOne(payload);
  return { id: result.insertedId ? result.insertedId.toString() : '', ...payload };
}

async function listBySubject(subjectEmail, options = {}) {
  const col = getCollection(COLLECTION);
  const filter = { subjectEmail: subjectEmail || '' };
  if (options.purpose) filter.purpose = options.purpose;
  const docs = await col.find(filter).sort({ timestamp: -1 }).limit(options.limit || 200).toArray();
  return docs.map(docToConsent).filter(Boolean);
}

async function redactSubject(subjectEmail, hashedSubject) {
  const col = getCollection(COLLECTION);
  const result = await col.updateMany(
    { subjectEmail: subjectEmail || '' },
    { $set: { subjectEmail: hashedSubject, redactedAt: new Date().toISOString() } }
  );
  return { modifiedCount: result.modifiedCount };
}

module.exports = { appendConsent, listBySubject, redactSubject, docToConsent };
