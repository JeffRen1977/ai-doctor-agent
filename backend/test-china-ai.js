/**
 * 测试中国大模型服务
 * 使用方法: node test-china-ai.js
 */

require('dotenv').config();
const aiServiceFactory = require('./src/services/aiServiceFactory');

async function testChinaAIServices() {
  console.log('🧪 测试中国大模型服务\n');
  console.log('='.repeat(50));
  
  // 检查可用服务
  const availableServices = aiServiceFactory.getAvailableServices();
  console.log('\n📋 可用的AI服务:');
  Object.keys(availableServices).forEach(provider => {
    const service = availableServices[provider];
    console.log(`  ✅ ${service.name} (${provider})`);
    console.log(`     模型: ${service.models.join(', ')}`);
  });
  
  console.log('\n' + '='.repeat(50));
  
  // 测试文心一言
  if (availableServices.ernie) {
    console.log('\n🤖 测试文心一言服务...');
    try {
      const result = await aiServiceFactory.healthChat(
        '我最近总是头痛，应该怎么办？',
        '',
        { provider: 'ernie', model: 'ernie-bot' }
      );
      
      if (result.success) {
        console.log('✅ 文心一言测试成功');
        console.log(`📝 回复: ${result.text.substring(0, 100)}...`);
      } else {
        console.log('❌ 文心一言测试失败:', result.error);
      }
    } catch (error) {
      console.log('❌ 文心一言测试错误:', error.message);
    }
  } else {
    console.log('\n⚠️ 文心一言服务不可用（请检查BAIDU_API_KEY和BAIDU_SECRET_KEY）');
  }
  
  // 测试通义千问
  if (availableServices.qwen) {
    console.log('\n🤖 测试通义千问服务...');
    try {
      const result = await aiServiceFactory.healthChat(
        '我最近总是头痛，应该怎么办？',
        '',
        { provider: 'qwen', model: 'qwen-turbo' }
      );
      
      if (result.success) {
        console.log('✅ 通义千问测试成功');
        console.log(`📝 回复: ${result.text.substring(0, 100)}...`);
      } else {
        console.log('❌ 通义千问测试失败:', result.error);
      }
    } catch (error) {
      console.log('❌ 通义千问测试错误:', error.message);
    }
  } else {
    console.log('\n⚠️ 通义千问服务不可用（请检查DASHSCOPE_API_KEY）');
  }
  
  // 测试健康记录分析
  console.log('\n' + '='.repeat(50));
  console.log('\n📊 测试健康记录分析...');
  
  const healthData = {
    bloodPressure: '140/90',
    heartRate: 85,
    glucose: 110,
    cholesterol: 220
  };
  
  // 使用文心一言分析
  if (availableServices.ernie) {
    try {
      const result = await aiServiceFactory.analyzeHealthRecords(
        healthData,
        { provider: 'ernie' }
      );
      
      if (result.success) {
        console.log('✅ 文心一言健康分析成功');
        console.log(`📝 分析结果: ${result.analysis.substring(0, 150)}...`);
      }
    } catch (error) {
      console.log('❌ 文心一言健康分析错误:', error.message);
    }
  }
  
  // 使用通义千问分析
  if (availableServices.qwen) {
    try {
      const result = await aiServiceFactory.analyzeHealthRecords(
        healthData,
        { provider: 'qwen' }
      );
      
      if (result.success) {
        console.log('✅ 通义千问健康分析成功');
        console.log(`📝 分析结果: ${result.analysis.substring(0, 150)}...`);
      }
    } catch (error) {
      console.log('❌ 通义千问健康分析错误:', error.message);
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('\n✅ 测试完成！');
  console.log('\n💡 提示:');
  console.log('  - 如果服务不可用，请检查环境变量配置');
  console.log('  - 文心一言需要: BAIDU_API_KEY, BAIDU_SECRET_KEY');
  console.log('  - 通义千问需要: DASHSCOPE_API_KEY');
  console.log('  - 详细配置请查看: docs/CHINA_DEPLOYMENT_GUIDE.md');
}

// 运行测试
testChinaAIServices().catch(error => {
  console.error('❌ 测试过程出错:', error);
  process.exit(1);
});
