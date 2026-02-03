# 登录问题排查指南

## 🔍 常见登录失败原因

### 1. 后端服务未运行

**症状：**
- 浏览器控制台显示网络错误
- 请求超时或连接被拒绝

**解决方案：**
```bash
# 启动后端服务
cd backend
npm start

# 或使用开发模式
npm run dev
```

**验证：**
```bash
# 测试健康检查
curl http://localhost:8000/health
```

### 2. API路由404错误

**症状：**
- 浏览器控制台显示 `404 Not Found`
- 网络请求失败

**检查：**
1. 确认后端路由已注册：
   ```javascript
   // backend/src/index.js
   app.use('/api/auth', authRoutes);
   ```

2. 检查Vite代理配置（开发环境）：
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

### 3. Firebase配置错误

**症状：**
- 登录返回401错误
- 控制台显示Firebase相关错误

**检查：**
1. 确认 `backend/.env` 中包含所有Firebase配置：
   ```bash
   FIREBASE_API_KEY=your-api-key
   FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   FIREBASE_APP_ID=your-app-id
   ```

2. 验证Firebase配置是否正确：
   - 检查Firebase控制台
   - 确认认证服务已启用
   - 确认邮箱/密码认证已启用

### 4. CORS错误

**症状：**
- 浏览器控制台显示CORS错误
- 请求被阻止

**解决方案：**
1. 检查后端CORS配置：
   ```javascript
   // backend/src/index.js
   app.use(cors({
     origin: function (origin, callback) {
       // 允许的源列表
       callback(null, true);
     }
   }));
   ```

2. 设置 `FRONTEND_URL` 环境变量

### 5. 用户不存在或密码错误

**症状：**
- 登录返回401错误
- 错误信息："用户不存在" 或 "密码错误"

**解决方案：**
1. 使用测试账户：
   - 邮箱: `jianfengren.sd@gmail.com`
   - 密码: `123456`

2. 或注册新账户：
   - 在登录页面点击"注册"
   - 填写邮箱、密码和姓名
   - 注册成功后使用新账户登录

### 6. JWT Token生成失败

**症状：**
- 登录成功但无法访问受保护的路由
- Token无效错误

**检查：**
1. 确认 `JWT_SECRET` 环境变量已设置：
   ```bash
   JWT_SECRET=your-secret-key-here
   ```

2. 检查Token是否正确存储：
   ```javascript
   // 浏览器控制台
   console.log(localStorage.getItem('token'));
   ```

## 🛠️ 诊断步骤

### 步骤1: 运行诊断脚本

```bash
node test-login.js
```

这个脚本会检查：
- 后端服务健康状态
- API路由可用性
- Firebase配置
- JWT配置
- 实际登录测试

### 步骤2: 检查浏览器控制台

1. 打开浏览器开发者工具（F12）
2. 切换到"Console"标签
3. 查看错误信息
4. 切换到"Network"标签
5. 查看登录请求的详细信息：
   - 请求URL
   - 请求方法
   - 响应状态码
   - 响应内容

### 步骤3: 检查后端日志

查看后端服务终端输出，查找：
- 登录请求日志
- 错误堆栈信息
- Firebase认证错误

### 步骤4: 手动测试API

使用curl测试登录端点：

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jianfengren.sd@gmail.com",
    "password": "123456"
  }'
```

预期响应：
```json
{
  "user": {
    "id": "...",
    "email": "jianfengren.sd@gmail.com",
    "name": "..."
  },
  "token": "..."
}
```

## 🔧 快速修复

### 修复1: 重启服务

```bash
# 停止后端服务 (Ctrl+C)
# 然后重新启动
cd backend
npm start
```

### 修复2: 清除浏览器缓存

1. 打开浏览器开发者工具
2. Application → Clear storage → Clear site data
3. 硬刷新页面 (Ctrl+Shift+R 或 Cmd+Shift+R)

### 修复3: 检查环境变量

```bash
# 检查后端环境变量
cd backend
cat .env

# 确保所有必要的变量都已设置
```

### 修复4: 验证Firebase配置

1. 访问 [Firebase Console](https://console.firebase.google.com/)
2. 选择项目
3. 进入 Authentication → Sign-in method
4. 确认"Email/Password"已启用

## 📝 常见错误消息

### "该邮箱已被注册"
- 用户已存在，请直接登录
- 或使用其他邮箱注册

### "用户不存在"
- 邮箱未注册
- 请先注册账户

### "密码错误"
- 输入的密码不正确
- 测试账户密码: `123456`

### "服务器内部错误"
- 检查后端日志
- 检查Firebase配置
- 检查数据库连接

### "网络错误" 或 "连接被拒绝"
- 后端服务未运行
- 端口被占用
- 防火墙阻止连接

## 🆘 获取帮助

如果问题仍未解决：

1. **收集信息：**
   - 浏览器控制台错误
   - 网络请求详情
   - 后端日志
   - 运行 `node test-login.js` 的输出

2. **检查文档：**
   - [API文档](./API_DOCUMENTATION.md)
   - [部署指南](./deployment/DEPLOYMENT_GUIDE.md)
   - [故障排除指南](./TROUBLESHOOTING_DEPLOYMENT_ERRORS.md)

3. **创建Issue：**
   - 包含错误信息
   - 包含环境信息
   - 包含复现步骤

---

**最后更新**: 2025-01-XX
