const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');

const router = express.Router();

// 模拟用户数据库
const users = [
  {
    id: '1',
    email: 'demo@example.com',
    password: '$2a$10$Rk4fN1EcgzLtmSqtT6GBn.M6pI6EmPrP0bXsS5sHYlLmzLex5exo.', // password: 123456
    name: '张三',
    avatar: null
  }
];

// 登录验证schema
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required()
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

    // 查找用户
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ error: '邮箱或密码错误' });
    }

    // 验证密码
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: '邮箱或密码错误' });
    }

    // 生成JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // 返回用户信息和token
    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar
      },
      token
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 用户登出
router.post('/logout', (req, res) => {
  // 在实际应用中，可以将token加入黑名单
  res.json({ message: '登出成功' });
});

// 获取当前用户信息
router.get('/me', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: '未提供认证token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = users.find(u => u.id === decoded.userId);
    
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar
    });
  } catch (error) {
    res.status(401).json({ error: '无效的token' });
  }
});

module.exports = router; 