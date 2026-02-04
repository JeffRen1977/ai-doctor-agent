# 检查 Vercel 分支连接

## 问题诊断

你的情况：
- ✅ 当前在 `main` 分支
- ✅ `main` 分支已与远程同步
- ⚠️ `release` 分支有 4 个未推送的提交
- ⚠️ 有未提交的本地更改

## 解决方案

### 步骤 1：检查 Vercel 连接的分支

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择你的项目
3. 进入 **Settings** → **Git**
4. 查看 **Production Branch** 设置
   - 如果是 `main` → 继续步骤 2A
   - 如果是 `release` → 继续步骤 2B

### 步骤 2A：如果 Vercel 连接 `main` 分支

**提交并推送当前更改到 main**：

```bash
# 提交当前更改
git add .
git commit -m "feat: Add Vercel deployment configuration and setup docs"

# 推送到 main
git push origin main
```

### 步骤 2B：如果 Vercel 连接 `release` 分支

**需要将更改合并到 release 并推送**：

```bash
# 先提交当前更改到 main
git add .
git commit -m "feat: Add Vercel deployment configuration and setup docs"
git push origin main

# 切换到 release 分支
git checkout release

# 合并 main 的更改
git merge main

# 推送 release 分支（包含之前的 4 个提交）
git push origin release
```

### 步骤 3：在 Vercel 中手动触发部署

1. 进入 Vercel Dashboard → **Deployments**
2. 点击 **⋯** → **Redeploy**
3. 选择最新的提交
4. 点击 **Redeploy**

## 快速检查命令

运行以下命令检查状态：

```bash
# 检查当前分支
git branch

# 检查未推送的提交
git log origin/main..HEAD --oneline
git log origin/release..HEAD --oneline

# 检查远程仓库状态
git fetch origin
git status
```

## 推荐操作

基于你的情况，建议：

1. **提交当前更改**（包含 Vercel 配置）
2. **推送到 main 分支**
3. **在 Vercel Dashboard 中检查连接的分支**
4. **如果 Vercel 连接 release，也推送到 release**
