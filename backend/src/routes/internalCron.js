/**
 * Internal cron routes — not under /api; protect with bearer token only.
 *
 * POST /internal/cron/daily-report
 * Body (optional): { "userEmails": ["user@example.com"] }
 * Query (optional): dryRun=true — list who would run without LLM / Telegram / DB writes beyond reads
 */

const express = require('express');
const router = express.Router();
const { internalCronAuth } = require('../middleware/internalCronAuth');
const dailyReportCronService = require('../services/dailyReportCronService');

router.post('/daily-report', internalCronAuth, async (req, res) => {
  try {
    const dryRun =
      req.query.dryRun === '1' ||
      req.query.dryRun === 'true' ||
      req.body?.dryRun === true;

    const summary = await dailyReportCronService.runDailyReportBatch({
      userEmails: req.body?.userEmails,
      dryRun
    });

    res.status(200).json({ success: true, ...summary });
  } catch (error) {
    console.error('internalCron daily-report:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
