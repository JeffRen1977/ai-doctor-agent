# 🏥 健康档案分析功能 (Health Document Analysis)

## 📋 功能概述

健康档案分析功能利用大语言模型（Gemini AI）对用户上传的医疗文档进行智能分析，生成个人化的健康报告和建议。这个功能可以帮助用户更好地理解自己的健康状况，获得专业的健康建议。

## 🎯 主要特性

### 1. 多文档支持
- **支持格式**：PDF、Word文档、医疗图片（JPG、PNG、GIF、BMP、TIFF）
- **批量上传**：一次可上传最多20个文件
- **文件大小**：每个文件最大10MB
- **智能解析**：自动提取文档中的医疗信息

### 2. AI智能分析
- **健康总结**：基于上传文档生成个人健康概览
- **关键指标**：提取血压、胆固醇、血糖等重要健康数据
- **风险因素**：识别潜在的健康风险和关注点
- **医疗条件**：分析已诊断或疑似医疗状况
- **用药情况**：提取药物和治疗信息
- **健康评分**：1-10分的综合健康评分系统

### 3. 个性化建议
- **健康建议**：基于分析结果提供具体的健康建议
- **下一步行动**：明确的后续行动指导
- **优先级排序**：识别最重要的健康关注点
- **时间规划**：建议复查和随访时间

### 4. 数据管理
- **分析历史**：保存所有历史分析记录
- **详细查看**：查看每次分析的完整详情
- **数据安全**：用户数据加密存储，隐私保护

## 🏗️ 技术架构

### 后端架构
```
backend/src/
├── routes/
│   └── healthAnalysis.js          # 健康分析API路由
├── services/
│   └── healthAnalysisService.js   # 健康分析服务
└── uploads/
    └── health-documents/          # 文档存储目录
```

### 前端架构
```
frontend/pages/
├── HealthAnalysisPage.tsx         # 健康分析主页面
└── HealthAnalysisPage.css         # 样式文件
```

### 数据库结构
```javascript
// Firestore Collection: healthAnalyses
{
  id: "analysis_id",
  userId: "user_id",
  userEmail: "user@example.com",
  documents: [
    {
      filename: "medical_report.pdf",
      path: "/uploads/health-documents/...",
      size: 1024000,
      mimetype: "application/pdf"
    }
  ],
  analysis: {
    summary: "健康总结...",
    healthMetrics: {
      bloodPressure: "120/80",
      cholesterol: "200mg/dL",
      glucose: "95mg/dL"
    },
    riskFactors: ["高血压", "高胆固醇"],
    medicalConditions: ["糖尿病前期"],
    medications: ["二甲双胍 500mg"],
    recommendations: ["低盐饮食", "规律运动"],
    nextSteps: ["3个月后复查"],
    healthScore: {
      score: 7,
      explanation: "整体健康状况良好，需要关注血压"
    },
    priorityAreas: ["心血管健康"],
    timeline: {
      nextCheckup: "3个月",
      urgentActions: [],
      longTermGoals: []
    }
  },
  analysisDate: "2024-01-15T10:30:00Z",
  status: "completed",
  createdAt: "2024-01-15T10:30:00Z",
  updatedAt: "2024-01-15T10:30:00Z"
}
```

## 🚀 API接口

### 1. 分析医疗文档
```http
POST /api/health-analysis/analyze
Content-Type: multipart/form-data
Authorization: Bearer <token>

FormData:
- documents: File[] (多个文件)
```

**响应示例**：
```json
{
  "success": true,
  "message": "Health analysis completed successfully",
  "data": {
    "analysisId": "analysis_123",
    "summary": "基于您的医疗文档分析...",
    "riskFactors": ["高血压", "高胆固醇"],
    "recommendations": ["低盐饮食", "规律运动"],
    "nextSteps": ["3个月后复查"],
    "analysisDate": "2024-01-15T10:30:00Z"
  }
}
```

### 2. 获取分析历史
```http
GET /api/health-analysis/history?page=1&limit=10
Authorization: Bearer <token>
```

### 3. 获取分析详情
```http
GET /api/health-analysis/:id
Authorization: Bearer <token>
```

## 🎨 用户界面

### 主页面功能
1. **文档上传区域**
   - 拖拽上传界面
   - 文件类型和大小验证
   - 批量文件选择

2. **文件管理**
   - 文件列表显示
   - 文件信息展示（名称、大小）
   - 文件移除功能

3. **分析历史**
   - 历史分析列表
   - 健康评分显示
   - 快速查看详情

4. **分析详情模态框**
   - 健康评分卡片
   - 健康总结
   - 风险因素标签
   - 建议时间线
   - 下一步行动

## 🔧 配置说明

### 环境变量
```bash
# Gemini AI配置
GEMINI_API_KEY=your_gemini_api_key

# Firebase配置
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email
```

### 文件上传配置
```javascript
// multer配置
const storage = multer.diskStorage({
  destination: 'uploads/health-documents/',
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    // 文件类型验证
  }
});
```

## 📱 移动端支持

- **响应式设计**：适配各种屏幕尺寸
- **触摸友好**：优化的移动端交互
- **性能优化**：快速加载和流畅体验

## 🔒 安全特性

1. **文件验证**：严格的文件类型和大小检查
2. **用户认证**：JWT token验证
3. **数据加密**：敏感数据加密存储
4. **访问控制**：用户只能访问自己的分析数据

## 🚀 部署说明

### 1. 后端部署
```bash
# 安装依赖
npm install

# 启动服务
npm run dev:backend
```

### 2. 前端部署
```bash
# 安装依赖
npm install

# 构建项目
npm run build

# 启动服务
npm run dev:frontend
```

### 3. 数据库设置
- 确保Firebase项目已配置
- 创建`healthAnalyses`集合
- 设置适当的访问规则

## 📊 使用流程

1. **用户登录**：使用有效账户登录系统
2. **上传文档**：在健康分析页面上传医疗文档
3. **等待分析**：系统自动解析文档并调用AI分析
4. **查看结果**：在分析历史中查看分析结果
5. **详细查看**：点击查看完整的分析报告
6. **跟踪建议**：根据建议进行健康管理

## 🔮 未来扩展

1. **更多文档格式**：支持更多医疗文档格式
2. **OCR增强**：改进图片文档的文字识别
3. **趋势分析**：分析健康数据的时间趋势
4. **医生集成**：与医生系统集成，共享分析结果
5. **健康提醒**：基于分析结果设置健康提醒

## 🐛 故障排除

### 常见问题
1. **文件上传失败**：检查文件大小和格式
2. **分析失败**：检查Gemini API配置
3. **数据加载失败**：检查Firebase连接

### 日志查看
```bash
# 查看后端日志
tail -f backend/server.log

# 查看特定错误
grep "ERROR" backend/server.log
```

## 📞 技术支持

如有问题，请联系开发团队或查看项目文档。

---

**注意**：此功能涉及医疗信息处理，请确保遵守相关法律法规和隐私保护要求。


