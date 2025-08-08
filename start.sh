#!/bin/bash

echo "🚀 启动AI医生助理系统..."

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未找到Node.js，请先安装Node.js"
    exit 1
fi

# 检查npm是否安装
if ! command -v npm &> /dev/null; then
    echo "❌ 错误: 未找到npm，请先安装npm"
    exit 1
fi

# 检查依赖是否安装
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖包..."
    npm install
fi

# 启动开发服务器
echo "🌐 启动开发服务器..."
echo "📍 访问地址: http://localhost:3000 (如果被占用会自动选择其他端口)"
echo "🔄 按 Ctrl+C 停止服务器"
echo ""

npm run dev 