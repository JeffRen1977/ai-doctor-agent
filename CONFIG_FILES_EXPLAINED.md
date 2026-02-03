# 配置文件详解

本文档详细解释项目中各个配置文件的作用和配置项。

---

## 📦 package.json

### 作用
Node.js 项目的核心配置文件，定义了项目元数据、依赖包、脚本命令等。

### 主要配置项

#### 基本信息
```json
{
  "name": "ai-doctor-agent",           // 项目名称
  "version": "1.0.0",                  // 项目版本
  "description": "AI个人医生助理全栈应用",  // 项目描述
  "private": true,                     // 私有项目，不会发布到 npm
  "main": "backend/src/index.js",      // 主入口文件
  "engines": {                         // 运行时要求
    "node": ">=20.0.0",               // Node.js 版本要求
    "npm": ">=10.0.0"                 // npm 版本要求
  }
}
```

#### 脚本命令 (scripts)
```json
{
  "scripts": {
    // 开发环境
    "dev:frontend": "vite",                    // 启动前端开发服务器
    "dev:backend": "nodemon backend/src/index.js",  // 启动后端开发服务器（自动重启）
    "dev:mobile": "vite --host 0.0.0.0 --port 3000",  // 移动端开发模式
    "dev:full": "node scripts/start-mobile-dev.js",  // 同时启动前后端
    
    // 构建
    "build": "vite build",                      // 构建前端生产版本
    "build:mobile": "vite build --mode mobile", // 移动端构建
    
    // 生产环境
    "start": "node scripts/start-railway.js",  // Railway 启动命令
    "start:backend": "node backend/src/index.js",  // 直接启动后端
    
    // 测试
    "test:login": "node scripts/test-login.js",     // 测试登录功能
    "test:china-ai": "node backend/test-china-ai.js",  // 测试中国AI模型
    "test:language": "node scripts/test-language-sync.js",  // 测试语言同步
    
    // 部署
    "deploy:railway": "./scripts/deploy-railway.sh",  // Railway 部署
    "deploy:vercel": "./scripts/deploy-vercel.sh",    // Vercel 部署
    "deploy:quick": "./scripts/quick-deploy.sh",      // 快速部署
    
    // 工具
    "fix:deployment": "node scripts/fix-deployment-errors.js",  // 修复部署错误
    "lint": "eslint frontend --ext ts,tsx"  // 代码检查
  }
}
```

#### 依赖包

**dependencies** (生产依赖):
- `react`, `react-dom` - React 框架
- `antd` - Ant Design UI 组件库
- `express` - 后端 Web 框架
- `firebase` - Firebase 服务
- `@google/generative-ai` - Google Gemini AI
- `openai` - OpenAI API
- `axios` - HTTP 客户端
- `zustand` - 状态管理
- 等等...

**devDependencies** (开发依赖):
- `vite` - 前端构建工具
- `typescript` - TypeScript 编译器
- `nodemon` - 自动重启开发服务器
- `eslint` - 代码检查工具
- 等等...

### 使用示例

```bash
# 安装依赖
npm install

# 运行开发服务器
npm run dev:frontend
npm run dev:backend
npm run dev:full

# 构建生产版本
npm run build

# 运行测试
npm run test:login

# 部署
npm run deploy:railway
```

---

## 🚂 railway.json

### 作用
Railway 平台的后端部署配置文件，定义如何构建和运行后端服务。

### 配置详解

```json
{
  "$schema": "https://railway.app/railway.schema.json",  // JSON Schema 验证
  "build": {
    "builder": "dockerfile",           // 使用 Dockerfile 构建
    "dockerfilePath": "Dockerfile"     // Dockerfile 路径
  },
  "deploy": {
    "startCommand": "npm start",        // 启动命令（执行 package.json 中的 start）
    "healthcheckPath": "/health",       // 健康检查端点
    "healthcheckTimeout": 300,          // 健康检查超时时间（秒）
    "restartPolicyType": "on_failure",  // 重启策略：失败时重启
    "restartPolicyMaxRetries": 10,      // 最大重启次数
    "numReplicas": 1,                  // 副本数量
    "healthcheckInterval": 30,         // 健康检查间隔（秒）
    "healthcheckRetries": 3            // 健康检查重试次数
  },
  "source": {
    "branch": "release"                // 部署分支
  }
}
```

### 工作流程

1. **构建阶段**:
   - Railway 读取 `railway.json`
   - 使用 Dockerfile 构建 Docker 镜像
   - 安装依赖包

2. **部署阶段**:
   - 执行 `startCommand` (`npm start`)
   - `npm start` 执行 `scripts/start-railway.js`
   - 启动后端服务器

3. **健康检查**:
   - Railway 定期访问 `/health` 端点
   - 如果检查失败，自动重启服务

### 重要配置说明

- **healthcheckPath**: Railway 通过这个端点判断服务是否健康
- **restartPolicyType**: `on_failure` 表示只在失败时重启
- **branch**: 指定从哪个 Git 分支部署

---

## 📘 tsconfig.json

### 作用
TypeScript 编译器配置文件，定义 TypeScript 编译选项和项目结构。

### 配置详解

```json
{
  "compilerOptions": {
    // 编译目标
    "target": "ES2020",              // 编译为 ES2020 标准
    "lib": ["ES2020", "DOM", "DOM.Iterable"],  // 包含的库文件
    "module": "ESNext",              // 使用 ESNext 模块系统
    
    // 模块解析
    "moduleResolution": "node",      // 使用 Node.js 模块解析
    "resolveJsonModule": true,       // 允许导入 JSON 文件
    "isolatedModules": true,         // 每个文件作为独立模块
    
    // JSX 配置
    "jsx": "react-jsx",              // 使用新的 JSX 转换（React 17+）
    
    // 类型检查
    "strict": true,                  // 启用严格模式
    "noUnusedLocals": true,          // 检查未使用的局部变量
    "noUnusedParameters": true,      // 检查未使用的参数
    "noFallthroughCasesInSwitch": true,  // 检查 switch 语句的 fallthrough
    
    // 路径映射
    "baseUrl": ".",                  // 基础路径
    "paths": {
      "@/*": ["frontend/*"]          // @ 别名指向 frontend 目录
    },
    
    // 其他
    "useDefineForClassFields": true,  // 使用标准的类字段定义
    "skipLibCheck": true,            // 跳过库文件的类型检查
    "allowSyntheticDefaultImports": true,  // 允许合成默认导入
    "noEmit": true                   // 不生成输出文件（Vite 负责构建）
  },
  "include": ["frontend"],           // 包含 frontend 目录
  "references": [{                   // 项目引用
    "path": "./tsconfig.node.json"   // 引用 Node.js 配置文件
  }]
}
```

### 路径别名

配置了 `@/*` 别名，可以在代码中这样使用：

```typescript
// 不使用别名
import { useAuthStore } from '../../stores/authStore'

// 使用别名（更简洁）
import { useAuthStore } from '@/stores/authStore'
```

### 严格模式

启用 `strict: true` 后，TypeScript 会进行更严格的类型检查：
- 不允许隐式 `any` 类型
- 必须明确处理 `null` 和 `undefined`
- 检查未使用的变量和参数

---

## 📗 tsconfig.node.json

### 作用
Node.js 环境下的 TypeScript 配置（用于 Vite 配置文件等）。

### 配置详解

```json
{
  "compilerOptions": {
    "composite": true,               // 启用项目引用
    "skipLibCheck": true,            // 跳过库文件检查
    "module": "ESNext",              // 使用 ESNext 模块
    "moduleResolution": "bundler",   // 使用 bundler 模块解析（Vite）
    "allowSyntheticDefaultImports": true  // 允许合成默认导入
  },
  "include": ["vite.config.ts"]     // 只包含 Vite 配置文件
}
```

### 为什么需要两个 tsconfig？

- **tsconfig.json**: 用于前端 React 代码
- **tsconfig.node.json**: 用于 Node.js 工具文件（如 `vite.config.ts`）

两者有不同的编译目标和模块系统需求。

---

## ▲ vercel.json

### 作用
Vercel 平台的前端部署配置文件，定义如何构建和部署前端应用。

### 配置详解

```json
{
  "version": 2,                      // Vercel 配置版本
  "buildCommand": "npm run build",   // 构建命令
  "outputDirectory": "dist",         // 构建输出目录
  "installCommand": "npm install",   // 安装依赖命令
  "framework": "vite",               // 框架类型（Vercel 自动优化）
  
  "rewrites": [                      // URL 重写规则
    {
      "source": "/(.*)",             // 匹配所有路径
      "destination": "/index.html"   // 重定向到 index.html（SPA 路由）
    }
  ],
  
  "headers": [                        // HTTP 响应头配置
    {
      "source": "/assets/(.*)",      // 静态资源
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"  // 长期缓存
        }
      ]
    },
    {
      "source": "/(.*\\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot))",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"  // 长期缓存
        }
      ]
    },
    {
      "source": "/index.html",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "no-cache, no-store, must-revalidate"  // 不缓存 HTML
        }
      ]
    }
  ],
  
  "env": {                           // 环境变量（已弃用，应在 Vercel 控制台设置）
    "VITE_API_BASE_URL": "@railway_backend_url"
  }
}
```

### 关键配置说明

#### 1. SPA 路由支持 (rewrites)
```json
"rewrites": [
  {
    "source": "/(.*)",
    "destination": "/index.html"
  }
]
```
**作用**: 所有路由都返回 `index.html`，让 React Router 处理客户端路由。

**为什么需要**: 
- 用户直接访问 `/chat` 时，Vercel 会返回 404
- 通过 rewrite，所有路径都返回 `index.html`
- React Router 在客户端处理路由

#### 2. 缓存策略 (headers)

**静态资源** (长期缓存):
```json
"Cache-Control": "public, max-age=31536000, immutable"
```
- 缓存 1 年
- `immutable` 表示资源不会改变
- 提高加载速度

**HTML 文件** (不缓存):
```json
"Cache-Control": "no-cache, no-store, must-revalidate"
```
- 确保用户总是获取最新的 HTML
- 避免缓存导致的问题

#### 3. 构建配置

- **buildCommand**: Vercel 执行 `npm run build` 构建前端
- **outputDirectory**: 构建产物在 `dist` 目录
- **framework**: 指定为 `vite`，Vercel 会进行优化

### 工作流程

1. **检测**: Vercel 检测到 `vercel.json` 和 `vite.config.ts`
2. **安装**: 执行 `npm install`
3. **构建**: 执行 `npm run build`
4. **部署**: 将 `dist` 目录内容部署到 CDN
5. **路由**: 所有请求通过 rewrite 规则处理

---

## ⚙️ vite.config.ts

### 作用
Vite 构建工具的配置文件，定义前端开发服务器和构建选项。

### 配置详解

```typescript
export default defineConfig({
  // 插件
  plugins: [
    react({
      fastRefresh: true,    // 快速刷新（HMR）
      babel: {
        plugins: []
      }
    })
  ],
  
  // 项目根目录
  root: '.',
  
  // 静态资源目录
  publicDir: 'frontend/public',
  
  // 路径别名
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './frontend')
    }
  },
  
  // 开发服务器配置
  server: {
    port: 3000,              // 开发服务器端口
    host: true,              // 允许外部访问（移动端调试）
    hmr: {                   // 热模块替换
      port: 3003,            // HMR WebSocket 端口
      host: 'localhost'
    },
    proxy: {                 // API 代理
      '/api': {
        target: 'http://localhost:8000',  // 后端地址
        changeOrigin: true
      }
    }
  },
  
  // 构建配置
  build: {
    outDir: 'dist',          // 输出目录
    assetsDir: 'assets',     // 静态资源目录
    sourcemap: true,         // 生成 source map
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html')
      }
    }
  },
  
  // 环境变量
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    'import.meta.env.VITE_RAILWAY_BACKEND_URL': JSON.stringify(process.env.VITE_RAILWAY_BACKEND_URL || ''),
    'import.meta.env.VITE_API_BASE_URL': JSON.stringify(process.env.VITE_API_BASE_URL || '')
  },
  
  // 依赖优化
  optimizeDeps: {
    include: ['react', 'react-dom', 'antd', '@ant-design/icons']
  }
})
```

### 关键配置说明

#### 1. API 代理 (proxy)
```typescript
proxy: {
  '/api': {
    target: 'http://localhost:8000',
    changeOrigin: true
  }
}
```
**作用**: 开发时，前端请求 `/api/*` 会被代理到 `http://localhost:8000/api/*`

**好处**: 
- 避免 CORS 问题
- 前端可以使用相对路径
- 生产环境不需要代理（直接请求 Railway）

#### 2. 环境变量 (define)
```typescript
define: {
  'import.meta.env.VITE_RAILWAY_BACKEND_URL': JSON.stringify(process.env.VITE_RAILWAY_BACKEND_URL || '')
}
```
**作用**: 将环境变量注入到代码中

**使用**:
```typescript
// 在代码中使用
const apiUrl = import.meta.env.VITE_RAILWAY_BACKEND_URL
```

#### 3. 路径别名 (alias)
```typescript
alias: {
  '@': path.resolve(__dirname, './frontend')
}
```
**作用**: 简化导入路径

**使用**:
```typescript
import Component from '@/components/Component'
// 等同于
import Component from './frontend/components/Component'
```

---

## 🔗 配置文件之间的关系

```
┌─────────────────┐
│  package.json   │  ← 定义项目依赖和脚本
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐ ┌──▼────┐
│Railway│ │Vercel │
│.json  │ │.json  │  ← 部署平台配置
└───────┘ └───────┘
    │         │
    │    ┌────▼────┐
    │    │vite.config│  ← 构建工具配置
    │    └────┬────┘
    │         │
┌───▼─────────▼───┐
│  tsconfig.json   │  ← TypeScript 配置
└─────────────────┘
```

### 工作流程

1. **开发阶段**:
   - `package.json` 定义开发脚本
   - `vite.config.ts` 配置开发服务器
   - `tsconfig.json` 配置 TypeScript

2. **构建阶段**:
   - `package.json` 的 `build` 脚本
   - `vite.config.ts` 的构建配置
   - 生成 `dist` 目录

3. **部署阶段**:
   - **后端**: `railway.json` → Railway 平台
   - **前端**: `vercel.json` → Vercel 平台

---

## 📝 常见配置修改

### 修改开发服务器端口

```typescript
// vite.config.ts
server: {
  port: 3001,  // 改为 3001
}
```

### 添加新的环境变量

1. 在 Vercel/Railway 设置环境变量
2. 在 `vite.config.ts` 的 `define` 中添加
3. 在代码中使用 `import.meta.env.VITE_XXX`

### 修改构建输出目录

```typescript
// vite.config.ts
build: {
  outDir: 'build',  // 改为 build
}
```

同时更新 `vercel.json`:
```json
{
  "outputDirectory": "build"
}
```

---

## 🐛 故障排除

### TypeScript 错误

**问题**: 类型检查失败
**解决**: 检查 `tsconfig.json` 的 `include` 和 `exclude` 配置

### 构建失败

**问题**: Vite 构建错误
**解决**: 
- 检查 `vite.config.ts` 配置
- 查看构建日志
- 验证环境变量

### 部署失败

**问题**: Railway/Vercel 部署失败
**解决**:
- 检查对应的 JSON 配置文件
- 验证构建命令
- 查看平台日志

---

**最后更新**: 2025-01-XX
