const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
// 加载 .env：根目录、backend/.env（按 __dirname）、backend/.env（按 cwd），后者覆盖前者
require('dotenv').config();
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config({ path: path.join(process.cwd(), 'backend', '.env') });

// 密钥自检：JWT_SECRET 缺失或过弱时直接终止进程。
// 绝不允许带着可伪造的 token 对外提供病历接口。
const { assertJwtSecretConfigured } = require('./config/jwtConfig');
try {
  assertJwtSecretConfigured();
} catch (error) {
  console.error('❌ 启动中止：' + error.message);
  process.exit(1);
}

const aiProviderConfig = require('./config/aiProviderConfig');
(function logDefaultAI() {
  const provider = aiProviderConfig.getDefaultProvider();
  const model = aiProviderConfig.getDefaultModel(provider);
  console.log('🔧 Default AI (from .env):', provider, model, '| DEPLOYMENT_REGION=' + (process.env.DEPLOYMENT_REGION || '(unset)'));
})();

const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const healthRecordsRoutes = require('./routes/healthRecords');
const wearableRoutes = require('./routes/wearables');
const healthAnalysisRoutes = require('./routes/healthAnalysis');
const userSettingsRoutes = require('./routes/userSettings');
const digitalTwinRoutes = require('./routes/digitalTwin');
const riskMonitoringRoutes = require('./routes/riskMonitoring');
const interventionEngineRoutes = require('./routes/interventionEngine');
const rehabilitationAssistantRoutes = require('./routes/rehabilitationAssistant');
const timeSeriesRoutes = require('./routes/timeSeries');
const interventionsRoutes = require('./routes/interventions');
const conversationsRoutes = require('./routes/conversations');
const appointmentsRoutes = require('./routes/appointments');
const reportsRoutes = require('./routes/reports');
const emergencyRoutes = require('./routes/emergency');
const internalCronRoutes = require('./routes/internalCron');
const telegramIntegrationRoutes = require('./routes/telegramIntegration');
const internalTelegramRoutes = require('./routes/internalTelegram');

const app = express();
const PORT = process.env.PORT || 8000;

if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => { console.log(`${req.method} ${req.path}`); next(); });
}

// Frontend static paths
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
    break;
  }
}
if (!distPath) {
  console.error("Frontend build not found. Searched:", possibleDistPaths.map(p => path.relative(process.cwd(), p)));
}

// CORS configuration for Railway deployment
const allowedOrigins = [
  'http://localhost:3000', // Local development
  'http://localhost:3001', // Vite dev server (alternative port)
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

const isDev = process.env.NODE_ENV !== 'production';
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (allowedOrigin.includes('*')) {
        return origin.endsWith(allowedOrigin.replace('*.', ''));
      }
      return origin === allowedOrigin;
    });
    if (isAllowed) return callback(null, true);
    if (isDev) console.warn('CORS blocked:', origin);
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
// Increase body size limit for file uploads (50MB)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/health-records', healthRecordsRoutes);
app.use('/api/wearables', wearableRoutes);
app.use('/api/health-analysis', healthAnalysisRoutes);
app.use('/api/user-settings', userSettingsRoutes);
app.use('/api/digital-twin', digitalTwinRoutes);
app.use('/api/risk-monitoring', riskMonitoringRoutes);
app.use('/api/intervention', interventionEngineRoutes);
app.use('/api/rehabilitation', rehabilitationAssistantRoutes);
app.use('/api/time-series', timeSeriesRoutes);
app.use('/api/interventions', interventionsRoutes);
app.use('/api/conversations', conversationsRoutes);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/integrations/telegram', telegramIntegrationRoutes);
app.use('/internal/cron', internalCronRoutes);
app.use('/internal/telegram', internalTelegramRoutes);

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    env: process.env.NODE_ENV || 'development'
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
        res.set('Cache-Control', 'public, max-age=300, must-revalidate');
        res.set('X-Version', Date.now().toString());
      }
    }
  }));
} else {
  console.error("Static files: distPath not found");
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
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.sendFile(indexPath);
  } else {
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
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.sendFile(indexPath);
  } else {
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

async function startServer() {
  const useMongo = /^mongo(db)?$/i.test(String(process.env.PERSISTENCE_ADAPTER || '').trim()) ||
    /^mongo(db)?$/i.test(String(process.env.AUTH_PROVIDER || '').trim());
  if (process.env.PERSISTENCE_ADAPTER === 'mongodb') {
    const { getDb } = require('./adapters/mongodb/connection');
    await getDb();
    console.log('✅ MongoDB connected (MONGODB_URI from env or localhost)');
  }
  if (useMongo) {
    console.log('🔐 Auth: mongodb (本地注册/登录，不经过 Firebase Auth)');
  } else {
    console.log('🔐 Auth: firebase (Firebase Auth)');
  }
  return new Promise((resolve, reject) => {
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server listening on ${PORT} (env: ${process.env.NODE_ENV || 'development'})`);
      resolve(server);
    });
    server.on('error', (error) => {
      console.error('Server start failed:', error.message, error.code);
      reject(error);
      process.exit(1);
    });
  });
}

let server;
startServer()
  .then((s) => { server = s; })
  .catch((err) => {
    console.error('Startup error:', err);
    process.exit(1);
  });

// Graceful shutdown
function shutdown(sig) {
  return () => {
    console.log(`${sig} received, shutting down gracefully`);
    if (server && typeof server.close === 'function') {
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  };
}
process.on('SIGTERM', shutdown('SIGTERM'));
process.on('SIGINT', shutdown('SIGINT')); 