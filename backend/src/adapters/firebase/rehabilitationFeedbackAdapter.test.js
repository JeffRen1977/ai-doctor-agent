/**
 * Unit tests: RehabilitationFeedback Firebase Adapter
 * See docs/data-format/REPOSITORY_EXPANSION_DESIGN.md §3.7
 */

const mockAddDoc = jest.fn();
jest.mock('../../config/firebase', () => ({ db: {} }));
jest.mock('firebase/firestore', () => ({
  collection: jest.fn((db, col) => ({ _col: col })),
  addDoc: (...args) => mockAddDoc(...args)
}));

const { addRehabilitationFeedback } = require('./rehabilitationFeedbackAdapter');

beforeEach(() => {
  mockAddDoc.mockReset();
});

describe('addRehabilitationFeedback', () => {
  test('calls addDoc and returns { id, ... }', async () => {
    mockAddDoc.mockResolvedValue({ id: 'fb_abc' });
    const result = await addRehabilitationFeedback({
      recordId: 'rehab_1',
      userEmail: 'u@e.com',
      effectiveness: 5,
      helpful: true,
      comments: 'Great',
      timestamp: new Date().toISOString()
    });
    expect(mockAddDoc).toHaveBeenCalledTimes(1);
    const payload = mockAddDoc.mock.calls[0][1];
    expect(payload.recordId).toBe('rehab_1');
    expect(payload.effectiveness).toBe(5);
    expect(result.id).toBe('fb_abc');
  });
});
