/**
 * Daily report batch job for POST /internal/cron/daily-report.
 * buildAIContext → generateHealthAssessmentReport → reportRepo (inside reportService) → Telegram (optional).
 */

const axios = require('axios');
const contextBuilderService = require('./contextBuilderService');
const reportService = require('./reportService');
const { userSettingsRepo } = require('../repositories');

function sanitizeUserId(email) {
  if (!email || typeof email !== 'string') return '';
  return email.toLowerCase().replace(/[^a-zA-Z0-9@._-]/g, '_');
}

function collectUserEmails(body) {
  const fromBody = Array.isArray(body?.userEmails)
    ? body.userEmails.filter((e) => typeof e === 'string' && e.includes('@'))
    : [];
  if (fromBody.length) return [...new Set(fromBody.map((e) => e.trim().toLowerCase()))];

  const raw = process.env.CRON_DAILY_REPORT_USER_EMAILS || '';
  return raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter((e) => e.includes('@'));
}

async function getTelegramChatId(userId) {
  try {
    const settings = await userSettingsRepo.getUserSettings(userId);
    if (!settings || typeof settings !== 'object') return null;
    const id =
      settings.integrations?.telegramChatId ||
      settings.telegramChatId ||
      settings.messaging?.telegramChatId;
    if (id == null || id === '') return null;
    return String(id);
  } catch {
    return null;
  }
}

async function sendTelegramSummary(chatId, text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || !chatId) return { sent: false, reason: 'missing_token_or_chat_id' };

  const payload = {
    chat_id: chatId,
    text: String(text).slice(0, 4096),
    disable_web_page_preview: true
  };

  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const res = await axios.post(url, payload, { timeout: 20000 });
  return { sent: true, telegram: res.data };
}

/**
 * WeChat template/subscription messages are not implemented here; keep Node-only with official SDK later.
 */
async function sendWeChatIfConfigured() {
  if (process.env.WECHAT_DAILY_REPORT_ENABLED === 'true') {
    return { sent: false, reason: 'wechat_daily_not_implemented' };
  }
  return { sent: false, reason: 'wechat_disabled' };
}

/**
 * @param {{ userEmails?: string[], dryRun?: boolean }} opts
 */
async function runDailyReportBatch(opts = {}) {
  const dryRun = Boolean(opts.dryRun);
  const userEmails = collectUserEmails({ userEmails: opts.userEmails });
  const summary = {
    startedAt: new Date().toISOString(),
    dryRun,
    total: userEmails.length,
    results: []
  };

  if (userEmails.length === 0) {
    summary.message =
      'No users to process. Pass JSON { "userEmails": ["a@b.com"] } or set CRON_DAILY_REPORT_USER_EMAILS.';
    return summary;
  }

  for (const userEmail of userEmails) {
    const userId = sanitizeUserId(userEmail);
    const row = { userEmail, userId };

    try {
      const payload = await contextBuilderService.buildAIContext(userId, {
        medications: true,
        vitalsRecent: true,
        chatRecent: true,
        language: 'zh'
      });

      if (!payload.basicInfo || payload.basicInfo === '暂无基础档案信息。') {
        row.skipped = true;
        row.reason = 'no_basic_profile';
        summary.results.push(row);
        continue;
      }

      if (dryRun) {
        row.dryRun = true;
        row.wouldGenerate = true;
        summary.results.push(row);
        continue;
      }

      const reportResult = await reportService.generateHealthAssessmentReport(userEmail, {
        title: `每日健康摘要 - ${new Date().toLocaleDateString('zh-CN')}`
      });

      if (!reportResult.success) {
        row.error = reportResult.error || 'report_failed';
        summary.results.push(row);
        continue;
      }

      row.reportId = reportResult.report?.reportId;

      const execSummary =
        (reportResult.report?.sections && reportResult.report.sections.executiveSummary) ||
        '您的健康日报已生成，请打开应用查看全文。';

      const chatId = await getTelegramChatId(userId);
      if (chatId) {
        try {
          row.telegram = await sendTelegramSummary(chatId, execSummary);
        } catch (err) {
          row.telegramError = err.response?.data?.description || err.message;
        }
      } else {
        row.telegram = { sent: false, reason: 'no_telegram_chat_id_in_userSettings' };
      }

      row.wechat = await sendWeChatIfConfigured();
      summary.results.push(row);
    } catch (err) {
      row.error = err.message;
      summary.results.push(row);
    }
  }

  summary.finishedAt = new Date().toISOString();
  return summary;
}

module.exports = {
  runDailyReportBatch,
  sanitizeUserId,
  collectUserEmails
};
