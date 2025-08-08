# AI医生助理系统 - 故障排除指南

## 🚨 常见问题及解决方案

### 1. 端口被占用问题

**问题描述**: 启动时显示 "Port 3000 is in use"

**解决方案**:
```bash
# 方法1: 使用启动脚本（会自动选择可用端口）
./start.sh

# 方法2: 手动指定端口
npm run dev -- --port 3001

# 方法3: 查找并关闭占用端口的进程
lsof -ti:3000 | xargs kill -9
```

### 2. 依赖包版本冲突

**问题描述**: 出现 tslib 或 @ant-design/plots 相关错误

**解决方案**:
```bash
# 清理缓存
rm -rf node_modules/.vite
rm -rf node_modules/.cache

# 重新安装依赖
npm install

# 或者强制重新安装
rm -rf node_modules package-lock.json
npm install
```

### 3. 图标导入错误

**问题描述**: "The requested module does not provide an export named 'XXXOutlined'"

**解决方案**:
- 检查图标名称是否正确
- 使用 Ant Design 官方图标库中的图标
- 常见替换：
  - `LocationOutlined` → `GlobalOutlined`
  - `RobotOutlined` → `MessageOutlined`

### 4. TypeScript 编译错误

**问题描述**: TypeScript 类型检查失败

**解决方案**:
```bash
# 检查 TypeScript 配置
npx tsc --noEmit

# 跳过类型检查启动
npm run dev -- --mode development
```

### 5. 构建失败

**问题描述**: `npm run build` 失败

**解决方案**:
```bash
# 清理构建缓存
rm -rf dist

# 使用开发模式构建
npm run dev

# 或者跳过类型检查
npx vite build --mode production
```

## 🔧 开发环境设置

### 环境要求
- Node.js 16+
- npm 或 yarn
- 现代浏览器（Chrome, Firefox, Safari, Edge）

### 安装步骤
```bash
# 1. 克隆项目
git clone <repository-url>
cd ai-doctor-agent

# 2. 安装依赖
npm install

# 3. 启动开发服务器
npm run dev
```

## 🌐 访问应用

### 开发环境
- 默认地址: http://localhost:3000
- 如果端口被占用，会自动选择其他端口（如 3001, 3002, 3003）
- 查看终端输出确认实际端口

### 生产环境
```bash
# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

## 📱 功能测试

### 基本功能检查
1. **页面加载**: 访问首页，检查是否正常显示
2. **导航功能**: 点击侧边栏菜单，检查页面切换
3. **响应式设计**: 调整浏览器窗口大小，检查布局适配
4. **交互功能**: 测试按钮点击、表单提交等交互

### 各模块测试
1. **健康仪表板**: 检查数据展示和图表
2. **AI问诊**: 测试对话功能
3. **预约管理**: 测试日历和预约流程
4. **设备同步**: 测试设备管理界面
5. **紧急求助**: 测试紧急功能
6. **健康档案**: 测试档案管理

## 🐛 调试技巧

### 浏览器开发者工具
1. 打开 F12 开发者工具
2. 查看 Console 标签页的错误信息
3. 查看 Network 标签页的网络请求
4. 使用 Elements 标签页检查DOM结构

### 代码调试
```bash
# 启用详细日志
DEBUG=vite:* npm run dev

# 查看构建详情
npm run build --verbose
```

### 常见错误类型
1. **模块导入错误**: 检查文件路径和导入语法
2. **类型错误**: 检查 TypeScript 类型定义
3. **样式错误**: 检查 CSS 类名和样式规则
4. **运行时错误**: 检查 JavaScript 逻辑

## 📞 获取帮助

### 查看文档
- `README.md` - 项目总览
- `PROJECT_COMPLETION_SUMMARY.md` - 完整项目总结
- `FRONTEND_DESIGN_SUMMARY.md` - 前端设计说明
- `frontend/README.md` - 前端开发文档

### 检查日志
```bash
# 查看 npm 日志
npm run dev 2>&1 | tee dev.log

# 查看构建日志
npm run build 2>&1 | tee build.log
```

### 常见解决方案
1. **重启开发服务器**: 停止当前服务，重新运行 `npm run dev`
2. **清理缓存**: 删除 `node_modules/.vite` 目录
3. **重新安装依赖**: 删除 `node_modules` 和 `package-lock.json`，重新运行 `npm install`
4. **检查端口**: 确保端口没有被其他应用占用

## 🎯 性能优化

### 开发环境优化
```bash
# 使用更快的包管理器
npm install -g pnpm
pnpm install

# 启用 Vite 优化
npm run dev -- --force
```

### 生产环境优化
```bash
# 分析构建包大小
npm run build -- --analyze

# 启用压缩
npm run build -- --mode production
```

## 🔒 安全注意事项

### 开发环境
- 不要在代码中硬编码敏感信息
- 使用环境变量管理配置
- 定期更新依赖包

### 生产环境
- 启用 HTTPS
- 配置正确的 CORS 策略
- 实施适当的安全头部

## 📈 监控和维护

### 性能监控
- 使用浏览器开发者工具的性能标签页
- 监控页面加载时间
- 检查内存使用情况

### 错误监控
- 设置错误边界
- 记录用户操作日志
- 监控 API 调用失败

### 定期维护
- 更新依赖包版本
- 清理无用代码
- 优化构建配置 