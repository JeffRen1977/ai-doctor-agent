export class TraceRecorder {
  constructor({ AgentTrace, logger } = {}) {
    this.AgentTrace = AgentTrace;
    this.logger = logger;
  }

  buildTrace({ userId, sessionId, skill, userMessage, result, latencyMs }) {
    const steps = (result.steps || []).map((s, i) => ({
      stepIndex: i,
      text: s.text || '',
      toolCalls: (s.toolCalls || []).map((tc) => ({
        toolName: tc.toolName,
        args: tc.args,
      })),
      toolResults: (s.toolResults || []).map((tr) => ({
        toolName: tr.toolName,
        result: typeof tr.result === 'string'
          ? tr.result.slice(0, 2000)
          : JSON.stringify(tr.result).slice(0, 2000),
      })),
      tokenUsage: s.usage || {},
    }));

    return {
      userId,
      sessionId,
      skill,
      userMessage,
      steps,
      finalAnswer: result.text || '',
      totalSteps: steps.length,
      totalTokens: result.usage || {},
      latencyMs,
    };
  }

  async record(params) {
    try {
      const doc = this.buildTrace(params);
      await this.AgentTrace.create(doc);
      return doc;
    } catch (err) {
      this.logger.error({ err: { message: err?.message } }, 'TraceRecorder.record failed');
      return null;
    }
  }
}
