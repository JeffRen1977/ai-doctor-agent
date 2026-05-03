const { collectUserEmails, sanitizeUserId } = require('./dailyReportCronService');

describe('dailyReportCronService helpers', () => {
  test('sanitizeUserId normalizes email', () => {
    expect(sanitizeUserId('User+tag@Example.com')).toBe('user_tag@example.com');
  });

  test('collectUserEmails prefers body list', () => {
    const prev = process.env.CRON_DAILY_REPORT_USER_EMAILS;
    process.env.CRON_DAILY_REPORT_USER_EMAILS = 'legacy@x.com';
    const emails = collectUserEmails({ userEmails: ['A@b.com', 'not-an-email', 'c@d.com'] });
    expect(emails).toEqual(['a@b.com', 'c@d.com']);
    process.env.CRON_DAILY_REPORT_USER_EMAILS = prev;
  });

  test('collectUserEmails falls back to env', () => {
    const prev = process.env.CRON_DAILY_REPORT_USER_EMAILS;
    process.env.CRON_DAILY_REPORT_USER_EMAILS = ' one@x.com , two@y.com ';
    expect(collectUserEmails({})).toEqual(['one@x.com', 'two@y.com']);
    process.env.CRON_DAILY_REPORT_USER_EMAILS = prev;
  });
});
