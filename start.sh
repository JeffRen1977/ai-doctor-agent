#!/bin/bash

echo "🚀 Starting AI Doctor Agent Backend..."
echo "📍 Current directory: $(pwd)"
echo "📁 Directory contents:"
ls -la

echo ""
echo "🔍 Checking Node.js and npm versions..."
node --version
npm --version

echo ""
echo "🔍 Checking if backend directory exists..."
if [ ! -d "backend" ]; then
    echo "❌ Backend directory not found!"
    echo "📁 Available directories:"
    ls -la
    echo ""
    echo "🔍 Checking if we're in the right place..."
    pwd
    echo "🔍 Parent directory contents:"
    ls -la ../
    exit 1
else
    echo "✅ Backend directory found"
fi

echo ""
echo "🔍 Checking backend contents..."
ls -la backend/

echo ""
echo "🔍 Checking if backend/src exists..."
if [ ! -d "backend/src" ]; then
    echo "❌ Backend src directory not found!"
    echo "📁 Backend contents:"
    ls -la backend/
    exit 1
else
    echo "✅ Backend src directory found"
fi

echo ""
echo "🔍 Checking if frontend/dist exists..."
if [ ! -d "frontend/dist" ]; then
    echo "❌ Frontend dist directory not found!"
    echo "📁 Frontend contents:"
    ls -la frontend/ || echo "Frontend directory not found"
    echo ""
    echo "🔍 Checking if dist exists in root..."
    if [ -d "dist" ]; then
        echo "✅ Found dist in root, moving to frontend/dist"
        mkdir -p frontend
        mv dist frontend/
    else
        echo "❌ No dist directory found anywhere"
        exit 1
    fi
else
    echo "✅ Frontend dist directory found"
fi

echo ""
echo "🔍 Checking if package.json exists in backend..."
if [ ! -f "backend/package.json" ]; then
    echo "❌ Backend package.json not found!"
    echo "📁 Backend contents:"
    ls -la backend/
    echo ""
    echo "🔍 Checking if we need to copy package.json..."
    if [ -f "package.json" ]; then
        echo "✅ Found package.json in root, copying to backend"
        cp package.json backend/
        cp package-lock.json backend/ || echo "No package-lock.json found"
    else
        echo "❌ No package.json found anywhere"
        exit 1
    fi
else
    echo "✅ Backend package.json found"
fi

echo ""
echo "🔍 Checking if node_modules exists in backend..."
if [ ! -d "backend/node_modules" ]; then
    echo "⚠️ Backend node_modules not found, installing dependencies..."
    cd backend
    npm ci --only=production
    cd ..
else
    echo "✅ Backend node_modules found"
fi

echo ""
echo "✅ All checks passed, starting backend server..."

# Start the backend server
cd backend
echo "📍 Now in backend directory: $(pwd)"
echo "📁 Backend contents:"
ls -la

echo "🚀 Starting Node.js server..."
echo "🔍 Environment check:"
echo "NODE_ENV: ${NODE_ENV:-'not set'}"
echo "PORT: ${PORT:-'not set'}"
echo "JWT_SECRET: ${JWT_SECRET:+'set'}"
echo "FIREBASE_PROJECT_ID: ${FIREBASE_PROJECT_ID:+'set'}"

node src/index.js 