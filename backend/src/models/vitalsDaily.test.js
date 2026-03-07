/**
 * Unit tests: VitalsDaily (colocated with source)
 * See docs/data-format/IMPLEMENTATION_STEPS_DETAILED.md Step 0.4
 */

const { validateVitalsDaily } = require('./vitalsDaily');

describe('VitalsDaily', () => {
  test('合法 summary 与 anomalies 结构通过', () => {
    const data = {
      date: '2025-02-08',
      source: 'wearable',
      summary: { heartRate: { min: 60, max: 100, avg: 75 }, steps: 5000 },
      anomalies: [{ metric: 'heartRate', severity: 'low', description: '偶发早搏' }]
    };
    const result = validateVitalsDaily(data);
    expect(result.error).toBeUndefined();
    expect(result.value.summary.steps).toBe(5000);
    expect(result.value.anomalies).toHaveLength(1);
  });

  test('source 为 wearable|manual|ehr|aggregated 通过', () => {
    ['wearable', 'manual', 'ehr', 'aggregated'].forEach(source => {
      const result = validateVitalsDaily({ date: '2025-02-08', source });
      expect(result.error).toBeUndefined();
    });
  });
});
