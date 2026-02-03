# 脚本迁移说明

## 📋 状态

大部分脚本已经移动到 `scripts/` 文件夹，但以下文件仍在根目录：

- `deploy-railway.sh`
- `deploy-vercel.sh`
- `quick-deploy.sh`

## 🔄 手动迁移步骤

请手动将这些文件移动到 `scripts/` 文件夹：

```bash
# 从项目根目录运行
mv deploy-railway.sh deploy-vercel.sh quick-deploy.sh scripts/
```

## ✅ 验证

移动后，验证所有脚本都在 `scripts/` 文件夹：

```bash
ls -1 scripts/*.{sh,js}
```

应该看到所有脚本文件。

## 📝 更新后的使用方式

所有脚本现在通过 `package.json` 中的 npm 脚本调用：

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

或直接运行：

```bash
./scripts/deploy-railway.sh
./scripts/deploy-vercel.sh
./scripts/quick-deploy.sh
node scripts/test-login.js
```

---

**注意**: 如果文件移动后遇到权限问题，运行：
```bash
chmod +x scripts/*.sh
```
