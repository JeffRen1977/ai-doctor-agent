# Firebase 和 Gemini AI 集成设置指南

## 1. Firebase 设置

### 1.1 创建 Firebase 项目

1. 访问 [Firebase Console](https://console.firebase.google.com/)
2. 点击"创建项目"
3. 输入项目名称（例如：ai-doctor-agent）
4. 选择是否启用 Google Analytics（可选）
5. 点击"创建项目"

### 1.2 启用 Authentication

1. 在 Firebase Console 中，点击左侧菜单的"Authentication"
2. 点击"开始使用"
3. 在"登录方法"标签页中，启用"邮箱/密码"
4. 点击"保存"

### 1.3 启用 Firestore Database

1. 在 Firebase Console 中，点击左侧菜单的"Firestore Database"
2. 点击"创建数据库"
3. 选择"以测试模式开始"（开发环境）
4. 选择数据库位置（建议选择离用户最近的区域）
5. 点击"完成"

### 1.4 获取 Firebase 配置

1. 在 Firebase Console 中，点击项目设置（齿轮图标）
2. 在"常规"标签页中，滚动到"您的应用"部分
3. 点击"Web"图标（</>）
4. 输入应用昵称（例如：ai-doctor-backend）
5. 点击"注册应用"
6. 复制配置对象：

```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id"
};
```

### 1.5 设置 Firestore 安全规则

在 Firestore Database 中，点击"规则"标签页，添加以下规则：

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 用户只能访问自己的数据
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // 聊天记录
    match /chats/{chatId} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
    }
    
    // 饮食分析记录
    match /dietAnalysis/{analysisId} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
    }
    
    // 健康记录
    match /healthRecords/{recordId} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
    }
  }
}
```

## 2. Gemini AI 设置

### 2.1 获取 Gemini API Key

1. 访问 [Google AI Studio](https://makersuite.google.com/app/apikey)
2. 登录 Google 账户
3. 点击"创建 API 密钥"
4. 复制生成的 API 密钥

### 2.2 配置环境变量

1. 在 `backend` 目录下创建 `.env` 文件
2. 添加以下配置：

```env
# 服务器配置
PORT=8000
NODE_ENV=development

# JWT配置
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Firebase配置
FIREBASE_API_KEY=your-firebase-api-key
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
FIREBASE_APP_ID=your-app-id

# Gemini AI配置
GEMINI_API_KEY=your-gemini-api-key
```

## 3. 安装依赖

```bash
cd backend
npm install
```

## 4. 启动服务

```bash
npm start
```

## 5. 测试集成

### 5.1 测试用户注册

```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "123456",
    "name": "测试用户"
  }'
```

### 5.2 测试用户登录

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "123456"
  }'
```

### 5.3 测试 AI 聊天

```bash
curl -X POST http://localhost:8000/api/chat/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "message": "我最近经常头痛，应该怎么办？"
  }'
```

## 6. 注意事项

1. **安全性**：确保在生产环境中使用强密码和安全的 JWT 密钥
2. **API 限制**：注意 Gemini AI 的 API 调用限制和配额
3. **数据备份**：定期备份 Firestore 数据
4. **监控**：设置适当的日志记录和错误监控
5. **测试**：在生产环境部署前进行充分测试

## 7. 故障排除

### 7.1 Firebase 连接问题

- 检查 Firebase 配置是否正确
- 确保网络连接正常
- 验证 Firestore 规则是否正确

### 7.2 Gemini AI 问题

- 检查 API 密钥是否正确
- 确认 API 配额是否充足
- 查看错误日志获取详细信息

### 7.3 认证问题

- 检查 JWT 密钥是否正确
- 验证用户是否已正确注册
- 确认 token 是否过期 