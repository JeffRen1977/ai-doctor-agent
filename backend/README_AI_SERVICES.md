# AI服务测试指南

## 🧪 测试脚本

### 1. 测试OpenAI服务
```bash
node test-openai.js
```
这个脚本会测试OpenAI服务的基本功能，包括健康文档分析。

### 2. 测试Gemini服务
```bash
node test-gemini.js
```
这个脚本会测试Gemini服务的基本功能。

### 3. 演示AI服务功能
```bash
node demo-ai-services.js
```
这个脚本会演示所有可用的AI服务，包括比较模式。

## 🔧 环境配置

确保在 `.env` 文件中配置了必要的API密钥：

```bash
# Gemini AI Configuration
GEMINI_API_KEY=your-gemini-api-key-here

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key-here
```

## 📊 测试结果示例

### 成功输出示例
```
🎭 AI Services Demonstration
============================

📋 Available AI Services:
  ✅ Google Gemini (gemini)
     Models: gemini-1.5-pro, gemini-1.5-flash
  ✅ OpenAI (openai)
     Models: gpt-4, gpt-3.5-turbo

🧪 Testing AI Services with sample health data...

🤖 Testing Google Gemini...
  ✅ Analysis completed successfully
  📝 Analysis length: 1250 characters
  ⏱️ Processing time: 1250ms
  🎯 Model used: gemini-1.5-pro
  📊 Summary: 根据提供的健康数据，患者存在高血压、高胆固醇和血糖偏高的风险...

🤖 Testing OpenAI...
  ✅ Analysis completed successfully
  📝 Analysis length: 1180 characters
  ⏱️ Processing time: 2100ms
  🎯 Model used: gpt-4
  📊 Summary: 基于您的健康数据，我注意到几个需要关注的健康指标...

🔄 Testing comparison mode...
📊 Comparison Results:
  gemini: ✅ 1250ms - 1250 chars
  openai: ✅ 2100ms - 1180 chars

🎉 Demonstration completed!
```

## 🚀 前端测试

1. 启动后端服务：
```bash
npm start
```

2. 启动前端服务：
```bash
cd ../frontend && npm run dev
```

3. 在浏览器中访问健康记录页面
4. 上传测试文档
5. 选择AI服务提供商和模型
6. 点击"AI分析这些文档"按钮

## 🔍 故障排除

### 常见问题

1. **API密钥无效**
   - 检查 `.env` 文件中的API密钥是否正确
   - 验证API密钥是否有效且有足够权限

2. **服务不可用**
   - 检查网络连接
   - 验证API服务状态
   - 查看错误日志

3. **分析失败**
   - 检查文档格式是否支持
   - 验证文档内容是否有效
   - 查看AI服务的错误信息

### 调试技巧

1. 启用详细日志记录
2. 使用测试脚本验证服务
3. 检查API使用量和限制
4. 监控处理时间和性能

## 📝 注意事项

1. **API成本**: 使用AI服务会产生API调用费用，请注意控制使用量
2. **数据隐私**: 确保上传的文档不包含敏感信息
3. **服务限制**: 不同AI服务有不同的使用限制和配额
4. **性能差异**: 不同AI服务的处理速度和结果质量可能不同

---

**最后更新**: 2025年1月
**版本**: v2.0
**维护团队**: AI医生助理开发团队
