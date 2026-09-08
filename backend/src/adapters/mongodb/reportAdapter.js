/**
 * MongoDB Adapter: Report（与 firebase/reportAdapter 同接口）
 * 集合 reports；_id = reportId；list by userEmail + sort generatedAt。
 */
const { getCollection } = require('./connection');

const COLLECTION = 'reports';

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

function sanitizeReport(data) {
  if (!data || typeof data !== 'object') return null;
  const out = { ...data };
  ['generatedAt', 'createdAt', 'updatedAt'].forEach((k) => {
    if (out[k] != null) out[k] = toPlainValue(out[k]) || out[k];
  });
  return out;
}

/**
 * @param {Object} report - 含 reportId，文档 _id = report.reportId
 */
async function saveReport(report) {
  const col = getCollection(COLLECTION);
  const reportId = report.reportId;
  const payload = stripUndefined({ ...report });
  await col.updateOne(
    { _id: reportId },
    { $set: payload },
    { upsert: true }
  );
}

/**
 * @param {string} reportId
 * @returns {Promise<Object | null>}
 */
async function getReport(reportId) {
  const col = getCollection(COLLECTION);
  const doc = await col.findOne({ _id: reportId });
  if (!doc) return null;
  return sanitizeReport({ reportId: doc._id, ...doc });
}

/**
 * @param {string} userEmail
 * @param {Object} options - { limit?, reportType? }
 * @returns {Promise<Array<Report>>}
 */
async function listReportsByUser(userEmail, options = {}) {
  const col = getCollection(COLLECTION);
  const { limit: limitCount, reportType } = options;
  const filter = { userEmail: userEmail || '' };
  if (reportType) filter.reportType = reportType;
  let cursor = col.find(filter).sort({ generatedAt: -1 });
  if (limitCount != null) cursor = cursor.limit(limitCount);
  const docs = await cursor.toArray();
  return docs.map((d) => sanitizeReport({ reportId: d._id, ...d })).filter(Boolean);
}

module.exports = {
  saveReport,
  getReport,
  listReportsByUser,
  deleteByUser,
  sanitizeReport
};

async function deleteByUser(userEmail) {
  const col = getCollection(COLLECTION);
  const result = await col.deleteMany({ userEmail: userEmail || '' });
  return { deletedCount: result.deletedCount };
}
