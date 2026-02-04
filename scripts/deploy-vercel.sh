#!/bin/bash

# Vercel Frontend Deployment Script
# This script builds and prepares the frontend for Vercel deployment

set -e

echo "🚀 Starting Vercel Frontend Deployment..."
echo "=========================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}⚠️  Vercel CLI not found${NC}"
    echo "   Installing Vercel CLI..."
    npm install -g vercel
fi

# Check if Railway backend URL is set
if [ -z "$VITE_RAILWAY_BACKEND_URL" ]; then
    echo -e "${YELLOW}⚠️  Warning: VITE_RAILWAY_BACKEND_URL not set${NC}"
    echo "   Please set this in Vercel environment variables"
    echo ""
    echo -e "${BLUE}📋 Required Environment Variable:${NC}"
    echo "   VITE_RAILWAY_BACKEND_URL = https://ai-doctor-agent-production.up.railway.app"
    echo ""
    echo "   To set in Vercel:"
    echo "   1. Go to Vercel Dashboard"
    echo "   2. Settings → Environment Variables"
    echo "   3. Add: VITE_RAILWAY_BACKEND_URL"
    echo "   4. Value: https://ai-doctor-agent-production.up.railway.app"
    echo ""
    read -p "Do you want to continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Deployment cancelled"
        exit 1
    fi
else
    echo -e "${GREEN}✅ VITE_RAILWAY_BACKEND_URL is set: ${VITE_RAILWAY_BACKEND_URL}${NC}"
fi

# Check if vercel.json exists
if [ ! -f "vercel.json" ]; then
    echo -e "${YELLOW}⚠️  vercel.json not found${NC}"
    echo "   Creating vercel.json..."
    # vercel.json will be created by the script or should exist
fi

# Install dependencies
echo ""
echo -e "${BLUE}📦 Installing dependencies...${NC}"
npm install

# Build frontend
echo ""
echo -e "${BLUE}🔨 Building frontend...${NC}"
npm run build

# Check if build was successful
if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Build failed: dist directory not found${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Frontend build completed successfully!${NC}"
echo ""

# Ask user for deployment method
echo -e "${BLUE}📋 Deployment Options:${NC}"
echo "   1. Deploy to Vercel (using Vercel CLI)"
echo "   2. Just prepare for git push (Vercel auto-deploy)"
echo ""
read -p "Choose option (1 or 2): " -n 1 -r
echo

if [[ $REPLY =~ ^[1]$ ]]; then
    echo ""
    echo -e "${BLUE}🚀 Deploying to Vercel...${NC}"
    echo ""
    
    # Check if user is logged in to Vercel
    if ! vercel whoami &> /dev/null; then
        echo -e "${YELLOW}⚠️  Not logged in to Vercel${NC}"
        echo "   Please login first..."
        vercel login
    fi
    
    # Deploy to Vercel
    echo ""
    read -p "Deploy to production? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        vercel --prod
    else
        vercel
    fi
    
    echo ""
    echo -e "${GREEN}✅ Deployment completed!${NC}"
else
    echo ""
    echo -e "${GREEN}✅ Build prepared for git deployment${NC}"
    echo ""
    echo "📋 Next steps:"
    echo "   1. Commit and push to git repository"
    echo "   2. Vercel will automatically deploy from git"
    echo ""
    echo "🔧 Environment Variables to set in Vercel Dashboard:"
    echo "   - VITE_RAILWAY_BACKEND_URL=https://ai-doctor-agent-production.up.railway.app"
    echo "   - VITE_API_BASE_URL (optional, if different from above)"
    echo ""
    echo "📝 To set environment variables:"
    echo "   1. Go to Vercel Dashboard"
    echo "   2. Select your project"
    echo "   3. Settings → Environment Variables"
    echo "   4. Add the variables above"
    echo ""
fi
