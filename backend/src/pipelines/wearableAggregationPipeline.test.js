/**
 * Unit tests: WearableAggregationPipeline (colocated with source)
 */

const mockGetDocs = jest.fn();
const mockUpsert = jest.fn();
jest.mock('../config/firebase', () => ({ db: {} }));
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(() => ({ _col: 'wearableStreamData' })),
  query: jest.fn(() => ({ _q: true })),
  where: jest.fn(() => {}),
  getDocs: (...args) => mockGetDocs(...args)
}));
jest.mock('../repositories', () => ({
  vitalsDailyRepo: {
    upsertVitalsDaily: (...args) => mockUpsert(...args)
  }
}));

const {
  run,
  aggregateSummary,
  buildAnomalies,
  getDayBounds,
  fetchDataPointsForDay
} = require('./wearableAggregationPipeline');

beforeEach(() => {
  mockGetDocs.mockReset();
  mockUpsert.mockReset();
});

describe('getDayBounds', () => {
  test('返回当日 0:00 与 23:59:59.999 时间戳', () => {
    const b = getDayBounds('2025-02-08');
    expect(b).not.toBeNull();
    expect(b.end - b.start).toBe(24 * 60 * 60 * 1000 - 1);
  });
  test('无效日期返回 null', () => {
    expect(getDayBounds('not-a-date')).toBeNull();
  });
});

describe('aggregateSummary', () => {
  test('同 user+date 多条数据点产出 summary 中 min/max/avg 与手算一致', () => {
    const dataPoints = [
      { data: { heartRate: 60, steps: 1000 }, timestamp: '2025-02-08T10:00:00Z' },
      { data: { heartRate: 80, steps: 2000 }, timestamp: '2025-02-08T12:00:00Z' },
      { data: { heartRate: 100, steps: 500 }, timestamp: '2025-02-08T14:00:00Z' }
    ];
    const summary = aggregateSummary(dataPoints);
    expect(summary.heartRate).toEqual({ min: 60, max: 100, avg: 80, unit: 'bpm' });
    expect(summary.steps).toBe(3500);
  });
  test('无有效数值时对应 summary 键不存在', () => {
    const summary = aggregateSummary([{ data: {} }]);
    expect(summary.heartRate).toBeUndefined();
    expect(summary.steps).toBeUndefined();
  });
});

describe('buildAnomalies', () => {
  test('存在异常点时 anomalies 非空', () => {
    const dataPoints = [
      { data: { heartRate: 130 }, timestamp: '2025-02-08T10:00:00Z' },
      { data: { heartRate: 75 }, timestamp: '2025-02-08T11:00:00Z' }
    ];
    const anomalies = buildAnomalies(dataPoints, {});
    expect(anomalies.length).toBeGreaterThan(0);
    expect(anomalies.some((a) => a.metric === 'heartRate' && a.value === 130)).toBe(true);
  });
  test('无异常点时 anomalies 为空', () => {
    const dataPoints = [
      { data: { heartRate: 72 }, timestamp: '2025-02-08T10:00:00Z' }
    ];
    const anomalies = buildAnomalies(dataPoints, {});
    expect(anomalies).toHaveLength(0);
  });
});

describe('run', () => {
  test('给定 wearableStreamData fixture，调用 upsertVitalsDaily 且 summary 正确', async () => {
    const docs = [
          { id: '1', data: () => ({ userEmail: 'user_1', data: { heartRate: 70, steps: 2000 }, timestamp: '2025-02-08T12:00:00.000Z' }) },
          { id: '2', data: () => ({ userEmail: 'user_1', data: { heartRate: 90, steps: 3000 }, timestamp: '2025-02-08T14:00:00.000Z' }) }
        ];
    mockGetDocs.mockResolvedValue({
      forEach: (fn) => docs.forEach((d) => fn(d))
    });
    mockUpsert.mockResolvedValue(undefined);

    const result = await run('user_1', '2025-02-08');
    expect(result.success).toBe(true);
    expect(result.pointsUsed).toBe(2);
    expect(mockUpsert).toHaveBeenCalledTimes(1);
    const [userId, date, payload] = mockUpsert.mock.calls[0];
    expect(userId).toBe('user_1');
    expect(date).toBe('2025-02-08');
    expect(payload.source).toBe('aggregated');
    expect(payload.summary.heartRate.min).toBe(70);
    expect(payload.summary.heartRate.max).toBe(90);
    expect(payload.summary.steps).toBe(5000);
  });
});
