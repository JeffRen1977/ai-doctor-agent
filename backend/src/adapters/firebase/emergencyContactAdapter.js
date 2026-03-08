/**
 * Firebase Adapter: EmergencyContact
 */

const { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, getDocs, query, where, orderBy } = require('firebase/firestore');
const { db } = require('../../config/firebase');

const COLLECTION = 'emergencyContacts';

function toPlainValue(v) {
  if (v && typeof v.toDate === 'function') return v.toDate().toISOString();
  if (v instanceof Date) return v.toISOString();
  return v;
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
  const ref = doc(db, COLLECTION, contact.contactId);
  await setDoc(ref, contact);
}

async function getContact(contactId) {
  const ref = doc(db, COLLECTION, contactId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return sanitize({ contactId: snap.id, ...snap.data() });
}

async function listByUser(userEmail) {
  try {
    const ref = collection(db, COLLECTION);
    const q = query(ref, where('userEmail', '==', userEmail), orderBy('isPrimary', 'desc'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => sanitize({ contactId: d.id, ...d.data() })).filter(Boolean);
  } catch (e) {
    if (e.code === 'failed-precondition') {
      const ref = collection(db, COLLECTION);
      const q = query(ref, where('userEmail', '==', userEmail));
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map((d) => sanitize({ contactId: d.id, ...d.data() })).filter(Boolean);
      list.sort((a, b) => {
        if (a.isPrimary !== b.isPrimary) return (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0);
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      return list;
    }
    throw e;
  }
}

async function updateContact(contactId, updates) {
  const ref = doc(db, COLLECTION, contactId);
  await updateDoc(ref, { ...updates, updatedAt: new Date().toISOString() });
}

async function deleteContact(contactId) {
  const ref = doc(db, COLLECTION, contactId);
  await deleteDoc(ref);
}

async function unsetPrimaryForUser(userEmail) {
  const ref = collection(db, COLLECTION);
  const q = query(ref, where('userEmail', '==', userEmail), where('isPrimary', '==', true));
  const snapshot = await getDocs(q);
  await Promise.all(
    snapshot.docs.map((d) => updateDoc(d.ref, { isPrimary: false, updatedAt: new Date().toISOString() }))
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
