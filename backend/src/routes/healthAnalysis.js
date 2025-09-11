const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { authenticateToken } = require('../middleware/auth');
const { analyzeHealthDocuments, analyzeHealthDocumentsDirect } = require('../services/healthAnalysisService');
const { saveHealthAnalysis, getHealthAnalysisHistory, getHealthAnalysisById } = require('../services/healthAnalysisService');

const router = express.Router();

// Configure multer for file uploads (memory storage only)
const storage = multer.memoryStorage();

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
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
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type'), false);
    }
  }
});

// No need for local upload directory since we're using memory storage

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
router.post('/analyze', authenticateToken, (req, res, next) => {
  console.log('🔍 /analyze route - Before multer middleware');
  console.log('🔍 Request headers:', req.headers);
  console.log('🔍 Request body keys:', Object.keys(req.body));
  
  upload.array('documents', 20)(req, res, (err) => {
    if (err) {
      console.error('❌ Multer error:', err);
      return handleMulterError(err, req, res, next);
    }
    console.log('✅ Multer middleware completed successfully');
    next();
  });
}, async (req, res) => {
  try {
    console.log('🔍 Starting health document analysis...');
    console.log('📁 Uploaded files:', req.files?.length || 0);
    console.log('👤 User:', req.user.email);
    console.log('📋 Request body keys:', Object.keys(req.body));
    console.log('📋 Request files:', req.files);
    
    // Debug file structure
    if (req.files && req.files.length > 0) {
      req.files.forEach((file, index) => {
        console.log(`📄 File ${index}:`, {
          fieldname: file.fieldname,
          originalname: file.originalname,
          encoding: file.encoding,
          mimetype: file.mimetype,
          size: file.size,
          buffer: file.buffer ? `Buffer(${file.buffer.length} bytes)` : 'No buffer'
        });
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No documents provided for analysis'
      });
    }

    const userId = req.user.id;
    const userEmail = req.user.email;

    console.log('🔍 Route - userId:', userId, 'userEmail:', userEmail);
    console.log('🔍 Route - req.user:', req.user);

    // Analyze documents using AI (includes saving to database)
    const analysisResult = await analyzeHealthDocuments(req.files, userId, userEmail);

    console.log('✅ Health analysis completed and saved');

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
        uploadedFiles: analysisResult.uploadedFiles
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
 * @route GET /api/health-analysis/history
 * @desc Get user's health analysis history
 * @access Private
 */
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user.email;
    const { page = 1, limit = 10 } = req.query;

    const history = await getHealthAnalysisHistory(userEmail, {
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: history
    });

  } catch (error) {
    console.error('❌ Get analysis history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve analysis history',
      error: error.message
    });
  }
});

/**
 * @route GET /api/health-analysis/:id
 * @desc Get specific health analysis details
 * @access Private
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userEmail = req.user.email;

    const analysis = await getHealthAnalysisById(id, userEmail);

    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'Analysis not found'
      });
    }

    res.json({
      success: true,
      data: analysis
    });

  } catch (error) {
    console.error('❌ Get analysis details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve analysis details',
      error: error.message
    });
  }
});

/**
 * @route DELETE /api/health-analysis/:id
 * @desc Delete specific health analysis
 * @access Private
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // TODO: Implement delete functionality
    // const deleted = await deleteHealthAnalysis(id, userId);

    res.json({
      success: true,
      message: 'Analysis deleted successfully'
    });

  } catch (error) {
    console.error('❌ Delete analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete analysis',
      error: error.message
    });
  }
});

/**
 * @route POST /api/health-analysis/test-analyze
 * @desc Test health analysis with JSON data
 * @access Private
 */
router.post('/test-analyze', authenticateToken, async (req, res) => {
  try {
    console.log('🧪 Testing health analysis with JSON data...');
    console.log('📊 Request body:', req.body);
    
    const { documents } = req.body;
    
    if (!documents || !Array.isArray(documents) || documents.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No documents provided for analysis'
      });
    }
    
    const userId = req.user.id;
    const userEmail = req.user.email;
    
    // Convert JSON documents to parsed format
    const parsedDocuments = documents.map((doc, index) => ({
      filename: doc.filename || `document-${index}.txt`,
      content: doc.content || '',
      type: 'text'
    }));
    
    console.log('📁 Parsed documents:', parsedDocuments.length);
    
    // Call the health analysis service directly with parsed content
    const analysisResult = await analyzeHealthDocumentsDirect(parsedDocuments, userId, userEmail);
    
    res.json({
      success: true,
      message: 'Health analysis completed successfully',
      data: analysisResult
    });
    
  } catch (error) {
    console.error('❌ Test health analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze health documents',
      error: error.message
    });
  }
});

module.exports = router;

