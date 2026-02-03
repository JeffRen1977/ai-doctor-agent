#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting AI Doctor Agent Mobile Development...\n');

// Get project root directory (parent of scripts folder)
const projectRoot = path.resolve(__dirname, '..');

// 启动后端服务器
const backend = spawn('npm', ['run', 'dev:backend'], {
  cwd: projectRoot,
  stdio: 'inherit',
  shell: true
});

// 等待2秒后启动前端
setTimeout(() => {
  const frontend = spawn('npm', ['run', 'dev:mobile'], {
    cwd: projectRoot,
    stdio: 'inherit',
    shell: true
  });

  frontend.on('error', (err) => {
    console.error('❌ Frontend error:', err);
  });

  // 处理退出信号
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down servers...');
    backend.kill('SIGINT');
    frontend.kill('SIGINT');
    process.exit(0);
  });

}, 2000);

backend.on('error', (err) => {
  console.error('❌ Backend error:', err);
});

console.log('📱 Mobile development server will be available at:');
console.log('   http://localhost:3000');
console.log('   http://[your-ip]:3000 (for mobile devices)');
console.log('\n💡 Press Ctrl+C to stop both servers');

