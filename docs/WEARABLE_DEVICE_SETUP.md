# 🏃‍♂️ 可穿戴设备集成设置指南

本指南将帮助您设置Apple Watch和Fitbit等可穿戴设备的数据同步功能。

## 📱 支持的设备类型

### 1. Fitbit 设备
- ✅ Fitbit Versa, Sense, Charge, Inspire系列
- ✅ 实时数据同步
- ✅ 自动token刷新
- ✅ 支持数据类型：活动、心率、睡眠、体重、营养

### 2. Apple Watch / Apple Health
- ✅ Apple Watch Series 3+
- ✅ iPhone Health应用数据
- ✅ CSV数据导入
- ✅ 支持数据类型：活动、心率、睡眠、营养、身体指标

## 🔧 后端配置

### 1. 环境变量设置

在 `backend/.env` 文件中添加以下配置：

```bash
# Fitbit API配置
FITBIT_CLIENT_ID="your-fitbit-client-id"
FITBIT_CLIENT_SECRET="your-fitbit-client-secret"

# Apple HealthKit配置（未来使用）
APPLE_HEALTHKIT_BUNDLE_ID="your-app-bundle-id"
APPLE_HEALTHKIT_TEAM_ID="your-team-id"
```

### 2. Fitbit开发者账户设置

1. 访问 [Fitbit开发者门户](https://dev.fitbit.com/)
2. 创建新应用
3. 设置OAuth 2.0配置：
   - **Callback URL**: `http://localhost:8000/api/wearables/fitbit/callback`
   - **OAuth 2.0 Scopes**: `activity heartrate sleep profile weight nutrition`
4. 获取 `Client ID` 和 `Client Secret`

### 3. 数据库结构

系统会自动创建以下Firebase集合：

```javascript
// userWearables 集合
{
  "user@example.com": {
    "userEmail": "user@example.com",
    "fitbitTokens": {
      "access_token": "...",
      "refresh_token": "...",
      "expires_in": 28800,
      "user_id": "...",
      "scope": "activity heartrate sleep profile weight nutrition",
      "token_type": "Bearer",
      "created_at": "2024-01-15T10:00:00.000Z"
    },
    "fitbitConnected": true,
    "fitbitLastSync": "2024-01-15T10:00:00.000Z",
    "fitbitData": {
      "date": "2024-01-15",
      "activity": { /* Fitbit活动数据 */ },
      "heartRate": { /* 心率数据 */ },
      "sleep": { /* 睡眠数据 */ },
      "body": { /* 身体指标数据 */ },
      "source": "fitbit",
      "lastSync": "2024-01-15T10:00:00.000Z"
    },
    "appleConnected": false,
    "appleLastSync": null,
    "appleData": null,
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  }
}
```

## 🚀 前端使用

### 1. 设备连接流程

#### Fitbit连接：
1. 用户点击"连接Fitbit"按钮
2. 重定向到Fitbit授权页面
3. 用户登录并授权应用
4. 重定向回应用，完成连接
5. 自动同步数据

#### Apple Health连接：
1. 用户从iPhone导出健康数据（CSV格式）
2. 上传CSV文件到应用
3. 系统解析并存储数据
4. 显示数据摘要

### 2. API端点

```typescript
// 获取设备状态
GET /api/wearables/status

// 开始Fitbit授权
GET /api/wearables/fitbit/auth

// 完成Fitbit授权
POST /api/wearables/fitbit/complete-auth

// 获取Fitbit数据
GET /api/wearables/fitbit/data

// 同步所有设备
POST /api/wearables/sync

// 上传Apple Health数据
POST /api/wearables/apple/upload

// 获取数据摘要
GET /api/wearables/summary?days=7
```

## 📊 数据类型说明

### Fitbit数据
- **活动数据**: 步数、卡路里、距离、活跃分钟
- **心率数据**: 静息心率、心率区间、心率变异性
- **睡眠数据**: 睡眠时长、睡眠阶段、睡眠效率
- **身体指标**: 体重、BMI、体脂率
- **营养数据**: 水分摄入、卡路里摄入

### Apple Health数据
- **活动数据**: 步数、卡路里、运动时长
- **健康数据**: 心率、血压、血糖、体温
- **身体指标**: 体重、身高、BMI
- **睡眠数据**: 睡眠时长、睡眠质量

## 🔒 安全考虑

1. **OAuth 2.0认证**: 使用标准OAuth流程
2. **Token存储**: 安全存储在Firebase中
3. **用户隔离**: 每个用户只能访问自己的数据
4. **数据加密**: 敏感数据在传输和存储时加密
5. **权限控制**: 最小权限原则，只请求必要的数据

## 🚨 故障排除

### 常见问题

1. **Fitbit授权失败**
   - 检查Client ID和Secret是否正确
   - 确认Callback URL设置正确
   - 检查网络连接

2. **数据同步失败**
   - 检查token是否过期
   - 确认用户已授权必要的数据权限
   - 查看后端日志获取详细错误信息

3. **Apple Health数据解析错误**
   - 确认CSV格式正确
   - 检查文件编码（推荐UTF-8）
   - 验证数据列名是否匹配

### 调试技巧

1. 启用详细日志：
```javascript
console.log('🔍 调试信息:', data);
```

2. 检查网络请求：
   - 使用浏览器开发者工具
   - 查看Network标签页
   - 检查请求和响应

3. 验证数据格式：
   - 使用Postman测试API
   - 检查JSON响应结构
   - 验证数据类型

## 🔮 未来功能

1. **实时数据同步**: WebSocket连接实现实时更新
2. **更多设备支持**: Garmin、Samsung、小米等
3. **数据分析**: 趋势分析、健康建议
4. **智能提醒**: 基于数据的个性化提醒
5. **数据导出**: 支持多种格式的数据导出

## 📞 技术支持

如果遇到问题，请：

1. 检查本文档的故障排除部分
2. 查看后端控制台日志
3. 检查浏览器开发者工具
4. 联系开发团队并提供详细错误信息

---

**注意**: 本功能需要用户明确授权才能访问健康数据。请确保遵守相关隐私法规和平台政策。
