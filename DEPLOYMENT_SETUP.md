# 部署配置指南 - Railway (后端) + Vercel (前端)

## 📋 架构概述

- **后端**: Railway (Node.js/Express)
- **前端**: Vercel (React/Vite)
- **数据库**: Firebase Firestore
- **存储**: Firebase Storage

---

## 🚂 Railway 后端部署

### 1. 准备部署

```bash
# 运行部署准备脚本
chmod +x scripts/deploy-railway.sh
./scripts/deploy-railway.sh

# 或使用 npm 脚本
npm run deploy:railway
```

### 2. 在 Railway 中设置项目

1. 访问 [Railway](https://railway.app/)
2. 创建新项目
3. 连接到 GitHub 仓库
4. 选择 `release` 分支
5. Railway 会自动检测配置并部署

### 3. 配置环境变量

在 Railway 项目设置中添加以下环境变量：

#### 必需变量
```bash
JWT_SECRET=your-super-secret-jwt-key-here
FIREBASE_API_KEY=your-firebase-api-key
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789
FIREBASE_APP_ID=your-app-id
NODE_ENV=production
```

#### 可选变量（AI服务）
```bash
# Gemini AI
GEMINI_API_KEY=your-gemini-api-key

# OpenAI
OPENAI_API_KEY=your-openai-api-key

# 百度文心一言
BAIDU_API_KEY=your-baidu-api-key
BAIDU_SECRET_KEY=your-baidu-secret-key

# 阿里通义千问
DASHSCOPE_API_KEY=your-dashscope-api-key
```

### 4. 获取 Railway 后端 URL

部署完成后，Railway 会提供一个 URL，例如：
```
https://your-app-name.railway.app
```

**重要**: 保存这个 URL，需要在 Vercel 中配置。

### 5. 验证后端部署

```bash
# 测试健康检查
curl https://your-app-name.railway.app/health

# 测试 API
curl https://your-app-name.railway.app/api/health
```

---

## ▲ Vercel 前端部署

### 1. 准备部署

```bash
# 运行部署准备脚本
chmod +x scripts/deploy-vercel.sh
./scripts/deploy-vercel.sh

# 或使用 npm 脚本
npm run deploy:vercel
```

### 2. 在 Vercel 中设置项目

1. 访问 [Vercel](https://vercel.com/)
2. 导入 GitHub 仓库
3. 配置项目：
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (项目根目录)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### 3. 配置环境变量

在 Vercel 项目设置中添加：

```bash
# Railway 后端 URL（必需）
VITE_RAILWAY_BACKEND_URL=https://your-app-name.railway.app

# 或者使用通用变量名
VITE_API_BASE_URL=https://your-app-name.railway.app
```

### 4. 部署

Vercel 会自动：
1. 检测到 `vercel.json` 配置
2. 运行构建命令
3. 部署到生产环境

### 5. 验证前端部署

访问 Vercel 提供的 URL，检查：
- 页面是否正常加载
- API 请求是否成功
- 登录功能是否正常

---

## 🔧 配置 CORS

### Railway 后端 CORS 配置

后端代码已经配置了 CORS，但需要确保允许 Vercel 域名：

```javascript
// backend/src/index.js
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://your-vercel-app.vercel.app',  // 添加你的 Vercel URL
  process.env.FRONTEND_URL  // 或使用环境变量
];
```

在 Railway 环境变量中添加：
```bash
FRONTEND_URL=https://your-vercel-app.vercel.app
```

---

## 📝 部署检查清单

### Railway 后端
- [ ] 项目已连接到 GitHub
- [ ] 选择 `release` 分支
- [ ] 所有环境变量已设置
- [ ] 健康检查端点正常 (`/health`)
- [ ] API 端点正常 (`/api/health`)
- [ ] CORS 配置正确

### Vercel 前端
- [ ] 项目已连接到 GitHub
- [ ] `VITE_RAILWAY_BACKEND_URL` 环境变量已设置
- [ ] 构建成功
- [ ] 页面正常加载
- [ ] API 请求正常
- [ ] 登录功能正常

---

## 🚀 自动化部署

### 使用 GitHub Actions（可选）

创建 `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches:
      - release

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm install
      
      - name: Build
        run: npm run build
```

Railway 和 Vercel 都会自动从 GitHub 部署，所以通常不需要 GitHub Actions。

---

## 🔍 故障排除

### 后端问题

**问题**: API 返回 404
- 检查 Railway 日志
- 验证路由配置
- 检查环境变量

**问题**: CORS 错误
- 检查 `FRONTEND_URL` 环境变量
- 验证 Vercel URL 在允许列表中

### 前端问题

**问题**: API 请求失败
- 检查 `VITE_RAILWAY_BACKEND_URL` 是否正确
- 检查浏览器控制台的网络请求
- 验证 CORS 配置

**问题**: 构建失败
- 检查 Vercel 构建日志
- 验证依赖是否正确安装
- 检查 `vercel.json` 配置

---

## 📚 相关文档

- [Railway 文档](https://docs.railway.app/)
- [Vercel 文档](https://vercel.com/docs)
- [项目部署指南](./deployment/DEPLOYMENT_GUIDE.md)

---

## 🔄 更新部署

### 更新后端
```bash
# 1. 修改代码
# 2. 提交到 release 分支
git add .
git commit -m "Update backend"
git push origin release

# 3. Railway 会自动部署
```

### 更新前端
```bash
# 1. 修改代码
# 2. 提交到 release 分支
git add .
git commit -m "Update frontend"
git push origin release

# 3. Vercel 会自动部署
```

---

**最后更新**: 2025-01-XX
