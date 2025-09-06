const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function verifyGeminiKey() {
  console.log('🔍 验证Gemini API Key...');
  
  const apiKey = process.env.GEMINI_API_KEY;
  console.log('API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : '未设置');
  
  if (!apiKey) {
    console.log('❌ 未找到GEMINI_API_KEY环境变量');
    return;
  }
  
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    console.log('🧪 测试API连接...');
    const result = await model.generateContent('Hello, this is a test message.');
    const response = await result.response;
    
    console.log('✅ API Key验证成功！');
    console.log('📝 测试回复:', response.text());
    
  } catch (error) {
    console.log('❌ API Key验证失败:');
    console.log('错误类型:', error.constructor.name);
    console.log('错误信息:', error.message);
    
    if (error.status === 400) {
      console.log('\n💡 可能的解决方案:');
      console.log('1. 检查API Key是否正确');
      console.log('2. 确保已启用Gemini API服务');
      console.log('3. 检查API Key是否有正确的权限');
      console.log('4. 访问 https://aistudio.google.com/ 获取新的API Key');
    }
  }
}

verifyGeminiKey().catch(console.error);

