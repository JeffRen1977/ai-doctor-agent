const express = require('express');
const Joi = require('joi');
const { db } = require('../config/firebase');
const { collection, addDoc, getDocs, query, where, orderBy, doc, getDoc, updateDoc, deleteDoc } = require('firebase/firestore');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// 健康记录验证schema
const healthRecordSchema = Joi.object({
  date: Joi.string().required(),
  type: Joi.string().required(),
  description: Joi.string().required(),
  severity: Joi.string().valid('low', 'medium', 'high').required(),
  status: Joi.string().valid('active', 'resolved').required(),
  // 分析结果字段
  analysisResult: Joi.object({
    summary: Joi.string(),
    riskFactors: Joi.array(),
    recommendations: Joi.array(),
    nextSteps: Joi.array(),
    analysisDate: Joi.string(),
    documentsAnalyzed: Joi.number(),
    uploadedFiles: Joi.array()
  }).optional(),
  // 文档信息
  documents: Joi.array().items(Joi.object({
    documentId: Joi.string().required(), // 用户电子邮件作为文档标识符
    userEmail: Joi.string().email().required(),
    originalName: Joi.string(),
    downloadURL: Joi.string(),
    storagePath: Joi.string(),
    size: Joi.number(),
    contentType: Joi.string(),
    uploadedAt: Joi.string()
  })).optional()
});

// 获取健康记录列表
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.headers['user-id'] || req.user?.id || '1';
    const userEmail = req.user?.email;
    
    console.log('🔍 Getting health records for userId:', userId, 'userEmail:', userEmail);
    
    // 查询用户的健康记录，按创建时间倒序排列
    const healthRecordsRef = collection(db, 'healthRecords');
    const q = query(
      healthRecordsRef, 
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const userRecords = [];
    
    querySnapshot.forEach((doc) => {
      userRecords.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    console.log('✅ Found', userRecords.length, 'health records');
    res.json(userRecords);
  } catch (error) {
    console.error('获取健康记录错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 创建健康记录
router.post('/', authenticateToken, async (req, res) => {
  try {
    // 验证输入
    const { error, value } = healthRecordSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const userId = req.headers['user-id'] || req.user?.id || '1';
    const userEmail = req.user?.email;
    
    console.log('📝 Creating health record for userId:', userId, 'userEmail:', userEmail);
    
    const newRecord = {
      userId,
      userEmail,
      ...value,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // 保存到Firebase Firestore
    const healthRecordsRef = collection(db, 'healthRecords');
    const docRef = await addDoc(healthRecordsRef, newRecord);
    
    const createdRecord = {
      id: docRef.id,
      ...newRecord
    };

    console.log('✅ Health record created with ID:', docRef.id);
    res.status(201).json(createdRecord);
  } catch (error) {
    console.error('创建健康记录错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 更新健康记录
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.headers['user-id'] || req.user?.id || '1';
    const userEmail = req.user?.email;
    
    // 验证输入
    const { error, value } = healthRecordSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // 从 Firestore 获取记录
    const recordDocRef = doc(db, 'healthRecords', id);
    const recordDoc = await getDoc(recordDocRef);
    
    if (!recordDoc.exists()) {
      return res.status(404).json({ error: '健康记录不存在' });
    }

    const recordData = recordDoc.data();
    if (recordData.userId !== userId && recordData.userEmail !== userEmail) {
      return res.status(403).json({ error: '无权访问此记录' });
    }

    // 更新记录
    const updatedRecord = {
      ...value,
      updatedAt: new Date()
    };

    await updateDoc(recordDocRef, updatedRecord);

    res.json({
      id: recordDoc.id,
      ...recordData,
      ...updatedRecord
    });
  } catch (error) {
    console.error('更新健康记录错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 删除健康记录
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.headers['user-id'] || req.user?.id || '1';
    const userEmail = req.user?.email;
    
    // 从 Firestore 获取记录
    const recordDocRef = doc(db, 'healthRecords', id);
    const recordDoc = await getDoc(recordDocRef);
    
    if (!recordDoc.exists()) {
      return res.status(404).json({ error: '健康记录不存在' });
    }

    const recordData = recordDoc.data();
    if (recordData.userId !== userId && recordData.userEmail !== userEmail) {
      return res.status(403).json({ error: '无权访问此记录' });
    }

    await deleteDoc(recordDocRef);

    res.json({ message: '健康记录删除成功' });
  } catch (error) {
    console.error('删除健康记录错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 获取单个健康记录
// 注意：具体路由必须在参数路由之前定义
// GET /personal-health-record - 获取个人健康档案（必须在 /:id 之前）
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
    const recordDocRef = doc(db, 'personalHealthRecords', sanitizedEmail);
    const recordDoc = await getDoc(recordDocRef);
    
    if (!recordDoc.exists()) {
      console.log(`⚠️ Personal health record not found for: ${userEmail}`);
      // 返回空数据而不是 404，让前端可以正常处理
      return res.json({ 
        success: true,
        data: null,
        message: 'Personal health record not found'
      });
    }

    console.log(`✅ Personal health record found for: ${userEmail}`);
    res.json({
      success: true,
      data: recordDoc.data()
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

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // 如果 id 是 'personal-health-record'，说明路由顺序有问题
    if (id === 'personal-health-record') {
      console.error('❌ Route order issue: /personal-health-record matched /:id route');
      console.error('❌ This should not happen - /personal-health-record route should be defined before /:id');
      return res.status(404).json({ 
        success: false,
        error: 'Route not found. Route order issue detected.' 
      });
    }
    
    const userId = req.headers['user-id'] || req.user?.id || '1';
    const userEmail = req.user?.email;
    
    // 从 Firestore 获取记录
    const recordDocRef = doc(db, 'healthRecords', id);
    const recordDoc = await getDoc(recordDocRef);
    
    if (!recordDoc.exists()) {
      return res.status(404).json({ error: '健康记录不存在' });
    }

    const recordData = recordDoc.data();
    if (recordData.userId !== userId && recordData.userEmail !== userEmail) {
      return res.status(403).json({ error: '无权访问此记录' });
    }

    res.json({
      id: recordDoc.id,
      ...recordData
    });
  } catch (error) {
    console.error('获取健康记录错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

const fhirService = require('../services/fhirService');
const firebaseService = require('../services/firebaseService');
const pdfCaseExtractionService = require('../services/pdfCaseExtractionService');
const multer = require('multer');

// Configure multer for memory storage to handle file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for PDF files
    files: 10, // Maximum 10 files
    fieldSize: 10 * 1024 * 1024, // 10MB for form fields
  }
});

// Get patient records from FHIR server
router.get('/fhir/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    const records = await fhirService.getPatientRecords(patientId);
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload a health record file
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const { userEmail } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    if (!userEmail) {
      return res.status(400).json({ error: 'User email is required.' });
    }

    // 1. Upload file to Firebase Storage
    const uploadResult = await firebaseService.uploadHealthRecordFile(file, userEmail);
    if (!uploadResult.success) {
      throw new Error(uploadResult.error);
    }

    // 2. Add record metadata to Firestore
    const recordData = {
      fileName: file.originalname,
      fileType: file.mimetype,
      fileUrl: uploadResult.url,
      storagePath: uploadResult.path,
    };
    const recordResult = await firebaseService.addHealthRecord(userEmail, recordData);
    if (!recordResult.success) {
      throw new Error(recordResult.error);
    }

    res.status(201).json({
      message: 'File uploaded and record created successfully.',
      recordId: recordResult.id,
      fileUrl: uploadResult.url,
    });

  } catch (error) {
    console.error('Health record upload error:', error);
    res.status(500).json({ 
      error: 'Failed to upload health record.', 
      details: error.message 
    });
  }
});

// 保存个人健康档案（支持文本数据和文件上传）
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
      medicalHistory,
      medications,
      familyHistory,
      allergies,
      emergencyContact,
      emergencyPhone
    } = req.body;

    // 准备健康档案数据
    let healthRecordData = {
      basicInfo: {
        name: name || null,
        gender: gender || null,
        birthDate: birthDate || null,
        bloodType: bloodType || null,
      },
      medicalHistory: medicalHistory || null,
      medications: medications || null,
      familyHistory: familyHistory || null,
      allergies: allergies || null,
      emergencyContact: {
        name: emergencyContact || null,
        phone: emergencyPhone || null,
      },
      attachments: []
    };

    // 处理PDF文件：提取医疗信息
    let extractedMedicalInfo = null;
    if (req.files && req.files.length > 0) {
      // 查找PDF文件
      const pdfFiles = req.files.filter(file => file.mimetype === 'application/pdf');
      
      if (pdfFiles.length > 0) {
        console.log(`📄 Found ${pdfFiles.length} PDF file(s), extracting medical information...`);
        
        // 处理第一个PDF文件（可以扩展为处理多个）
        const pdfFile = pdfFiles[0];
        try {
          extractedMedicalInfo = await pdfCaseExtractionService.extractMedicalInfoFromPDF(
            pdfFile.buffer,
            userEmail
          );
          
          if (extractedMedicalInfo.success) {
            console.log('✅ Medical information extracted from PDF');
            
            // 如果用户没有手动填写，使用提取的信息
            if (!healthRecordData.medicalHistory && extractedMedicalInfo.medicalHistory) {
              healthRecordData.medicalHistory = extractedMedicalInfo.medicalHistory;
              console.log('📝 Using extracted medical history');
            } else if (healthRecordData.medicalHistory && extractedMedicalInfo.medicalHistory) {
              // 如果用户已填写，合并信息
              healthRecordData.medicalHistory = `${healthRecordData.medicalHistory}\n\n[从PDF提取的补充信息]\n${extractedMedicalInfo.medicalHistory}`;
            }
            
            if (!healthRecordData.medications && extractedMedicalInfo.medications) {
              healthRecordData.medications = extractedMedicalInfo.medications;
              console.log('💊 Using extracted medications');
            } else if (healthRecordData.medications && extractedMedicalInfo.medications) {
              // 如果用户已填写，合并信息
              healthRecordData.medications = `${healthRecordData.medications}\n\n[从PDF提取的补充信息]\n${extractedMedicalInfo.medications}`;
            }
            
            // 保存提取的原始信息，用于后续参考
            healthRecordData.pdfExtraction = {
              extractedAt: new Date().toISOString(),
              medicalHistory: extractedMedicalInfo.medicalHistory,
              medications: extractedMedicalInfo.medications,
              additionalInfo: extractedMedicalInfo.additionalInfo,
              provider: extractedMedicalInfo.provider,
              model: extractedMedicalInfo.model
            };
          } else {
            console.warn('⚠️ PDF extraction failed:', extractedMedicalInfo.error);
          }
        } catch (extractionError) {
          console.error('❌ Error extracting medical info from PDF:', extractionError);
          // 继续处理，即使提取失败
        }
      }
      
      // 上传所有文件到 Firebase Storage
      console.log(`📤 Uploading ${req.files.length} file(s) to Firebase Storage...`);
      try {
        const uploadResult = await firebaseService.uploadMultipleFiles(req.files, userEmail, 'personal-health-records');
        
        if (uploadResult.success) {
          healthRecordData.attachments = uploadResult.files;
          console.log(`✅ ${uploadResult.files.length} file(s) uploaded successfully`);
          
          // 如果有部分文件上传失败，记录警告
          if (uploadResult.errors && uploadResult.errors.length > 0) {
            console.warn(`⚠️ ${uploadResult.errors.length} file(s) failed to upload:`, uploadResult.errors);
          }
        } else {
          console.error('❌ File upload failed:', uploadResult.error);
          console.error('错误代码:', uploadResult.code || 'unknown');
          // 继续保存文本数据，即使文件上传失败
          // 但记录错误信息到数据中（过滤掉 undefined 值）
          healthRecordData.uploadErrors = {
            error: uploadResult.error || 'Unknown error',
            ...(uploadResult.code && { code: uploadResult.code }),
            timestamp: new Date().toISOString()
          };
        }
      } catch (uploadError) {
        console.error('❌ Exception during file upload:', uploadError);
        // 继续保存文本数据，即使文件上传失败
        healthRecordData.uploadErrors = {
          error: uploadError.message || 'Unknown error',
          ...(uploadError.code && { code: uploadError.code }),
          timestamp: new Date().toISOString()
        };
      }
    }

    // 保存到 Firestore
    console.log('💾 Saving personal health record to Firestore...');
    const saveResult = await firebaseService.savePersonalHealthRecord(userEmail, healthRecordData);
    
    if (!saveResult.success) {
      throw new Error(saveResult.error);
    }

    console.log('✅ Personal health record saved successfully');
    res.status(201).json({
      success: true,
      message: 'Personal health record saved successfully',
      recordId: saveResult.id,
      data: saveResult.data,
      pdfExtraction: extractedMedicalInfo ? {
        success: extractedMedicalInfo.success,
        medicalHistory: extractedMedicalInfo.medicalHistory,
        medications: extractedMedicalInfo.medications
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

// 注意：这个路由已经在第189行定义了，这里删除重复定义
// 路由顺序很重要：具体路由（如 /personal-health-record）必须在参数路由（如 /:id）之前

module.exports = router; 