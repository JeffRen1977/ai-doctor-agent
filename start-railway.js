#!/usr/bin/env node

// Railway-specific startup script
console.log('🚀 Starting AI Doctor Agent for Railway...');

// Force Railway configuration
process.env.NODE_ENV = process.env.NODE_ENV || 'production';
process.env.PORT = process.env.PORT || 8000;

console.log('=== RAILWAY STARTUP CONFIGURATION ===');
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`PORT: ${process.env.PORT}`);
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

// Start the backend
try {
  console.log('🔄 Starting backend server...');
  require('./backend/src/index.js');
  console.log('✅ Backend server started successfully');
} catch (error) {
  console.error('❌ Failed to start backend server:', error.message);
  console.error('Stack trace:', error.stack);
  process.exit(1);
}
