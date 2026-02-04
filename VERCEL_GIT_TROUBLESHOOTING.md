# Vercel Git 集成问题排查

## 问题：Vercel Dashboard 看不到最新的 Git 提交

### 可能的原因和解决方案

#### 1. 检查 Git 仓库连接

**步骤**：
1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择你的项目
3. 进入 **Settings** → **Git**
4. 检查：
   - Git Repository 是否正确连接
   - 连接的仓库 URL 是否正确
   - 是否有权限访问仓库

**如果未连接**：
- 点击 **Connect Git Repository**
- 选择你的 Git 提供商（GitHub, GitLab, Bitbucket）
- 授权访问并选择正确的仓库

#### 2. 检查分支配置

**步骤**：
1. 进入 **Settings** → **Git**
2. 检查 **Production Branch** 设置
3. 确认是否设置为 `main` 或 `release`

**常见问题**：
- Vercel 可能连接到 `main` 分支，但你在 `release` 分支提交
- 或者相反

**解决方案**：
- 在 Vercel 中更改 Production Branch
- 或者确保提交到正确的分支

#### 3. 检查代码是否已推送到远程仓库

**本地检查**：
```bash
# 检查当前分支
git branch

# 检查是否有未推送的提交
git log origin/main..HEAD  # 如果使用 main 分支
git log origin/release..HEAD  # 如果使用 release 分支

# 检查远程仓库状态
git remote -v
```

**如果本地有未推送的提交**：
```bash
# 推送到远程仓库
git push origin main  # 或 release
```

#### 4. 检查 Vercel 的 Git 集成状态

**步骤**：
1. 进入 **Settings** → **Git**
2. 查看 **Git Integration** 状态
3. 检查是否有错误信息

**如果显示错误**：
- 点击 **Disconnect** 然后重新连接
- 确保有正确的权限

#### 5. 手动触发部署

**方法一：通过 Vercel Dashboard**
1. 进入 **Deployments** 标签
2. 点击 **⋯** → **Redeploy**
3. 选择最新的提交

**方法二：通过 Git 推送**
```bash
# 创建一个空提交来触发部署
git commit --allow-empty -m "Trigger Vercel deployment"
git push origin main  # 或 release
```

**方法三：使用 Vercel CLI**
```bash
vercel --prod
```

#### 6. 检查分支保护规则

**如果使用 GitHub**：
1. 检查仓库的 **Settings** → **Branches**
2. 查看是否有分支保护规则阻止了 Vercel 的访问
3. 确保 Vercel 的 GitHub App 有足够权限

#### 7. 检查 Webhook 配置

**步骤**：
1. 在 GitHub/GitLab/Bitbucket 中
2. 进入仓库 **Settings** → **Webhooks**
3. 检查是否有 Vercel 的 webhook
4. 检查 webhook 是否正常工作

**如果 webhook 不存在或失效**：
- 在 Vercel 中重新连接 Git 仓库
- 这会自动创建新的 webhook

#### 8. 检查提交是否在正确的分支

**常见情况**：
- 你在本地 `release` 分支提交
- 但 Vercel 连接到 `main` 分支
- 所以看不到 `release` 分支的提交

**解决方案**：
```bash
# 检查当前分支
git branch

# 如果需要在 main 分支，切换到 main 并合并
git checkout main
git merge release
git push origin main

# 或者在 Vercel 中更改 Production Branch 为 release
```

## 快速检查清单

- [ ] Git 仓库已正确连接到 Vercel
- [ ] 代码已推送到远程仓库
- [ ] Vercel 的 Production Branch 设置正确
- [ ] 提交在正确的分支上
- [ ] 有足够的 Git 权限
- [ ] Webhook 正常工作
- [ ] 尝试手动触发部署

## 诊断命令

运行以下命令检查状态：

```bash
# 检查当前分支
git branch

# 检查远程仓库
git remote -v

# 检查未推送的提交
git log origin/main..HEAD --oneline

# 检查所有分支的最新提交
git log --oneline --all --graph -10

# 检查远程分支状态
git fetch origin
git status
```

## 常见解决方案

### 方案 1：确保推送到正确的分支

```bash
# 检查 Vercel 连接的分支（在 Vercel Dashboard 中查看）
# 然后推送代码到该分支

git push origin main  # 如果 Vercel 连接 main
# 或
git push origin release  # 如果 Vercel 连接 release
```

### 方案 2：在 Vercel 中更改分支

1. Vercel Dashboard → Settings → Git
2. 更改 **Production Branch** 为你使用的分支
3. 保存并重新部署

### 方案 3：重新连接 Git 仓库

1. Vercel Dashboard → Settings → Git
2. 点击 **Disconnect**
3. 重新连接仓库
4. 选择正确的分支

## 联系支持

如果以上方法都不行：
1. 检查 Vercel 的 [Status Page](https://www.vercel-status.com/)
2. 查看 Vercel Dashboard 中的错误信息
3. 联系 Vercel 支持
