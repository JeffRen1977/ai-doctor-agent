/**
 * 发信出口。未配置 SMTP 时：生产只记错误（接口仍对用户返回成功，防枚举）；
 * 开发把重置链接打进日志，方便本地点开。
 */

const logger = require('../observability/logger');

function smtpConfigured() {
  return Boolean(process.env.SMTP_HOST);
}

/**
 * @param {string} to
 * @param {string} resetUrl
 * @returns {Promise<{sent: boolean}>}
 */
async function sendPasswordResetMail(to, resetUrl) {
  if (!smtpConfigured()) {
    if (process.env.NODE_ENV === 'production') {
      logger.error({ event: 'smtp_unconfigured', to }, 'SMTP 未配置，密码重置邮件未发送');
    } else {
      logger.info({ to, resetUrl }, 'SMTP 未配置；开发环境密码重置链接');
    }
    return { sent: false };
  }

  // eslint-disable-next-line global-require
  const nodemailer = require('nodemailer');
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS || '' }
      : undefined
  });

  const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@localhost';
  await transporter.sendMail({
    from,
    to,
    subject: '重置你的密码',
    text: `请在一小时内打开以下链接设置新密码：\n${resetUrl}\n\n如果不是你本人操作，请忽略这封邮件。`,
    html: `<p>请在一小时内打开以下链接设置新密码：</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>如果不是你本人操作，请忽略这封邮件。</p>`
  });
  return { sent: true };
}

module.exports = { sendPasswordResetMail, smtpConfigured };
