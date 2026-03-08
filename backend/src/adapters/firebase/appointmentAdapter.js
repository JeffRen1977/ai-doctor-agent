/**
 * Firebase Adapter: Appointment
 * 读写 appointments/{appointmentId}；list by userEmail with optional filters.
 */

const { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, getDocs, query, where, orderBy, limit } = require('firebase/firestore');
const { db } = require('../../config/firebase');

const COLLECTION = 'appointments';

function toPlainValue(v) {
  if (v && typeof v.toDate === 'function') return v.toDate().toISOString();
  if (v instanceof Date) return v.toISOString();
  return v;
}

function sanitize(d) {
  if (!d || typeof d !== 'object') return null;
  const out = { ...d };
  ['scheduledDateTime', 'createdAt', 'updatedAt'].forEach((k) => {
    if (out[k] != null) out[k] = toPlainValue(out[k]) || out[k];
  });
  return out;
}

async function saveAppointment(appointment) {
  const ref = doc(db, COLLECTION, appointment.appointmentId);
  await setDoc(ref, appointment);
}

async function getAppointment(appointmentId) {
  const ref = doc(db, COLLECTION, appointmentId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return sanitize({ appointmentId: snap.id, ...snap.data() });
}

async function updateAppointment(appointmentId, updates) {
  const ref = doc(db, COLLECTION, appointmentId);
  await updateDoc(ref, { ...updates, updatedAt: new Date().toISOString() });
}

async function deleteAppointment(appointmentId) {
  const ref = doc(db, COLLECTION, appointmentId);
  await deleteDoc(ref);
}

async function listAppointmentsByUser(userEmail, options = {}) {
  const { status, startDate, endDate, limit: limitCount } = options;
  const ref = collection(db, COLLECTION);
  try {
    const constraints = [where('userEmail', '==', userEmail)];
    if (status) constraints.push(where('status', '==', status));
    if (startDate) constraints.push(where('scheduledDateTime', '>=', startDate));
    if (endDate) constraints.push(where('scheduledDateTime', '<=', endDate));
    constraints.push(orderBy('scheduledDateTime', 'asc'));
    if (limitCount != null) constraints.push(limit(limitCount));
    const q = query(ref, ...constraints);
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => sanitize({ appointmentId: d.id, ...d.data() })).filter(Boolean);
  } catch (indexError) {
    if (indexError.code === 'failed-precondition') {
      console.warn('⚠️ Appointments index not found, using fallback');
      const fallbackQ = query(ref, where('userEmail', '==', userEmail));
      const snapshot = await getDocs(fallbackQ);
      let list = snapshot.docs.map((d) => sanitize({ appointmentId: d.id, ...d.data() })).filter(Boolean);
      if (status) list = list.filter((a) => a.status === status);
      if (startDate) list = list.filter((a) => new Date(a.scheduledDateTime) >= new Date(startDate));
      if (endDate) list = list.filter((a) => new Date(a.scheduledDateTime) <= new Date(endDate));
      list.sort((a, b) => new Date(a.scheduledDateTime).getTime() - new Date(b.scheduledDateTime).getTime());
      if (limitCount != null) list = list.slice(0, limitCount);
      return list;
    }
    throw indexError;
  }
}

module.exports = {
  saveAppointment,
  getAppointment,
  updateAppointment,
  deleteAppointment,
  listAppointmentsByUser,
  sanitize
};
