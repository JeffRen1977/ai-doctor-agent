#!/usr/bin/env node

/**
 * Vercel Deploy Hook 触发脚本
 * 
 * 使用方法：
 * 1. 设置环境变量：export VERCEL_DEPLOY_HOOK_URL="your-hook-url"
 * 2. 运行脚本：node scripts/trigger-vercel-deploy.js
 * 
 * 或者直接在命令行中指定 URL：
 * VERCEL_DEPLOY_HOOK_URL="your-hook-url" node scripts/trigger-vercel-deploy.js
 */

const https = require('https');
const http = require('http');

// 从环境变量或命令行参数获取 Hook URL
const DEPLOY_HOOK_URL = process.env.VERCEL_DEPLOY_HOOK_URL || process.argv[2];

if (!DEPLOY_HOOK_URL) {
  console.error('❌ Error: VERCEL_DEPLOY_HOOK_URL is required');
  console.error('');
  console.error('Usage:');
  console.error('  export VERCEL_DEPLOY_HOOK_URL="https://api.vercel.com/v1/integrations/deploy/xxxxx/xxxxx"');
  console.error('  node scripts/trigger-vercel-deploy.js');
  console.error('');
  console.error('Or:');
  console.error('  VERCEL_DEPLOY_HOOK_URL="your-hook-url" node scripts/trigger-vercel-deploy.js');
  console.error('');
  console.error('To get your Deploy Hook URL:');
  console.error('  1. Go to Vercel Dashboard → Settings → Git → Deploy Hooks');
  console.error('  2. Create a new hook or copy existing hook URL');
  process.exit(1);
}

// 验证 URL 格式
let url;
try {
  url = new URL(DEPLOY_HOOK_URL);
} catch (error) {
  console.error('❌ Error: Invalid URL format');
  console.error('URL:', DEPLOY_HOOK_URL);
  process.exit(1);
}

// 选择 HTTP 或 HTTPS
const client = url.protocol === 'https:' ? https : http;

console.log('🚀 Triggering Vercel deployment...');
console.log('URL:', DEPLOY_HOOK_URL);
console.log('');

const options = {
  hostname: url.hostname,
  port: url.port || (url.protocol === 'https:' ? 443 : 80),
  path: url.pathname + url.search,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'Vercel-Deploy-Hook-Trigger/1.0',
  },
  timeout: 30000, // 30 seconds
};

const req = client.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      console.log('✅ Deployment triggered successfully!');
      console.log('Status Code:', res.statusCode);
      console.log('');
      
      // 尝试解析 JSON 响应
      try {
        const response = JSON.parse(data);
        if (response.job) {
          console.log('Job ID:', response.job.id);
          console.log('Job State:', response.job.state);
        }
        if (response.deployment) {
          console.log('Deployment URL:', response.deployment.url);
        }
      } catch (e) {
        // 如果不是 JSON，直接输出
        if (data) {
          console.log('Response:', data);
        }
      }
      console.log('');
      console.log('📊 Check deployment status at:');
      console.log('   https://vercel.com/dashboard');
    } else {
      console.error('❌ Failed to trigger deployment');
      console.error('Status Code:', res.statusCode);
      console.error('Response:', data);
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error:', error.message);
  if (error.code === 'ENOTFOUND') {
    console.error('   Could not resolve hostname. Check your internet connection.');
  } else if (error.code === 'ECONNREFUSED') {
    console.error('   Connection refused. Check the URL.');
  } else if (error.code === 'ETIMEDOUT') {
    console.error('   Request timeout. The server may be slow or unreachable.');
  }
  process.exit(1);
});

req.on('timeout', () => {
  console.error('❌ Request timeout');
  req.destroy();
  process.exit(1);
});

// 发送请求
req.end();
