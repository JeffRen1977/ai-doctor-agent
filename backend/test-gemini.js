const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGemini() {
  try {
    // 使用环境变量中的API key
    const apiKey = "AIzaSyD7Y6zkOjJLM0Aa5eYIj2-t5q5Z4RLzZwY";
    console.log('Testing Gemini API with key:', apiKey.substring(0, 10) + '...');
    
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // 尝试不同的模型名称
    const models = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro'];
    
    for (const modelName of models) {
      try {
        console.log(`\n🔄 尝试模型: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        
        console.log('✅ Gemini AI 服务初始化成功');
        
        // 测试简单的生成
        const result = await model.generateContent('Hello, how are you?');
        const response = await result.response;
        
        console.log(`✅ Gemini API 测试成功! 使用模型: ${modelName}`);
        console.log('Response:', response.text());
        return; // 成功则退出
        
      } catch (modelError) {
        console.log(`❌ 模型 ${modelName} 失败:`, modelError.message);
        continue; // 尝试下一个模型
      }
    }
    
    console.log('❌ 所有模型都失败了');
    
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
