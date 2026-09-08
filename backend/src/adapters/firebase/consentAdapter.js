/**
 * Firebase Adapter: Consent（只追加、按用户查询）
 */

const { collection, addDoc, getDocs, query, where, orderBy, updateDoc, doc } = require('firebase/firestore');
const { db } = require('../../config/firebase');

const COLLECTION = 'consents';

function docToConsent(docSnap) {
  const data = docSnap.data();
  if (!data) return null;
  return {
    id: docSnap.id,
    subjectEmail: data.subjectEmail ?? '',
    purpose: data.purpose ?? '',
    granted: !!data.granted,
    policyVersion: data.policyVersion ?? '',
    timestamp: data.timestamp ?? '',
    requestId: data.requestId ?? null,
    actorId: data.actorId ?? null,
    source: data.source ?? null
  };
}

async function appendConsent(event) {
  const ref = collection(db, COLLECTION);
  const payload = { ...event, timestamp: event.timestamp || new Date().toISOString() };
  const created = await addDoc(ref, payload);
  return { id: created.id, ...payload };
}

async function listBySubject(subjectEmail, options = {}) {
  const ref = collection(db, COLLECTION);
  const q = query(
    ref,
    where('subjectEmail', '==', subjectEmail || ''),
    orderBy('timestamp', 'desc')
  );
  const snap = await getDocs(q);
  let rows = snap.docs.map(docToConsent).filter(Boolean);
  if (options.purpose) rows = rows.filter((r) => r.purpose === options.purpose);
  if (options.limit) rows = rows.slice(0, options.limit);
  return rows;
}

async function redactSubject(subjectEmail, hashedSubject) {
  const ref = collection(db, COLLECTION);
  const q = query(ref, where('subjectEmail', '==', subjectEmail || ''));
  const snap = await getDocs(q);
  let modifiedCount = 0;
  for (const d of snap.docs) {
    await updateDoc(doc(db, COLLECTION, d.id), {
      subjectEmail: hashedSubject,
      redactedAt: new Date().toISOString()
    });
    modifiedCount += 1;
  }
  return { modifiedCount };
}

module.exports = { appendConsent, listBySubject, redactSubject, docToConsent };
