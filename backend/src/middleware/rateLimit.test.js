/**
 * 单元/集成测试：分级限流（backend/src/middleware/rateLimit.js）
 * 重点验证「超过阈值必须返回 429」以及计数键的隔离性 —— 一个用户被限流不能波及另一个。
 */

const express = require('express');
const request = require('supertest');
const jwtConfig = require('../config/jwtConfig');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'a'.repeat(64);

/** 用给定阈值构造一个隔离的 app，避免各测试共用同一个内存计数桶 */
function buildApp(limiterFactoryEnv, mountFn) {
  jest.resetModules();
  const prev = { ...process.env };
  Object.assign(process.env, limiterFactoryEnv);
  const limiters = require('./rateLimit');
  const app = express();
  app.use(express.json());
  mountFn(app, limiters);
  Object.keys(limiterFactoryEnv).forEach((k) => {
    if (prev[k] === undefined) delete process.env[k];
    else process.env[k] = prev[k];
  });
  return app;
}

function bearer(payload) {
  return `Bearer ${jwtConfig.signAuthToken(payload)}`;
}

describe('rateLimit middleware', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    delete process.env.RATE_LIMIT_DISABLED;
  });

  describe('loginLimiter', () => {
    it('blocks brute force on one account after the failure budget is spent', async () => {
      const app = buildApp({ RATE_LIMIT_LOGIN_MAX: '3' }, (a, l) => {
        a.post('/login', l.loginLimiter, (req, res) => res.status(401).json({ error: 'bad password' }));
      });

      for (let i = 0; i < 3; i++) {
        const res = await request(app).post('/login').send({ email: 'victim@example.com', password: 'guess' });
        expect(res.status).toBe(401);
      }

      const blocked = await request(app).post('/login').send({ email: 'victim@example.com', password: 'guess' });
      expect(blocked.status).toBe(429);
      expect(blocked.body.code).toBe('RATE_LIMITED');
      expect(blocked.headers['retry-after']).toBeDefined();
    });

    it('isolates the budget per account, so one victim does not lock out others', async () => {
      const app = buildApp({ RATE_LIMIT_LOGIN_MAX: '2' }, (a, l) => {
        a.post('/login', l.loginLimiter, (req, res) => res.status(401).json({ error: 'bad password' }));
      });

      for (let i = 0; i < 3; i++) {
        await request(app).post('/login').send({ email: 'victim@example.com', password: 'guess' });
      }

      const other = await request(app).post('/login').send({ email: 'someone-else@example.com', password: 'guess' });
      expect(other.status).toBe(401); // 未被别人的失败次数牵连
    });

    it('does not spend budget on successful logins', async () => {
      const app = buildApp({ RATE_LIMIT_LOGIN_MAX: '2' }, (a, l) => {
        a.post('/login', l.loginLimiter, (req, res) => res.status(200).json({ token: 'ok' }));
      });

      for (let i = 0; i < 6; i++) {
        const res = await request(app).post('/login').send({ email: 'legit@example.com', password: 'right' });
        expect(res.status).toBe(200);
      }
    });
  });

  describe('aiLimiter', () => {
    it('caps expensive POSTs per user', async () => {
      const app = buildApp({ RATE_LIMIT_AI_MAX: '2' }, (a, l) => {
        a.post('/analyze', l.aiLimiter, (req, res) => res.json({ ok: true }));
      });
      const auth = bearer({ userId: 'u1', email: 'u1@example.com' });

      await request(app).post('/analyze').set('Authorization', auth).expect(200);
      await request(app).post('/analyze').set('Authorization', auth).expect(200);
      const blocked = await request(app).post('/analyze').set('Authorization', auth);
      expect(blocked.status).toBe(429);
    });

    it('counts per user, not per IP, so NAT-shared users are not punished together', async () => {
      const app = buildApp({ RATE_LIMIT_AI_MAX: '1' }, (a, l) => {
        a.post('/analyze', l.aiLimiter, (req, res) => res.json({ ok: true }));
      });

      await request(app).post('/analyze').set('Authorization', bearer({ userId: 'u1' })).expect(200);
      await request(app).post('/analyze').set('Authorization', bearer({ userId: 'u1' })).expect(429);
      // 同一测试进程 = 同一 IP，但第二个用户仍应放行
      await request(app).post('/analyze').set('Authorization', bearer({ userId: 'u2' })).expect(200);
    });

    it('lets read-only GETs through without spending the AI budget', async () => {
      const app = buildApp({ RATE_LIMIT_AI_MAX: '1' }, (a, l) => {
        a.get('/summary', l.aiLimiter, (req, res) => res.json({ ok: true }));
      });
      const auth = bearer({ userId: 'u1' });

      for (let i = 0; i < 5; i++) {
        await request(app).get('/summary').set('Authorization', auth).expect(200);
      }
    });

    it('falls back to IP counting for an invalid or forged token', async () => {
      const app = buildApp({ RATE_LIMIT_AI_MAX: '1' }, (a, l) => {
        a.post('/analyze', l.aiLimiter, (req, res) => res.json({ ok: true }));
      });
      // 攻击者每次换一个伪造 token，若按 token 分桶就能无限绕过
      const forged = () => `Bearer ${require('jsonwebtoken').sign({ userId: Math.random() }, 'wrong-secret')}`;

      await request(app).post('/analyze').set('Authorization', forged()).expect(200);
      await request(app).post('/analyze').set('Authorization', forged()).expect(429);
    });
  });

  describe('limitingDisabled', () => {
    it('honours the escape hatch outside production', () => {
      jest.resetModules();
      process.env.NODE_ENV = 'development';
      process.env.RATE_LIMIT_DISABLED = 'true';
      expect(require('./rateLimit').limitingDisabled()).toBe(true);
    });

    it('ignores the escape hatch in production', () => {
      jest.resetModules();
      process.env.NODE_ENV = 'production';
      process.env.RATE_LIMIT_DISABLED = 'true';
      expect(require('./rateLimit').limitingDisabled()).toBe(false);
    });
  });
});
