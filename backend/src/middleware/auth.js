const jwt = require('jsonwebtoken');
const firebaseService = require('../services/firebaseService');

// JWT认证中间件
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '未提供认证token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    console.log('🔐 JWT解码成功:', decoded);
    
    // 验证用户是否存在
    const userResult = await firebaseService.getUserById(decoded.userId);
    if (!userResult.success) {
      console.error('❌ 用户不存在:', decoded.userId);
      return res.status(401).json({ error: '用户不存在' });
    }

    req.user = userResult.user;
    console.log('✅ 用户认证成功:', req.user.id, '邮箱:', req.user.email);
    next();
  } catch (error) {
    console.error('❌ Token验证错误:', error);
    return res.status(403).json({ error: '无效的token' });
  }
};

// 可选的认证中间件（不强制要求认证）
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const userResult = await firebaseService.getUserById(decoded.userId);
    
    if (userResult.success) {
      req.user = userResult.user;
    } else {
      req.user = null;
    }
    
    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

module.exports = { authenticateToken, optionalAuth }; 