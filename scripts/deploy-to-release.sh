#!/bin/bash

# 🚀 Deploy to Release Branch Script
# This script merges main branch changes to release branch and triggers deployment

set -e  # Exit on any error

echo "🚀 Starting deployment to release branch..."

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "❌ Error: Not in a git repository. Please run this script from the project root."
    exit 1
fi

# Check if we have uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo "❌ Error: You have uncommitted changes. Please commit or stash them first."
    echo "📋 Current changes:"
    git status --short
    exit 1
fi

# Ensure we're on main branch
current_branch=$(git branch --show-current)
if [ "$current_branch" != "main" ]; then
    echo "❌ Error: You must be on the main branch to deploy. Current branch: $current_branch"
    echo "💡 Please run: git checkout main"
    exit 1
fi

# Pull latest changes from remote
echo "📥 Pulling latest changes from remote..."
git pull origin main

# Switch to release branch
echo "🔄 Switching to release branch..."
git checkout release

# Merge main into release
echo "🔀 Merging main branch into release..."
git merge main --no-ff -m "Deploy: Merge main to release $(date '+%Y-%m-%d %H:%M:%S')"

# Push release branch to remote
echo "📤 Pushing release branch to remote..."
git push origin release

echo "✅ Successfully deployed to release branch!"
echo ""
echo "🎯 Next steps:"
echo "1. Railway will automatically detect the push to release branch"
echo "2. Railway will build and deploy from the release branch"
echo "3. Check Railway dashboard for deployment status"
echo ""
echo "🌐 Your app will be available at: https://ai-doctor-agent-production.up.railway.app"
echo ""
echo "📋 Deployment summary:"
echo "   - Source branch: main"
echo "   - Target branch: release"
echo "   - Deployment trigger: Railway auto-deploy"
echo "   - Status: ✅ Ready for deployment"
