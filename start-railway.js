#!/usr/bin/env node

// Railway-specific startup script - Updated: 2025-08-29 16:16 UTC
console.log('🚀 Starting AI Doctor Agent for Railway...');

// Force Railway configuration
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

// Railway should set PORT, but let's be more explicit
if (!process.env.PORT) {
  console.log('⚠️ PORT not set by Railway, using default 8000');
  process.env.PORT = 8000;
}

console.log('=== RAILWAY STARTUP CONFIGURATION ===');
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`PORT from env: ${process.env.PORT}`);
console.log(`Final PORT: ${process.env.PORT}`);
console.log(`Working Directory: ${process.cwd()}`);
console.log(`Node Version: ${process.version}`);
console.log(`Platform: ${process.platform}`);
console.log('=====================================');

// Check if we're in Railway
if (process.env.RAILWAY_ENVIRONMENT) {
  console.log('✅ Running in Railway environment');
} else {
  console.log('⚠️ Not running in Railway environment');
}

// List directory contents for debugging
console.log('📁 Current directory contents:');
try {
  const fs = require('fs');
  const contents = fs.readdirSync('.');
  console.log(contents);
  
  if (fs.existsSync('backend')) {
    console.log('📁 Backend directory contents:');
    const backendContents = fs.readdirSync('backend');
    console.log(backendContents);
    
    if (fs.existsSync('backend/src')) {
      console.log('📁 Backend/src directory contents:');
      const srcContents = fs.readdirSync('backend/src');
      console.log(srcContents);
    }
  }
  
  if (fs.existsSync('dist')) {
    console.log('📁 Dist directory contents:');
    const distContents = fs.readdirSync('dist');
    console.log(distContents);
  }
} catch (error) {
  console.error('❌ Error listing directories:', error.message);
}

// Test if we can require basic modules
console.log('🧪 Testing module availability...');
try {
  require('express');
  console.log('✅ Express module available');
} catch (error) {
  console.error('❌ Express module not available:', error.message);
}

try {
  require('cors');
  console.log('✅ CORS module available');
} catch (error) {
  console.error('❌ CORS module not available:', error.message);
}

try {
  require('helmet');
  console.log('✅ Helmet module available');
} catch (error) {
  console.error('❌ Helmet module not available:', error.message);
}

// Start the backend
try {
  console.log('🔄 Starting backend server...');
  
  // Try multiple possible paths for the backend
  const possibleBackendPaths = [
    './backend/src/index.js',
    './backend/index.js',
    './src/index.js',
    './index.js'
  ];
  
  let backendStarted = false;
  for (const backendPath of possibleBackendPaths) {
    try {
      if (fs.existsSync(backendPath)) {
        console.log(`✅ Found backend at: ${backendPath}`);
        require(backendPath);
        backendStarted = true;
        console.log('✅ Backend server started successfully');
        break;
      }
    } catch (pathError) {
      console.log(`⚠️ Path ${backendPath} not accessible:`, pathError.message);
    }
  }
  
  if (!backendStarted) {
    throw new Error('No valid backend path found');
  }
} catch (error) {
  console.error('❌ Failed to start backend server:', error.message);
  console.error('Stack trace:', error.stack);
  
  // Don't exit immediately, let's see what happens
  console.log('⚠️ Continuing without backend server...');
  
  // Try to start a minimal server to test if Railway can reach us
  try {
    const express = require('express');
    const app = express();
    const port = process.env.PORT || 8000;
    
    app.get('/', (req, res) => {
      res.json({ 
        message: 'AI Doctor Agent - Backend startup failed, but server is responding',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    });
    
    app.get('/health', (req, res) => {
      res.json({ 
        status: 'ERROR', 
        message: 'Backend startup failed',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    });
    
    app.listen(port, '0.0.0.0', () => {
      console.log(`⚠️ Minimal server started on port ${port} (backend failed to start)`);
    });
  } catch (minimalError) {
    console.error('❌ Even minimal server failed:', minimalError.message);
    process.exit(1);
  }
}
