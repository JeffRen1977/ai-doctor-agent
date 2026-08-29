/**
 * Load backend/.env before any tests run so adapter init (OPENAI_API_KEY, etc.) sees env.
 * Jest does not run backend/src/index.js, so dotenv is not loaded otherwise.
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });

// JWT_SECRET 现在是强制项（backend/src/config/jwtConfig.js）。
// 若本地 .env 未提供，给单测一个确定性的测试密钥，避免测试依赖开发者机器配置。
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'jest-only-jwt-secret-'.padEnd(64, '0');
}
