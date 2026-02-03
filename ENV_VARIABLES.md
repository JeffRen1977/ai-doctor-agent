# 环境变量配置指南

## 📋 概述

本项目需要分别在 Railway（后端）和 Vercel（前端）配置环境变量。

---

## 🚂 Railway 后端环境变量

在 Railway 项目设置 → Variables 中添加：

### 必需变量

```bash
# JWT 配置
JWT_SECRET=your-super-secret-jwt-key-here

# Firebase 配置
FIREBASE_API_KEY=your-firebase-api-key
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789
FIREBASE_APP_ID=your-app-id

# 环境
NODE_ENV=production

# CORS 配置（Vercel 前端 URL）
FRONTEND_URL=https://your-vercel-app.vercel.app
```

### 可选变量（AI 服务）

```bash
# Google Gemini
GEMINI_API_KEY=your-gemini-api-key

# OpenAI
OPENAI_API_KEY=your-openai-api-key

# 百度文心一言
BAIDU_API_KEY=your-baidu-api-key
BAIDU_SECRET_KEY=your-baidu-secret-key

# 阿里通义千问
DASHSCOPE_API_KEY=your-dashscope-api-key
```

---

## ▲ Vercel 前端环境变量

在 Vercel 项目设置 → Environment Variables 中添加：

### 必需变量

```bash
# Railway 后端 URL
VITE_RAILWAY_BACKEND_URL=https://your-app-name.railway.app
```

**重要**: 
- 变量名必须以 `VITE_` 开头才能在 Vite 构建中访问
- 替换 `your-app-name.railway.app` 为你的实际 Railway URL

---

## 🔧 如何获取值

### Railway 后端 URL

1. 在 Railway 项目中
2. 点击项目设置
3. 查看 "Domains" 或 "Settings" → "Networking"
4. 复制提供的 URL（例如：`https://your-app.railway.app`）

### Vercel 前端 URL

1. 在 Vercel 项目中
2. 部署完成后会自动生成
3. 格式：`https://your-app.vercel.app`

### Firebase 配置

1. 访问 [Firebase Console](https://console.firebase.google.com/)
2. 选择项目
3. 进入 Project Settings
4. 在 "Your apps" 部分找到 Web app 配置
5. 复制配置值

### JWT Secret

生成一个强随机字符串：

```bash
# 使用 openssl
openssl rand -base64 32

# 或使用 Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## ✅ 验证配置

### 验证后端

```bash
# 测试健康检查
curl https://your-app.railway.app/health

# 应该返回 JSON 响应
```

### 验证前端

1. 访问 Vercel URL
2. 打开浏览器开发者工具
3. 检查 Network 标签
4. API 请求应该指向 Railway URL

---

## 🔄 更新环境变量

### Railway

1. 进入项目设置
2. 点击 "Variables"
3. 添加或编辑变量
4. Railway 会自动重启服务

### Vercel

1. 进入项目设置
2. 点击 "Environment Variables"
3. 添加或编辑变量
4. 需要重新部署才能生效：
   - 触发新的部署
   - 或使用 Vercel CLI: `vercel --prod`

---

## 🐛 常见问题

### 前端无法连接到后端

**检查：**
1. `VITE_RAILWAY_BACKEND_URL` 是否正确
2. Railway 后端是否正在运行
3. CORS 配置是否正确（`FRONTEND_URL` 在 Railway 中）

### 环境变量未生效

**Vercel:**
- 确保变量名以 `VITE_` 开头
- 重新部署项目

**Railway:**
- 检查变量名拼写
- 重启服务

---

**最后更新**: 2025-01-XX
