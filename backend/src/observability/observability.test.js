/**
 * 单元测试：可观测性基础设施
 * 重点：日志脱敏必须生效；requestId 必须贯穿异步调用链；错误指纹必须稳定。
 */

describe('logger 脱敏', () => {
  it('抹掉凭据与病历内容，保留可检索的业务字段', () => {
    jest.resetModules();
    process.env.NODE_ENV = 'production';
    const { REDACT_PATHS } = require('./logger');

    // 凭据
    expect(REDACT_PATHS).toContain('password');
    expect(REDACT_PATHS).toContain('*.accessToken');
    expect(REDACT_PATHS).toContain('req.headers.authorization');
    // 医疗内容：日志里不该出现，它们属于审计表
    expect(REDACT_PATHS).toContain('*.healthData');
    expect(REDACT_PATHS).toContain('*.prompt');
    expect(REDACT_PATHS).toContain('*.aiResponse');
  });
});

describe('requestContext', () => {
  it('把上下文透传到异步调用栈深处', async () => {
    jest.resetModules();
    const { runWithContext, getContext } = require('./requestContext');

    async function deeplyNested() {
      await new Promise((r) => setImmediate(r));
      return getContext();
    }

    const result = await runWithContext({ requestId: 'req-1', userId: 'u1' }, async () => {
      await new Promise((r) => setImmediate(r));
      return deeplyNested();
    });

    expect(result.requestId).toBe('req-1');
    expect(result.userId).toBe('u1');
  });

  it('隔离并发请求的上下文', async () => {
    jest.resetModules();
    const { runWithContext, getContext } = require('./requestContext');

    const [a, b] = await Promise.all([
      runWithContext({ requestId: 'A' }, async () => {
        await new Promise((r) => setTimeout(r, 10));
        return getContext().requestId;
      }),
      runWithContext({ requestId: 'B' }, async () => getContext().requestId)
    ]);

    expect(a).toBe('A');
    expect(b).toBe('B');
  });

  it('请求外读取时返回空对象而不是抛错', () => {
    jest.resetModules();
    const { getContext } = require('./requestContext');
    expect(getContext()).toEqual({});
  });

  it('生成的 requestId 唯一', () => {
    jest.resetModules();
    const { newRequestId } = require('./requestContext');
    const ids = new Set(Array.from({ length: 500 }, () => newRequestId()));
    expect(ids.size).toBe(500);
  });
});

describe('errorReporter', () => {
  it('同一处代码的同类错误指纹稳定，不同处不同', () => {
    jest.resetModules();
    const { fingerprintOf } = require('./errorReporter');

    function throwHere() { return new Error('boom'); }
    function throwThere() { return new TypeError('boom'); }

    const a = fingerprintOf(throwHere());
    const b = fingerprintOf(throwHere());
    const c = fingerprintOf(throwThere());

    expect(a).toBe(b);          // 可聚合
    expect(a).not.toBe(c);      // 不同错误类型不会混为一谈
    expect(a).toHaveLength(12);
  });

  it('对没有堆栈的异常也能生成指纹', () => {
    jest.resetModules();
    const { fingerprintOf } = require('./errorReporter');
    expect(fingerprintOf({ name: 'Weird' })).toHaveLength(12);
    expect(fingerprintOf(null)).toHaveLength(12);
  });
});
