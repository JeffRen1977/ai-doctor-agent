# AI服务集成指南

## 📋 概述

本项目现在支持多个AI服务提供商，包括Google Gemini和OpenAI，让您可以比较不同AI模型的表现。

## 🤖 支持的AI服务

### 1. Google Gemini
- **模型**: gemini-1.5-pro, gemini-1.5-flash
- **特点**: 支持文本和图像分析，处理速度快
- **配置**: 需要 `GEMINI_API_KEY` 环境变量

### 2. OpenAI
- **模型**: gpt-4, gpt-4-turbo, gpt-3.5-turbo, gpt-4-vision-preview
- **特点**: 强大的文本分析能力，支持图像和PDF分析
- **配置**: 需要 `OPENAI_API_KEY` 环境变量

## 🔧 配置

### 环境变量设置

在 `backend/.env` 文件中添加以下配置：

```bash
# Gemini AI Configuration
GEMINI_API_KEY=your-gemini-api-key-here

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key-here
```

### 获取API密钥

#### Gemini API密钥
1. 访问 [Google AI Studio](https://makersuite.google.com/app/apikey)
2. 创建新的API密钥
3. 复制密钥到环境变量

#### OpenAI API密钥
1. 访问 [OpenAI Platform](https://platform.openai.com/api-keys)
2. 创建新的API密钥
3. 复制密钥到环境变量

## 🚀 使用方法

### 1. 前端界面

在健康记录页面的文件上传区域，您可以看到AI服务选择面板：

- **AI服务提供商**: 选择Gemini或OpenAI
- **模型**: 选择具体的AI模型
- **比较模式**: 启用后可以同时使用多个AI服务进行比较

### 2. API调用

#### 基本分析
```javascript
// 使用Gemini
const response = await api.post('/health-analysis/analyze', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});

// 使用OpenAI
formData.append('provider', 'openai');
formData.append('model', 'gpt-4');
```

#### 比较模式
```javascript
// 启用比较模式
```

### 3. 获取可用服务

```javascript
const response = await api.get('/health-analysis/ai-services');
console.log(response.data.data.services);
```

## 📊 功能特性

### 1. 智能服务选择
- 自动检测可用的AI服务
- 根据API密钥可用性显示选项
- 支持服务状态检查

### 2. 模型比较
- 同时使用多个AI服务进行分析
- 比较不同模型的表现
- 显示处理时间和质量差异

### 3. 性能监控
- 记录处理时间
- 显示使用的AI服务信息
- 提供详细的元数据

## 🔍 测试

### 测试OpenAI服务
```bash
cd backend
node test-openai.js
```

### 测试Gemini服务
```bash
cd backend
node test-gemini.js
```

## 📈 性能比较

### Gemini优势
- 处理速度快
- 支持多种文件格式
- 成本相对较低

### OpenAI优势
- 分析质量高
- 支持复杂的医疗文档
- 强大的推理能力

## 🛠️ 开发指南

### 添加新的AI服务

1. 创建新的服务文件 `backend/src/services/newAiService.js`
2. 实现标准接口：
   - `analyzeHealthRecords()`
   - `extractTextFromImage()`
   - `analyzePDFDocument()`
   - `isServiceAvailable()`
   - `getAvailableModels()`

3. 在 `aiServiceFactory.js` 中注册新服务

### 自定义分析逻辑

```javascript
// 在healthAnalysisService.js中自定义分析逻辑
const customAnalysis = await aiServiceFactory.analyzeHealthRecords(healthData, {
  provider: 'custom',
  model: 'custom-model',
  customOptions: { ... }
});
```

## 🔒 安全考虑

1. **API密钥保护**: 确保API密钥安全存储
2. **访问控制**: 限制API密钥的使用权限
3. **数据隐私**: 确保用户数据不被滥用
4. **成本控制**: 监控API使用量避免超支

## 📝 最佳实践

1. **选择合适的模型**: 根据文档类型选择最适合的AI模型
2. **批量处理**: 对于大量文档，考虑批量处理以提高效率
3. **错误处理**: 实现完善的错误处理和重试机制
4. **性能优化**: 使用缓存和异步处理提高性能

## 🆘 故障排除

### 常见问题

1. **API密钥无效**
   - 检查环境变量是否正确设置
   - 验证API密钥是否有效
   - 确认API密钥有足够的权限

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

---

**最后更新**: 2025年1月
**版本**: v2.0
**维护团队**: AI医生助理开发团队
