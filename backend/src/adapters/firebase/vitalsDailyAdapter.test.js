/**
 * Unit tests: VitalsDaily Firebase Adapter (colocated with source)
 */

const mockGetDoc = jest.fn();
const mockSetDoc = jest.fn();
jest.mock('../../config/firebase', () => ({ db: {} }));
jest.mock('firebase/firestore', () => ({
  doc: jest.fn((db, c, id, sub, dateId) => ({ _c: c, _id: id, _sub: sub, _dateId: dateId })),
  getDoc: (...args) => mockGetDoc(...args),
  setDoc: (...args) => mockSetDoc(...args)
}));

const { getVitalsDaily, upsertVitalsDaily } = require('./vitalsDailyAdapter');

beforeEach(() => {
  mockGetDoc.mockReset();
  mockSetDoc.mockReset();
});

describe('getVitalsDaily', () => {
  test('无文档时返回 null', async () => {
    mockGetDoc.mockResolvedValue({ exists: () => false });
    const result = await getVitalsDaily('user_1', '2025-02-08');
    expect(result).toBeNull();
  });

  test('有文档时返回 VitalsDaily 形态并通过校验', async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        date: '2025-02-08',
        source: 'wearable',
        summary: { heartRate: { min: 60, max: 100, avg: 75 }, steps: 5000 }
      })
    });
    const result = await getVitalsDaily('user_1', '2025-02-08');
    expect(result).not.toBeNull();
    expect(result.date).toBe('2025-02-08');
    expect(result.source).toBe('wearable');
    expect(result.summary.heartRate.avg).toBe(75);
    expect(result.summary.steps).toBe(5000);
  });
});

describe('upsertVitalsDaily', () => {
  test('同一 user+date 调用两次不同 payload 最终只保留最后一次（幂等）', async () => {
    mockSetDoc.mockResolvedValue(undefined);
    await upsertVitalsDaily('user_1', '2025-02-08', {
      date: '2025-02-08',
      source: 'aggregated',
      summary: { steps: 3000 }
    });
    expect(mockSetDoc).toHaveBeenCalledTimes(1);
    const firstCall = mockSetDoc.mock.calls[0][1];
    expect(firstCall.summary.steps).toBe(3000);

    await upsertVitalsDaily('user_1', '2025-02-08', {
      date: '2025-02-08',
      source: 'aggregated',
      summary: { steps: 6000, heartRate: { min: 55, max: 95, avg: 72 } }
    });
    expect(mockSetDoc).toHaveBeenCalledTimes(2);
    const secondCall = mockSetDoc.mock.calls[1][1];
    expect(secondCall.summary.steps).toBe(6000);
    expect(secondCall.summary.heartRate.avg).toBe(72);
    expect(mockSetDoc).toHaveBeenCalledWith(expect.anything(), expect.anything(), { merge: true });
  });
});
