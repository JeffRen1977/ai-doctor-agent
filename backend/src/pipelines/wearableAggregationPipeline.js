/**
 * 从 wearableStreamData 按 user+date 聚合为 VitalsDaily，通过 vitalsDailyRepo 写入子集合。
 * 仅依赖 repositories 与 config/firebase，不直接写 Firestore（写通过 repo）。
 * 可被「写入流数据后」或定时 job 调用。
 */

const { collection, query, where, getDocs } = require('firebase/firestore');
const { db } = require('../config/firebase');
const repositories = require('../repositories');

const WEARABLE_STREAM_COLLECTION = 'wearableStreamData';
const MAX_POINTS_PER_DAY = 2000;

/**
 * 取某日 00:00:00 与 23:59:59.999 的时间戳（本地日期）
 */
function getDayBounds(dateStr) {
  const d = new Date(dateStr + 'T00:00:00.000Z');
  if (isNaN(d.getTime())) return null;
  const start = d.getTime();
  const end = start + 24 * 60 * 60 * 1000 - 1;
  return { start, end };
}

/**
 * 从 wearableStreamData 查询某用户某日的数据点（userEmail 与 userId 在本项目中一致）
 * @param {string} userEmailOrId - userEmail 或 userId
 * @param {string} date - YYYY-MM-DD
 * @returns {Promise<Array<{ id: string, userEmail: string, data: Object, timestamp: * }>>}
 */
async function fetchDataPointsForDay(userEmailOrId, date) {
  const bounds = getDayBounds(date);
  if (!bounds) return [];
  const streamRef = collection(db, WEARABLE_STREAM_COLLECTION);
  const q = query(streamRef, where('userEmail', '==', userEmailOrId));
  const snap = await getDocs(q);
  const list = [];
  snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
  const filtered = list.filter((p) => {
    const t = p.timestamp ? new Date(p.timestamp).getTime() : 0;
    return t >= bounds.start && t <= bounds.end;
  });
  return filtered.slice(-MAX_POINTS_PER_DAY);
}

/**
 * 对数值数组计算 min/max/avg
 */
function stats(values) {
  const num = values.filter((v) => typeof v === 'number' && !Number.isNaN(v));
  if (num.length === 0) return null;
  const min = Math.min(...num);
  const max = Math.max(...num);
  const avg = num.reduce((a, b) => a + b, 0) / num.length;
  return { min, max, avg };
}

/**
 * 从数据点聚合 summary（与架构 7.2 一致）
 */
function aggregateSummary(dataPoints) {
  const summary = {};
  const hr = [];
  const hrResting = [];
  const sys = [];
  const dia = [];
  const glu = [];
  const hrvVals = [];
  let stepsTotal = 0;
  let sleepTotal = 0;

  for (const p of dataPoints) {
    const d = p.data || {};
    if (typeof d.heartRate === 'number') hr.push(d.heartRate);
    if (typeof d.restingHeartRate === 'number') hrResting.push(d.restingHeartRate);
    if (d.bloodPressure) {
      if (typeof d.bloodPressure.systolic === 'number') sys.push(d.bloodPressure.systolic);
      if (typeof d.bloodPressure.diastolic === 'number') dia.push(d.bloodPressure.diastolic);
    }
    if (typeof d.glucose === 'number') glu.push(d.glucose);
    if (typeof d.steps === 'number') stepsTotal += d.steps;
    if (typeof d.sleepMinutes === 'number') sleepTotal += d.sleepMinutes;
    if (typeof d.hrv === 'number') hrvVals.push(d.hrv);
  }

  const hrS = stats(hr);
  if (hrS) {
    summary.heartRate = { ...hrS, unit: 'bpm' };
    if (hrResting.length) summary.heartRate.resting = stats(hrResting).avg;
  }
  const sysS = stats(sys);
  const diaS = stats(dia);
  if (sysS || diaS) {
    summary.bloodPressure = {
      systolicMin: sysS ? sysS.min : undefined,
      systolicMax: sysS ? sysS.max : undefined,
      diastolicMin: diaS ? diaS.min : undefined,
      diastolicMax: diaS ? diaS.max : undefined,
      unit: 'mmHg'
    };
  }
  const gluS = stats(glu);
  if (gluS) summary.glucose = { ...gluS, unit: 'mg/dL' };
  if (stepsTotal > 0) summary.steps = stepsTotal;
  if (sleepTotal > 0) summary.sleepMinutes = sleepTotal;
  const hrvS = stats(hrvVals);
  if (hrvS) summary.hrv = { avg: hrvS.avg, unit: 'ms' };

  return summary;
}

/**
 * 简单规则：超出阈值则记为异常（可选）
 */
function buildAnomalies(dataPoints, summary) {
  const anomalies = [];
  const seen = new Set();
  for (const p of dataPoints) {
    const d = p.data || {};
    const ts = p.timestamp ? new Date(p.timestamp).toISOString() : undefined;
    if (typeof d.heartRate === 'number') {
      if (d.heartRate > 120 || d.heartRate < 40) {
        const key = `hr-${d.heartRate}-${ts}`;
        if (!seen.has(key)) {
          seen.add(key);
          anomalies.push({
            metric: 'heartRate',
            value: d.heartRate,
            at: ts,
            severity: d.heartRate > 120 || d.heartRate < 50 ? 'medium' : 'low',
            description: d.heartRate > 120 ? '心率偏高' : '心率偏低'
          });
        }
      }
    }
    if (d.bloodPressure && typeof d.bloodPressure.systolic === 'number' && d.bloodPressure.systolic > 180) {
      const key = `bp-${ts}`;
      if (!seen.has(key)) {
        seen.add(key);
        anomalies.push({
          metric: 'bloodPressure',
          value: d.bloodPressure.systolic,
          at: ts,
          severity: 'high',
          description: '收缩压偏高'
        });
      }
    }
  }
  return anomalies;
}

/**
 * 执行聚合并写入 vitals_daily 子集合
 * @param {string} userId - personalHealthRecords 文档 ID（与 userEmail 一致）
 * @param {string} date - YYYY-MM-DD
 * @returns {Promise<{ success: boolean, pointsUsed?: number, error?: string }>}
 */
async function run(userId, date) {
  try {
    const dataPoints = await fetchDataPointsForDay(userId, date);
    const summary = aggregateSummary(dataPoints);
    const anomalies = buildAnomalies(dataPoints, summary);
    const payload = {
      userId,
      date,
      source: 'aggregated',
      summary,
      anomalies,
      trend: null,
      updatedAt: new Date()
    };
    await repositories.vitalsDailyRepo.upsertVitalsDaily(userId, date, payload);
    return { success: true, pointsUsed: dataPoints.length };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

module.exports = {
  run,
  fetchDataPointsForDay,
  aggregateSummary,
  buildAnomalies,
  getDayBounds
};
