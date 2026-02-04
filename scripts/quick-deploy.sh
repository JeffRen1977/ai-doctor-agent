#!/bin/bash

# Quick Deployment Script
# This script helps you deploy both backend and frontend

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 AI Doctor Agent - Quick Deployment${NC}"
echo "=========================================="
echo ""

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo -e "${YELLOW}⚠️  Git not initialized${NC}"
    exit 1
fi

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)
echo -e "${BLUE}📋 Current branch: ${CURRENT_BRANCH}${NC}"

# Check if on release branch
if [ "$CURRENT_BRANCH" != "release" ]; then
    echo -e "${YELLOW}⚠️  You are not on the release branch${NC}"
    read -p "Do you want to switch to release branch? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git checkout release || git checkout -b release
    else
        echo "Deployment cancelled"
        exit 1
    fi
fi

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}⚠️  You have uncommitted changes${NC}"
    git status --short
    echo ""
    read -p "Do you want to commit and push? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter commit message: " COMMIT_MSG
        git add .
        git commit -m "${COMMIT_MSG:-Update deployment}"
        git push origin release
        echo -e "${GREEN}✅ Changes pushed to release branch${NC}"
    else
        echo "Please commit your changes first"
        exit 1
    fi
else
    echo -e "${GREEN}✅ No uncommitted changes${NC}"
fi

echo ""
echo -e "${BLUE}📦 Deployment Summary:${NC}"
echo "=========================================="
echo ""
echo -e "${GREEN}✅ Backend (Railway):${NC}"
echo "   - Branch: release"
echo "   - Auto-deploys on push"
echo "   - Check: https://railway.app/"
echo ""
echo -e "${GREEN}✅ Frontend (Vercel):${NC}"
echo "   - Branch: release"
echo "   - Auto-deploys on push"
echo "   - Check: https://vercel.com/"
echo ""
echo -e "${YELLOW}⚠️  Important:${NC}"
echo "   1. Ensure Railway backend URL is set in Vercel:"
echo "      VITE_RAILWAY_BACKEND_URL=https://your-app.railway.app"
echo ""
echo "   2. Ensure CORS is configured in Railway:"
echo "      FRONTEND_URL=https://your-app.vercel.app"
echo ""
echo -e "${BLUE}🔍 Monitor deployments:${NC}"
echo "   - Railway: Check project dashboard"
echo "   - Vercel: Check project dashboard"
echo ""
