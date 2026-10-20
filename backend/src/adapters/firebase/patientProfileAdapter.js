/**
 * Firebase Adapter: PatientProfile
 * Collection: patient_profiles (root-level, keyed by userId)
 */
const {
  doc, getDoc, setDoc, deleteDoc,
} = require('firebase/firestore');
const { db } = require('../../config/firebase');

const COLLECTION = 'patient_profiles';

const ARRAY_FIELDS = ['conditions', 'allergies', 'contraindications', 'goals', 'concerns'];

function normalize(snap) {
  if (!snap.exists()) return null;
  const d = snap.data();
  const out = { userId: snap.id };
  for (const f of ARRAY_FIELDS) {
    out[f] = d[f] || [];
  }
  out.preferences = d.preferences || {};
  out.lastUpdatedBy = d.lastUpdatedBy || 'agent';
  out.metadata = d.metadata || {};
  out.createdAt = d.createdAt;
  out.updatedAt = d.updatedAt;
  return out;
}

async function getByUser(userId) {
  const ref = doc(db, COLLECTION, userId);
  const snap = await getDoc(ref);
  return normalize(snap);
}

async function upsert(userId, updates) {
  const ref = doc(db, COLLECTION, userId);
  const snap = await getDoc(ref);
  const now = new Date().toISOString();
  const existing = snap.exists() ? snap.data() : {};

  const merged = { ...existing, updatedAt: now };
  if (!existing.createdAt) merged.createdAt = now;

  for (const f of ARRAY_FIELDS) {
    if (Array.isArray(updates[f]) && updates[f].length > 0) {
      const current = new Set(existing[f] || []);
      for (const v of updates[f]) current.add(v);
      merged[f] = [...current];
    }
  }
  if (updates.preferences) merged.preferences = updates.preferences;
  if (updates.lastUpdatedBy) merged.lastUpdatedBy = updates.lastUpdatedBy;
  if (updates.metadata) merged.metadata = updates.metadata;

  await setDoc(ref, merged);
}

async function deleteByUser(userId) {
  const ref = doc(db, COLLECTION, userId);
  await deleteDoc(ref);
}

module.exports = { getByUser, upsert, deleteByUser };
