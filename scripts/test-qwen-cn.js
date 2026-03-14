/**
 * 本地测试：中国区 + 通义千问配置
 * 用法：在项目根目录执行 node scripts/test-qwen-cn.js
 * 会加载 backend/.env，检查 DEPLOYMENT_REGION、DASHSCOPE_API_KEY 及默认 provider，并可选调用千问 healthChat 一次。
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const DEPLOYMENT_REGION = process.env.DEPLOYMENT_REGION || '';
const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY || '';
const hasKey = typeof DASHSCOPE_API_KEY === 'string' && DASHSCOPE_API_KEY.trim().length > 0;
// 千问端点区域：后端会按 DASHSCOPE_REGION 或 DEPLOYMENT_REGION 自动选择
const effectiveRegion = (process.env.DASHSCOPE_REGION || process.env.DEPLOYMENT_REGION || 'cn').toLowerCase();

console.log('=== 中国区 + 千问 配置检查 ===\n');
console.log('DEPLOYMENT_REGION:', DEPLOYMENT_REGION || '(未设置)');
console.log('千问端点区域:', effectiveRegion, effectiveRegion === 'intl' ? '(新加坡/国际)' : effectiveRegion === 'us' ? '(美国)' : '(中国)');
console.log('DASHSCOPE_API_KEY:', hasKey ? `已设置 (长度 ${DASHSCOPE_API_KEY.trim().length})` : '未设置或为空');
console.log('');

// 使用 backend 的 config 和 service（需在 backend 目录 context 下 require，或从项目根指定 path）
const backendPath = path.join(__dirname, '..', 'backend', 'src');
const aiProviderConfig = require(path.join(backendPath, 'config', 'aiProviderConfig.js'));
const aiServiceFactory = require(path.join(backendPath, 'services', 'aiServiceFactory.js'));

const defaultProvider = aiProviderConfig.getDefaultProvider();
const defaultModel = aiProviderConfig.getDefaultModel(defaultProvider);
const available = Object.keys(aiServiceFactory.availableServices || {});

console.log('默认 AI 提供方 (getDefaultProvider):', defaultProvider);
console.log('默认模型:', defaultModel);
console.log('当前可用提供方:', available.join(', ') || '(无)');
if (DEPLOYMENT_REGION === 'cn' && defaultProvider !== 'qwen') {
  console.log('💡 DEPLOYMENT_REGION=cn 时默认应为 qwen；当前为', defaultProvider, '。若需默认千问，请勿设置 DEFAULT_AI_PROVIDER 或设为 DEFAULT_AI_PROVIDER=qwen');
}
console.log('');

if (!aiServiceFactory.availableServices || !aiServiceFactory.availableServices.qwen) {
  console.log('❌ 千问未在可用列表中，请确认 DASHSCOPE_API_KEY 在 backend/.env 中正确配置。');
  process.exit(1);
}

console.log('✅ 千问已初始化并可用。');

// 可选：调用一次 healthChat 验证 API Key 是否有效
async function testHealthChat() {
  const qwenService = require(path.join(backendPath, 'services', 'adapters', 'qwenService.js'));
  if (!qwenService.healthChat) {
    console.log('(跳过 healthChat 调用：适配器未暴露该方法)');
    return;
  }
  console.log('\n正在用千问发送一条测试健康问答...');
  try {
    const result = await qwenService.healthChat('你好，请用一句话介绍你自己。', '', { model: 'qwen-turbo', language: 'zh' });
    if (result.success && (result.text || result.response || result.message)) {
      const text = result.text || result.response || result.message;
      console.log('✅ 千问回复:', (text || '').substring(0, 200) + (text && text.length > 200 ? '...' : ''));
    } else {
      console.log('❌ 千问返回异常:', result.error || result);
    }
  } catch (err) {
    console.log('❌ 千问调用失败:', err.message);
    if (String(err.message || '').includes('401')) {
      console.log('💡 401 表示认证失败。请确认：');
      console.log('   1) Key 所在区域与 DEPLOYMENT_REGION 一致（新加坡 Key → DEPLOYMENT_REGION=intl；中国 Key → cn）');
      console.log('   2) Key 未过期、未删除，且已开通对应模型（如 qwen-turbo）');
    }
  }
}

testHealthChat()
  .then(() => {
    console.log('\n=== 检查完成 ===');
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
