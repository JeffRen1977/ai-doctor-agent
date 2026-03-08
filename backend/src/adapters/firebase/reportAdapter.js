/**
 * Firebase Adapter: Report
 * 读写 reports/{reportId}；list 用 query where userEmail、orderBy generatedAt、limit。
 * 仅依赖 config/firebase，不依赖 services 或 routes.
 */

const { doc, getDoc, setDoc, collection, getDocs, query, where, orderBy, limit } = require('firebase/firestore');
const { db } = require('../../config/firebase');

const COLLECTION = 'reports';

function toPlainValue(v) {
  if (v && typeof v.toDate === 'function') return v.toDate().toISOString();
  if (v instanceof Date) return v.toISOString();
  return v;
}

function sanitizeReport(data) {
  if (!data || typeof data !== 'object') return null;
  const out = { ...data };
  ['generatedAt', 'createdAt', 'updatedAt'].forEach((k) => {
    if (out[k] != null) out[k] = toPlainValue(out[k]) || out[k];
  });
  return out;
}

/**
 * @param {Object} report - 含 reportId，文档 id = report.reportId
 */
async function saveReport(report) {
  const ref = doc(db, COLLECTION, report.reportId);
  await setDoc(ref, report);
}

/**
 * @param {string} reportId
 * @returns {Promise<Object | null>}
 */
async function getReport(reportId) {
  const ref = doc(db, COLLECTION, reportId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return sanitizeReport({ reportId: snap.id, ...snap.data() });
}

/**
 * @param {string} userEmail
 * @param {Object} options - { limit?, reportType? }
 * @returns {Promise<Array<Report>>}
 */
async function listReportsByUser(userEmail, options = {}) {
  const { limit: limitCount, reportType } = options;
  const reportsRef = collection(db, COLLECTION);
  try {
    const constraints = [where('userEmail', '==', userEmail)];
    if (reportType) constraints.push(where('reportType', '==', reportType));
    constraints.push(orderBy('generatedAt', 'desc'));
    if (limitCount != null) constraints.push(limit(limitCount));
    const q = query(reportsRef, ...constraints);
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => sanitizeReport({ reportId: d.id, ...d.data() })).filter(Boolean);
  } catch (indexError) {
    if (indexError.code === 'failed-precondition') {
      console.warn('⚠️ Reports index not found, using fallback');
      const fallbackQuery = query(reportsRef, where('userEmail', '==', userEmail));
      const snapshot = await getDocs(fallbackQuery);
      let list = snapshot.docs.map((d) => sanitizeReport({ reportId: d.id, ...d.data() })).filter(Boolean);
      if (reportType) list = list.filter((r) => r.reportType === reportType);
      list.sort((a, b) => new Date(b.generatedAt || 0).getTime() - new Date(a.generatedAt || 0).getTime());
      if (limitCount != null) list = list.slice(0, limitCount);
      return list;
    }
    throw indexError;
  }
}

module.exports = {
  saveReport,
  getReport,
  listReportsByUser,
  sanitizeReport
};
