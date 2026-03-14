const mockInsertOne = jest.fn();
jest.mock('./connection', () => ({
  getCollection: jest.fn(() => ({ insertOne: mockInsertOne }))
}));

const { addNutritionAnalysis } = require('./nutritionAnalysisAdapter');

beforeEach(() => {
  mockInsertOne.mockReset();
});

describe('addNutritionAnalysis', () => {
  it('inserts and returns { id, userEmail, nutrition, feedback, timestamp }', async () => {
    mockInsertOne.mockResolvedValue({ insertedId: { toString: () => 'na123' } });
    const result = await addNutritionAnalysis({
      userEmail: 'u@e.com',
      nutrition: { calories: 500 },
      feedback: {}
    });
    expect(mockInsertOne).toHaveBeenCalledWith(expect.objectContaining({
      userEmail: 'u@e.com',
      nutrition: { calories: 500 },
      feedback: {}
    }));
    expect(result.id).toBe('na123');
    expect(result.userEmail).toBe('u@e.com');
    expect(result.timestamp).toBeDefined();
  });
});
