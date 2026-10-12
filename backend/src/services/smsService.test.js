const mockPutSmsCode = jest.fn();
const mockGetSmsCode = jest.fn();
const mockDeleteSmsCode = jest.fn();
const mockIncrementAttempts = jest.fn();

jest.mock('../repositories', () => ({
  smsCodeRepo: {
    putSmsCode: mockPutSmsCode,
    getSmsCode: mockGetSmsCode,
    deleteSmsCode: mockDeleteSmsCode,
    incrementAttempts: mockIncrementAttempts
  }
}));

jest.mock('../observability/logger', () => ({
  warn: jest.fn(),
  error: jest.fn()
}));

const { sendVerificationCode, verifyCode, generateCode } = require('./smsService');

beforeEach(() => {
  jest.clearAllMocks();
  delete process.env.ALIBABA_SMS_ACCESS_KEY_ID;
  delete process.env.ALIBABA_SMS_ACCESS_KEY_SECRET;
});

describe('generateCode', () => {
  it('returns a 6-digit string', () => {
    const code = generateCode();
    expect(code).toMatch(/^\d{6}$/);
  });
});

describe('sendVerificationCode', () => {
  it('rejects empty phone', async () => {
    const result = await sendVerificationCode('');
    expect(result.success).toBe(false);
    expect(result.error).toContain('手机号');
  });

  it('rejects invalid phone number', async () => {
    const result = await sendVerificationCode('12345');
    expect(result.success).toBe(false);
    expect(result.error).toContain('有效');
  });

  it('stores code and returns success when SMS not configured', async () => {
    mockPutSmsCode.mockResolvedValue(undefined);
    const result = await sendVerificationCode('13812345678');
    expect(result.success).toBe(true);
    expect(result.expiresAt).toBeDefined();
    expect(mockPutSmsCode).toHaveBeenCalledWith(
      '13812345678',
      expect.objectContaining({ code: expect.stringMatching(/^\d{6}$/) })
    );
  });
});

describe('verifyCode', () => {
  it('rejects empty phone or code', async () => {
    expect((await verifyCode('', '123456')).valid).toBe(false);
    expect((await verifyCode('13812345678', '')).valid).toBe(false);
  });

  it('rejects when no stored code (expired)', async () => {
    mockGetSmsCode.mockResolvedValue(null);
    const result = await verifyCode('13812345678', '123456');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('过期');
  });

  it('rejects when max attempts exceeded', async () => {
    mockGetSmsCode.mockResolvedValue({ code: '123456', attempts: 5, expiresAt: new Date(Date.now() + 60000).toISOString() });
    const result = await verifyCode('13812345678', '123456');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('次数过多');
    expect(mockDeleteSmsCode).toHaveBeenCalledWith('13812345678');
  });

  it('rejects wrong code and increments attempts', async () => {
    mockGetSmsCode.mockResolvedValue({ code: '123456', attempts: 2, expiresAt: new Date(Date.now() + 60000).toISOString() });
    const result = await verifyCode('13812345678', '999999');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('验证码错误');
    expect(mockIncrementAttempts).toHaveBeenCalledWith('13812345678');
  });

  it('accepts correct code and deletes it', async () => {
    mockGetSmsCode.mockResolvedValue({ code: '123456', attempts: 0, expiresAt: new Date(Date.now() + 60000).toISOString() });
    const result = await verifyCode('13812345678', '123456');
    expect(result.valid).toBe(true);
    expect(mockDeleteSmsCode).toHaveBeenCalledWith('13812345678');
  });

  it('trims whitespace from user input', async () => {
    mockGetSmsCode.mockResolvedValue({ code: '123456', attempts: 0, expiresAt: new Date(Date.now() + 60000).toISOString() });
    const result = await verifyCode('13812345678', ' 123456 ');
    expect(result.valid).toBe(true);
  });
});
