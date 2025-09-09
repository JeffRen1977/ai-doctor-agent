# 🚀 Deployment Guide - Release Branch Strategy

## 📋 Overview

This project now uses a **release branch strategy** for production deployments on Railway. This ensures that only tested and stable code reaches production.

## 🌳 Branch Structure

```
main (development) → release (production) → Railway deployment
```

- **`main`**: Development branch for ongoing work and testing
- **`release`**: Production branch that triggers Railway deployments
- **Railway**: Automatically deploys from the `release` branch

## 🚀 How to Deploy

### Option 1: Automated Deployment (Recommended)

Use the provided deployment script:

```bash
./deploy-to-release.sh
```

This script will:
1. ✅ Check you're on the `main` branch
2. ✅ Pull latest changes from remote
3. ✅ Switch to `release` branch
4. ✅ Merge `main` into `release`
5. ✅ Push `release` to remote
6. ✅ Trigger Railway deployment

### Option 2: Manual Deployment

```bash
# 1. Ensure you're on main branch
git checkout main
git pull origin main

# 2. Switch to release branch
git checkout release

# 3. Merge main into release
git merge main --no-ff -m "Deploy: Merge main to release $(date '+%Y-%m-%d %H:%M:%S')"

# 4. Push to trigger deployment
git push origin release
```

## ⚙️ Configuration

### Railway Configuration (`railway.json`)

```json
{
  "source": {
    "branch": "release"
  }
}
```

This tells Railway to monitor the `release` branch for deployments.

### Deployment Script (`deploy-to-release.sh`)

The script includes safety checks:
- ✅ Verifies you're on the `main` branch
- ✅ Checks for uncommitted changes
- ✅ Pulls latest changes before merging
- ✅ Creates meaningful merge commit messages

## 🔄 Workflow

### Daily Development
1. Work on `main` branch
2. Commit and push changes to `main`
3. Test locally and in staging

### Production Deployment
1. Run `./deploy-to-release.sh`
2. Railway automatically detects the push to `release`
3. Railway builds and deploys the application
4. Monitor deployment in Railway dashboard

## 🎯 Benefits

- **Stability**: Only tested code reaches production
- **Safety**: Main branch remains stable for development
- **Automation**: One command deployment
- **Traceability**: Clear merge history between branches
- **Rollback**: Easy to revert to previous release

## 🚨 Important Notes

1. **Always test on `main`** before deploying to `release`
2. **Never work directly on `release`** branch
3. **Use the deployment script** to avoid manual errors
4. **Monitor Railway dashboard** after deployment
5. **Keep `main` and `release` in sync** for easy rollbacks

## 🔧 Troubleshooting

### If deployment fails:
1. Check Railway dashboard for build logs
2. Verify all environment variables are set
3. Check if `release` branch has latest changes
4. Re-run deployment script if needed

### If you need to rollback:
1. Find the last working commit in `release` history
2. Reset `release` to that commit
3. Force push: `git push origin release --force`

## 📱 Testing Your Deployment

After deployment, test these endpoints:
- **Homepage**: `https://ai-doctor-agent-production.up.railway.app`
- **Health Check**: `https://ai-doctor-agent-production.up.railway.app/health`
- **API**: `https://ai-doctor-agent-production.up.railway.app/api/health`

## 🎉 You're All Set!

Your AI Doctor Agent now has a robust deployment strategy that ensures production stability while maintaining development flexibility.
