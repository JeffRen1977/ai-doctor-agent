# AI个人医生助理 - 后端API服务

这是AI个人医生助理的后端API服务，基于Node.js + Express构建。

## 功能特性

### 🔐 认证功能
- 用户登录/登出
- JWT token认证
- 用户信息管理

### 💬 聊天功能
- AI医生对话
- 聊天历史管理
- 症状建议

### 📋 健康记录
- 健康记录CRUD操作
- 记录分类管理
- 数据验证

### 🛡️ 安全特性
- CORS支持
- Helmet安全头
- 输入验证
- 错误处理

## 快速开始

### 环境要求
- Node.js >= 16.0.0
- npm >= 8.0.0

### 安装依赖
```bash
cd backend
npm install
```

### 环境配置
复制环境配置示例文件：
```bash
cp env.example .env
```

编辑 `.env` 文件，配置必要的环境变量。

### 启动服务
```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

服务将在 http://localhost:8000 启动

## API接口文档

### 认证接口

#### 用户登录
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "demo@example.com",
  "password": "123456"
}
```

#### 用户登出
```
POST /api/auth/logout
Authorization: Bearer <token>
```

#### 获取用户信息
```
GET /api/auth/me
Authorization: Bearer <token>
```

### 聊天接口

#### 发送消息
```
POST /api/chat/send
Content-Type: application/json
Authorization: Bearer <token>

{
  "message": "我最近头痛"
}
```

#### 获取聊天历史
```
GET /api/chat/history
Authorization: Bearer <token>
```

#### 清空聊天历史
```
DELETE /api/chat/history
Authorization: Bearer <token>
```

#### 获取症状建议
```
POST /api/chat/symptoms
Content-Type: application/json

{
  "symptoms": "头痛"
}
```

### 健康记录接口

#### 获取健康记录列表
```
GET /api/health-records
Authorization: Bearer <token>
```

#### 创建健康记录
```
POST /api/health-records
Content-Type: application/json
Authorization: Bearer <token>

{
  "date": "2024-01-15",
  "type": "头痛",
  "description": "持续性头痛，伴有轻微恶心",
  "severity": "medium",
  "status": "resolved"
}
```

#### 更新健康记录
```
PUT /api/health-records/:id
Content-Type: application/json
Authorization: Bearer <token>

{
  "date": "2024-01-15",
  "type": "头痛",
  "description": "持续性头痛，伴有轻微恶心",
  "severity": "medium",
  "status": "resolved"
}
```

#### 删除健康记录
```
DELETE /api/health-records/:id
Authorization: Bearer <token>
```

#### 获取单个健康记录
```
GET /api/health-records/:id
Authorization: Bearer <token>
```

## 项目结构

```
backend/
├── src/
│   ├── routes/
│   │   ├── auth.js          # 认证路由
│   │   ├── chat.js          # 聊天路由
│   │   └── healthRecords.js # 健康记录路由
│   └── index.js             # 主入口文件
├── package.json
├── env.example
└── README.md
```

## 技术栈

- **运行环境**: Node.js
- **Web框架**: Express.js
- **认证**: JWT + bcryptjs
- **数据验证**: Joi
- **安全**: Helmet + CORS
- **日志**: Morgan

## 开发指南

### 添加新路由
1. 在 `src/routes/` 创建新的路由文件
2. 在 `src/index.js` 中注册路由
3. 添加相应的中间件和验证

### 数据验证
使用Joi进行输入验证：
```javascript
const schema = Joi.object({
  field: Joi.string().required()
});
```

### 错误处理
使用统一的错误处理中间件：
```javascript
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误' });
});
```

## 部署

### 生产环境配置
1. 设置 `NODE_ENV=production`
2. 配置安全的 `JWT_SECRET`
3. 设置适当的 `PORT`

### Docker部署
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 8000
CMD ["npm", "start"]
```

## 测试

运行测试：
```bash
npm test
```

## 许可证

本项目采用 MIT 许可证。 