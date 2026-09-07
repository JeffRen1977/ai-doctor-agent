const { verifyAuthToken } = require('../config/jwtConfig');
const firebaseService = require('../services/firebaseService');

// JWT认证中间件
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '未提供认证token' });
  }

  try {
    const decoded = verifyAuthToken(token);
    const userResult = await firebaseService.getUserById(decoded.userId);
    if (!userResult.success) {
      return res.status(401).json({ error: '用户不存在' });
    }
    req.user = userResult.user;
    next();
  } catch (error) {
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
    const decoded = verifyAuthToken(token);
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

/** 管理接口：必须已经过 authenticateToken，且 role 为 admin */
function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: '需要管理员权限' });
  }
  return next();
}

module.exports = { authenticateToken, optionalAuth, requireAdmin }; 