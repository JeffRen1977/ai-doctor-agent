# AI个人医生助理

> 一个基于React + Node.js的智能健康咨询系统，提供AI医生对话和健康记录管理功能

[![React](https://img.shields.io/badge/React-18.2.0-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9.0-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-16+-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.18.2-green.svg)](https://expressjs.com/)
[![Ant Design](https://img.shields.io/badge/Ant%20Design-5.0.0-red.svg)](https://ant.design/)

## 📋 目录

- [项目概述](#项目概述)
- [功能特性](#功能特性)
- [技术栈](#技术栈)
- [快速开始](#快速开始)
- [项目结构](#项目结构)
- [API文档](#api文档)
- [开发指南](#开发指南)
- [部署指南](#部署指南)
- [贡献指南](#贡献指南)

## 🎯 项目概述

AI个人医生助理是一个现代化的健康咨询平台，采用前后端分离架构，为用户提供智能健康咨询、症状分析和健康记录管理服务。

### 核心价值
- 🤖 **智能AI咨询**: 基于症状的智能健康建议
- 📊 **健康记录管理**: 完整的个人健康档案系统
- 🔐 **安全认证**: JWT认证和密码加密
- 📱 **响应式设计**: 完美适配各种设备
- ⚡ **实时交互**: 流畅的用户体验

## ✨ 功能特性

### 🏥 核心功能
- **AI医生对话**: 智能症状分析和健康建议
- **健康记录管理**: 完整的CRUD操作和状态跟踪
- **个人资料管理**: 用户信息和健康档案完善
- **用户认证系统**: 安全的登录登出功能

### 🎨 用户界面
- **现代化设计**: 基于Ant Design的优雅UI
- **响应式布局**: 完美适配桌面端和移动端
- **中文界面**: 完全中文化的用户界面
- **直观操作**: 简单易用的操作流程

### 🔧 技术特性
- **TypeScript支持**: 完整的类型安全
- **状态管理**: 高效的Zustand状态管理
- **路由系统**: React Router 6的现代化路由
- **API集成**: Axios的HTTP请求处理
- **开发体验**: Vite的快速热重载

## 🛠️ 技术栈

### 前端技术栈
| 技术 | 版本 | 用途 |
|------|------|------|
| React | 18.2.0 | 现代化UI库 |
| TypeScript | 4.9.0 | 类型安全的JavaScript |
| Ant Design | 5.0.0 | 企业级UI组件库 |
| Zustand | 4.3.0 | 轻量级状态管理 |
| React Router | 6.8.0 | 客户端路由 |
| Vite | 4.1.0 | 快速构建工具 |
| Axios | 1.3.0 | HTTP客户端 |
| Day.js | 1.11.0 | 日期处理库 |

### 后端技术栈
| 技术 | 版本 | 用途 |
|------|------|------|
| Node.js | 16+ | JavaScript运行时 |
| Express.js | 4.18.2 | Web应用框架 |
| JWT | 9.0.0 | 用户认证 |
| bcryptjs | 2.4.3 | 密码加密 |
| Joi | 17.9.2 | 数据验证 |
| Helmet | 7.0.0 | 安全中间件 |
| CORS | 2.8.5 | 跨域资源共享 |
| Morgan | 1.10.0 | HTTP请求日志 |

## 🚀 快速开始

### 环境要求
- Node.js 16+
- npm 或 yarn
- 现代浏览器

### 安装步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd AI-doctor
```

2. **安装依赖**
```bash
# 安装前端依赖
npm install

# 安装后端依赖
cd backend && npm install
```

3. **启动服务**
```bash
# 启动前端开发服务器
npm run dev

# 启动后端API服务
cd backend && npm run dev
```

4. **访问应用**
- 前端: http://localhost:3000
- 后端API: http://localhost:8000
- 演示账号: demo@example.com / 123456

## 📁 项目结构

```
AI-doctor/
├── frontend/                 # 前端源码
│   ├── components/          # 可复用组件
│   │   ├── Sidebar.tsx     # 侧边栏组件
│   │   ├── ChatMessage.tsx # 聊天消息组件
│   │   └── *.css          # 组件样式
│   ├── pages/              # 页面组件
│   │   ├── LoginPage.tsx   # 登录页面
│   │   ├── ChatPage.tsx    # 聊天页面
│   │   ├── HealthRecordsPage.tsx # 健康记录页面
│   │   ├── ProfilePage.tsx # 个人资料页面
│   │   └── *.css          # 页面样式
│   ├── stores/             # 状态管理
│   │   ├── authStore.ts    # 认证状态
│   │   └── chatStore.ts    # 聊天状态
│   ├── services/           # API服务
│   │   ├── api.ts          # API配置
│   │   └── chatService.ts  # 聊天服务
│   ├── App.tsx             # 主应用组件
│   ├── main.tsx            # 应用入口
│   └── index.css           # 全局样式
├── backend/                # 后端源码
│   ├── src/
│   │   ├── routes/         # API路由
│   │   │   ├── auth.js     # 认证路由
│   │   │   ├── chat.js     # 聊天路由
│   │   │   └── healthRecords.js # 健康记录路由
│   │   └── index.js        # 服务器入口
│   ├── package.json        # 后端依赖
│   └── README.md           # 后端说明
├── docs/                   # 项目文档
│   ├── README.md           # 文档中心
│   ├── API_DOCUMENTATION.md # API文档
│   ├── DEVELOPMENT_GUIDE.md # 开发指南
│   ├── DEPLOYMENT_GUIDE.md # 部署指南
│   └── PROJECT_SUMMARY.md  # 项目总结
├── Design_doc/             # 设计文档
├── package.json            # 前端依赖
├── vite.config.ts          # Vite配置
├── tsconfig.json           # TypeScript配置
└── README.md               # 项目说明
```

## 📡 API文档

> 详细的API文档请查看 [docs/API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md)

### 快速参考

#### 认证接口
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/logout` - 用户登出
- `GET /api/auth/me` - 获取当前用户信息

#### 聊天接口
- `POST /api/chat/send` - 发送消息到AI医生
- `GET /api/chat/history` - 获取聊天历史
- `DELETE /api/chat/history` - 清空聊天历史

#### 健康记录接口
- `GET /api/health-records` - 获取健康记录列表
- `POST /api/health-records` - 创建健康记录
- `PUT /api/health-records/:id` - 更新健康记录
- `DELETE /api/health-records/:id` - 删除健康记录

## 🔧 开发指南

> 详细的开发指南请查看 [docs/DEVELOPMENT_GUIDE.md](docs/DEVELOPMENT_GUIDE.md)

### 快速开始

#### 前端开发
```bash
# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 代码检查
npm run lint
```

#### 后端开发
```bash
# 启动开发服务器
cd backend && npm run dev

# 运行测试
cd backend && npm test
```

### 开发规范
- **TypeScript**: 严格模式，完整类型定义
- **React**: 函数式组件，Hooks模式
- **代码风格**: ESLint + Prettier
- **Git提交**: Conventional Commits规范

## 🚀 部署指南

> 详细的部署指南请查看 [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md)

### 部署选项

#### 开发环境
- 本地开发服务器 (Vite + Nodemon)
- 热重载和实时调试

#### 生产环境
- **独立服务器**: Nginx + PM2
- **Docker容器**: Docker Compose
- **云平台**: AWS、Azure、GCP

### 快速部署

#### 本地开发
```bash
# 启动前端
npm run dev

# 启动后端
cd backend && npm run dev
```

#### Docker部署
```bash
# 使用Docker Compose
docker-compose up -d
```

#### 生产部署
```bash
# 构建前端
npm run build

# 启动后端
cd backend && pm2 start src/index.js
```

## 🤝 贡献指南

### 开发流程

1. **Fork项目**
```bash
git clone https://github.com/your-username/ai-doctor.git
cd ai-doctor
```

2. **创建功能分支**
```bash
git checkout -b feature/AmazingFeature
```

3. **提交更改**
```bash
git add .
git commit -m 'Add some AmazingFeature'
```

4. **推送到分支**
```bash
git push origin feature/AmazingFeature
```

5. **创建Pull Request**

### 代码规范

#### 提交信息规范
```
feat: 添加新功能
fix: 修复bug
docs: 更新文档
style: 代码格式调整
refactor: 代码重构
test: 添加测试
chore: 构建过程或辅助工具的变动
```

#### 代码风格
- 使用ESLint和Prettier
- 遵循TypeScript最佳实践
- 组件命名使用PascalCase
- 文件命名使用camelCase

## 📚 文档

### 核心文档
- **[文档中心](docs/README.md)** - 完整的文档导航和索引
- **[API文档](docs/API_DOCUMENTATION.md)** - 详细的API接口文档
- **[开发指南](docs/DEVELOPMENT_GUIDE.md)** - 开发环境搭建和最佳实践
- **[部署指南](docs/DEPLOYMENT_GUIDE.md)** - 生产环境部署方案
- **[项目总结](docs/PROJECT_SUMMARY.md)** - 完整的技术架构和功能说明

### 文档特点
- **结构化**: 清晰的目录结构和章节划分
- **实用性**: 包含大量代码示例和配置模板
- **完整性**: 覆盖开发、部署、维护全流程
- **可维护性**: 模块化文档结构，便于更新

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 📞 联系方式

- 项目Issues: [GitHub Issues](https://github.com/your-username/ai-doctor/issues)
- 邮箱: your-email@example.com
- 项目主页: https://github.com/your-username/ai-doctor

## 🙏 致谢

感谢所有为这个项目做出贡献的开发者和用户！

---

**AI个人医生助理** - 让健康管理更智能，让生活更美好！ 🏥✨ 