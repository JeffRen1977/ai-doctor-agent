const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const healthRecordsRoutes = require('./routes/healthRecords');
const dietAnalysisRoutes = require('./routes/dietAnalysis');
const wearableRoutes = require('./routes/wearables');

const app = express();
const PORT = process.env.PORT || 8000;

// Railway-specific configuration
console.log("=== RAILWAY CONFIGURATION ===");
console.log(`PORT from env: ${process.env.PORT}`);
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`Final PORT: ${PORT}`);
console.log(`Current working directory: ${process.cwd()}`);
console.log(`__dirname: ${__dirname}`);
console.log("================================");

// Add request logging middleware at the very beginning
app.use((req, res, next) => {
  console.log(`🌐 ${req.method} ${req.path} - ${req.ip} - ${req.get('User-Agent')}`);
  console.log(`🔍 Request headers:`, req.headers);
  next();
});

// --- Enhanced Logging ---
console.log("--- Starting Server ---");
console.log(`Node Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`Port: ${PORT}`);
console.log(`Current Directory: ${__dirname}`);

// --- Path Verification ---
// Try multiple possible paths for frontend files
const possibleDistPaths = [
  path.join(__dirname, '../../dist'),           // From backend/src
  path.join(__dirname, '../dist'),             // From backend
  path.join(__dirname, '../../frontend/dist'), // Alternative path
  path.join(__dirname, '../frontend/dist'),    // Alternative path
  path.join(__dirname, 'dist'),               // Direct dist
  path.join(__dirname, 'frontend/dist')       // Direct frontend/dist
];

let distPath = null;
let indexPath = null;

for (const testPath of possibleDistPaths) {
  const testIndexPath = path.join(testPath, 'index.html');
  if (require('fs').existsSync(testPath) && require('fs').existsSync(testIndexPath)) {
    distPath = testPath;
    indexPath = testIndexPath;
    console.log(`✅ Found frontend files at: ${distPath}`);
    break;
  }
}

if (!distPath) {
  console.error("--- CRITICAL: Frontend build files not found! ---");
  console.log("Searched paths:", possibleDistPaths);
  // List available directories for debugging
  try {
    const rootContents = require('fs').readdirSync(path.join(__dirname, '../..'));
    console.log("Root directory contents:", rootContents);
  } catch (e) {
    console.error("Could not read root directory:", e.message);
  }
} else {
  console.log(`Serving static files from: ${distPath}`);
  console.log(`Expecting index.html at: ${indexPath}`);
}
// --- End Enhanced Logging ---

// CORS configuration for Railway deployment
const allowedOrigins = [
  'http://localhost:3000', // Local development
  'http://localhost:5173', // Vite dev server
  'https://*.railway.app', // Railway domains
  process.env.FRONTEND_URL // Custom frontend URL if set
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list
    if (allowedOrigins.some(allowedOrigin => {
      if (allowedOrigin.includes('*')) {
        // Handle wildcard domains
        const domain = allowedOrigin.replace('*.', '');
        return origin.endsWith(domain);
      }
      return origin === allowedOrigin;
    })) {
      return callback(null, true);
    }
    
    // Log blocked origins for debugging
    console.log(`Blocked origin: ${origin}`);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// 中间件
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for development
}));
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/health-records', healthRecordsRoutes);
app.use('/api/diet-analysis', dietAnalysisRoutes);
app.use('/api/wearables', wearableRoutes);

// Railway-specific root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'AI Doctor Agent Backend is Running!',
    status: 'OK',
    timestamp: new Date().toISOString(),
    railway: {
      port: PORT,
      env: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
      platform: process.platform
    },
    endpoints: {
      health: '/health',
      testBackend: '/test-backend',
      apiHealth: '/api/health',
      debug: '/api/debug'
    }
  });
});

// Basic health check for Railway (works immediately)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Service is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    env: process.env.NODE_ENV || 'development',
    requestInfo: {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      headers: req.headers
    }
  });
});

// Test route to verify backend is accessible
app.get('/test-backend', (req, res) => {
  res.json({
    message: 'Backend is working!',
    timestamp: new Date().toISOString(),
    serverInfo: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      uptime: process.uptime(),
      memory: process.memoryUsage()
    },
    requestInfo: {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path,
      method: req.method
    }
  });
});

// Static file test endpoint
app.get('/test-static', (req, res) => {
  try {
    const testFile = path.join(distPath, 'assets/main-ce93f8d7.js');
    const testCss = path.join(distPath, 'assets/index-83669fd6.css');
    const testIcon = path.join(distPath, 'icon-192x192.png');
    
    res.json({
      message: 'Static file test',
      timestamp: new Date().toISOString(),
      distPath: distPath,
      testFiles: {
        jsFile: {
          path: testFile,
          exists: require('fs').existsSync(testFile),
          size: require('fs').existsSync(testFile) ? require('fs').statSync(testFile).size : null
        },
        cssFile: {
          path: testCss,
          exists: require('fs').existsSync(testCss),
          size: require('fs').existsSync(testCss) ? require('fs').statSync(testCss).size : null
        },
        iconFile: {
          path: testIcon,
          exists: require('fs').existsSync(testIcon),
          size: require('fs').existsSync(testIcon) ? require('fs').statSync(testIcon).size : null
        }
      },
      distContents: distPath ? require('fs').readdirSync(distPath) : 'No dist path'
    });
  } catch (error) {
    res.json({
      error: error.message,
      stack: error.stack
    });
  }
});

// Direct asset test endpoints
app.get('/test-js', (req, res) => {
  try {
    const jsFile = path.join(distPath, 'assets/main-ce93f8d7.js');
    if (require('fs').existsSync(jsFile)) {
      res.set('Content-Type', 'application/javascript');
      res.sendFile(jsFile);
    } else {
      res.status(404).json({ error: 'JS file not found', path: jsFile });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/test-css', (req, res) => {
  try {
    const cssFile = path.join(distPath, 'assets/index-83669fd6.css');
    if (require('fs').existsSync(cssFile)) {
      res.set('Content-Type', 'text/css');
      res.sendFile(cssFile);
    } else {
      res.status(404).json({ error: 'CSS file not found', path: cssFile });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/test-icon', (req, res) => {
  try {
    const iconFile = path.join(distPath, 'icon-192x192.png');
    if (require('fs').existsSync(iconFile)) {
      res.set('Content-Type', 'image/png');
      res.sendFile(iconFile);
    } else {
      res.status(404).json({ error: 'Icon file not found', path: iconFile });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'AI医生助理API服务运行正常',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime()
  });
});

// Debug endpoint to check file paths
app.get('/api/debug', (req, res) => {
  try {
    const frontendPath = path.join(__dirname, '../../frontend/dist');
    const indexPath = path.join(__dirname, '../../frontend/dist/index.html');
    
    res.json({
      currentDir: __dirname,
      frontendPath: frontendPath,
      indexPath: indexPath,
      frontendExists: require('fs').existsSync(frontendPath),
      indexExists: require('fs').existsSync(indexPath),
      files: require('fs').readdirSync(path.dirname(frontendPath))
    });
  } catch (error) {
    res.json({
      error: error.message,
      currentDir: __dirname
    });
  }
});

// Serve static files from the React app build
if (distPath) {
  // Configure static file serving with proper MIME types
  app.use(express.static(distPath, {
    setHeaders: (res, path, stat) => {
      // Set proper MIME types for different file types
      if (path.endsWith('.js')) {
        res.set('Content-Type', 'application/javascript');
      } else if (path.endsWith('.css')) {
        res.set('Content-Type', 'text/css');
      } else if (path.endsWith('.png') || path.endsWith('.jpg') || path.endsWith('.jpeg') || path.endsWith('.gif') || path.endsWith('.svg')) {
        res.set('Content-Type', `image/${path.split('.').pop()}`);
      } else if (path.endsWith('.ico')) {
        res.set('Content-Type', 'image/x-icon');
      }
      
      // Log static file requests for debugging
      console.log(`📁 Serving static file: ${path} (${res.get('Content-Type')})`);
    }
  }));
  console.log(`✅ Static files being served from: ${distPath}`);
} else {
  console.error("❌ Cannot serve static files - distPath not found");
}

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
  if (!distPath || !indexPath) {
    return res.status(500).json({ 
      error: 'Frontend not configured', 
      message: 'Static file path not found',
      searchedPaths: possibleDistPaths,
      currentDir: __dirname 
    });
  }
  
  if (require('fs').existsSync(indexPath)) {
    console.log(`✅ Serving index.html for route: ${req.path}`);
    res.sendFile(indexPath);
  } else {
    console.error(`❌ index.html not found at: ${indexPath}`);
    res.status(404).json({ 
      error: 'Frontend not found', 
      path: indexPath,
      currentDir: __dirname,
      searchedPaths: possibleDistPaths
    });
  }
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误' });
});

// Start server with error handling
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 AI医生助理后端服务启动成功！`);
  console.log(`📍 服务地址: http://0.0.0.0:${PORT}`);
  console.log(`📍 外部访问: https://ai-doctor-agent-production.up.railway.app`);
  console.log(`📊 健康检查: http://0.0.0.0:${PORT}/health`);
  console.log(`🔍 环境: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔍 端口: ${PORT}`);
  console.log(`🔍 绑定地址: 0.0.0.0`);
  console.log(`🔍 进程ID: ${process.pid}`);
  console.log(`🔍 工作目录: ${process.cwd()}`);
  
  // Test if we can actually bind to the port
  const address = server.address();
  console.log(`🔍 服务器绑定信息:`, address);
  
  // Verify the server is listening
  if (server.listening) {
    console.log(`✅ 服务器正在监听端口 ${PORT}`);
  } else {
    console.error(`❌ 服务器未在监听端口 ${PORT}`);
  }
}).on('error', (error) => {
  console.error(`❌ 服务器启动失败:`, error.message);
  console.error(`❌ 错误代码:`, error.code);
  console.error(`❌ 错误详情:`, error);
  
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ 端口 ${PORT} 已被占用`);
  } else if (error.code === 'EACCES') {
    console.error(`❌ 没有权限绑定到端口 ${PORT}`);
  } else if (error.code === 'EINVAL') {
    console.error(`❌ 无效的端口号: ${PORT}`);
  } else if (error.code === 'EADDRNOTAVAIL') {
    console.error(`❌ 地址不可用: 0.0.0.0:${PORT}`);
  }
  
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
}); 