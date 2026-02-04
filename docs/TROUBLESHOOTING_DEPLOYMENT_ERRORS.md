# 部署错误排查指南

## 🔍 常见错误及解决方案

### 1. Service Worker 缓存错误

**错误信息：**
```
Uncaught (in promise) TypeError: Failed to execute 'addAll' on 'Cache': Request failed
```

**原因：**
- Service Worker 试图缓存不存在的文件
- 文件路径不正确
- 网络请求失败

**解决方案：**

1. **更新 Service Worker**（已完成）
   - 使用 `Promise.allSettled` 替代 `cache.addAll`
   - 添加错误处理，允许部分文件缓存失败

2. **清除旧的 Service Worker**
   ```javascript
   // 在浏览器控制台运行
   navigator.serviceWorker.getRegistrations().then(registrations => {
     registrations.forEach(registration => registration.unregister());
   });
   ```

3. **硬刷新页面**
   - Windows/Linux: `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`

### 2. 图标文件 404 错误

**错误信息：**
```
/icon-192x192.png:1 Failed to load resource: the server responded with a status of 404
Error while trying to use the following icon from the Manifest: /icon-192x192.png
```

**原因：**
- manifest.json 引用了不存在的 PNG 图标
- 只有 SVG 图标，但某些浏览器期望 PNG

**解决方案：**

#### 方案A：使用 SVG 图标（推荐，已配置）
manifest.json 已配置为使用 `/icon.svg`，这是正确的。

#### 方案B：创建 PNG 图标（如果需要）
如果需要 PNG 图标，可以：

1. **创建图标文件**
   ```bash
   # 使用 ImageMagick 或在线工具将 SVG 转换为 PNG
   # 创建 192x192 和 512x512 的 PNG 图标
   ```

2. **更新 manifest.json**
   ```json
   {
     "icons": [
       {
         "src": "/icon-192x192.png",
         "sizes": "192x192",
         "type": "image/png"
       },
       {
         "src": "/icon-512x512.png",
         "sizes": "512x512",
         "type": "image/png"
       }
     ]
   }
   ```

### 3. API 路由 404 错误

**错误信息：**
```
/api/auth/login:1 Failed to load resource: the server responded with a status of 404
```

**原因：**
- 后端服务未启动
- API 路由未正确配置
- 代理配置问题（开发环境）
- 部署时路径问题

**解决方案：**

#### 开发环境

1. **检查后端服务是否运行**
   ```bash
   # 检查端口 8000 是否被占用
   lsof -i :8000
   
   # 启动后端服务
   cd backend
   npm start
   ```

2. **检查 Vite 代理配置**
   ```typescript
   // vite.config.ts
   server: {
     proxy: {
       '/api': {
         target: 'http://localhost:8000',
         changeOrigin: true,
       },
     },
   }
   ```

3. **检查 API 路由注册**
   ```javascript
   // backend/src/index.js
   app.use('/api/auth', authRoutes);
   ```

#### 生产环境（Vercel/Railway）

1. **检查环境变量**
   ```bash
   # 确保所有必要的环境变量都已设置
   - JWT_SECRET
   - FIREBASE_* (所有 Firebase 配置)
   - GEMINI_API_KEY 或 OPENAI_API_KEY
   ```

2. **检查部署配置**
   - Vercel: 检查 `vercel.json` 配置
   - Railway: 检查 `railway.json` 配置

3. **检查后端路由**
   ```javascript
   // 确保所有路由都已注册
   app.use('/api/auth', authRoutes);
   app.use('/api/chat', chatRoutes);
   // ... 其他路由
   ```

4. **检查静态文件服务**
   ```javascript
   // 确保在 API 路由之后配置静态文件
   if (distPath) {
     app.use(express.static(distPath));
     app.get('*', (req, res) => {
       res.sendFile(indexPath);
     });
   }
   ```

### 4. 部署到 Vercel 的特殊配置

如果部署到 Vercel，需要创建 `vercel.json`：

```json
{
  "version": 2,
  "builds": [
    {
      "src": "backend/src/index.js",
      "use": "@vercel/node"
    },
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "backend/src/index.js"
    },
    {
      "src": "/(.*)",
      "dest": "/dist/$1"
    }
  ]
}
```

### 5. 部署到 Railway 的配置

Railway 使用 `railway.json` 和 `start-railway.js`，确保：

1. **检查启动脚本**
   ```javascript
   // start-railway.js 应该：
   // 1. 构建前端
   // 2. 启动后端服务
   ```

2. **检查环境变量**
   - Railway 会自动注入 `PORT` 环境变量
   - 确保其他环境变量都已设置

### 6. 清除浏览器缓存

如果问题持续，尝试：

1. **清除 Service Worker**
   ```javascript
   // 浏览器控制台
   navigator.serviceWorker.getRegistrations().then(registrations => {
     registrations.forEach(reg => reg.unregister());
   });
   ```

2. **清除应用缓存**
   - Chrome: DevTools → Application → Clear storage
   - Firefox: DevTools → Storage → Clear All

3. **硬刷新**
   - `Ctrl + Shift + R` (Windows/Linux)
   - `Cmd + Shift + R` (Mac)

### 7. 调试步骤

1. **检查网络请求**
   - 打开浏览器 DevTools → Network
   - 查看失败的请求详情
   - 检查请求 URL 和响应状态

2. **检查控制台错误**
   - 打开浏览器 DevTools → Console
   - 查看完整错误堆栈
   - 检查 Service Worker 日志

3. **检查后端日志**
   ```bash
   # 查看后端日志
   # Railway: 在 Dashboard 查看日志
   # 本地: 查看终端输出
   ```

4. **测试 API 端点**
   ```bash
   # 测试健康检查
   curl https://your-domain.com/health
   
   # 测试 API
   curl https://your-domain.com/api/health
   ```

### 8. 常见问题检查清单

- [ ] 后端服务是否运行？
- [ ] 环境变量是否正确配置？
- [ ] API 路由是否正确注册？
- [ ] 静态文件路径是否正确？
- [ ] Service Worker 是否已更新？
- [ ] 浏览器缓存是否已清除？
- [ ] 网络请求是否被 CORS 阻止？
- [ ] 部署平台配置是否正确？

### 9. 获取帮助

如果问题仍未解决：

1. **检查日志**
   - 浏览器控制台
   - 后端服务器日志
   - 部署平台日志

2. **创建 Issue**
   - 包含错误信息
   - 包含环境信息
   - 包含复现步骤

3. **查看文档**
   - [部署指南](./deployment/DEPLOYMENT_GUIDE.md)
   - [故障排除指南](./guides/TROUBLESHOOTING.md)

---

**最后更新**: 2025-01-XX
