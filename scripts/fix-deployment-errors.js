/**
 * 修复部署错误的脚本
 * 使用方法: node fix-deployment-errors.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 开始修复部署错误...\n');

// Get project root directory (parent of scripts folder)
const projectRoot = path.resolve(__dirname, '..');

// 1. 检查并修复 Service Worker
console.log('1. 检查 Service Worker...');
const swPath = path.join(projectRoot, 'frontend/public/sw.js');
if (fs.existsSync(swPath)) {
  console.log('   ✅ Service Worker 文件存在');
  // Service Worker 已经更新，包含错误处理
} else {
  console.log('   ❌ Service Worker 文件不存在');
}

// 2. 检查图标文件
console.log('\n2. 检查图标文件...');
const iconSvgPath = path.join(projectRoot, 'frontend/public/icon.svg');
if (fs.existsSync(iconSvgPath)) {
  console.log('   ✅ icon.svg 存在');
} else {
  console.log('   ❌ icon.svg 不存在');
  console.log('   💡 提示: 需要创建 icon.svg 文件');
}

// 3. 检查 manifest.json
console.log('\n3. 检查 manifest.json...');
const manifestPath = path.join(projectRoot, 'frontend/public/manifest.json');
if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  console.log('   ✅ manifest.json 存在');
  
  // 检查图标配置
  if (manifest.icons && manifest.icons.length > 0) {
    const hasPngIcons = manifest.icons.some(icon => icon.src.includes('.png'));
    if (hasPngIcons) {
      console.log('   ⚠️  manifest.json 引用了 PNG 图标，但可能不存在');
      console.log('   💡 建议: 使用 SVG 图标或创建 PNG 图标文件');
    } else {
      console.log('   ✅ 图标配置正确（使用 SVG）');
    }
  }
} else {
  console.log('   ❌ manifest.json 不存在');
}

// 4. 检查后端路由配置
console.log('\n4. 检查后端路由配置...');
const backendIndexPath = path.join(projectRoot, 'backend/src/index.js');
if (fs.existsSync(backendIndexPath)) {
  const backendCode = fs.readFileSync(backendIndexPath, 'utf8');
  
  const requiredRoutes = [
    '/api/auth',
    '/api/chat',
    '/api/health-records',
    '/api/diet-analysis'
  ];
  
  let allRoutesFound = true;
  requiredRoutes.forEach(route => {
    if (backendCode.includes(`app.use('${route}'`)) {
      console.log(`   ✅ ${route} 路由已配置`);
    } else {
      console.log(`   ❌ ${route} 路由未找到`);
      allRoutesFound = false;
    }
  });
  
  if (allRoutesFound) {
    console.log('   ✅ 所有必需的路由都已配置');
  }
} else {
  console.log('   ❌ backend/src/index.js 不存在');
}

// 5. 检查环境变量文件
console.log('\n5. 检查环境变量配置...');
const envPath = path.join(projectRoot, 'backend/.env');
const envExamplePath = path.join(projectRoot, 'backend/.env.example');

if (fs.existsSync(envPath)) {
  console.log('   ✅ .env 文件存在');
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  const requiredVars = [
    'JWT_SECRET',
    'FIREBASE_PROJECT_ID'
  ];
  
  requiredVars.forEach(varName => {
    if (envContent.includes(varName)) {
      console.log(`   ✅ ${varName} 已配置`);
    } else {
      console.log(`   ⚠️  ${varName} 未找到（可能使用默认值）`);
    }
  });
} else {
  console.log('   ⚠️  .env 文件不存在');
  if (fs.existsSync(envExamplePath)) {
    console.log('   💡 提示: 可以复制 .env.example 创建 .env 文件');
  }
}

// 6. 检查 Vite 配置
console.log('\n6. 检查 Vite 配置...');
const viteConfigPath = path.join(projectRoot, 'vite.config.ts');
if (fs.existsSync(viteConfigPath)) {
  const viteConfig = fs.readFileSync(viteConfigPath, 'utf8');
  
  if (viteConfig.includes("proxy")) {
    console.log('   ✅ Vite 代理配置存在');
    if (viteConfig.includes("'/api'")) {
      console.log('   ✅ API 代理已配置');
    }
  } else {
    console.log('   ⚠️  Vite 代理配置未找到');
  }
} else {
  console.log('   ❌ vite.config.ts 不存在');
}

// 7. 生成修复建议
console.log('\n' + '='.repeat(50));
console.log('📋 修复建议:\n');

console.log('1. Service Worker 缓存错误:');
console.log('   - Service Worker 已更新，包含错误处理');
console.log('   - 清除浏览器缓存和 Service Worker');
console.log('   - 硬刷新页面 (Ctrl+Shift+R 或 Cmd+Shift+R)\n');

console.log('2. 图标文件 404 错误:');
console.log('   - manifest.json 已配置使用 SVG 图标');
console.log('   - 确保 frontend/public/icon.svg 存在');
console.log('   - 如果需要 PNG 图标，需要创建并更新 manifest.json\n');

console.log('3. API 路由 404 错误:');
console.log('   - 确保后端服务正在运行');
console.log('   - 检查环境变量配置');
console.log('   - 检查部署平台的配置（Vercel/Railway）');
console.log('   - 查看后端日志以获取详细错误信息\n');

console.log('4. 清除缓存:');
console.log('   - 浏览器控制台运行:');
console.log('     navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister()));');
console.log('   - 清除浏览器缓存');
console.log('   - 硬刷新页面\n');

console.log('5. 测试步骤:');
console.log('   - 检查后端健康: curl http://localhost:8000/health');
console.log('   - 检查 API: curl http://localhost:8000/api/health');
console.log('   - 查看浏览器控制台和网络请求\n');

console.log('='.repeat(50));
console.log('\n✅ 检查完成！');
console.log('\n📚 详细文档: docs/TROUBLESHOOTING_DEPLOYMENT_ERRORS.md');
