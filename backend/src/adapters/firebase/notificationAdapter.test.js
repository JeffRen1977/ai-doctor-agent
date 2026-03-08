/**
 * Unit tests: Notification Firebase Adapter
 * See docs/data-format/REPOSITORY_EXPANSION_DESIGN.md §3.5
 */

const mockAddDoc = jest.fn();
jest.mock('../../config/firebase', () => ({ db: {} }));
jest.mock('firebase/firestore', () => ({
  collection: jest.fn((db, col) => ({ _col: col })),
  addDoc: (...args) => mockAddDoc(...args)
}));

const { addNotification } = require('./notificationAdapter');

beforeEach(() => {
  mockAddDoc.mockReset();
});

describe('addNotification', () => {
  test('calls addDoc with payload and returns { id, ... }', async () => {
    mockAddDoc.mockResolvedValue({ id: 'notif_abc' });
    const result = await addNotification({
      userEmail: 'u@e.com',
      type: 'risk_alert',
      alertId: 'alert_1',
      title: 'High risk',
      message: 'Check glucose',
      timestamp: new Date().toISOString(),
      read: false
    });
    expect(mockAddDoc).toHaveBeenCalledTimes(1);
    const [ref, payload] = mockAddDoc.mock.calls[0];
    expect(ref._col).toBe('notifications');
    expect(payload.userEmail).toBe('u@e.com');
    expect(payload.type).toBe('risk_alert');
    expect(payload.alertId).toBe('alert_1');
    expect(payload.read).toBe(false);
    expect(result.id).toBe('notif_abc');
    expect(result.title).toBe('High risk');
  });

  test('fills default timestamp and read when not provided', async () => {
    mockAddDoc.mockResolvedValue({ id: 'x' });
    await addNotification({ userEmail: 'a@b.com', type: 'risk_alert' });
    const payload = mockAddDoc.mock.calls[0][1];
    expect(payload.timestamp).toBeDefined();
    expect(payload.read).toBe(false);
  });
});
