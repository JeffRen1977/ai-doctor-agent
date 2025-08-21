# 可穿戴设备集成指南

## 📱 概述

AI医生助理系统支持多种可穿戴设备的健康数据集成，包括Fitbit、Apple Health等主流平台。在没有真实设备连接的情况下，系统还提供模拟数据功能，让用户可以体验完整的健康数据分析功能。

## 🔗 支持的设备类型

### 1. Fitbit 设备
- **支持型号**: 所有Fitbit智能手表和手环
- **数据类型**: 步数、卡路里、心率、睡眠、体重等
- **连接方式**: OAuth 2.0认证流程
- **API版本**: Fitbit Web API v1.2

### 2. Apple Health
- **支持设备**: iPhone、Apple Watch
- **数据类型**: 活动、心率、睡眠、营养、身体指标等
- **连接方式**: HealthKit数据导出/导入
- **数据格式**: CSV文件

### 3. 通用设备
- **支持范围**: 其他兼容的健康设备
- **数据类型**: 基础健康指标
- **连接方式**: 标准化数据格式

## 🎭 模拟数据功能

### 功能特点
- **实时生成**: 每次生成不同的模拟数据
- **真实模拟**: 基于真实健康数据的统计规律
- **完整覆盖**: 包含所有主要健康指标
- **智能分析**: 提供健康洞察和建议

### 模拟数据类型

#### Fitbit模拟数据
```json
{
  "activity": {
    "summary": {
      "steps": 6500,
      "caloriesOut": 2100,
      "activeMinutes": 45,
      "distance": 5.2,
      "floors": 8
    }
  },
  "heartRate": {
    "activities_heart": [...],
    "activities_heart_intraday": {
      "dataset": [...]
    }
  },
  "sleep": {
    "sleep": [{
      "duration": 420,
      "efficiency": 85,
      "levels": {...}
    }]
  }
}
```

#### Apple Health模拟数据
```json
{
  "activity": {
    "steps": 6800,
    "calories": 1950,
    "distance": 5.4,
    "activeEnergy": 450,
    "exerciseMinutes": 35
  },
  "heartRate": {
    "current": 72,
    "resting": 58,
    "average": 68,
    "max": 145,
    "min": 52
  },
  "nutrition": {
    "water": 2200,
    "fiber": 25,
    "protein": 95,
    "carbs": 250,
    "fat": 65
  }
}
```

## 🚀 快速开始

### 1. 生成模拟数据
```typescript
// 生成Fitbit模拟数据
const fitbitMockData = await wearablesAPI.generateMockData('fitbit');

// 生成Apple Health模拟数据
const appleMockData = await wearablesAPI.generateMockData('apple');

// 获取综合健康摘要
const mockSummary = await wearablesAPI.getMockSummary();
```

### 2. 同步设备数据
```typescript
// 强制使用模拟数据
const mockSync = await wearablesAPI.syncDevices(true);

// 尝试真实同步（失败时自动回退到模拟数据）
const realSync = await wearablesAPI.syncDevices(false);
```

### 3. 获取健康摘要
```typescript
// 强制使用模拟数据
const mockSummary = await wearablesAPI.getSummary(7, true);

// 自动检测（无真实数据时使用模拟数据）
const autoSummary = await wearablesAPI.getSummary(7, false);
```

## 🔧 后端API接口

### 模拟数据生成
```http
POST /api/wearables/mock/generate
Content-Type: application/json
Authorization: Bearer <token>

{
  "deviceType": "fitbit" // 或 "apple"
}
```

### 模拟健康摘要
```http
GET /api/wearables/mock/summary
Authorization: Bearer <token>
```

### 设备同步（支持模拟回退）
```http
POST /api/wearables/sync
Content-Type: application/json
Authorization: Bearer <token>

{
  "useMock": false // true强制使用模拟数据
}
```

### 健康摘要（支持模拟回退）
```http
GET /api/wearables/summary?days=7&useMock=false
Authorization: Bearer <token>
```

## 📊 数据结构和字段

### 健康摘要结构
```typescript
interface HealthSummary {
  date: string;
  lastSync: string;
  overview: {
    steps: number;
    calories: number;
    activeMinutes: number;
    sleepHours: number;
    heartRate: number;
  };
  trends: {
    weeklySteps: number[];
    weeklyCalories: number[];
    weeklySleep: number[];
    weeklyHeartRate: number[];
  };
  insights: HealthInsight[];
  recommendations: HealthRecommendation[];
}
```

### 健康洞察结构
```typescript
interface HealthInsight {
  type: 'warning' | 'positive' | 'info';
  category: 'activity' | 'sleep' | 'heart' | 'nutrition';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
}
```

### 健康建议结构
```typescript
interface HealthRecommendation {
  category: 'activity' | 'sleep' | 'nutrition';
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: string;
}
```

## 🎯 使用场景

### 1. 开发和测试
- 前端界面开发和测试
- API接口验证
- 数据展示逻辑测试
- 用户体验优化

### 2. 演示和展示
- 产品功能演示
- 客户需求展示
- 投资方演示
- 团队内部展示

### 3. 用户教育
- 功能使用指导
- 数据解读示例
- 健康建议展示
- 系统能力展示

## 🔒 安全考虑

### 数据隔离
- 模拟数据与真实数据完全隔离
- 用户权限验证
- 数据访问日志记录

### 隐私保护
- 模拟数据不包含个人信息
- 数据生成算法随机化
- 符合GDPR和隐私法规

## 📈 性能优化

### 数据生成
- 缓存常用数据结构
- 异步数据生成
- 批量数据操作

### 存储优化
- 数据压缩存储
- 定期清理过期数据
- 索引优化查询

## 🚧 故障排除

### 常见问题

#### 1. 模拟数据生成失败
```bash
# 检查后端服务状态
curl http://localhost:8000/api/health

# 检查Firebase连接
curl http://localhost:8000/api/wearables/status
```

#### 2. 数据同步异常
```bash
# 查看后端日志
tail -f backend/logs/app.log

# 检查认证状态
curl -H "Authorization: Bearer <token>" http://localhost:8000/api/wearables/status
```

#### 3. 前端显示异常
```bash
# 检查浏览器控制台
# 检查网络请求状态
# 验证API响应格式
```

### 调试技巧
1. **启用详细日志**: 设置环境变量 `DEBUG=wearables:*`
2. **检查数据流**: 使用浏览器开发者工具监控API调用
3. **验证数据结构**: 检查Firebase中的数据格式
4. **测试API端点**: 使用Postman或curl测试接口

## 🔮 未来扩展

### 计划功能
1. **更多设备支持**: Garmin、Samsung Health等
2. **数据可视化**: 图表和趋势分析
3. **机器学习**: 基于历史数据的健康预测
4. **社交功能**: 朋友间健康数据分享

### 技术改进
1. **实时数据同步**: WebSocket连接
2. **离线支持**: 本地数据缓存
3. **多语言支持**: 国际化界面
4. **移动端优化**: 响应式设计

## 📚 相关文档

- [API文档](./API_DOCUMENTATION.md)
- [部署指南](./DEPLOYMENT_GUIDE.md)
- [开发指南](./DEVELOPMENT_GUIDE.md)
- [项目总结](./PROJECT_SUMMARY.md)

## 🤝 贡献指南

欢迎提交Issue和Pull Request来改进可穿戴设备集成功能！

### 开发规范
1. **代码风格**: 遵循项目现有的代码风格
2. **测试覆盖**: 新功能需要包含测试
3. **文档更新**: 及时更新相关文档
4. **性能考虑**: 注意代码性能优化

---

**可穿戴设备集成指南** - 让健康数据更智能，让生活更健康！ 📱✨
