const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { requireConsent } = require('../middleware/requireConsent');
const { CONSENT_PURPOSES } = require('../models/consent');
const rehabilitationAssistantService = require('../services/rehabilitationAssistantService');

/**
 * POST /api/rehabilitation/explain-metrics
 * 科普解读临床指标
 */
router.post('/explain-metrics', authenticateToken, requireConsent(CONSENT_PURPOSES.AI_INFERENCE), async (req, res) => {
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
router.post('/emotional-support', authenticateToken, requireConsent(CONSENT_PURPOSES.AI_INFERENCE), async (req, res) => {
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
router.post('/meditation', authenticateToken, requireConsent(CONSENT_PURPOSES.AI_INFERENCE), async (req, res) => {
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
router.post('/cbt', authenticateToken, requireConsent(CONSENT_PURPOSES.AI_INFERENCE), async (req, res) => {
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
router.post('/answer', authenticateToken, requireConsent(CONSENT_PURPOSES.AI_INFERENCE), async (req, res) => {
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

/**
 * GET /api/rehabilitation/records
 * 获取康复记录历史
 */
router.get('/records', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user?.email;
    if (!userEmail) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { type, subtype, limit } = req.query;
    
    const result = await rehabilitationAssistantService.getRehabilitationRecords(userEmail, {
      type: type || null,
      subtype: subtype || null,
      limitCount: limit ? parseInt(limit) : 20
    });
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Get records error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get records',
      details: error.message
    });
  }
});

/**
 * GET /api/rehabilitation/context
 * 获取用户上下文
 */
router.get('/context', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user?.email;
    if (!userEmail) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userContextService = require('../services/userContextService');
    const context = await userContextService.getUserContext(userEmail);
    
    res.status(200).json({
      success: true,
      context: context
    });
  } catch (error) {
    console.error('Get context error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get context',
      details: error.message
    });
  }
});

/**
 * POST /api/rehabilitation/feedback
 * 提交反馈
 */
router.post('/feedback', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user?.email;
    if (!userEmail) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { recordId, effectiveness, helpful, comments } = req.body;
    
    if (!recordId || !effectiveness) {
      return res.status(400).json({ 
        error: 'recordId and effectiveness are required' 
      });
    }

    const result = await rehabilitationAssistantService.saveFeedback(
      userEmail,
      recordId,
      { effectiveness, helpful, comments }
    );
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Save feedback error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save feedback',
      details: error.message
    });
  }
});

module.exports = router;
