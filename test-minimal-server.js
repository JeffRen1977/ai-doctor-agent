#!/usr/bin/env node

const express = require('express');
const app = express();
const port = process.env.PORT || 8000;

console.log('🧪 Starting minimal test server...');
console.log(`Port: ${port}`);
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`Working directory: ${process.cwd()}`);

app.get('/', (req, res) => {
  res.json({
    message: 'Minimal test server is working!',
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

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Minimal server health check',
    timestamp: new Date().toISOString()
  });
});

app.get('/test', (req, res) => {
  res.json({
    message: 'Test endpoint working',
    timestamp: new Date().toISOString()
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`✅ Minimal test server started on port ${port}`);
  console.log(`📍 Local: http://localhost:${port}`);
  console.log(`📍 Network: http://0.0.0.0:${port}`);
});

// Handle errors
app.on('error', (error) => {
  console.error('❌ Server error:', error);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});
