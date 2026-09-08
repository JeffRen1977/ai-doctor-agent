/**
 * 导出任务。第一版同步生成 JSON，仍落库以便 24h 内再次下载。
 */
const { ObjectId } = require('mongodb');
const { getCollection } = require('./connection');

const COLLECTION = 'privacyJobs';

function docToJob(doc) {
  if (!doc) return null;
  const id = doc._id instanceof ObjectId ? doc._id.toString() : String(doc._id || '');
  return {
    id,
    subjectEmail: doc.subjectEmail ?? '',
    type: doc.type ?? 'export',
    status: doc.status ?? 'pending',
    payload: doc.payload ?? null,
    error: doc.error ?? null,
    createdAt: doc.createdAt ?? '',
    expiresAt: doc.expiresAt ?? null
  };
}

async function createJob(job) {
  const col = getCollection(COLLECTION);
  const payload = {
    ...job,
    createdAt: job.createdAt || new Date().toISOString()
  };
  const result = await col.insertOne(payload);
  return { id: result.insertedId ? result.insertedId.toString() : '', ...payload };
}

async function getJob(id) {
  if (!id) return null;
  const col = getCollection(COLLECTION);
  const filter = ObjectId.isValid(id) && String(id).length === 24 ? { _id: new ObjectId(id) } : { _id: id };
  const doc = await col.findOne(filter);
  return docToJob(doc);
}

module.exports = { createJob, getJob, docToJob };
