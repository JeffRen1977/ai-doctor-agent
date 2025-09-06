# 移动端开发指南

## 概述

AI医生助理应用现在完全支持本地和移动端开发，提供了一致的用户体验和功能。本指南将帮助您了解如何在移动端和桌面端之间进行开发。

## 架构特点

### 1. 响应式设计
- **自动设备检测**: 应用会自动检测设备类型并切换到相应的布局
- **断点设计**: 
  - 移动端: ≤ 768px
  - 平板: 768px - 1024px  
  - 桌面端: > 1024px
- **触摸优化**: 所有交互都针对触摸设备进行了优化

### 2. PWA (Progressive Web App) 支持
- **离线功能**: 支持离线使用核心功能
- **安装提示**: 自动提示用户安装到主屏幕
- **推送通知**: 支持健康提醒和通知
- **后台同步**: 支持数据后台同步

### 3. 移动端特定功能
- **手势支持**: 支持滑动、点击等手势操作
- **移动端导航**: 底部导航栏和抽屉式菜单
- **触摸反馈**: 优化的触摸交互体验
- **性能优化**: 针对移动设备的性能优化

## 开发环境设置

### 1. 安装依赖
```bash
npm install
```

### 2. 启动开发服务器

#### 仅前端开发
```bash
npm run dev:frontend
```

#### 移动端开发（支持外部访问）
```bash
npm run dev:mobile
```

#### 全栈开发
```bash
npm run dev:full
```

### 3. 移动端调试

#### 使用Chrome DevTools
1. 启动移动端开发服务器: `npm run dev:mobile`
2. 在Chrome中打开 `http://localhost:3000`
3. 按F12打开DevTools
4. 点击设备图标切换到移动端视图
5. 选择目标设备或自定义尺寸

#### 使用真实设备
1. 确保电脑和手机在同一网络
2. 启动移动端开发服务器: `npm run dev:mobile`
3. 在手机浏览器中访问: `http://[你的IP地址]:3000`
4. 例如: `http://192.168.1.100:3000`

## 移动端特性

### 1. 布局系统

#### 移动端布局 (`MobileApp.tsx`)
- 顶部导航栏
- 主要内容区域
- 底部导航栏
- 浮动操作按钮

#### 桌面端布局 (`App.tsx`)
- 侧边栏导航
- 主要内容区域

### 2. 组件结构

```
frontend/
├── components/
│   ├── MobileApp.tsx          # 移动端主应用
│   ├── MobileApp.css          # 移动端样式
│   ├── MobileMenu.tsx         # 移动端菜单
│   ├── MobileMenu.css         # 移动端菜单样式
│   ├── MobileInstallPrompt.tsx # PWA安装提示
│   └── MobileInstallPrompt.css
├── hooks/
│   └── useMobile.ts           # 移动端Hook
└── pages/                     # 页面组件（共享）
```

### 3. 移动端Hook

#### `useMobile()`
提供设备信息检测：
```typescript
const { 
  isMobile,      // 是否为移动设备
  isTablet,      // 是否为平板
  isDesktop,     // 是否为桌面端
  screenWidth,   // 屏幕宽度
  screenHeight,  // 屏幕高度
  orientation,   // 屏幕方向
  isOnline,      // 网络状态
  isPWA,         // 是否为PWA模式
  canInstall     // 是否可安装PWA
} = useMobile()
```

#### `useMobileGestures()`
提供手势支持：
```typescript
const { type, direction } = useMobileGestures()
// type: 'swipe-left' | 'swipe-right' | 'swipe-up' | 'swipe-down' | null
// direction: 'left' | 'right' | 'up' | 'down' | null
```

#### `useMobileNotifications()`
提供通知功能：
```typescript
const { 
  permission,        // 通知权限状态
  isSupported,       // 是否支持通知
  requestPermission, // 请求权限
  showNotification   // 显示通知
} = useMobileNotifications()
```

## 构建和部署

### 1. 构建应用
```bash
# 标准构建
npm run build

# 移动端优化构建
npm run build:mobile
```

### 2. 预览构建结果
```bash
npm run preview
```

### 3. 本地服务器测试
```bash
npm run mobile:serve
```

## 移动端优化

### 1. 性能优化
- **代码分割**: 按需加载组件
- **图片优化**: 响应式图片和懒加载
- **缓存策略**: 智能缓存静态资源
- **压缩优化**: 代码和资源压缩

### 2. 用户体验优化
- **触摸反馈**: 所有交互都有视觉反馈
- **加载状态**: 优雅的加载动画
- **错误处理**: 友好的错误提示
- **离线支持**: 离线状态下的功能降级

### 3. 安全优化
- **HTTPS**: 生产环境强制HTTPS
- **CSP**: 内容安全策略
- **数据加密**: 敏感数据加密传输

## 测试

### 1. 响应式测试
- 测试不同屏幕尺寸下的布局
- 验证触摸交互的响应性
- 检查横竖屏切换

### 2. PWA测试
- 测试离线功能
- 验证安装流程
- 检查推送通知

### 3. 性能测试
- 使用Lighthouse进行性能评估
- 测试网络慢速情况下的表现
- 验证内存使用情况

## 常见问题

### 1. 移动端样式问题
**问题**: 样式在移动端显示异常
**解决**: 检查CSS媒体查询和移动端特定样式

### 2. 触摸事件问题
**问题**: 触摸事件不响应
**解决**: 确保使用了正确的触摸事件处理

### 3. PWA安装问题
**问题**: PWA无法安装
**解决**: 检查manifest.json和Service Worker配置

### 4. 网络问题
**问题**: 移动端无法访问开发服务器
**解决**: 确保使用正确的IP地址和端口

## 最佳实践

### 1. 开发建议
- 优先考虑移动端体验
- 使用相对单位而非固定像素
- 测试真实设备而非仅模拟器
- 考虑网络条件的影响

### 2. 性能建议
- 优化图片大小和格式
- 减少HTTP请求数量
- 使用CDN加速静态资源
- 实施适当的缓存策略

### 3. 用户体验建议
- 保持界面简洁直观
- 提供清晰的视觉反馈
- 考虑单手操作的便利性
- 优化加载和错误状态

## 更新日志

### v1.0.0
- 初始移动端支持
- PWA功能实现
- 响应式设计完成
- 移动端特定功能添加

---

通过本指南，您应该能够成功进行移动端和桌面端的开发。如有问题，请参考项目文档或联系开发团队。

