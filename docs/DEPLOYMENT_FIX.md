# 部署错误修复说明

## 问题修复

### 1. API 404 错误修复

**问题**：`/api/auth/login` 返回 404

**原因**：前端部署在 Vercel (ai-theron.com)，后端部署在 Railway，API 路径需要指向正确的后端 URL。

**解决方案**：
- 创建了 `frontend/utils/apiConfig.ts` 统一管理 API base URL
- 更新了所有使用硬编码 `/api` 的地方
- API URL 现在会根据环境变量自动配置

### 2. 图标 404 错误修复

**问题**：`/icon-192x192.png` 返回 404

**原因**：浏览器可能在寻找 PNG 版本的图标，但 manifest.json 配置的是 SVG。

**解决方案**：
- `manifest.json` 已正确配置为使用 `/icon.svg`
- 如果浏览器仍然报错，可能需要清除浏览器缓存

## Vercel 环境变量配置

在 Vercel 项目设置中添加以下环境变量：

### 必需的环境变量

1. **VITE_RAILWAY_BACKEND_URL**
   - 值：`https://ai-doctor-agent-production.up.railway.app`
   - 说明：Railway 后端的基础 URL

2. **VITE_API_BASE_URL**（可选）
   - 值：`https://ai-doctor-agent-production.up.railway.app/api`
   - 说明：如果设置了此变量，将优先使用此值

### 配置步骤

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择你的项目（ai-theron.com）
3. 进入 **Settings** → **Environment Variables**
4. 添加环境变量：
   ```
   VITE_RAILWAY_BACKEND_URL = https://ai-doctor-agent-production.up.railway.app
   ```
   或者（如果使用完整 API URL）：
   ```
   VITE_API_BASE_URL = https://ai-doctor-agent-production.up.railway.app/api
   ```
5. 选择环境：**Production**, **Preview**, **Development**（建议全部选择）
6. 点击 **Save**
7. 重新部署项目（或等待下次自动部署）

## 验证修复

部署后，检查以下内容：

1. **API 请求**：
   - 打开浏览器开发者工具（F12）
   - 查看 Network 标签
   - 登录时，API 请求应该指向正确的 Railway 后端 URL

2. **图标加载**：
   - 检查 `/icon.svg` 是否正常加载
   - 如果仍有问题，清除浏览器缓存

3. **Service Worker**：
   - Service Worker 应该正常注册
   - 检查控制台是否有错误

## 测试

1. 访问 https://www.ai-theron.com
2. 尝试登录
3. 检查浏览器控制台是否有错误
4. 验证 API 请求是否指向正确的后端 URL

## 注意事项

- 环境变量更改后需要重新部署才能生效
- 确保 Railway 后端已正确配置 CORS，允许来自 ai-theron.com 的请求
- 如果使用 HTTPS，确保所有 API 请求也使用 HTTPS
