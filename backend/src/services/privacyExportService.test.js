jest.mock('../repositories', () => ({
  privacyJobRepo: {},
  consentRepo: {},
  personalHealthRecordRepo: {},
  medicationRepo: {},
  userRepo: {},
  userProfileRepo: {},
  healthRecordRepo: {},
  chatHistoryRepo: {},
  conversationRepo: {},
  reportRepo: {}
}));

jest.mock('./auditService', () => ({
  getSubjectTrail: jest.fn(),
  append: jest.fn(),
  AUDIT_ACTIONS: { ACCOUNT_EXPORTED: 'account.exported' }
}));

jest.mock('../models/auditEvent', () => ({
  AUDIT_ACTIONS: { ACCOUNT_EXPORTED: 'account.exported' }
}));

const { stripSecrets } = require('./privacyExportService');

describe('privacyExportService.stripSecrets', () => {
  it('drops password hashes and reset tokens', () => {
    const out = stripSecrets({
      email: 'a@test.com',
      name: 'A',
      passwordHash: 'secret',
      passwordResetTokenHash: 'tok',
      passwordResetExpiresAt: 'soon',
      fitbitTokens: { access: 'x' }
    });
    expect(out.email).toBe('a@test.com');
    expect(out.passwordHash).toBeUndefined();
    expect(out.passwordResetTokenHash).toBeUndefined();
    expect(out.fitbitTokens).toBeUndefined();
  });
});
