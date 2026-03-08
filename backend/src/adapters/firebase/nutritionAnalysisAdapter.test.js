/**
 * Unit tests: NutritionAnalysis Firebase Adapter
 * See docs/data-format/REPOSITORY_EXPANSION_DESIGN.md §3.3
 */

const mockAddDoc = jest.fn();
jest.mock('../../config/firebase', () => ({ db: {} }));
jest.mock('firebase/firestore', () => ({
  collection: jest.fn((db, col) => ({ _col: col })),
  addDoc: (...args) => mockAddDoc(...args)
}));

const { addNutritionAnalysis } = require('./nutritionAnalysisAdapter');

beforeEach(() => {
  mockAddDoc.mockReset();
});

describe('addNutritionAnalysis', () => {
  test('calls addDoc with userEmail, nutrition, feedback, timestamp and returns id + payload', async () => {
    mockAddDoc.mockResolvedValue({ id: 'doc_abc123' });
    const result = await addNutritionAnalysis({
      userEmail: 'u@e.com',
      nutrition: { foods: [], calories: 500 },
      feedback: { status: 'ok' }
    });
    expect(mockAddDoc).toHaveBeenCalledTimes(1);
    const [ref, payload] = mockAddDoc.mock.calls[0];
    expect(ref._col).toBe('nutritionAnalyses');
    expect(payload.userEmail).toBe('u@e.com');
    expect(payload.nutrition).toEqual({ foods: [], calories: 500 });
    expect(payload.feedback).toEqual({ status: 'ok' });
    expect(typeof payload.timestamp).toBe('string');
    expect(result.id).toBe('doc_abc123');
    expect(result.userEmail).toBe('u@e.com');
    expect(result.nutrition).toEqual(payload.nutrition);
  });

  test('fills default timestamp when not provided', async () => {
    mockAddDoc.mockResolvedValue({ id: 'x' });
    await addNutritionAnalysis({ userEmail: 'a@b.com', nutrition: {} });
    const payload = mockAddDoc.mock.calls[0][1];
    expect(payload.timestamp).toBeDefined();
    expect(payload.feedback).toEqual({});
  });
});
