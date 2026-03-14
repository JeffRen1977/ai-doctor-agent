const mockFindOne = jest.fn();
const mockUpdateOne = jest.fn();

jest.mock('./connection', () => ({
  getCollection: jest.fn(() => ({
    findOne: mockFindOne,
    updateOne: mockUpdateOne
  }))
}));

const { getVitalsDaily, upsertVitalsDaily } = require('./vitalsDailyAdapter');

beforeEach(() => {
  mockFindOne.mockReset();
  mockUpdateOne.mockReset();
});

describe('vitalsDailyAdapter', () => {
  it('getVitalsDaily returns null when not found', async () => {
    mockFindOne.mockResolvedValue(null);
    expect(await getVitalsDaily('u1', '2025-02-01')).toBeNull();
  });
  it('upsertVitalsDaily upserts', async () => {
    mockUpdateOne.mockResolvedValue({ acknowledged: true });
    await upsertVitalsDaily('u1', '2025-02-01', {
      userId: 'u1',
      userEmail: 'u@e.com',
      summary: {},
      anomalies: []
    });
    expect(mockUpdateOne).toHaveBeenCalledWith(expect.any(Object), expect.any(Object), { upsert: true });
  });
});
