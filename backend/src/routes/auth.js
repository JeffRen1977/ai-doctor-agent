const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const firebaseService = require('../services/firebaseService');
const adapters = require('../adapters');
const { userRepo } = require('../repositories');

const router = express.Router();
// 由「当前加载的 adapter」决定认证方式，不读 env，避免 .env 未生效仍走 Firebase
function useMongoAuth() {
  return !!adapters.__useMongoAuth;
}

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
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { email, password, name } = value;

    const mongoAuth = useMongoAuth();
    if (process.env.NODE_ENV !== 'production') {
      console.log('[auth/register] useMongoAuth=' + mongoAuth + ' (由当前 adapter 决定)');
    }
    if (mongoAuth) {
      // MongoDB：本地认证，不经过 Firebase Auth
      const existing = await userRepo.getByEmail(email);
      if (existing) {
        return res.status(400).json({ error: '该邮箱已被注册' });
      }
      const passwordHash = await bcrypt.hash(password, 10);
      const uid = 'local-' + Date.now() + '-' + Math.random().toString(36).slice(2, 11);
      await userRepo.setByEmail(email, {
        uid,
        email,
        name,
        passwordHash,
        avatar: null,
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      const token = jwt.sign(
        { userId: uid, email },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );
      return res.status(201).json({
        user: { id: uid, email, name, avatar: null },
        token
      });
    }

    // Firebase：检查并注册
    const userExists = await firebaseService.checkUserExists(email);
    if (userExists) {
      return res.status(400).json({ error: '该邮箱已被注册' });
    }
    const result = await firebaseService.registerUser(email, password, name);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    const token = jwt.sign(
      { userId: result.user.id, email: result.user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );
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
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { email, password } = value;

    if (useMongoAuth()) {
      // MongoDB：本地认证，校验密码哈希
      const userData = await userRepo.getByEmail(email);
      if (!userData || !userData.passwordHash) {
        return res.status(401).json({ error: '邮箱或密码错误' });
      }
      const match = await bcrypt.compare(password, userData.passwordHash);
      if (!match) {
        return res.status(401).json({ error: '邮箱或密码错误' });
      }
      const token = jwt.sign(
        { userId: userData.uid, email: userData.email },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );
      return res.json({
        user: {
          id: userData.uid,
          email: userData.email,
          name: userData.name,
          avatar: userData.avatar
        },
        token
      });
    }

    // Firebase 认证
    const result = await firebaseService.loginUser(email, password);
    if (!result.success) {
      return res.status(401).json({ error: result.error });
    }
    const token = jwt.sign(
      { userId: result.user.id, email: result.user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );
    res.json({
      user: result.user,
      token
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// Token刷新端点
router.post('/refresh-token', async (req, res) => {
  try {
    const { userId, email } = req.body;
    
    if (!userId || !email) {
      return res.status(400).json({ error: '缺少用户ID或邮箱' });
    }

    // 验证用户是否存在
    const userResult = await firebaseService.getUserById(userId);
    if (!userResult.success) {
      return res.status(401).json({ error: '用户不存在' });
    }

    // 生成新的JWT token
    const newToken = jwt.sign(
      { userId, email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    console.log('🔐 Token refreshed successfully for user:', email);

    res.json({
      token: newToken,
      message: 'Token refreshed successfully'
    });
  } catch (error) {
    console.error('Token刷新错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 为现有Firebase Auth用户创建用户文档
router.post('/create-document', async (req, res) => {
  try {
    const { email, uid, name } = req.body;
    
    if (!email || !uid) {
      return res.status(400).json({ error: '邮箱和用户ID是必需的' });
    }

    const result = await firebaseService.createUserDocumentForExistingUser(email, uid, name || 'User');
    
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({ message: result.message });
  } catch (error) {
    console.error('创建用户文档错误:', error);
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

// 获取用户详细资料
router.get('/profile/:email', async (req, res) => {
  try {
    const { email } = req.params;
    
    if (!email) {
      return res.status(400).json({ error: '邮箱是必需的' });
    }

    const result = await firebaseService.getUserProfile(email);
    
    if (!result.success) {
      return res.status(404).json({ error: result.error });
    }

    res.json({ profile: result.profile });
  } catch (error) {
    console.error('获取用户资料错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 更新用户详细资料
router.put('/profile/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const profileData = req.body;
    
    if (!email) {
      return res.status(400).json({ error: '邮箱是必需的' });
    }

    const result = await firebaseService.updateUserProfile(email, profileData);
    
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({ message: '用户资料更新成功', profile: result.profile });
  } catch (error) {
    console.error('更新用户资料错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

module.exports = router; 