# Vercel 部署配置指南

## 后端域名

**Railway 后端域名**: `ai-doctor-agent-production.up.railway.app`

## 环境变量配置

### 在 Vercel Dashboard 中设置

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择项目：**ai-theron.com**（或你的项目名称）
3. 进入 **Settings** → **Environment Variables**
4. 添加以下环境变量：

#### 必需的环境变量

| 变量名 | 值 | 环境 |
|--------|-----|------|
| `VITE_RAILWAY_BACKEND_URL` | `https://ai-doctor-agent-production.up.railway.app` | Production, Preview, Development |

#### 可选的环境变量

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `VITE_API_BASE_URL` | `https://ai-doctor-agent-production.up.railway.app/api` | 如果设置，将优先使用此值 |

### 配置步骤详解

1. **添加环境变量**
   - 点击 **Add New** 按钮
   - Key: `VITE_RAILWAY_BACKEND_URL`
   - Value: `https://ai-doctor-agent-production.up.railway.app`
   - 选择环境：勾选 **Production**, **Preview**, **Development**
   - 点击 **Save**

2. **验证配置**
   - 确保所有环境都已设置
   - 检查变量值是否正确（包含 `https://` 协议）

3. **重新部署**
   - 进入 **Deployments** 标签
   - 找到最新的部署
   - 点击 **⋯** → **Redeploy**
   - 或者推送新的代码到 Git 仓库触发自动部署

## 使用部署脚本

### 方式一：使用 npm 脚本

```bash
npm run deploy:vercel
```

### 方式二：直接运行脚本

```bash
./scripts/deploy-vercel.sh
```

脚本会：
- 检查环境变量配置
- 安装依赖
- 构建前端
- 提供部署选项（CLI 部署或 Git 推送）

## 验证部署

### 1. 检查环境变量

在 Vercel Dashboard 中：
- Settings → Environment Variables
- 确认 `VITE_RAILWAY_BACKEND_URL` 已设置
- 确认值为：`https://ai-doctor-agent-production.up.railway.app`

### 2. 检查部署日志

在 Vercel Dashboard 中：
- Deployments → 选择最新部署
- 查看 Build Logs
- 确认构建成功

### 3. 测试 API 连接

1. 访问部署的网站
2. 打开浏览器开发者工具（F12）
3. 进入 **Network** 标签
4. 尝试登录
5. 检查 API 请求是否指向正确的后端：
   - 应该看到请求到：`https://ai-doctor-agent-production.up.railway.app/api/auth/login`

## 故障排除

### API 请求返回 404

**原因**：环境变量未正确设置或未重新部署

**解决方案**：
1. 检查 Vercel 环境变量是否正确设置
2. 确保变量名是 `VITE_RAILWAY_BACKEND_URL`（注意 `VITE_` 前缀）
3. 重新部署项目

### CORS 错误

**原因**：Railway 后端未配置允许 Vercel 域名的 CORS

**解决方案**：
在 Railway 后端环境变量中添加：
```
FRONTEND_URL=https://your-vercel-domain.vercel.app
```
或
```
CORS_ORIGIN=https://your-vercel-domain.vercel.app
```

### 环境变量未生效

**原因**：Vite 环境变量需要在构建时注入

**解决方案**：
1. 确保变量名以 `VITE_` 开头
2. 重新构建和部署（环境变量更改后必须重新部署）
3. 清除浏览器缓存

## 快速检查清单

- [ ] 在 Vercel 中设置了 `VITE_RAILWAY_BACKEND_URL`
- [ ] 环境变量值为：`https://ai-doctor-agent-production.up.railway.app`
- [ ] 选择了所有环境（Production, Preview, Development）
- [ ] 已重新部署项目
- [ ] 测试登录功能正常
- [ ] API 请求指向正确的后端 URL

## 联系信息

如有问题，请检查：
- Vercel 部署日志
- 浏览器控制台错误
- Network 标签中的 API 请求
