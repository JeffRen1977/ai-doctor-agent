/**
 * MongoDB Adapter: WearableStreamData（与 firebase/wearableStreamDataAdapter 同接口）
 * 集合 wearableStreamData；addDataPoint insertOne；getRecentByUser / listByUserInTimeRange 按 userEmail、timestamp。
 */
const { ObjectId } = require('mongodb');
const { getCollection } = require('./connection');

const COLLECTION = 'wearableStreamData';

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

function sanitizePoint(data) {
  if (!data || typeof data !== 'object') return null;
  const out = { ...data };
  if (out.timestamp != null) out.timestamp = toPlainValue(out.timestamp) || out.timestamp;
  return out;
}

async function addDataPoint(dataPoint) {
  const col = getCollection(COLLECTION);
  const payload = stripUndefined(dataPoint);
  const result = await col.insertOne(payload);
  const id = result.insertedId ? result.insertedId.toString() : '';
  return { id };
}

/**
 * @param {string} userEmail
 * @param {Object} options - { limit?, timeRange?, deviceType? }
 */
async function getRecentByUser(userEmail, options = {}) {
  const col = getCollection(COLLECTION);
  const { limit: limitCount, timeRange, deviceType } = options;
  const TIME_RANGE_MS = { '1h': 60 * 60 * 1000, '6h': 6 * 60 * 60 * 1000, '24h': 24 * 60 * 60 * 1000 };
  const DEFAULT_CAP = 500;
  const cappedLimit = Math.min(Math.max(1, Number(limitCount) || 100), DEFAULT_CAP);
  const fetchLimit = timeRange && TIME_RANGE_MS[timeRange] ? Math.max(cappedLimit, 500) : cappedLimit;

  let docs = await col
    .find({ userEmail: userEmail || '' })
    .sort({ timestamp: -1 })
    .limit(fetchLimit)
    .toArray();

  let dataPoints = docs.map((d) => ({
    id: d._id instanceof ObjectId ? d._id.toString() : String(d._id || ''),
    ...sanitizePoint(d)
  }));
  dataPoints = dataPoints.reverse();

  const since = timeRange && TIME_RANGE_MS[timeRange] ? Date.now() - TIME_RANGE_MS[timeRange] : null;
  if (since != null) {
    dataPoints = dataPoints.filter((p) => new Date(p.timestamp || 0).getTime() >= since);
  }
  if (deviceType && typeof deviceType === 'string') {
    dataPoints = dataPoints.filter((p) => p.deviceType === deviceType);
  }
  return dataPoints.slice(-cappedLimit);
}

/**
 * @param {string} userEmail
 * @param {number} startMs
 * @param {number} endMs
 * @param {number} [limitCount]
 */
async function listByUserInTimeRange(userEmail, startMs, endMs, limitCount) {
  const col = getCollection(COLLECTION);
  const docs = await col.find({ userEmail: userEmail || '' }).sort({ timestamp: 1 }).toArray();
  const list = docs
    .filter((d) => {
      const t = d.timestamp ? new Date(d.timestamp).getTime() : 0;
      return t >= startMs && t <= endMs;
    })
    .map((d) => ({
      id: d._id instanceof ObjectId ? d._id.toString() : String(d._id || ''),
      ...sanitizePoint(d)
    }));
  if (limitCount != null) return list.slice(0, limitCount);
  return list;
}

module.exports = {
  addDataPoint,
  getRecentByUser,
  listByUserInTimeRange,
  deleteByUser,
  sanitizePoint
};

async function deleteByUser(userEmail) {
  const col = getCollection(COLLECTION);
  const result = await col.deleteMany({ userEmail: userEmail || '' });
  return { deletedCount: result.deletedCount };
}
