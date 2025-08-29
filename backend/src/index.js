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
app.use(express.static(path.join(__dirname, '../dist')));

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, '../dist/index.html');
  
  if (require('fs').existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).json({ 
      error: 'Frontend not found', 
      path: indexPath,
      currentDir: __dirname 
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