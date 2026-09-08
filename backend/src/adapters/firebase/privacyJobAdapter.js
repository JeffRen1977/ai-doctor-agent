/**
 * Firebase Adapter: PrivacyJob
 */
const { collection, addDoc, getDoc, doc } = require('firebase/firestore');
const { db } = require('../../config/firebase');

const COLLECTION = 'privacyJobs';

function snapToJob(docSnap) {
  if (!docSnap?.exists()) return null;
  const data = docSnap.data() || {};
  return {
    id: docSnap.id,
    subjectEmail: data.subjectEmail ?? '',
    type: data.type ?? 'export',
    status: data.status ?? 'pending',
    payload: data.payload ?? null,
    error: data.error ?? null,
    createdAt: data.createdAt ?? '',
    expiresAt: data.expiresAt ?? null
  };
}

async function createJob(job) {
  const ref = collection(db, COLLECTION);
  const payload = { ...job, createdAt: job.createdAt || new Date().toISOString() };
  const created = await addDoc(ref, payload);
  return { id: created.id, ...payload };
}

async function getJob(id) {
  if (!id) return null;
  const snap = await getDoc(doc(db, COLLECTION, id));
  return snapToJob(snap);
}

module.exports = { createJob, getJob };
