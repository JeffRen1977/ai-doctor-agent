import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      fastRefresh: true,
      babel: {
        plugins: []
      }
    })
  ],
  root: '.', // Set root to current directory
  publicDir: 'frontend/public', // Set public directory
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './frontend'),
    },
  },
  server: {
    port: 3000,
    host: true, // 允许外部访问，支持移动端调试
    hmr: {
      port: 3003, // Use different port for HMR to avoid conflicts
      host: 'localhost'
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path, // 不重写路径
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('❌ Proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('🔄 Proxying request:', req.method, req.url, '→', proxyReq.path);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('✅ Proxy response:', req.method, req.url, '→', proxyRes.statusCode);
          });
        },
      },
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
      },
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    // Expose Railway backend URL for production builds
    'import.meta.env.VITE_RAILWAY_BACKEND_URL': JSON.stringify(process.env.VITE_RAILWAY_BACKEND_URL || ''),
    'import.meta.env.VITE_API_BASE_URL': JSON.stringify(process.env.VITE_API_BASE_URL || ''),
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'antd', '@ant-design/icons'],
    force: true, // 强制重新预构建依赖
    exclude: [], // 确保不排除任何依赖
  },
  cacheDir: 'node_modules/.vite', // 明确指定缓存目录
}) 