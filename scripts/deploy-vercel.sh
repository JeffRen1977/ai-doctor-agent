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
NC='\033[0m' # No Color

# Check if Railway backend URL is set
if [ -z "$VITE_RAILWAY_BACKEND_URL" ]; then
    echo -e "${YELLOW}⚠️  Warning: VITE_RAILWAY_BACKEND_URL not set${NC}"
    echo "   Please set this in Vercel environment variables"
    echo "   Format: https://your-app.railway.app"
fi

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Build frontend
echo ""
echo "🔨 Building frontend..."
npm run build

# Check if build was successful
if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Build failed: dist directory not found${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Frontend build completed successfully!${NC}"
echo ""
echo "📋 Next steps:"
echo "   1. Push to git repository"
echo "   2. Vercel will automatically deploy from git"
echo "   3. Or run: vercel --prod"
echo ""
echo "🔧 Environment Variables to set in Vercel:"
echo "   - VITE_RAILWAY_BACKEND_URL=https://your-app.railway.app"
echo ""
