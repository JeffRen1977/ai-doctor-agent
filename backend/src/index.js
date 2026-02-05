const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const healthRecordsRoutes = require('./routes/healthRecords');
const dietAnalysisRoutes = require('./routes/dietAnalysis');
const wearableRoutes = require('./routes/wearables');
const healthAnalysisRoutes = require('./routes/healthAnalysis');
const userSettingsRoutes = require('./routes/userSettings');
const digitalTwinRoutes = require('./routes/digitalTwin');

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
  path.join(__dirname, '../dist'),             // From backend (Docker container structure)
  path.join(__dirname, '../../dist'),          // From backend/src (alternative)
  path.join(__dirname, '../../frontend/dist'), // Frontend dist (development)
  path.join(__dirname, '../frontend/dist'),    // Frontend dist (alternative)
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
  'http://localhost:3001', // Vite dev server (alternative port)
  'http://localhost:3002', // Vite HMR port (legacy)
  'http://localhost:3003', // Vite HMR port (new)
  'http://localhost:5173', // Vite dev server
  'http://10.17.99.248:3000', // Network access for mobile testing
  'http://10.17.99.248:3001', // Network access for mobile testing (alternative port)
  'http://192.168.0.39:3000', // Network access for mobile testing (new IP)
  'http://192.168.0.39:3001', // Network access for mobile testing (new IP alternative port)
  'https://*.railway.app', // Railway domains
  'https://*.vercel.app', // Vercel domains (all Vercel deployments)
  'https://ai-theron.com', // Custom domain
  'https://www.ai-theron.com', // Custom domain with www
  process.env.FRONTEND_URL // Custom frontend URL if set
].filter(Boolean);

// Log allowed origins for debugging
console.log('=== CORS Configuration ===');
console.log('Allowed origins:', allowedOrigins);
console.log('FRONTEND_URL from env:', process.env.FRONTEND_URL);
console.log('==========================');

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      console.log('✅ Allowing request with no origin');
      return callback(null, true);
    }
    
    // Check if origin is in allowed list
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (allowedOrigin.includes('*')) {
        // Handle wildcard domains
        const domain = allowedOrigin.replace('*.', '');
        const matches = origin.endsWith(domain);
        if (matches) {
          console.log(`✅ Allowed origin (wildcard): ${origin} matches ${allowedOrigin}`);
        }
        return matches;
      }
      const matches = origin === allowedOrigin;
      if (matches) {
        console.log(`✅ Allowed origin (exact): ${origin}`);
      }
      return matches;
    });
    
    if (isAllowed) {
      return callback(null, true);
    }
    
    // Log blocked origins for debugging
    console.log(`❌ Blocked origin: ${origin}`);
    console.log(`   Allowed origins:`, allowedOrigins);
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
app.use('/api/health-analysis', healthAnalysisRoutes);
app.use('/api/user-settings', userSettingsRoutes);
app.use('/api/digital-twin', digitalTwinRoutes);

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

// Cache busting endpoint
app.get('/cache-bust', (req, res) => {
  res.json({
    timestamp: new Date().toISOString(),
    version: 'v4.0.0',
    cacheBust: Date.now(),
    message: 'Cache busting endpoint - use this to verify fresh content',
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
});

// Force cache clear endpoint
app.get('/force-clear-cache', (req, res) => {
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0',
    'X-Cache-Clear': 'forced',
    'X-Timestamp': Date.now().toString()
  });
  
  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    message: 'Cache clear headers set - browser should clear cache',
    instructions: 'This endpoint sets headers that force browsers to clear their cache',
    cacheControl: 'no-cache, no-store, must-revalidate, max-age=0'
  });
});

// Health check with cache status
app.get('/health-cache', (req, res) => {
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'X-Cache-Status': 'monitoring',
    'X-Server-Time': new Date().toISOString()
  });
  
  res.json({
    status: 'OK',
    cacheStatus: 'monitoring',
    timestamp: new Date().toISOString(),
    cacheHeaders: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    },
    recommendations: [
      'If experiencing white screen, visit /force-clear-cache',
      'Check browser console for cache-related errors',
      'Ensure service worker is updated to v4'
    ]
  });
});

// Cache fix page route
app.get('/cache-fix', (req, res) => {
  const cacheFixPath = path.join(distPath, 'cache-fix.html');
  if (require('fs').existsSync(cacheFixPath)) {
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
      'X-Cache-Fix': 'available'
    });
    res.sendFile(cacheFixPath);
  } else {
    res.status(404).json({ 
      error: 'Cache fix page not found',
      searchedPath: cacheFixPath,
      distPath: distPath
    });
  }
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
    const mainJsFile = findMainJsFile();
    const mainCssFile = findMainCssFile();
    const testIcon = path.join(distPath, 'icon.svg');
    
    // Get detailed file structure
    let assetsContents = [];
    let distContents = [];
    
    try {
      if (distPath) {
        distContents = require('fs').readdirSync(distPath);
        
        // Check assets subdirectory
        const assetsPath = path.join(distPath, 'assets');
        if (require('fs').existsSync(assetsPath)) {
          assetsContents = require('fs').readdirSync(assetsPath);
        }
      }
    } catch (dirError) {
      console.error('Error reading directories:', dirError.message);
    }
    
    res.json({
      message: 'Static file test',
      timestamp: new Date().toISOString(),
      distPath: distPath,
      distContents: distContents,
      assetsContents: assetsContents,
      dynamicFiles: {
        mainJsFile: mainJsFile,
        mainCssFile: mainCssFile,
        mainJsExists: mainJsFile ? require('fs').existsSync(path.join(distPath, mainJsFile)) : false,
        mainCssExists: mainCssFile ? require('fs').existsSync(path.join(distPath, mainCssFile)) : false
      },
      testFiles: {
        jsFile: {
          path: mainJsFile ? path.join(distPath, mainJsFile) : 'Not found',
          exists: mainJsFile ? require('fs').existsSync(path.join(distPath, mainJsFile)) : false,
          size: mainJsFile && require('fs').existsSync(path.join(distPath, mainJsFile)) ? require('fs').statSync(path.join(distPath, mainJsFile)).size : null
        },
        cssFile: {
          path: mainCssFile ? path.join(distPath, mainCssFile) : 'Not found',
          exists: mainCssFile ? require('fs').existsSync(path.join(distPath, mainCssFile)) : false,
          size: mainCssFile && require('fs').existsSync(path.join(distPath, mainCssFile)) ? require('fs').statSync(path.join(distPath, mainCssFile)).size : null
        },
        iconFile: {
          path: testIcon,
          exists: require('fs').existsSync(testIcon),
          size: require('fs').existsSync(testIcon) ? require('fs').statSync(testIcon).size : null
        }
      },
      fileSearch: {
        jsFiles: assetsContents.filter(file => file.endsWith('.js')),
        cssFiles: assetsContents.filter(file => file.endsWith('.css')),
        imageFiles: assetsContents.filter(file => /\.(png|jpg|jpeg|gif|svg|ico)$/.test(file))
      }
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
    const mainJsFile = findMainJsFile();
    if (!mainJsFile) {
      return res.status(404).json({ error: 'No main JS file found' });
    }
    
    const jsFilePath = path.join(distPath, mainJsFile);
    if (require('fs').existsSync(jsFilePath)) {
      res.set('Content-Type', 'application/javascript');
      res.sendFile(jsFilePath);
    } else {
      res.status(404).json({ error: 'JS file not found', path: jsFilePath });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/test-css', (req, res) => {
  try {
    const mainCssFile = findMainCssFile();
    if (!mainCssFile) {
      return res.status(404).json({ error: 'No main CSS file found' });
    }
    
    const cssFilePath = path.join(distPath, mainCssFile);
    if (require('fs').existsSync(cssFilePath)) {
      res.set('Content-Type', 'text/css');
      res.sendFile(cssFilePath);
    } else {
      res.status(404).json({ error: 'CSS file not found', path: cssFilePath });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/test-icon', (req, res) => {
  try {
    const iconFile = path.join(distPath, 'icon.svg');
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
  // Configure static file serving with proper MIME types and cache control
  app.use(express.static(distPath, {
    setHeaders: (res, path, stat) => {
      // Set proper MIME types for different file types
      if (path.endsWith('.js')) {
        res.set('Content-Type', 'application/javascript');
      } else if (path.endsWith('.css')) {
        res.set('Content-Type', 'text/css');
      } else if (path.endsWith('.png') || path.endsWith('.jpg') || path.endsWith('.jpeg') || path.endsWith('.gif')) {
        res.set('Content-Type', `image/${path.split('.').pop()}`);
      } else if (path.endsWith('.svg')) {
        res.set('Content-Type', 'image/svg+xml');
      } else if (path.endsWith('.ico')) {
        res.set('Content-Type', 'image/x-icon');
      }
      
      // Set aggressive cache control headers to prevent white screen issues
      if (path.endsWith('.html')) {
        // HTML files should NEVER be cached to ensure fresh content
        res.set('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');
        res.set('Last-Modified', new Date().toUTCString());
        res.set('X-Version', Date.now().toString());
        res.set('X-Cache-Control', 'HTML-NO-CACHE');
      } else if (path.endsWith('.js') || path.endsWith('.css')) {
        // JS and CSS files with aggressive cache busting
        res.set('Cache-Control', 'public, max-age=0, must-revalidate');
        res.set('ETag', `"${stat.size}-${stat.mtime.getTime()}-${Date.now()}"`);
        res.set('X-Version', Date.now().toString());
        res.set('X-Cache-Control', 'ASSET-REVALIDATE');
      } else if (path.endsWith('.png') || path.endsWith('.jpg') || path.endsWith('.jpeg') || path.endsWith('.gif') || path.endsWith('.svg') || path.endsWith('.ico')) {
        // Images with moderate caching
        res.set('Cache-Control', 'public, max-age=3600, must-revalidate'); // 1 hour
        res.set('X-Version', Date.now().toString());
      } else {
        // Default cache control for other files
        res.set('Cache-Control', 'public, max-age=300, must-revalidate'); // 5 minutes
        res.set('X-Version', Date.now().toString());
      }
      
      // Log static file requests for debugging
      console.log(`📁 Serving static file: ${path} (${res.get('Content-Type')}) - Cache: ${res.get('Cache-Control')} - Version: ${res.get('X-Version')}`);
    }
  }));
  console.log(`✅ Static files being served from: ${distPath}`);
} else {
  console.error("❌ Cannot serve static files - distPath not found");
}

// Helper function to find main JavaScript file
function findMainJsFile() {
  try {
    if (!distPath) return null;
    
    const assetsPath = path.join(distPath, 'assets');
    if (!require('fs').existsSync(assetsPath)) return null;
    
    const assetsContents = require('fs').readdirSync(assetsPath);
    const jsFiles = assetsContents.filter(file => file.endsWith('.js'));
    
    // Find the main JavaScript file (usually starts with 'main-')
    const mainJsFile = jsFiles.find(file => file.startsWith('main-'));
    return mainJsFile ? path.join('assets', mainJsFile) : null;
  } catch (error) {
    console.error('Error finding main JS file:', error.message);
    return null;
  }
}

// Helper function to find main CSS file
function findMainCssFile() {
  try {
    if (!distPath) return null;
    
    const assetsPath = path.join(distPath, 'assets');
    if (!require('fs').existsSync(assetsPath)) return null;
    
    const assetsContents = require('fs').readdirSync(assetsPath);
    const cssFiles = assetsContents.filter(file => file.endsWith('.css'));
    
    // Find the main CSS file (usually starts with 'index-')
    const mainCssFile = cssFiles.find(file => file.startsWith('index-'));
    return mainCssFile ? path.join('assets', mainCssFile) : null;
  } catch (error) {
    console.error('Error finding main CSS file:', error.message);
    return null;
  }
}

// Specific route for index.html to ensure fresh content
app.get('/', (req, res) => {
  if (!distPath || !indexPath) {
    return res.status(500).json({ 
      error: 'Frontend not configured', 
      message: 'Static file path not found',
      searchedPaths: possibleDistPaths,
      currentDir: __dirname 
    });
  }
  
  if (require('fs').existsSync(indexPath)) {
    console.log(`✅ Serving fresh index.html for root route`);
    // Set headers to prevent caching of HTML
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
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

// IMPORTANT: Handle React routing AFTER static files - return all requests to React app
// This route should only handle non-static file requests
app.get('*', (req, res) => {
  // Skip if this is a static file request (should be handled by express.static above)
  if (req.path.startsWith('/assets/') || req.path.startsWith('/icon') || req.path.startsWith('/manifest.json') || req.path.startsWith('/sw.js')) {
    console.log(`⚠️ Static file request caught by catch-all route: ${req.path}`);
    return res.status(404).json({ error: 'Static file not found' });
  }
  
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
    // Set headers to prevent caching of HTML
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
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