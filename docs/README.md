# AI个人医生助理系统 - 文档中心

## 📚 文档概览

欢迎来到AI个人医生助理系统的文档中心。这里包含了项目的完整文档，帮助您快速了解、开发、部署和维护系统。

## 🗂️ 文档结构

### 📋 核心文档
- **[项目总结](../PROJECT_SUMMARY.md)** - 项目整体概述和功能总结
- **[开发指南](DEVELOPMENT_GUIDE.md)** - 详细的开发环境搭建和开发流程
- **[API文档](API_DOCUMENTATION.md)** - 完整的API接口文档
- **[部署指南](DEPLOYMENT_GUIDE.md)** - 生产环境部署指南

### 🏥 功能文档
- **[健康分析功能](HEALTH_ANALYSIS_FEATURE.md)** - AI健康分析功能详细说明
- **[饮食分析功能](features/DIET_ANALYSIS_FEATURE.md)** - 饮食分析功能说明
- **[可穿戴设备集成](WEARABLE_DEVICE_SETUP.md)** - 可穿戴设备连接和配置
- **[移动端开发指南](MOBILE_DEVELOPMENT_GUIDE.md)** - 移动端开发和PWA功能

### 🔧 技术文档
- **[Firebase配置](FIREBASE_SETUP.md)** - Firebase服务配置指南
- **[聊天历史结构](CHAT_HISTORY_STRUCTURE.md)** - 聊天数据结构说明
- **[饮食分析结构](DIET_ANALYSIS_STRUCTURE.md)** - 饮食分析数据结构
- **[故障排除指南](guides/TROUBLESHOOTING.md)** - 常见问题解决方案

### 🎨 设计文档
- **[前端设计总结](design/FRONTEND_DESIGN_SUMMARY.md)** - 前端UI/UX设计说明
- **[核心架构设计](design/Core%20architecture%20&%20functionality.pdf)** - 系统架构设计文档

## 🚀 快速开始

### 1. 环境准备
```bash
# 克隆项目
git clone <repository-url>
cd ai-doctor-agent

# 安装依赖
npm install
cd backend && npm install
```

### 2. 配置环境变量
```bash
# 复制环境变量模板
cp backend/.env.example backend/.env

# 编辑环境变量
# 配置Firebase、Gemini AI等服务的API密钥
```

### 3. 启动开发服务器
```bash
# 启动后端服务
cd backend && npm start

# 启动前端服务
npm run dev:frontend
```

## 📖 文档使用指南

### 开发者
- 从[开发指南](DEVELOPMENT_GUIDE.md)开始
- 参考[API文档](API_DOCUMENTATION.md)了解接口
- 查看[故障排除指南](guides/TROUBLESHOOTING.md)解决常见问题

### 部署人员
- 参考[部署指南](DEPLOYMENT_GUIDE.md)
- 查看[Firebase配置](FIREBASE_SETUP.md)
- 了解[可穿戴设备集成](WEARABLE_DEVICE_SETUP.md)

### 产品经理
- 查看[项目总结](../PROJECT_SUMMARY.md)了解功能
- 参考[功能文档](#-功能文档)了解具体功能
- 查看[设计文档](#-设计文档)了解用户体验

## 🔄 文档更新

文档会随着项目的发展持续更新。最新更新包括：

### 2025年1月更新
- ✅ 添加了AI健康分析功能文档
- ✅ 更新了Firebase集成文档
- ✅ 完善了移动端开发指南
- ✅ 优化了API文档结构

## 📞 支持与反馈

如果您在使用文档过程中遇到问题，或有改进建议，请：

1. 查看[故障排除指南](guides/TROUBLESHOOTING.md)
2. 提交Issue到项目仓库
3. 联系开发团队

---

**最后更新**: 2025年1月
**文档版本**: v2.0
**维护团队**: AI医生助理开发团队