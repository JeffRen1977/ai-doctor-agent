/**
 * 临床报告生成API路由
 */

const express = require('express');
const router = express.Router();
const reportService = require('../services/reportService');
const { authenticateToken } = require('../middleware/auth');

/**
 * POST /api/reports/health-assessment
 * 生成健康评估报告
 */
router.post('/health-assessment', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user?.email;
    if (!userEmail) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { title, period } = req.body;

    const result = await reportService.generateHealthAssessmentReport(userEmail, {
      title,
      period
    });

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.status(201).json({
      success: true,
      message: 'Health assessment report generated successfully',
      report: result.report
    });
  } catch (error) {
    console.error('❌ Generate health assessment report error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to generate health assessment report.',
      details: error.message 
    });
  }
});

/**
 * POST /api/reports/comprehensive
 * 生成综合健康报告
 */
router.post('/comprehensive', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user?.email;
    if (!userEmail) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { title, period } = req.body;

    const result = await reportService.generateComprehensiveReport(userEmail, {
      title,
      period
    });

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.status(201).json({
      success: true,
      message: 'Comprehensive report generated successfully',
      report: result.report
    });
  } catch (error) {
    console.error('❌ Generate comprehensive report error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to generate comprehensive report.',
      details: error.message 
    });
  }
});

/**
 * GET /api/reports
 * 获取用户的报告列表
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user?.email;
    if (!userEmail) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { reportType, limit } = req.query;
    const filters = {};
    if (reportType) filters.reportType = reportType;
    if (limit) filters.limit = parseInt(limit);

    const result = await reportService.getUserReports(userEmail, filters);

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json({
      success: true,
      reports: result.reports
    });
  } catch (error) {
    console.error('❌ Get reports error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get reports.',
      details: error.message 
    });
  }
});

/**
 * GET /api/reports/:reportId
 * 获取单个报告
 */
router.get('/:reportId', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user?.email;
    if (!userEmail) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { reportId } = req.params;

    const result = await reportService.getReport(reportId);

    if (!result.success) {
      return res.status(404).json({ error: result.error });
    }

    // 验证报告属于当前用户
    if (result.report.userEmail !== userEmail) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      success: true,
      report: result.report
    });
  } catch (error) {
    console.error('❌ Get report error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get report.',
      details: error.message 
    });
  }
});

module.exports = router;
