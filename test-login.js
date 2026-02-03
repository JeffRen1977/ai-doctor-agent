/**
 * 登录问题诊断脚本
 * 使用方法: node test-login.js
 */

const axios = require('axios');
require('dotenv').config({ path: './backend/.env' });

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000';

console.log('🔍 开始诊断登录问题...\n');
console.log('='.repeat(50));

// 1. 检查后端服务是否运行
async function checkBackendHealth() {
  console.log('\n1. 检查后端服务健康状态...');
  try {
    const response = await axios.get(`${API_BASE_URL}/health`, {
      timeout: 5000
    });
    console.log('   ✅ 后端服务正在运行');
    console.log('   📊 状态:', response.data.status);
    return true;
  } catch (error) {
    console.log('   ❌ 后端服务未运行或无法访问');
    console.log('   💡 错误:', error.message);
    console.log('   💡 请确保后端服务已启动: cd backend && npm start');
    return false;
  }
}

// 2. 检查API路由
async function checkAPIRoute() {
  console.log('\n2. 检查API路由...');
  try {
    // 测试一个简单的POST请求（不发送数据，看路由是否存在）
    const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email: 'test@example.com',
      password: 'test123'
    }, {
      validateStatus: (status) => status < 500 // 接受400和401状态码
    });
    
    if (response.status === 400 || response.status === 401) {
      console.log('   ✅ API路由存在（返回验证错误是正常的）');
      return true;
    }
    return false;
  } catch (error) {
    if (error.response) {
      if (error.response.status === 400 || error.response.status === 401) {
        console.log('   ✅ API路由存在（返回验证错误是正常的）');
        return true;
      } else if (error.response.status === 404) {
        console.log('   ❌ API路由不存在（404错误）');
        console.log('   💡 检查后端路由配置: backend/src/index.js');
        return false;
      }
    } else if (error.code === 'ECONNREFUSED') {
      console.log('   ❌ 无法连接到后端服务');
      console.log('   💡 请确保后端服务正在运行');
      return false;
    } else {
      console.log('   ❌ 未知错误:', error.message);
      return false;
    }
  }
}

// 3. 检查Firebase配置
function checkFirebaseConfig() {
  console.log('\n3. 检查Firebase配置...');
  const requiredVars = [
    'FIREBASE_API_KEY',
    'FIREBASE_AUTH_DOMAIN',
    'FIREBASE_PROJECT_ID',
    'FIREBASE_STORAGE_BUCKET',
    'FIREBASE_MESSAGING_SENDER_ID',
    'FIREBASE_APP_ID'
  ];
  
  let allConfigured = true;
  requiredVars.forEach(varName => {
    if (process.env[varName]) {
      console.log(`   ✅ ${varName} 已配置`);
    } else {
      console.log(`   ❌ ${varName} 未配置`);
      allConfigured = false;
    }
  });
  
  if (!allConfigured) {
    console.log('   💡 请在 backend/.env 文件中配置Firebase环境变量');
  }
  
  return allConfigured;
}

// 4. 检查JWT配置
function checkJWTConfig() {
  console.log('\n4. 检查JWT配置...');
  if (process.env.JWT_SECRET) {
    console.log('   ✅ JWT_SECRET 已配置');
    return true;
  } else {
    console.log('   ⚠️  JWT_SECRET 未配置（将使用默认值）');
    console.log('   💡 建议: 在 backend/.env 中设置 JWT_SECRET');
    return false;
  }
}

// 5. 测试登录（使用测试账户）
async function testLogin() {
  console.log('\n5. 测试登录功能...');
  
  // 测试账户（根据代码中的测试用户）
  const testEmail = 'jianfengren.sd@gmail.com';
  const testPassword = '123456';
  
  try {
    const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email: testEmail,
      password: testPassword
    });
    
    if (response.data.user && response.data.token) {
      console.log('   ✅ 登录成功！');
      console.log('   👤 用户:', response.data.user.email);
      console.log('   🔑 Token长度:', response.data.token.length);
      return true;
    } else {
      console.log('   ❌ 登录失败: 响应中缺少用户信息或token');
      return false;
    }
  } catch (error) {
    if (error.response) {
      console.log('   ❌ 登录失败');
      console.log('   📊 状态码:', error.response.status);
      console.log('   💬 错误信息:', error.response.data?.error || error.response.data?.message);
      
      if (error.response.status === 401) {
        console.log('   💡 可能原因:');
        console.log('      - 邮箱或密码错误');
        console.log('      - Firebase认证失败');
        console.log('      - 用户不存在');
      } else if (error.response.status === 400) {
        console.log('   💡 可能原因:');
        console.log('      - 请求格式错误');
        console.log('      - 邮箱格式无效');
        console.log('      - 密码长度不足（最少6位）');
      } else if (error.response.status === 500) {
        console.log('   💡 可能原因:');
        console.log('      - 服务器内部错误');
        console.log('      - Firebase配置错误');
        console.log('      - 数据库连接问题');
      }
    } else {
      console.log('   ❌ 网络错误:', error.message);
      console.log('   💡 请检查网络连接和后端服务状态');
    }
    return false;
  }
}

// 6. 检查CORS配置
function checkCORSConfig() {
  console.log('\n6. 检查CORS配置...');
  const frontendUrl = process.env.FRONTEND_URL;
  if (frontendUrl) {
    console.log('   ✅ FRONTEND_URL 已配置:', frontendUrl);
  } else {
    console.log('   ⚠️  FRONTEND_URL 未配置');
    console.log('   💡 如果遇到CORS错误，请设置 FRONTEND_URL');
  }
}

// 主函数
async function main() {
  console.log(`🌐 API Base URL: ${API_BASE_URL}\n`);
  
  const results = {
    backendHealth: await checkBackendHealth(),
    apiRoute: await checkAPIRoute(),
    firebaseConfig: checkFirebaseConfig(),
    jwtConfig: checkJWTConfig(),
    corsConfig: checkCORSConfig(),
    loginTest: false
  };
  
  // 只有在其他检查都通过时才测试登录
  if (results.backendHealth && results.apiRoute) {
    results.loginTest = await testLogin();
  } else {
    console.log('\n⚠️  跳过登录测试（后端服务或API路由不可用）');
  }
  
  // 总结
  console.log('\n' + '='.repeat(50));
  console.log('📋 诊断总结:\n');
  
  const allPassed = Object.values(results).every(r => r === true || r === undefined);
  
  if (allPassed) {
    console.log('✅ 所有检查通过！登录功能应该正常工作。');
  } else {
    console.log('❌ 发现问题，请根据上述建议进行修复。\n');
    console.log('常见问题解决方案:');
    console.log('1. 后端服务未运行: cd backend && npm start');
    console.log('2. Firebase配置错误: 检查 backend/.env 中的Firebase配置');
    console.log('3. API路由404: 检查 backend/src/index.js 中的路由配置');
    console.log('4. 网络问题: 检查防火墙和代理设置');
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('\n💡 提示:');
  console.log('- 查看详细错误信息: 检查浏览器控制台和网络请求');
  console.log('- 查看后端日志: 检查后端服务终端输出');
  console.log('- 测试API: 使用 curl 或 Postman 测试 /api/auth/login 端点');
}

// 运行诊断
main().catch(error => {
  console.error('❌ 诊断过程出错:', error);
  process.exit(1);
});
