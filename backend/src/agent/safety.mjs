import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const _consentService = require('../services/consentService');
const _disclaimerService = require('../services/medicalDisclaimerService');
const _contentModerationService = require('../services/contentModerationService');
const _auditService = require('../services/auditService');
const _logger = require('../observability/logger');

function getAgentProvider() {
  return process.env.AGENT_LLM_PROVIDER === 'dashscope' ? 'dashscope' : 'openai';
}

export function createAgentSafety(deps = {}) {
  const consentService = deps.consentService ?? _consentService;
  const disclaimerService = deps.disclaimerService ?? _disclaimerService;
  const contentModerationService = deps.contentModerationService ?? _contentModerationService;
  const auditService = deps.auditService ?? _auditService;
  const logger = deps.logger ?? _logger;

  return {
    async assertAgentConsent(userEmail) {
      await consentService.assertCanCallAi(userEmail, getAgentProvider());
    },

    async moderateAgentOutput(text, language = 'zh') {
      if (!contentModerationService.isConfigured() || !text) return text;
      try {
        const result = await contentModerationService.moderateHealthContent(text);
        if (!result.safe) {
          logger.warn({ labels: result.labels }, 'Agent output blocked by content moderation');
          return null;
        }
      } catch (err) {
        logger.error({ err: { message: err?.message } }, 'Agent content moderation check failed');
      }
      return text;
    },

    appendDisclaimer(text, language = 'zh') {
      return disclaimerService.wrapResponse(text, 'message', language);
    },

    async recordAgentAudit({ userEmail, message, answer, latencyMs, success, errorMessage, steps }) {
      try {
        await auditService.recordAiDecision({
          operation: 'healthChat',
          provider: getAgentProvider(),
          model: process.env.AGENT_MODEL || 'gpt-4o',
          input: message,
          output: success ? { success: true, message: answer } : null,
          latencyMs,
          success,
          errorMessage: errorMessage ?? null,
          subjectEmail: userEmail,
          metadata: { inputKind: 'message', agentPath: true, steps },
        });
      } catch (err) {
        logger.error({ err: { message: err?.message } }, 'Agent audit recording failed');
      }
    },
  };
}

const defaultSafety = createAgentSafety();

export const assertAgentConsent = defaultSafety.assertAgentConsent;
export const moderateAgentOutput = defaultSafety.moderateAgentOutput;
export const appendDisclaimer = defaultSafety.appendDisclaimer;
export const recordAgentAudit = defaultSafety.recordAgentAudit;
