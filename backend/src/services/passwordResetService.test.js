jest.mock('../config/firebase', () => ({ auth: { __fake: true } }));

const mockSendPasswordResetEmail = jest.fn();
jest.mock('firebase/auth', () => ({
  sendPasswordResetEmail: (...args) => mockSendPasswordResetEmail(...args)
}));

const mockGetByEmail = jest.fn();
const mockUpdateByEmail = jest.fn();
const mockFindByPasswordResetHash = jest.fn();

jest.mock('../repositories', () => ({
  userRepo: {
    getByEmail: (...args) => mockGetByEmail(...args),
    updateByEmail: (...args) => mockUpdateByEmail(...args),
    findByPasswordResetHash: (...args) => mockFindByPasswordResetHash(...args)
  }
}));

const mockSendMail = jest.fn().mockResolvedValue({ sent: false });
jest.mock('./mailer', () => ({
  sendPasswordResetMail: (...args) => mockSendMail(...args)
}));

const bcrypt = require('bcryptjs');
const passwordResetService = require('./passwordResetService');

beforeEach(() => {
  mockGetByEmail.mockReset();
  mockUpdateByEmail.mockReset().mockResolvedValue(undefined);
  mockFindByPasswordResetHash.mockReset();
  mockSendMail.mockClear();
  mockSendPasswordResetEmail.mockReset();
});

describe('requestMongoReset', () => {
  it('does nothing visible when the email is unknown', async () => {
    mockGetByEmail.mockResolvedValue(null);
    const result = await passwordResetService.requestMongoReset('nobody@test.com');
    expect(result.accepted).toBe(true);
    expect(mockUpdateByEmail).not.toHaveBeenCalled();
    expect(mockSendMail).not.toHaveBeenCalled();
  });

  it('stores only a hash and emails the raw token', async () => {
    mockGetByEmail.mockResolvedValue({ email: 'me@test.com', uid: 'u1' });
    await passwordResetService.requestMongoReset('me@test.com');
    expect(mockUpdateByEmail).toHaveBeenCalled();
    const saved = mockUpdateByEmail.mock.calls[0][1];
    expect(saved.passwordResetTokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(mockSendMail).toHaveBeenCalledWith(
      'me@test.com',
      expect.stringContaining('resetToken=')
    );
    const url = mockSendMail.mock.calls[0][1];
    const raw = decodeURIComponent(String(url).split('resetToken=')[1] || '');
    expect(passwordResetService.hashToken(raw)).toBe(saved.passwordResetTokenHash);
  });
});

describe('confirmMongoReset', () => {
  it('rejects an unknown token', async () => {
    mockFindByPasswordResetHash.mockResolvedValue(null);
    const result = await passwordResetService.confirmMongoReset('nope', 'newpassword1');
    expect(result.success).toBe(false);
  });

  it('rejects an expired token', async () => {
    mockFindByPasswordResetHash.mockResolvedValue({
      email: 'me@test.com',
      passwordResetExpiresAt: new Date(Date.now() - 1000).toISOString()
    });
    const result = await passwordResetService.confirmMongoReset('token-value-here', 'newpassword1');
    expect(result.success).toBe(false);
  });

  it('updates the password hash and clears the reset fields', async () => {
    mockFindByPasswordResetHash.mockResolvedValue({
      email: 'me@test.com',
      passwordResetExpiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString()
    });
    const result = await passwordResetService.confirmMongoReset('token-value-here', 'newpassword1');
    expect(result.success).toBe(true);
    const saved = mockUpdateByEmail.mock.calls[0][1];
    expect(saved.passwordResetTokenHash).toBeNull();
    expect(await bcrypt.compare('newpassword1', saved.passwordHash)).toBe(true);
  });
});

describe('requestFirebaseReset', () => {
  it('swallows missing-user errors so callers cannot enumerate accounts', async () => {
    mockSendPasswordResetEmail.mockRejectedValue(new Error('auth/user-not-found'));
    const result = await passwordResetService.requestFirebaseReset('nobody@test.com');
    expect(result.accepted).toBe(true);
  });
});
