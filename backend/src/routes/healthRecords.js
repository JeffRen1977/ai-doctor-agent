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
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.headers['user-id'] || '1';
    
    // 验证输入
    const { error, value } = healthRecordSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const userRecords = healthRecords.get(userId) || [];
    const recordIndex = userRecords.findIndex(record => record.id === id);

    if (recordIndex === -1) {
      return res.status(404).json({ error: '健康记录不存在' });
    }

    const updatedRecord = {
      ...userRecords[recordIndex],
      ...value,
      updatedAt: new Date()
    };

    userRecords[recordIndex] = updatedRecord;

    res.json(updatedRecord);
  } catch (error) {
    console.error('更新健康记录错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 删除健康记录
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.headers['user-id'] || '1';
    
    const userRecords = healthRecords.get(userId) || [];
    const recordIndex = userRecords.findIndex(record => record.id === id);

    if (recordIndex === -1) {
      return res.status(404).json({ error: '健康记录不存在' });
    }

    userRecords.splice(recordIndex, 1);

    res.json({ message: '健康记录删除成功' });
  } catch (error) {
    console.error('删除健康记录错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 获取单个健康记录
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.headers['user-id'] || '1';
    
    const userRecords = healthRecords.get(userId) || [];
    const record = userRecords.find(record => record.id === id);

    if (!record) {
      return res.status(404).json({ error: '健康记录不存在' });
    }

    res.json(record);
  } catch (error) {
    console.error('获取健康记录错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

const fhirService = require('../services/fhirService');
const firebaseService = require('../services/firebaseService');
const multer = require('multer');

// Configure multer for memory storage to handle file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

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

module.exports = router; 