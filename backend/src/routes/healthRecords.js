const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const firebaseService = require('../services/firebaseService');
const { medicationRepo, personalHealthRecordRepo } = require('../repositories');
const pdfCaseExtractionService = require('../services/pdfCaseExtractionService');
const fhirService = require('../services/fhirService');
const multer = require('multer');
const {
  createMedicalDocument,
  createAIAnalysis,
  MEDICAL_DOCUMENT_TYPES
} = require('../models/healthRecordModels');

const router = express.Router();

// Configure multer for memory storage to handle file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 10, // Maximum 10 files
    fieldSize: 10 * 1024 * 1024, // 10MB for form fields
  }
});

// ========== 个人健康档案 ==========

// GET /personal-health-record - 获取个人健康档案
router.get('/personal-health-record', authenticateToken, async (req, res) => {
  console.log('✅ GET /personal-health-record route matched');
  try {
    const userEmail = req.user?.email;
    
    if (!userEmail) {
      console.warn('⚠️ No user email in request');
      return res.status(401).json({ 
        success: false,
        error: 'User not authenticated' 
      });
    }

    console.log(`🔍 Fetching personal health record for: ${userEmail}`);

    const sanitizedEmail = userEmail.replace(/[^a-zA-Z0-9@._-]/g, '_');
    const data = await personalHealthRecordRepo.get(sanitizedEmail);

    if (!data) {
      console.log(`⚠️ Personal health record not found for: ${userEmail}`);
      return res.json({
        success: true,
        data: null,
        message: 'Personal health record not found'
      });
    }
    const medications = await medicationRepo.listActive(sanitizedEmail);
    const dataWithMedications = { ...data, medications };
    console.log(`✅ Personal health record found for: ${userEmail}`);
    res.json({
      success: true,
      data: dataWithMedications
    });

  } catch (error) {
    console.error('❌ Get personal health record error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get personal health record.', 
      details: error.message 
    });
  }
});

// POST /personal-health-record - 保存/更新个人健康档案
router.post('/personal-health-record', authenticateToken, upload.array('files', 10), async (req, res) => {
  try {
    const userEmail = req.user?.email;
    
    if (!userEmail) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // 解析表单数据
    const {
      name,
      gender,
      birthDate,
      bloodType,
      height,
      weight,
      medicalHistory,
      medications,
      familyHistory,
      allergies,
      emergencyContact,
      emergencyPhone,
      relationship,
      documentType // 文档类型（如果上传了文件）
    } = req.body;

    // 准备健康档案数据（新格式）；用药记录通过 medicationRepo 写入，不写入根文档
    const sanitizedEmail = userEmail.replace(/[^a-zA-Z0-9@._-]/g, '_');
    let healthRecordData = {
      basicInfo: {
        name: name || null,
        gender: gender || null,
        birthDate: birthDate || null,
        bloodType: bloodType || null,
        height: height ? parseFloat(height) : null,
        weight: weight ? parseFloat(weight) : null,
        bmi: (height && weight) ? parseFloat(weight) / Math.pow(parseFloat(height) / 100, 2) : null
      },
      medicalHistory: medicalHistory || null,
      medications: null,
      familyHistory: familyHistory || null,
      allergies: allergies || null,
      // 注意：紧急联系人的基本信息保存在健康档案中，但详细的紧急联系人管理（多个联系人、通知设置等）
      // 应使用紧急求助服务（/api/emergency/contacts）
      emergencyContact: {
        name: emergencyContact || null,
        phone: emergencyPhone || null,
        relationship: relationship || null
      },
      medicalDocuments: [],
      wearableDataRefs: {},
      aiAnalyses: []
    };

    // 处理上传的文件
    let extractedMedicalInfo = null;
    if (req.files && req.files.length > 0) {
      console.log(`📤 Processing ${req.files.length} file(s)...`);
      
      // 上传文件到 Firebase Storage
      const uploadResult = await firebaseService.uploadMultipleFiles(
        req.files, 
        userEmail, 
        'personal-health-records'
      );
      
      if (uploadResult.success && uploadResult.files) {
        // 为每个文件创建医疗文档对象
        for (let i = 0; i < uploadResult.files.length; i++) {
          const file = req.files[i];
          const uploadInfo = uploadResult.files[i];
          
          // 确定文档类型
          let docType = documentType || 'other';
          if (!MEDICAL_DOCUMENT_TYPES.includes(docType)) {
            // 根据文件类型自动判断
            if (file.mimetype === 'application/pdf') {
              docType = 'hospital-record'; // 默认PDF为医院病例
            } else if (file.mimetype.startsWith('image/')) {
              docType = 'imaging'; // 图片为影像资料
            } else {
              docType = 'other';
            }
          }
          
          // 提取文件扩展名
          const fileExtension = file.originalname.split('.').pop() || '';
          
          // 创建医疗文档对象
          const medicalDoc = createMedicalDocument({
            documentType: docType,
            title: file.originalname.replace(/\.[^/.]+$/, ''), // 移除扩展名
            originalFileName: file.originalname,
            fileExtension: fileExtension,
            fileInfo: {
              downloadURL: uploadInfo.downloadURL,
              storagePath: uploadInfo.storagePath,
              size: uploadInfo.size,
              contentType: uploadInfo.contentType
            },
            uploadedAt: new Date().toISOString()
          });
          
          // 如果是PDF，尝试提取医疗信息
          if (file.mimetype === 'application/pdf') {
            try {
              extractedMedicalInfo = await pdfCaseExtractionService.extractMedicalInfoFromPDF(
                file.buffer,
                userEmail
              );
              
              if (extractedMedicalInfo.success) {
                // 将提取的信息添加到文档的 aiExtraction 字段
                medicalDoc.aiExtraction = {
                  extractedAt: new Date().toISOString(),
                  provider: extractedMedicalInfo.provider || 'unknown',
                  model: extractedMedicalInfo.model || 'unknown',
                  extractedData: {
                    medicalHistory: extractedMedicalInfo.medicalHistory,
                    medications: extractedMedicalInfo.medications,
                    familyHistory: extractedMedicalInfo.familyHistory,
                    allergies: extractedMedicalInfo.allergies,
                    additionalInfo: extractedMedicalInfo.additionalInfo
                  },
                  confidence: 0.8 // 默认置信度
                };
                
                // 如果用户没有手动填写，使用提取的信息
                if (!healthRecordData.medicalHistory && extractedMedicalInfo.medicalHistory) {
                  healthRecordData.medicalHistory = extractedMedicalInfo.medicalHistory;
                }
                
                if (!healthRecordData.medications && extractedMedicalInfo.medications) {
                  healthRecordData.medications = extractedMedicalInfo.medications;
                }
                
                if (!healthRecordData.familyHistory && extractedMedicalInfo.familyHistory) {
                  healthRecordData.familyHistory = extractedMedicalInfo.familyHistory;
                }
                
                if (!healthRecordData.allergies && extractedMedicalInfo.allergies) {
                  healthRecordData.allergies = extractedMedicalInfo.allergies;
                }
                
                // 创建AI分析记录
                const analysis = createAIAnalysis({
                  analysisType: 'document-analysis',
                  aiProvider: extractedMedicalInfo.provider || 'unknown',
                  aiModel: extractedMedicalInfo.model || 'unknown',
                  analysisDate: new Date().toISOString(),
                  inputData: {
                    documentIds: [medicalDoc.documentId]
                  },
                  results: {
                    summary: `从PDF文档 "${file.originalname}" 中提取了医疗信息`,
                    extractedData: {
                      medicalHistory: extractedMedicalInfo.medicalHistory,
                      medications: extractedMedicalInfo.medications,
                      familyHistory: extractedMedicalInfo.familyHistory,
                      allergies: extractedMedicalInfo.allergies,
                      additionalInfo: extractedMedicalInfo.additionalInfo
                    }
                  }
                });
                
                healthRecordData.aiAnalyses.push(analysis);
              }
            } catch (extractionError) {
              console.error('❌ Error extracting medical info from PDF:', extractionError);
            }
          }
          
          healthRecordData.medicalDocuments.push(medicalDoc);
        }
        
        console.log(`✅ ${healthRecordData.medicalDocuments.length} document(s) processed`);
      } else {
        console.error('❌ File upload failed:', uploadResult.error);
      }
    }

    // 保存到 Firestore
    console.log('💾 Saving personal health record to Firestore...');
    const saveResult = await firebaseService.savePersonalHealthRecord(userEmail, healthRecordData);
    
    if (!saveResult.success) {
      throw new Error(saveResult.error);
    }

    if (medications != null && medications !== '') {
      try {
        const list = Array.isArray(medications) ? medications : (typeof medications === 'string' ? JSON.parse(medications || '[]') : []);
        const current = await medicationRepo.listActive(sanitizedEmail);
        for (const med of list) {
          const item = med && typeof med === 'object' ? med : {};
          const existing = item.id ? current.find(m => m.id === item.id) : null;
          if (existing) {
            await medicationRepo.update(sanitizedEmail, item.id, item);
          } else {
            await medicationRepo.add(sanitizedEmail, item);
          }
        }
      } catch (e) {
        console.warn('⚠️ Medication sync skipped:', e.message);
      }
    }

    console.log('✅ Personal health record saved successfully');
    res.status(201).json({
      success: true,
      message: 'Personal health record saved successfully',
      recordId: saveResult.id,
      data: saveResult.data,
      documentsProcessed: healthRecordData.medicalDocuments.length,
      pdfExtraction: extractedMedicalInfo ? {
        success: extractedMedicalInfo.success,
        medicalHistory: extractedMedicalInfo.medicalHistory,
        medications: extractedMedicalInfo.medications,
        familyHistory: extractedMedicalInfo.familyHistory,
        allergies: extractedMedicalInfo.allergies
      } : null
    });

  } catch (error) {
    console.error('❌ Save personal health record error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to save personal health record.', 
      details: error.message 
    });
  }
});

// ========== 医疗文档管理 ==========

// POST /documents - 上传医疗文档
router.post('/documents', authenticateToken, upload.array('files', 10), async (req, res) => {
  try {
    const userEmail = req.user?.email;
    const { documentType, title, description, medicalInfo, imagingInfo } = req.body;
    
    if (!userEmail) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }
    
    // 上传文件
    const uploadResult = await firebaseService.uploadMultipleFiles(
      req.files,
      userEmail,
      'personal-health-records'
    );
    
    if (!uploadResult.success) {
      return res.status(500).json({ error: uploadResult.error });
    }
    
    // 创建医疗文档对象
    const documents = [];
    for (let i = 0; i < uploadResult.files.length; i++) {
      const file = req.files[i];
      const uploadInfo = uploadResult.files[i];
      
      const docType = documentType || (file.mimetype.startsWith('image/') ? 'imaging' : 'other');
      const fileExtension = file.originalname.split('.').pop() || '';
      
      const medicalDoc = createMedicalDocument({
        documentType: docType,
        title: title || file.originalname.replace(/\.[^/.]+$/, ''),
        description: description || null,
        originalFileName: file.originalname,
        fileExtension: fileExtension,
        fileInfo: {
          downloadURL: uploadInfo.downloadURL,
          storagePath: uploadInfo.storagePath,
          size: uploadInfo.size,
          contentType: uploadInfo.contentType
        },
        medicalInfo: medicalInfo ? JSON.parse(medicalInfo) : null,
        imagingInfo: imagingInfo ? JSON.parse(imagingInfo) : null,
        uploadedAt: new Date().toISOString()
      });
      
      // 添加到个人健康档案
      await firebaseService.addMedicalDocument(userEmail, medicalDoc);
      documents.push(medicalDoc);
    }
    
    res.status(201).json({
      success: true,
      message: 'Documents uploaded successfully',
      documents: documents
    });
    
  } catch (error) {
    console.error('❌ Upload documents error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to upload documents.', 
      details: error.message 
    });
  }
});

// GET /documents - 获取文档列表
router.get('/documents', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user?.email;
    
    if (!userEmail) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const sanitizedEmail = userEmail.replace(/[^a-zA-Z0-9@._-]/g, '_');
    const data = await personalHealthRecordRepo.get(sanitizedEmail);

    if (!data) {
      return res.json({ success: true, documents: [] });
    }

    const documents = data.medicalDocuments || [];

    res.json({
      success: true,
      documents: documents
    });

  } catch (error) {
    console.error('❌ Get documents error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get documents.', 
      details: error.message 
    });
  }
});

// GET /documents/:documentId - 获取单个文档
router.get('/documents/:documentId', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user?.email;
    const { documentId } = req.params;
    
    if (!userEmail) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const sanitizedEmail = userEmail.replace(/[^a-zA-Z0-9@._-]/g, '_');
    const data = await personalHealthRecordRepo.get(sanitizedEmail);

    if (!data) {
      return res.status(404).json({ error: 'Personal health record not found' });
    }

    const documents = data.medicalDocuments || [];
    const document = documents.find(d => d.documentId === documentId);
    
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    res.json({
      success: true,
      document: document
    });
    
  } catch (error) {
    console.error('❌ Get document error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get document.', 
      details: error.message 
    });
  }
});

// DELETE /documents/:documentId - 删除文档
router.delete('/documents/:documentId', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user?.email;
    const { documentId } = req.params;
    
    if (!userEmail) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const result = await firebaseService.deleteMedicalDocument(userEmail, documentId);
    
    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }
    
    res.json({
      success: true,
      message: 'Document deleted successfully'
    });
    
  } catch (error) {
    console.error('❌ Delete document error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete document.', 
      details: error.message 
    });
  }
});

// ========== AI分析 ==========

// GET /analyses - 获取分析历史
router.get('/analyses', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user?.email;
    
    if (!userEmail) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const sanitizedEmail = userEmail.replace(/[^a-zA-Z0-9@._-]/g, '_');
    const data = await personalHealthRecordRepo.get(sanitizedEmail);

    if (!data) {
      return res.json({ success: true, analyses: [] });
    }

    const analyses = data.aiAnalyses || [];

    res.json({
      success: true,
      analyses: analyses
    });

  } catch (error) {
    console.error('❌ Get analyses error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get analyses.', 
      details: error.message 
    });
  }
});

// ========== FHIR ==========

// GET /fhir/:patientId - 获取FHIR患者记录
router.get('/fhir/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    const records = await fhirService.getPatientRecords(patientId);
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
