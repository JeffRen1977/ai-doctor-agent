/**
 * Unit tests: Conversation (legacy) Firebase Adapter
 * See docs/data-format/REPOSITORY_EXPANSION_DESIGN.md §3.8
 */

const mockGetDocs = jest.fn();
jest.mock('../../config/firebase', () => ({ db: {} }));
jest.mock('firebase/firestore', () => ({
  collection: jest.fn((db, col) => ({ _col: col })),
  getDocs: (...args) => mockGetDocs(...args),
  query: jest.fn(() => ({})),
  where: jest.fn(() => ({})),
  orderBy: jest.fn(() => ({})),
  limit: jest.fn(() => ({}))
}));

const { getActiveConversationsByUser, docToConversation } = require('./conversationAdapter');

beforeEach(() => {
  mockGetDocs.mockReset();
});

describe('getActiveConversationsByUser', () => {
  test('returns conversations from snapshot with updatedAt as ISO string', async () => {
    const ts = { toDate: () => new Date('2025-01-01T12:00:00.000Z') };
    mockGetDocs.mockResolvedValue({
      docs: [
        { id: 'conv_1', data: () => ({ userEmail: 'u@e.com', updatedAt: ts, summary: 'Talk about health' }) }
      ]
    });
    const result = await getActiveConversationsByUser('u@e.com', 5);
    expect(result).toHaveLength(1);
    expect(result[0].conversationId).toBe('conv_1');
    expect(result[0].updatedAt).toBe('2025-01-01T12:00:00.000Z');
  });

  test('on failed-precondition uses fallback and sorts by updatedAt', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    mockGetDocs
      .mockRejectedValueOnce({ code: 'failed-precondition' })
      .mockResolvedValueOnce({
        docs: [
          { id: 'b', data: () => ({ userEmail: 'u@e.com', updatedAt: '2025-01-02T00:00:00.000Z' }) },
          { id: 'a', data: () => ({ userEmail: 'u@e.com', updatedAt: '2025-01-01T00:00:00.000Z' }) }
        ]
      });
    const result = await getActiveConversationsByUser('u@e.com', 3);
    expect(result).toHaveLength(2);
    expect(result[0].conversationId).toBe('b');
    expect(result[0].updatedAt).toBe('2025-01-02T00:00:00.000Z');
    warnSpy.mockRestore();
  });
});

describe('docToConversation', () => {
  test('converts Timestamp to ISO string', () => {
    const docSnap = {
      id: 'x',
      data: () => ({ updatedAt: { toDate: () => new Date('2025-02-01T00:00:00.000Z') } })
    };
    const out = docToConversation(docSnap);
    expect(out.updatedAt).toBe('2025-02-01T00:00:00.000Z');
  });
});
