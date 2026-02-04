# Vercel Deploy Hooks 设置指南

## 是否需要设置 Deploy Hooks？

### 简短回答：**通常不需要**

如果你的项目已经通过 Git 集成连接到 Vercel，当代码推送到 Git 仓库时会**自动触发部署**，不需要 Deploy Hooks。

### 什么时候需要 Deploy Hooks？

Deploy Hooks 适用于以下场景：

1. **手动触发部署**（不通过 Git 推送）
2. **外部系统集成**（如 CI/CD 工具、监控系统）
3. **定时部署**（通过 cron job 调用）
4. **多环境部署**（为不同环境创建不同的 hooks）

## 当前项目情况

### 你的项目已经有：

✅ **Git 集成** - Vercel 连接到 GitHub 仓库  
✅ **自动部署** - 推送到 `release` 分支时自动部署  
✅ **环境变量配置** - Railway 后端 URL 已配置

### 因此，**不需要设置 Deploy Hooks**

## 如何验证 Git 集成是否正常工作

1. **检查 Git 连接**：
   - Vercel Dashboard → Settings → Git
   - 确认仓库已连接
   - 确认 Production Branch 设置为 `release`（或 `main`）

2. **测试自动部署**：
   ```bash
   # 创建一个测试提交
   git commit --allow-empty -m "Test: Trigger Vercel deployment"
   git push origin release
   ```
   - 然后检查 Vercel Dashboard → Deployments
   - 应该看到新的部署自动开始

## 如果需要设置 Deploy Hooks（可选）

### 步骤：

1. **创建 Deploy Hook**：
   - Vercel Dashboard → Settings → Git
   - 滚动到底部，找到 **Deploy Hooks**
   - 点击 **Create Hook**
   - 输入名称（如：`Manual Deploy`）
   - 选择分支（如：`release`）
   - 点击 **Create Hook**

2. **获取 Hook URL**：
   - 创建后会生成一个 URL
   - 格式：`https://api.vercel.com/v1/integrations/deploy/xxxxx/xxxxx`

3. **使用 Hook**：
   ```bash
   # 使用 curl 触发部署
   curl -X POST https://api.vercel.com/v1/integrations/deploy/xxxxx/xxxxx
   ```

### 使用场景示例：

**场景 1：手动触发部署**
```bash
# 不推送代码，直接触发部署
curl -X POST YOUR_DEPLOY_HOOK_URL
```

**场景 2：在 CI/CD 中使用**
```yaml
# GitHub Actions 示例
- name: Trigger Vercel Deployment
  run: |
    curl -X POST ${{ secrets.VERCEL_DEPLOY_HOOK }}
```

**场景 3：定时部署**
```bash
# Cron job 示例（每天凌晨部署）
0 0 * * * curl -X POST YOUR_DEPLOY_HOOK_URL
```

## 推荐配置

### 对于你的项目，推荐：

1. **保持 Git 集成**（已设置）
   - 这是主要的部署方式
   - 自动、可靠、有版本控制

2. **可选：创建一个 Deploy Hook**（如果需要）
   - 用于紧急手动部署
   - 用于测试和调试
   - 用于外部系统集成

## 总结

| 部署方式 | 是否需要 | 用途 |
|---------|---------|------|
| **Git 集成** | ✅ **必需** | 自动部署（主要方式） |
| **Deploy Hooks** | ⚪ **可选** | 手动触发、外部集成 |

### 建议：

- ✅ **保持 Git 集成** - 这是标准做法
- ⚪ **Deploy Hooks** - 只有在需要手动触发或外部集成时才设置

## 验证当前设置

运行以下命令检查 Git 集成：

```bash
# 检查当前分支
git branch

# 检查远程仓库
git remote -v

# 推送代码测试自动部署
git push origin release
```

然后在 Vercel Dashboard 中查看是否自动触发部署。
