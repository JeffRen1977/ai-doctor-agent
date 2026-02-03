# Scripts 文件夹

这个文件夹包含所有项目相关的脚本文件。

## 📁 脚本分类

### 🚀 部署脚本

- **`deploy-railway.sh`** - Railway 后端部署准备脚本
- **`deploy-vercel.sh`** - Vercel 前端部署准备脚本
- **`quick-deploy.sh`** - 快速部署脚本（一键部署）
- **`deploy-to-release.sh`** - 部署到 release 分支
- **`deploy.sh`** - 通用部署脚本

### 🧪 测试脚本

- **`test-login.js`** - 登录问题诊断脚本
- **`test-language-sync.js`** - 语言同步测试脚本

### 🔧 工具脚本

- **`fix-deployment-errors.js`** - 部署错误修复诊断脚本
- **`start-railway.js`** - Railway 启动脚本
- **`start-mobile-dev.js`** - 移动端开发启动脚本

## 📝 使用方法

### 从项目根目录运行

所有脚本都应该从项目根目录运行：

```bash
# 部署脚本
npm run deploy:railway
npm run deploy:vercel
npm run deploy:quick

# 测试脚本
npm run test:login
npm run test:language

# 工具脚本
npm run fix:deployment
```

### 直接运行

```bash
# Shell 脚本
./scripts/deploy-railway.sh
./scripts/deploy-vercel.sh
./scripts/quick-deploy.sh

# Node.js 脚本
node scripts/test-login.js
node scripts/fix-deployment-errors.js
```

## ⚠️ 注意事项

1. **工作目录**: 所有脚本都假设从项目根目录运行
2. **权限**: Shell 脚本需要执行权限 (`chmod +x`)
3. **依赖**: Node.js 脚本需要先安装依赖 (`npm install`)

## 🔄 更新脚本

如果添加新脚本：
1. 将脚本放在 `scripts/` 文件夹
2. 更新 `package.json` 中的 scripts 部分
3. 确保脚本使用相对路径引用项目文件
4. 更新此 README

---

**最后更新**: 2025-01-XX
