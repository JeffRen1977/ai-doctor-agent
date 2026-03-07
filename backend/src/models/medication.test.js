/**
 * Unit tests: Medication (colocated with source)
 * See docs/data-format/IMPLEMENTATION_STEPS_DETAILED.md Step 0.4
 */

const { validateMedication, normalizeMedicationFromLegacy } = require('./medication');

describe('Medication', () => {
  test('合法对象，status=active 通过', () => {
    const data = {
      id: 'med_1',
      name: '阿司匹林',
      status: 'active',
      dosage: '100mg',
      frequency: '每日一次'
    };
    const result = validateMedication(data);
    expect(result.error).toBeUndefined();
    expect(result.value.status).toBe('active');
  });

  test('status 为 invalid 时不通过', () => {
    const data = { id: 'med_1', name: '阿司匹林', status: 'invalid' };
    const result = validateMedication(data);
    expect(result.error).toBeDefined();
  });

  test('status 为 paused、stopped 均通过', () => {
    expect(validateMedication({ id: 'm1', name: 'A', status: 'paused' }).error).toBeUndefined();
    expect(validateMedication({ id: 'm2', name: 'B', status: 'stopped' }).error).toBeUndefined();
  });

  test('normalizeMedicationFromLegacy 将 completed 映射为 stopped', () => {
    const legacy = { id: 'm1', name: 'X', status: 'completed' };
    const normalized = normalizeMedicationFromLegacy(legacy);
    expect(normalized.status).toBe('stopped');
  });

  test('normalizeMedicationFromLegacy 将 discontinued 映射为 stopped', () => {
    const legacy = { id: 'm2', name: 'Y', status: 'discontinued' };
    const normalized = normalizeMedicationFromLegacy(legacy);
    expect(normalized.status).toBe('stopped');
  });

  test('与现有 medications 集合单条形状兼容：经 normalize 后通过', () => {
    const legacyItem = {
      id: 'med_1',
      name: 'Metformin',
      dosage: '500mg',
      frequency: '每日两次',
      time: ['08:00', '20:00'],
      startDate: '2024-01-01',
      status: 'active'
    };
    const result = validateMedication(normalizeMedicationFromLegacy(legacyItem));
    expect(result.error).toBeUndefined();
  });
});
