# AI个人医生助理 - 开发指南

> 详细的开发指南，包含环境搭建、代码规范、最佳实践和扩展指南

## 📋 目录

- [环境搭建](#环境搭建)
- [项目结构](#项目结构)
- [开发规范](#开发规范)
- [前端开发](#前端开发)
- [后端开发](#后端开发)
- [测试指南](#测试指南)
- [部署指南](#部署指南)
- [扩展指南](#扩展指南)

## 🛠️ 环境搭建

### 系统要求

- **操作系统**: macOS 10.15+, Windows 10+, Ubuntu 18.04+
- **Node.js**: 16.0.0 或更高版本
- **npm**: 8.0.0 或更高版本
- **Git**: 2.20.0 或更高版本

### 开发环境安装

1. **安装Node.js**
```bash
# 使用nvm安装Node.js (推荐)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 16
nvm use 16

# 或直接从官网下载安装
# https://nodejs.org/
```

2. **安装Git**
```bash
# macOS
brew install git

# Ubuntu
sudo apt-get install git

# Windows
# 下载安装: https://git-scm.com/
```

3. **安装VS Code (推荐)**
```bash
# macOS
brew install --cask visual-studio-code

# 或从官网下载: https://code.visualstudio.com/
```

### 项目初始化

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

3. **环境变量配置**
```bash
# 复制环境变量模板
cp backend/env.example backend/.env

# 编辑环境变量
nano backend/.env
```

## 📁 项目结构

### 前端结构
```
frontend/
├── components/          # 可复用组件
│   ├── Sidebar.tsx     # 侧边栏组件
│   ├── ChatMessage.tsx # 聊天消息组件
│   └── *.css          # 组件样式
├── pages/              # 页面组件
│   ├── LoginPage.tsx   # 登录页面
│   ├── ChatPage.tsx    # 聊天页面
│   ├── HealthRecordsPage.tsx # 健康记录页面
│   ├── ProfilePage.tsx # 个人资料页面
│   └── *.css          # 页面样式
├── stores/             # 状态管理
│   ├── authStore.ts    # 认证状态
│   └── chatStore.ts    # 聊天状态
├── services/           # API服务
│   ├── api.ts          # API配置
│   └── chatService.ts  # 聊天服务
├── types/              # TypeScript类型定义
├── utils/              # 工具函数
├── App.tsx             # 主应用组件
├── main.tsx            # 应用入口
└── index.css           # 全局样式
```

### 后端结构
```
backend/
├── src/
│   ├── routes/         # API路由
│   │   ├── auth.js     # 认证路由
│   │   ├── chat.js     # 聊天路由
│   │   └── healthRecords.js # 健康记录路由
│   ├── middleware/      # 中间件
│   ├── utils/          # 工具函数
│   ├── config/         # 配置文件
│   └── index.js        # 服务器入口
├── tests/              # 测试文件
├── docs/               # 文档
├── package.json        # 依赖配置
└── README.md           # 后端说明
```

## 📝 开发规范

### 代码风格

#### TypeScript规范
```typescript
// 接口命名使用PascalCase
interface UserProfile {
  id: string;
  name: string;
  email: string;
}

// 函数命名使用camelCase
const getUserProfile = (id: string): UserProfile => {
  // 实现
};

// 常量使用UPPER_SNAKE_CASE
const API_BASE_URL = 'http://localhost:8000';
```

#### React组件规范
```typescript
// 组件命名使用PascalCase
interface ChatMessageProps {
  message: Message;
  onReply?: (message: string) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, onReply }) => {
  // 组件实现
  return (
    <div className="chat-message">
      {/* JSX内容 */}
    </div>
  );
};

export default ChatMessage;
```

#### CSS规范
```css
/* 使用BEM命名规范 */
.chat-message {
  /* 基础样式 */
}

.chat-message--user {
  /* 修饰符样式 */
}

.chat-message__content {
  /* 子元素样式 */
}
```

### Git提交规范

使用[Conventional Commits](https://www.conventionalcommits.org/)规范：

```bash
# 功能开发
git commit -m "feat: 添加用户登录功能"

# Bug修复
git commit -m "fix: 修复登录验证问题"

# 文档更新
git commit -m "docs: 更新API文档"

# 代码重构
git commit -m "refactor: 重构状态管理逻辑"

# 测试相关
git commit -m "test: 添加用户认证测试"

# 构建相关
git commit -m "chore: 更新依赖版本"
```

### 文件命名规范

- **组件文件**: PascalCase (如 `ChatMessage.tsx`)
- **页面文件**: PascalCase (如 `LoginPage.tsx`)
- **工具文件**: camelCase (如 `apiUtils.ts`)
- **样式文件**: kebab-case (如 `chat-message.css`)
- **配置文件**: kebab-case (如 `vite.config.ts`)

## 🎨 前端开发

### 组件开发

#### 创建新组件
```bash
# 创建组件文件
touch frontend/components/NewComponent.tsx
touch frontend/components/NewComponent.css
```

#### 组件模板
```typescript
import React from 'react';
import { ComponentProps } from 'antd';
import './NewComponent.css';

interface NewComponentProps {
  title: string;
  onAction?: () => void;
}

const NewComponent: React.FC<NewComponentProps> = ({ title, onAction }) => {
  return (
    <div className="new-component">
      <h3>{title}</h3>
      {onAction && (
        <button onClick={onAction}>
          执行操作
        </button>
      )}
    </div>
  );
};

export default NewComponent;
```

### 状态管理

#### Zustand Store模板
```typescript
import { create } from 'zustand';

interface State {
  data: any[];
  loading: boolean;
  error: string | null;
}

interface Actions {
  fetchData: () => Promise<void>;
  setData: (data: any[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const useStore = create<State & Actions>((set, get) => ({
  data: [],
  loading: false,
  error: null,
  
  fetchData: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('/api/data');
      const data = await response.json();
      set({ data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },
  
  setData: (data) => set({ data }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));

export default useStore;
```

### API服务开发

#### 创建API服务
```typescript
import api from './api';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const newService = {
  // 获取数据
  async getData(): Promise<ApiResponse<any[]>> {
    const response = await api.get('/api/data');
    return response.data;
  },
  
  // 创建数据
  async createData(data: any): Promise<ApiResponse<any>> {
    const response = await api.post('/api/data', data);
    return response.data;
  },
  
  // 更新数据
  async updateData(id: string, data: any): Promise<ApiResponse<any>> {
    const response = await api.put(`/api/data/${id}`, data);
    return response.data;
  },
  
  // 删除数据
  async deleteData(id: string): Promise<ApiResponse<void>> {
    const response = await api.delete(`/api/data/${id}`);
    return response.data;
  },
};
```

## 🔧 后端开发

### 路由开发

#### 创建新路由
```bash
# 创建路由文件
touch backend/src/routes/newRoute.js
```

#### 路由模板
```javascript
const express = require('express');
const Joi = require('joi');

const router = express.Router();

// 数据验证schema
const dataSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().optional(),
});

// 获取数据列表
router.get('/', async (req, res) => {
  try {
    // 实现逻辑
    res.json({
      success: true,
      data: [],
      message: '获取数据成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 创建数据
router.post('/', async (req, res) => {
  try {
    // 验证输入
    const { error, value } = dataSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }
    
    // 实现逻辑
    res.status(201).json({
      success: true,
      data: value,
      message: '创建成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
```

### 中间件开发

#### 认证中间件
```javascript
const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: '未提供认证token'
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: '无效的token'
    });
  }
};

module.exports = authMiddleware;
```

### 数据库集成

#### MongoDB集成
```javascript
const mongoose = require('mongoose');

// 连接数据库
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// 定义Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

// 创建模型
const User = mongoose.model('User', userSchema);

module.exports = User;
```

## 🧪 测试指南

### 前端测试

#### 单元测试
```bash
# 安装测试依赖
npm install --save-dev @testing-library/react @testing-library/jest-dom

# 运行测试
npm test
```

#### 测试示例
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import LoginPage from '../pages/LoginPage';

describe('LoginPage', () => {
  test('should render login form', () => {
    render(<LoginPage />);
    expect(screen.getByText('登录')).toBeInTheDocument();
  });
  
  test('should handle form submission', () => {
    render(<LoginPage />);
    const emailInput = screen.getByPlaceholderText('邮箱');
    const passwordInput = screen.getByPlaceholderText('密码');
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: '123456' } });
    
    // 测试逻辑
  });
});
```

### 后端测试

#### API测试
```bash
# 安装测试依赖
cd backend && npm install --save-dev jest supertest

# 运行测试
npm test
```

#### 测试示例
```javascript
const request = require('supertest');
const app = require('../src/index');

describe('Auth API', () => {
  test('should login successfully', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'demo@example.com',
        password: '123456'
      });
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
```

## 🚀 部署指南

### 前端部署

#### 构建生产版本
```bash
# 构建
npm run build

# 预览构建结果
npm run preview
```

#### Docker部署
```dockerfile
# Dockerfile
FROM node:16-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 后端部署

#### PM2部署
```bash
# 安装PM2
npm install -g pm2

# 启动应用
pm2 start backend/src/index.js --name "ai-doctor-backend"

# 设置开机自启
pm2 startup
pm2 save
```

#### Docker部署
```dockerfile
# Dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 8000
CMD ["npm", "start"]
```

## 🔧 扩展指南

### 添加新功能

1. **前端扩展**
   - 创建新页面组件
   - 添加路由配置
   - 更新侧边栏菜单
   - 实现状态管理

2. **后端扩展**
   - 创建新的路由文件
   - 实现业务逻辑
   - 添加数据验证
   - 更新API文档

### 集成第三方服务

#### OpenAI集成
```javascript
const { Configuration, OpenAIApi } = require('openai');

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const generateResponse = async (message) => {
  const completion = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: message }],
  });
  
  return completion.data.choices[0].message.content;
};
```

#### 数据库集成
```javascript
// PostgreSQL集成
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const query = async (text, params) => {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log('执行查询', { text, duration, rows: res.rowCount });
  return res;
};
```

### 性能优化

#### 前端优化
- 代码分割 (Code Splitting)
- 懒加载 (Lazy Loading)
- 图片优化
- 缓存策略

#### 后端优化
- 数据库索引
- 缓存机制
- 负载均衡
- 监控日志

## 📚 学习资源

### 技术文档
- [React官方文档](https://reactjs.org/docs/)
- [TypeScript官方文档](https://www.typescriptlang.org/docs/)
- [Ant Design文档](https://ant.design/docs/react/introduce)
- [Express.js文档](https://expressjs.com/)

### 最佳实践
- [React最佳实践](https://reactjs.org/docs/hooks-faq.html)
- [TypeScript最佳实践](https://www.typescriptlang.org/docs/handbook/)
- [Node.js最佳实践](https://github.com/goldbergyoni/nodebestpractices)

---

**AI个人医生助理开发指南** - 让开发更高效，让代码更优雅！ 💻✨ 