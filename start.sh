#!/bin/bash

echo "🚀 Starting AI Doctor Agent Backend..."

# Check if we're in the right directory
echo "📍 Current directory: $(pwd)"
echo "📁 Directory contents:"
ls -la

# Check if backend directory exists
if [ ! -d "backend" ]; then
    echo "❌ Backend directory not found!"
    echo "📁 Available directories:"
    ls -la
    exit 1
fi

# Check if frontend dist exists
if [ ! -d "frontend/dist" ]; then
    echo "❌ Frontend dist directory not found!"
    echo "📁 Frontend contents:"
    ls -la frontend/ || echo "Frontend directory not found"
    exit 1
fi

# Check if backend source exists
if [ ! -d "backend/src" ]; then
    echo "❌ Backend src directory not found!"
    echo "📁 Backend contents:"
    ls -la backend/ || echo "Backend directory not found"
    exit 1
fi

echo "✅ All directories found, starting backend server..."

# Start the backend server
cd backend
echo "📍 Now in backend directory: $(pwd)"
echo "📁 Backend contents:"
ls -la

echo "🚀 Starting Node.js server..."
node src/index.js 