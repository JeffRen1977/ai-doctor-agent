# AI个人医生助理 - 部署指南

> 详细的部署指南，包含开发环境、生产环境和云平台部署方案

## 📋 目录

- [部署概述](#部署概述)
- [开发环境部署](#开发环境部署)
- [生产环境部署](#生产环境部署)
- [Docker部署](#docker部署)
- [云平台部署](#云平台部署)
- [监控和维护](#监控和维护)
- [故障排除](#故障排除)

## 🎯 部署概述

### 部署架构
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   前端应用      │    │   后端API       │    │   数据库        │
│   (Nginx)       │◄──►│   (Node.js)     │◄──►│   (MongoDB)     │
│   Port: 80      │    │   Port: 8000    │    │   Port: 27017   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 部署选项
- **开发环境**: 本地开发服务器
- **生产环境**: 独立服务器部署
- **容器化部署**: Docker + Docker Compose
- **云平台部署**: AWS、Azure、GCP等

## 🛠️ 开发环境部署

### 本地开发环境

#### 1. 环境准备
```bash
# 检查Node.js版本
node --version  # 需要 16.0.0+

# 检查npm版本
npm --version   # 需要 8.0.0+

# 检查Git版本
git --version   # 需要 2.20.0+
```

#### 2. 项目克隆
```bash
# 克隆项目
git clone <repository-url>
cd AI-doctor

# 安装前端依赖
npm install

# 安装后端依赖
cd backend && npm install
```

#### 3. 环境变量配置
```bash
# 复制环境变量模板
cp backend/env.example backend/.env

# 编辑环境变量
nano backend/.env
```

**环境变量配置**:
```env
# 服务器配置
PORT=8000
NODE_ENV=development

# JWT配置
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# 数据库配置 (可选)
MONGODB_URI=mongodb://localhost:27017/ai-doctor

# 第三方服务配置 (可选)
OPENAI_API_KEY=your-openai-api-key
```

#### 4. 启动服务
```bash
# 启动前端开发服务器
npm run dev

# 启动后端API服务
cd backend && npm run dev
```

#### 5. 验证部署
```bash
# 检查前端服务
curl http://localhost:3000

# 检查后端服务
curl http://localhost:8000/api/health

# 测试登录API
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"123456"}'
```

## 🚀 生产环境部署

### 独立服务器部署

#### 1. 服务器准备
```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装Node.js
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装Nginx
sudo apt install nginx -y

# 安装PM2
sudo npm install -g pm2
```

#### 2. 项目部署
```bash
# 创建应用目录
sudo mkdir -p /var/www/ai-doctor
sudo chown $USER:$USER /var/www/ai-doctor

# 克隆项目
cd /var/www/ai-doctor
git clone <repository-url> .

# 安装依赖
npm install
cd backend && npm install
```

#### 3. 前端构建
```bash
# 构建前端
npm run build

# 检查构建结果
ls -la dist/
```

#### 4. 后端配置
```bash
# 创建生产环境变量
cd backend
cp env.example .env

# 编辑生产环境变量
nano .env
```

**生产环境变量**:
```env
PORT=8000
NODE_ENV=production
JWT_SECRET=your-production-secret-key-change-this
MONGODB_URI=mongodb://localhost:27017/ai-doctor
```

#### 5. 启动服务
```bash
# 启动后端服务
cd backend
pm2 start src/index.js --name "ai-doctor-backend"

# 设置开机自启
pm2 startup
pm2 save
```

#### 6. Nginx配置
```bash
# 创建Nginx配置
sudo nano /etc/nginx/sites-available/ai-doctor
```

**Nginx配置**:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        root /var/www/ai-doctor/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # API代理
    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}
```

```bash
# 启用站点
sudo ln -s /etc/nginx/sites-available/ai-doctor /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 🐳 Docker部署

### Docker Compose部署

#### 1. 创建Docker Compose配置
```bash
# 创建docker-compose.yml
nano docker-compose.yml
```

**docker-compose.yml**:
```yaml
version: '3.8'

services:
  # 前端服务
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    networks:
      - ai-doctor-network

  # 后端服务
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.backend
    ports:
      - "8000:8000"
    environment:
      - NODE_ENV=production
      - PORT=8000
      - JWT_SECRET=your-production-secret-key
    depends_on:
      - mongodb
    networks:
      - ai-doctor-network

  # MongoDB数据库
  mongodb:
    image: mongo:5.0
    ports:
      - "27017:27017"
    environment:
      - MONGO_INITDB_ROOT_USERNAME=admin
      - MONGO_INITDB_ROOT_PASSWORD=password
    volumes:
      - mongodb_data:/data/db
    networks:
      - ai-doctor-network

  # Redis缓存 (可选)
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - ai-doctor-network

volumes:
  mongodb_data:
  redis_data:

networks:
  ai-doctor-network:
    driver: bridge
```

#### 2. 前端Dockerfile
```dockerfile
# Dockerfile.frontend
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

#### 3. 后端Dockerfile
```dockerfile
# Dockerfile.backend
FROM node:16-alpine

WORKDIR /app

# 复制package文件
COPY package*.json ./
RUN npm ci --only=production

# 复制源代码
COPY . .

# 创建非root用户
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# 更改文件权限
RUN chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 8000

CMD ["npm", "start"]
```

#### 4. Nginx配置
```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    # 日志格式
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log;

    # Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss;

    server {
        listen 80;
        server_name localhost;

        # 前端静态文件
        location / {
            root /usr/share/nginx/html;
            index index.html;
            try_files $uri $uri/ /index.html;
        }

        # API代理
        location /api {
            proxy_pass http://backend:8000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # 安全头
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "no-referrer-when-downgrade" always;
    }
}
```

#### 5. 启动Docker服务
```bash
# 构建并启动服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

## ☁️ 云平台部署

### AWS部署

#### 1. EC2实例部署
```bash
# 连接到EC2实例
ssh -i your-key.pem ubuntu@your-ec2-ip

# 安装Docker
sudo apt update
sudo apt install docker.io docker-compose -y
sudo usermod -aG docker $USER

# 克隆项目
git clone <repository-url>
cd AI-doctor

# 启动服务
docker-compose up -d
```

#### 2. AWS ECS部署
```yaml
# task-definition.json
{
  "family": "ai-doctor",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "frontend",
      "image": "your-account/ai-doctor-frontend:latest",
      "portMappings": [
        {
          "containerPort": 80,
          "protocol": "tcp"
        }
      ]
    },
    {
      "name": "backend",
      "image": "your-account/ai-doctor-backend:latest",
      "portMappings": [
        {
          "containerPort": 8000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ]
    }
  ]
}
```

### Azure部署

#### 1. Azure Container Instances
```bash
# 登录Azure
az login

# 创建资源组
az group create --name ai-doctor-rg --location eastus

# 部署容器实例
az container create \
  --resource-group ai-doctor-rg \
  --name ai-doctor \
  --image your-registry/ai-doctor:latest \
  --dns-name-label ai-doctor \
  --ports 80 8000
```

### Google Cloud部署

#### 1. Google Cloud Run
```bash
# 设置项目
gcloud config set project your-project-id

# 构建镜像
gcloud builds submit --tag gcr.io/your-project-id/ai-doctor

# 部署到Cloud Run
gcloud run deploy ai-doctor \
  --image gcr.io/your-project-id/ai-doctor \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

## 📊 监控和维护

### 日志监控

#### 1. 应用日志
```bash
# 查看PM2日志
pm2 logs ai-doctor-backend

# 查看Nginx日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# 查看Docker日志
docker-compose logs -f
```

#### 2. 系统监控
```bash
# 安装监控工具
sudo apt install htop iotop nethogs -y

# 查看系统资源
htop
df -h
free -h
```

### 性能监控

#### 1. 应用性能监控
```javascript
// 添加性能监控
const performance = require('perf_hooks').performance;

app.use((req, res, next) => {
  const start = performance.now();
  
  res.on('finish', () => {
    const duration = performance.now() - start;
    console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration.toFixed(2)}ms`);
  });
  
  next();
});
```

#### 2. 健康检查
```javascript
// 健康检查端点
app.get('/api/health', (req, res) => {
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage()
  };
  
  res.json(health);
});
```

### 备份策略

#### 1. 数据库备份
```bash
# MongoDB备份
mongodump --db ai-doctor --out /backup/$(date +%Y%m%d)

# 自动备份脚本
#!/bin/bash
BACKUP_DIR="/backup"
DATE=$(date +%Y%m%d_%H%M%S)
mongodump --db ai-doctor --out $BACKUP_DIR/$DATE
tar -czf $BACKUP_DIR/ai-doctor_$DATE.tar.gz $BACKUP_DIR/$DATE
rm -rf $BACKUP_DIR/$DATE
```

#### 2. 应用备份
```bash
# 备份应用文件
tar -czf /backup/app_$(date +%Y%m%d).tar.gz /var/www/ai-doctor

# 备份配置文件
cp /etc/nginx/sites-available/ai-doctor /backup/nginx_config_$(date +%Y%m%d)
```

## 🔧 故障排除

### 常见问题

#### 1. 端口冲突
```bash
# 检查端口占用
sudo netstat -tulpn | grep :8000
sudo lsof -i :8000

# 杀死占用进程
sudo kill -9 <PID>
```

#### 2. 权限问题
```bash
# 修复文件权限
sudo chown -R $USER:$USER /var/www/ai-doctor
sudo chmod -R 755 /var/www/ai-doctor

# 修复Nginx权限
sudo chown -R www-data:www-data /var/www/ai-doctor/dist
```

#### 3. 内存不足
```bash
# 检查内存使用
free -h

# 清理内存
sudo sync && sudo sysctl -w vm.drop_caches=3

# 增加swap空间
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

#### 4. 数据库连接问题
```bash
# 检查MongoDB状态
sudo systemctl status mongod

# 重启MongoDB
sudo systemctl restart mongod

# 检查连接
mongo --eval "db.runCommand('ping')"
```

### 日志分析

#### 1. 错误日志分析
```bash
# 查看错误日志
sudo tail -f /var/log/nginx/error.log | grep -i error

# 分析访问日志
sudo tail -f /var/log/nginx/access.log | grep -E "(404|500|502|503)"
```

#### 2. 应用日志分析
```bash
# 查看PM2错误日志
pm2 logs ai-doctor-backend --err

# 查看Docker错误日志
docker-compose logs backend | grep -i error
```

### 性能优化

#### 1. Nginx优化
```nginx
# nginx.conf优化
worker_processes auto;
worker_connections 1024;

# 启用缓存
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

#### 2. Node.js优化
```javascript
// 启用集群模式
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
} else {
  require('./src/index.js');
}
```

---

**AI个人医生助理部署指南** - 让部署更简单，让运维更高效！ 🚀✨ 