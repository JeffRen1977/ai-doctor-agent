const express = require('express');
const Joi = require('joi');

const router = express.Router();

// 模拟健康记录数据
const healthRecords = new Map();

// 健康记录验证schema
const healthRecordSchema = Joi.object({
  date: Joi.string().required(),
  type: Joi.string().required(),
  description: Joi.string().required(),
  severity: Joi.string().valid('low', 'medium', 'high').required(),
  status: Joi.string().valid('active', 'resolved').required()
});

// 获取健康记录列表
router.get('/', (req, res) => {
  try {
    const userId = req.headers['user-id'] || '1';
    const userRecords = healthRecords.get(userId) || [];
    
    res.json(userRecords);
  } catch (error) {
    console.error('获取健康记录错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 创建健康记录
router.post('/', (req, res) => {
  try {
    // 验证输入
    const { error, value } = healthRecordSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const userId = req.headers['user-id'] || '1';
    const newRecord = {
      id: Date.now().toString(),
      ...value,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (!healthRecords.has(userId)) {
      healthRecords.set(userId, []);
    }

    const userRecords = healthRecords.get(userId);
    userRecords.push(newRecord);

    res.status(201).json(newRecord);
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

module.exports = router; 