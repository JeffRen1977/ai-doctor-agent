/**
 * 单元测试：审计服务
 * 重点：审计写入失败绝不能影响主流程；内容留痕分级正确；哈希始终保留。
 */

const mockAppendEvent = jest.fn();
const mockListBySubject = jest.fn();
const mockListByRequestId = jest.fn();

jest.mock('../repositories', () => ({
  auditEventRepo: {
    appendEvent: (...args) => mockAppendEvent(...args),
    listBySubject: (...args) => mockListBySubject(...args),
    listByRequestId: (...args) => mockListByRequestId(...args)
  }
}));

const mockLoggerError = jest.fn();
jest.mock('../observability/logger', () => ({
  error: (...args) => mockLoggerError(...args),
  warn: jest.fn(),
  info: jest.fn()
}));


describe('auditService', () => {
  let auditService;
  const originalCapture = process.env.AUDIT_CAPTURE;

  beforeEach(() => {
    jest.resetModules();
    mockAppendEvent.mockReset().mockResolvedValue({ id: 'evt_1' });
    mockLoggerError.mockReset();
    auditService = require('./auditService');
  });

  afterEach(() => {
    if (originalCapture === undefined) delete process.env.AUDIT_CAPTURE;
    else process.env.AUDIT_CAPTURE = originalCapture;
  });

  it('records an AI decision with both digests and a summary', async () => {
    const res = await auditService.recordAiDecision({
      operation: 'analyzeHealthRecords',
      provider: 'gemini',
      model: 'gemini-2.5-flash',
      input: { glucose: 3.2 },
      output: { hasAnomaly: true },
      latencyMs: 1234,
      success: true,
      subjectEmail: 'patient@example.com'
    });

    expect(res.recorded).toBe(true);
    const saved = mockAppendEvent.mock.calls[0][0];
    expect(saved.action).toBe('ai.decision');
    expect(saved.provider).toBe('gemini');
    expect(saved.subjectEmail).toBe('patient@example.com');
    expect(saved.inputDigest).toMatch(/^[a-f0-9]{64}$/);
    expect(saved.outputDigest).toMatch(/^[a-f0-9]{64}$/);
    expect(saved.outputSummary).toContain('hasAnomaly');
  });

  it('never throws when the audit write fails, and logs the full event for recovery', async () => {
    mockAppendEvent.mockRejectedValue(new Error('firestore unavailable'));

    const res = await auditService.recordAiDecision({
      operation: 'analyzeHealthRecords',
      provider: 'gemini',
      input: 'x',
      output: 'y',
      success: true
    });

    expect(res.recorded).toBe(false);
    // 落库失败时，完整事件必须出现在日志里，否则这条记录就彻底丢了
    const logged = mockLoggerError.mock.calls[0][0];
    expect(logged.event).toBe('audit_write_failed');
    expect(logged.auditEvent.inputDigest).toMatch(/^[a-f0-9]{64}$/);
  });

  it('keeps digests but drops content in digest mode', async () => {
    process.env.AUDIT_CAPTURE = 'digest';
    jest.resetModules();
    auditService = require('./auditService');

    await auditService.recordAiDecision({ operation: 'op', input: 'secret vitals', output: 'diagnosis', success: true });

    const saved = mockAppendEvent.mock.calls[0][0];
    expect(saved.inputSummary).toBeNull();
    expect(saved.outputSummary).toBeNull();
    expect(saved.inputDigest).toMatch(/^[a-f0-9]{64}$/); // 哈希仍在，可证明内容未被篡改
  });

  it('truncates long content in summary mode', async () => {
    process.env.AUDIT_CAPTURE = 'summary';
    process.env.AUDIT_SUMMARY_MAX_CHARS = '50';
    jest.resetModules();
    auditService = require('./auditService');

    await auditService.recordAiDecision({ operation: 'op', input: 'a'.repeat(500), output: 'ok', success: true });

    const saved = mockAppendEvent.mock.calls[0][0];
    expect(saved.inputSummary).toContain('truncated');
    expect(saved.inputSummary.length).toBeLessThan(200);
    delete process.env.AUDIT_SUMMARY_MAX_CHARS;
  });

  it('inherits requestId from the ambient request context', async () => {
    // 必须从 resetModules 之后的同一份模块注册表取，否则拿到的是另一个
    // AsyncLocalStorage 实例，上下文自然读不到。
    const { runWithContext } = require('../observability/requestContext');
    await runWithContext({ requestId: 'req-abc', userId: 'u1' }, async () => {
      await auditService.recordAiDecision({ operation: 'op', input: 'i', output: 'o', success: true });
    });

    const saved = mockAppendEvent.mock.calls[0][0];
    expect(saved.requestId).toBe('req-abc');
    expect(saved.actorId).toBe('u1');
  });

  it('records a suppressed alert with the reason it was dropped', async () => {
    await auditService.recordAlert('suppressed', {
      operation: 'riskMonitoring.detectAnomalies',
      subjectEmail: 'patient@example.com',
      alert: { type: 'hypoglycemia', confidence: 0.4 },
      severity: 'high',
      reason: 'confidence_below_threshold(0.6)'
    });

    const saved = mockAppendEvent.mock.calls[0][0];
    expect(saved.action).toBe('alert.suppressed');
    expect(saved.metadata.reason).toBe('confidence_below_threshold(0.6)');
    expect(saved.outputSummary).toContain('hypoglycemia');
  });

  it('rejects an event with an unknown action instead of silently storing it', async () => {
    const res = await auditService.append({ action: 'bogus.action', success: true });
    expect(res.recorded).toBe(false);
    expect(mockAppendEvent).not.toHaveBeenCalled();
  });
});
