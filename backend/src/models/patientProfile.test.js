const PatientProfile = require('./patientProfile');

describe('PatientProfile model', () => {
  test('validates required userId', () => {
    const doc = new PatientProfile({});
    const err = doc.validateSync();
    expect(err.errors.userId).toBeDefined();
  });

  test('accepts valid profile', () => {
    const doc = new PatientProfile({
      userId: 'u1',
      conditions: ['diabetes', 'hypertension'],
      allergies: ['penicillin'],
      goals: ['减重5公斤', '血糖控制在7以下'],
    });
    const err = doc.validateSync();
    expect(err).toBeUndefined();
    expect(doc.conditions).toHaveLength(2);
    expect(doc.lastUpdatedBy).toBe('agent');
  });

  test('defaults arrays to empty', () => {
    const doc = new PatientProfile({ userId: 'u1' });
    expect(doc.conditions).toEqual([]);
    expect(doc.allergies).toEqual([]);
    expect(doc.contraindications).toEqual([]);
    expect(doc.goals).toEqual([]);
    expect(doc.concerns).toEqual([]);
  });

  test('rejects invalid lastUpdatedBy enum', () => {
    const doc = new PatientProfile({
      userId: 'u1', lastUpdatedBy: 'invalid',
    });
    const err = doc.validateSync();
    expect(err.errors.lastUpdatedBy).toBeDefined();
  });
});
