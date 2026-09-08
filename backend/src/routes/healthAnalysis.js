const express = require('express');
const multer = require('multer');
const { authenticateToken } = require('../middleware/auth');
const { requireConsent } = require('../middleware/requireConsent');
const { CONSENT_PURPOSES } = require('../models/consent');
const {
  analyzeHealthDocuments,
  getHealthAnalysisHistory,
  getHealthAnalysisById
} = require('../services/healthAnalysisService');
const aiServiceFactory = require('../services/aiServiceFactory');

const router = express.Router();

const ALLOWED_MIMES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/csv',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/bmp',
  'image/tiff',
  'image/webp'
];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = ALLOWED_MIMES.includes(file.mimetype);
    cb(ok ? null : new Error('Unsupported file type'), ok);
  }
});

// Multer error handling middleware
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 10MB.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum is 20 files.'
      });
    }
  }
  
  if (error.message === 'Unsupported file type') {
    return res.status(400).json({
      success: false,
      message: 'Unsupported file type. Please upload PDF, Word, or image files.'
    });
  }
  
  console.error('❌ Multer error:', error);
  res.status(500).json({
    success: false,
    message: 'File upload error',
    error: error.message
  });
};

/**
 * @route POST /api/health-analysis/analyze
 * @desc Analyze uploaded health documents
 * @access Private
 */
router.post('/analyze', authenticateToken, requireConsent(CONSENT_PURPOSES.AI_INFERENCE), (req, res, next) => {
  upload.array('documents', 20)(req, res, (err) => {
    if (err) return handleMulterError(err, req, res, next);
    next();
  });
}, async (req, res) => {
  try {
    if (!req.files?.length) {
      return res.status(400).json({ success: false, message: 'No documents provided for analysis' });
    }
    const { provider = 'gemini', model } = req.body;
    const analysisResult = await analyzeHealthDocuments(req.files, req.user.id, req.user.email, { provider, model });

    res.json({
      success: true,
      message: 'Health analysis completed successfully',
      data: {
        analysisId: analysisResult.analysisId,
        summary: analysisResult.analysis.summary,
        riskFactors: analysisResult.analysis.riskFactors,
        recommendations: analysisResult.analysis.recommendations,
        nextSteps: analysisResult.analysis.nextSteps,
        analysisDate: analysisResult.analysisDate,
        uploadedFiles: analysisResult.uploadedFiles,
        aiProvider: analysisResult.aiProvider,
        aiModel: analysisResult.aiModel,
        processingTime: analysisResult.processingTime
      }
    });

  } catch (error) {
    console.error('❌ Health analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze health documents',
      error: error.message
    });
  }
});

/**
 * @route GET /api/health-analysis/ai-services
 * @desc Get available AI services and models
 * @access Private
 */
router.get('/ai-services', authenticateToken, async (req, res) => {
  try {
    const services = aiServiceFactory.getAvailableServices();
    res.json({ success: true, data: { services, totalServices: Object.keys(services).length } });
  } catch (error) {
    console.error('❌ Get AI services error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve AI services', error: error.message });
  }
});

/**
 * @route GET /api/health-analysis/history
 * @desc Get user's health analysis history
 * @access Private
 */
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const history = await getHealthAnalysisHistory(req.user.email, {
      page: parseInt(req.query.page, 10) || 1,
      limit: parseInt(req.query.limit, 10) || 10
    });
    res.json({ success: true, data: history });
  } catch (error) {
    console.error('❌ Get analysis history error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve analysis history', error: error.message });
  }
});

/**
 * @route GET /api/health-analysis/:id
 * @desc Get specific health analysis details
 * @access Private
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const analysis = await getHealthAnalysisById(req.params.id, req.user.email);
    if (!analysis) return res.status(404).json({ success: false, message: 'Analysis not found' });
    res.json({ success: true, data: analysis });
  } catch (error) {
    console.error('❌ Get analysis details error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve analysis details', error: error.message });
  }
});

module.exports = router;

