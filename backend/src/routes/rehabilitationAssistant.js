const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const rehabilitationAssistantService = require('../services/rehabilitationAssistantService');

/**
 * POST /api/rehabilitation/explain-metrics
 * 科普解读临床指标
 */
router.post('/explain-metrics', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user?.email;
    if (!userEmail) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { metrics } = req.body;
    
    if (!metrics) {
      return res.status(400).json({ error: 'metrics are required' });
    }

    const result = await rehabilitationAssistantService.explainClinicalMetrics(userEmail, metrics);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Explain metrics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to explain metrics',
      details: error.message
    });
  }
});

/**
 * POST /api/rehabilitation/emotional-support
 * 情绪与心理支持
 */
router.post('/emotional-support', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user?.email;
    if (!userEmail) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { context } = req.body;
    
    if (!context) {
      return res.status(400).json({ error: 'context is required' });
    }

    const result = await rehabilitationAssistantService.provideEmotionalSupport(userEmail, context);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Emotional support error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to provide emotional support',
      details: error.message
    });
  }
});

/**
 * POST /api/rehabilitation/meditation
 * 冥想引导
 */
router.post('/meditation', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user?.email;
    if (!userEmail) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { type } = req.body;
    
    const result = await rehabilitationAssistantService.guideMeditation(
      userEmail,
      type || 'breathing'
    );
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Meditation guide error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to guide meditation',
      details: error.message
    });
  }
});

/**
 * POST /api/rehabilitation/cbt
 * 认知行为疗法支持
 */
router.post('/cbt', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user?.email;
    if (!userEmail) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { situation } = req.body;
    
    if (!situation) {
      return res.status(400).json({ error: 'situation is required' });
    }

    const result = await rehabilitationAssistantService.provideCBT(userEmail, situation);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('CBT support error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to provide CBT support',
      details: error.message
    });
  }
});

/**
 * POST /api/rehabilitation/answer
 * 健康问答
 */
router.post('/answer', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user?.email;
    if (!userEmail) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { question } = req.body;
    
    if (!question) {
      return res.status(400).json({ error: 'question is required' });
    }

    const result = await rehabilitationAssistantService.answerHealthQuestions(userEmail, question);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Answer health question error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to answer health question',
      details: error.message
    });
  }
});

module.exports = router;
