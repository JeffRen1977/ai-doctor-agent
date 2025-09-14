#!/usr/bin/env node

// Railway-specific startup script - Updated: 2025-09-14 06:20 UTC
// Fix: Ensure correct backend path order and enhanced debugging
console.log('🚀 Starting AI Doctor Agent for Railway...');

// Check Node.js version compatibility
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
if (majorVersion < 20) {
  console.error(`❌ Node.js version ${nodeVersion} is not supported. Firebase requires Node.js 20 or higher.`);
  console.error(`Current version: ${nodeVersion}`);
  console.error(`Required version: >=20.0.0`);
  process.exit(1);
}
console.log(`✅ Node.js version ${nodeVersion} is compatible with Firebase`);

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

// Test Firebase compatibility with better error handling
try {
  const firebase = require('firebase');
  console.log('✅ Firebase module available');
} catch (error) {
  console.error('❌ Firebase module not available:', error.message);
  
  // Try alternative Firebase imports
  try {
    const { initializeApp } = require('firebase/app');
    console.log('✅ Firebase app module available');
  } catch (appError) {
    console.error('❌ Firebase app module not available:', appError.message);
  }
  
  try {
    const { getAuth } = require('firebase/auth');
    console.log('✅ Firebase auth module available');
  } catch (authError) {
    console.error('❌ Firebase auth module not available:', authError.message);
  }
}

// Start the backend
try {
  console.log('🔄 Starting backend server...');
  
  // Try multiple possible paths for the backend
  const possibleBackendPaths = [
    './backend/src/index.js',  // This should be the correct path
    './backend/index.js',
    './src/index.js',
    './index.js'
  ];
  
  let backendStarted = false;
  for (const backendPath of possibleBackendPaths) {
    try {
      console.log(`🔍 Checking path: ${backendPath}`);
      const fs = require('fs');
      if (fs.existsSync(backendPath)) {
        console.log(`✅ Found backend at: ${backendPath}`);
        console.log(`📄 File size: ${fs.statSync(backendPath).size} bytes`);
        console.log(`📅 Last modified: ${fs.statSync(backendPath).mtime}`);
        require(backendPath);
        backendStarted = true;
        console.log('✅ Backend server started successfully');
        break;
      } else {
        console.log(`❌ Path ${backendPath} does not exist`);
      }
    } catch (pathError) {
      console.log(`⚠️ Path ${backendPath} not accessible:`, pathError.message);
      console.log(`📊 Error details:`, pathError.stack);
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
