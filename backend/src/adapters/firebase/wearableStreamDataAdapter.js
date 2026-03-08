/**
 * Firebase Adapter: WearableStreamData
 * 流式穿戴数据：addDoc 写入；按 userEmail 查询，支持 orderBy timestamp 与 fallback。
 */

const { collection, addDoc, getDocs, query, where, orderBy, limit } = require('firebase/firestore');
const { db } = require('../../config/firebase');

const COLLECTION = 'wearableStreamData';

function toPlainValue(v) {
  if (v && typeof v.toDate === 'function') return v.toDate().toISOString();
  if (v instanceof Date) return v.toISOString();
  return v;
}

function sanitizePoint(data) {
  if (!data || typeof data !== 'object') return null;
  const out = { ...data };
  if (out.timestamp != null) out.timestamp = toPlainValue(out.timestamp) || out.timestamp;
  return out;
}

/**
 * @param {Object} dataPoint - 含 userEmail, deviceType, data, timestamp 等
 * @returns {Promise<{ id: string }>}
 */
async function addDataPoint(dataPoint) {
  const ref = collection(db, COLLECTION);
  const docRef = await addDoc(ref, dataPoint);
  return { id: docRef.id };
}

/**
 * @param {string} userEmail
 * @param {Object} options - { limit?, timeRange?: '1h'|'6h'|'24h', deviceType?: string }
 * @returns {Promise<Array>} 按时间正序的数据点，每项含 id 与 timestamp 转为 ISO
 */
async function getRecentByUser(userEmail, options = {}) {
  const { limit: limitCount, timeRange, deviceType } = options;
  const TIME_RANGE_MS = { '1h': 60 * 60 * 1000, '6h': 6 * 60 * 60 * 1000, '24h': 24 * 60 * 60 * 1000 };
  const DEFAULT_CAP = 500;
  const cappedLimit = Math.min(Math.max(1, Number(limitCount) || 100), DEFAULT_CAP);
  const fetchLimit = timeRange && TIME_RANGE_MS[timeRange] ? Math.max(cappedLimit, 500) : cappedLimit;

  const ref = collection(db, COLLECTION);
  let dataPoints = [];

  try {
    const q = query(
      ref,
      where('userEmail', '==', userEmail),
      orderBy('timestamp', 'desc'),
      limit(fetchLimit)
    );
    const snapshot = await getDocs(q);
    snapshot.forEach((d) => dataPoints.push({ id: d.id, ...sanitizePoint(d.data()) }));
    dataPoints = dataPoints.reverse();
  } catch (indexError) {
    if (indexError.code === 'failed-precondition') {
      console.warn('⚠️ WearableStreamData index not found, using fallback');
      const fallbackQ = query(ref, where('userEmail', '==', userEmail));
      const snapshot = await getDocs(fallbackQ);
      snapshot.forEach((d) => dataPoints.push({ id: d.id, ...sanitizePoint(d.data()) }));
      dataPoints.sort((a, b) => {
        const ta = new Date(a.timestamp || 0).getTime();
        const tb = new Date(b.timestamp || 0).getTime();
        return ta - tb;
      });
      dataPoints = dataPoints.slice(-fetchLimit);
    } else {
      throw indexError;
    }
  }

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
 * @param {number} startMs - 起始时间戳（含）
 * @param {number} endMs - 结束时间戳（含）
 * @param {number} [limitCount] - 最多返回条数
 * @returns {Promise<Array>}
 */
async function listByUserInTimeRange(userEmail, startMs, endMs, limitCount) {
  const ref = collection(db, COLLECTION);
  const q = query(ref, where('userEmail', '==', userEmail));
  const snapshot = await getDocs(q);
  const list = [];
  snapshot.forEach((d) => list.push({ id: d.id, ...sanitizePoint(d.data()) }));
  const filtered = list.filter((p) => {
    const t = p.timestamp ? new Date(p.timestamp).getTime() : 0;
    return t >= startMs && t <= endMs;
  });
  filtered.sort((a, b) => new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime());
  if (limitCount != null) return filtered.slice(0, limitCount);
  return filtered;
}

module.exports = {
  addDataPoint,
  getRecentByUser,
  listByUserInTimeRange,
  sanitizePoint
};
