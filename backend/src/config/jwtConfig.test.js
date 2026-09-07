/**
 * 单元测试：JWT 密钥快速失败逻辑（backend/src/config/jwtConfig.js）
 * 重点是「缺失/占位/过短的密钥必须抛错」，绝不能静默回退到默认值。
 */

const STRONG_SECRET = 'a'.repeat(64);

describe('jwtConfig', () => {
  const originalSecret = process.env.JWT_SECRET;
  const originalExpiresIn = process.env.JWT_EXPIRES_IN;
  let jwtConfig;

  beforeEach(() => {
    jest.resetModules();
    jwtConfig = require('./jwtConfig');
  });

  afterEach(() => {
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;
    if (originalExpiresIn === undefined) delete process.env.JWT_EXPIRES_IN;
    else process.env.JWT_EXPIRES_IN = originalExpiresIn;
  });

  describe('describeProblem', () => {
    it('rejects a missing or blank secret', () => {
      expect(jwtConfig.describeProblem(undefined)).toMatch(/未配置/);
      expect(jwtConfig.describeProblem('')).toMatch(/未配置/);
      expect(jwtConfig.describeProblem('   ')).toMatch(/未配置/);
    });

    it('rejects the historical hardcoded fallback', () => {
      expect(jwtConfig.describeProblem('your-secret-key')).toMatch(/占位值/);
      expect(jwtConfig.describeProblem('YOUR-SECRET-KEY')).toMatch(/占位值/);
      expect(jwtConfig.describeProblem('your-super-secret-jwt-key-here')).toMatch(/占位值/);
    });

    it('rejects a secret shorter than the minimum length', () => {
      const short = 'x'.repeat(jwtConfig.MIN_SECRET_LENGTH - 1);
      expect(jwtConfig.describeProblem(short)).toMatch(/长度/);
    });

    it('accepts a strong secret', () => {
      expect(jwtConfig.describeProblem(STRONG_SECRET)).toBeNull();
    });
  });

  describe('getJwtSecret / assertJwtSecretConfigured', () => {
    it('throws instead of falling back when JWT_SECRET is unset', () => {
      delete process.env.JWT_SECRET;
      expect(() => jwtConfig.getJwtSecret()).toThrow(/JWT_SECRET 未配置/);
      expect(() => jwtConfig.assertJwtSecretConfigured()).toThrow(/JWT_SECRET 未配置/);
    });

    it('throws when JWT_SECRET is the public placeholder', () => {
      process.env.JWT_SECRET = 'your-secret-key';
      expect(() => jwtConfig.assertJwtSecretConfigured()).toThrow(/占位值/);
    });

    it('returns the configured secret when it is strong', () => {
      process.env.JWT_SECRET = STRONG_SECRET;
      expect(jwtConfig.getJwtSecret()).toBe(STRONG_SECRET);
      expect(() => jwtConfig.assertJwtSecretConfigured()).not.toThrow();
    });
  });

  describe('signAuthToken / verifyAuthToken', () => {
    it('round-trips a payload with the configured secret', () => {
      process.env.JWT_SECRET = STRONG_SECRET;
      const token = jwtConfig.signAuthToken({ userId: 'u1', email: 'a@b.com' });
      const decoded = jwtConfig.verifyAuthToken(token);
      expect(decoded.userId).toBe('u1');
      expect(decoded.email).toBe('a@b.com');
      expect(decoded.exp).toBeGreaterThan(decoded.iat);
    });

    it('rejects a token forged with the old hardcoded secret', () => {
      process.env.JWT_SECRET = STRONG_SECRET;
      const forged = require('jsonwebtoken').sign({ userId: 'attacker' }, 'your-secret-key');
      expect(() => jwtConfig.verifyAuthToken(forged)).toThrow();
    });

    it('refuses to sign at all when the secret is unusable', () => {
      delete process.env.JWT_SECRET;
      expect(() => jwtConfig.signAuthToken({ userId: 'u1' })).toThrow(/JWT_SECRET/);
    });

    it('honours JWT_EXPIRES_IN', () => {
      process.env.JWT_SECRET = STRONG_SECRET;
      process.env.JWT_EXPIRES_IN = '15m';
      const decoded = jwtConfig.verifyAuthToken(jwtConfig.signAuthToken({ userId: 'u1' }));
      expect(decoded.exp - decoded.iat).toBe(15 * 60);
    });
  });

  describe('verifyAuthTokenAllowExpired', () => {
    it('accepts a token that expired inside the grace window', () => {
      process.env.JWT_SECRET = STRONG_SECRET;
      process.env.JWT_EXPIRES_IN = '7d';
      const jwt = require('jsonwebtoken');
      const now = Math.floor(Date.now() / 1000);
      const token = jwt.sign(
        { userId: 'u1', email: 'a@b.com', iat: now - 120, exp: now - 60 },
        STRONG_SECRET
      );
      const decoded = jwtConfig.verifyAuthTokenAllowExpired(token);
      expect(decoded.userId).toBe('u1');
    });

    it('rejects a token expired beyond the grace window', () => {
      process.env.JWT_SECRET = STRONG_SECRET;
      process.env.JWT_EXPIRES_IN = '7d';
      const jwt = require('jsonwebtoken');
      const now = Math.floor(Date.now() / 1000);
      const eightDays = 8 * 24 * 3600;
      const token = jwt.sign(
        { userId: 'u1', iat: now - eightDays - 60, exp: now - eightDays },
        STRONG_SECRET
      );
      expect(() => jwtConfig.verifyAuthTokenAllowExpired(token)).toThrow(/refresh window/);
    });

    it('rejects a token signed with the wrong secret', () => {
      process.env.JWT_SECRET = STRONG_SECRET;
      const jwt = require('jsonwebtoken');
      const forged = jwt.sign({ userId: 'u1' }, 'totally-different-secret-value-000000000000');
      expect(() => jwtConfig.verifyAuthTokenAllowExpired(forged)).toThrow();
    });
  });
});
