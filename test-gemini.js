const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGemini() {
  try {
    // 使用环境变量中的API key
    const apiKey = "AIzaSyD7Y6zkOjJLM0Aa5eYIj2-t5q5Z4RLzZwY";
    console.log('Testing Gemini API with key:', apiKey.substring(0, 10) + '...');
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    console.log('✅ Gemini AI 服务初始化成功');
    
    // 测试简单的生成
    const result = await model.generateContent('Hello, how are you?');
    const response = await result.response;
    
    console.log('✅ Gemini API 测试成功!');
    console.log('Response:', response.text());
    
  } catch (error) {
    console.error('❌ Gemini API 测试失败:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      status: error.status
    });
  }
}

testGemini();
