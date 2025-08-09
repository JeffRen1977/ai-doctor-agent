const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const firebaseService = require('../services/firebaseService');

const router = express.Router();

// 登录验证schema
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required()
});

// 注册验证schema
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  name: Joi.string().min(2).max(50).required()
});

// 用户注册
router.post('/register', async (req, res) => {
  try {
    // 验证输入
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { email, password, name } = value;

    // 检查用户是否已存在
    const userExists = await firebaseService.checkUserExists(email);
    if (userExists) {
      return res.status(400).json({ error: '该邮箱已被注册' });
    }

    // 注册用户
    const result = await firebaseService.registerUser(email, password, name);
    
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    // 生成JWT token
    const token = jwt.sign(
      { userId: result.user.id, email: result.user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // 返回用户信息和token
    res.status(201).json({
      user: result.user,
      token
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 用户登录
router.post('/login', async (req, res) => {
  try {
    // 验证输入
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { email, password } = value;

    // 登录用户
    const result = await firebaseService.loginUser(email, password);
    
    if (!result.success) {
      return res.status(401).json({ error: result.error });
    }

    // 生成JWT token
    const token = jwt.sign(
      { userId: result.user.id, email: result.user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // 返回用户信息和token
    res.json({
      user: result.user,
      token
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 用户登出
router.post('/logout', async (req, res) => {
  try {
    const result = await firebaseService.logoutUser();
    
    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json({ message: '登出成功' });
  } catch (error) {
    console.error('登出错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 获取当前用户信息
router.get('/me', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: '未提供认证token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const result = await firebaseService.getUserById(decoded.userId);
    
    if (!result.success) {
      return res.status(404).json({ error: result.error });
    }

    res.json(result.user);
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(401).json({ error: '无效的token' });
  }
});

// 更新用户信息
router.put('/profile', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: '未提供认证token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const { name, avatar } = req.body;

    const updates = {};
    if (name) updates.name = name;
    if (avatar !== undefined) updates.avatar = avatar;

    const result = await firebaseService.updateUser(decoded.userId, updates);
    
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({ message: '用户信息更新成功' });
  } catch (error) {
    console.error('更新用户信息错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

module.exports = router; 