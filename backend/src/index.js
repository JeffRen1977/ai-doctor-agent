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

// Basic health check for Railway (works immediately)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Service is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    env: process.env.NODE_ENV || 'development'
  });
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
  app.use(express.static(distPath));
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

app.listen(PORT, () => {
  console.log(`🚀 AI医生助理后端服务启动成功！`);
  console.log(`📍 服务地址: http://localhost:${PORT}`);
  console.log(`📊 健康检查: http://localhost:${PORT}/api/health`);
}); 