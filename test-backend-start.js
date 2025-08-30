#!/usr/bin/env node

console.log('🧪 Testing backend startup...');

// Test basic Node.js functionality
console.log('✅ Node.js is working');
console.log('✅ Current directory:', process.cwd());
console.log('✅ Node version:', process.version);

// Test file system access
try {
  const fs = require('fs');
  console.log('✅ File system module loaded');
  
  const contents = fs.readdirSync('.');
  console.log('✅ Current directory contents:', contents);
  
  if (fs.existsSync('backend')) {
    console.log('✅ Backend directory exists');
    const backendContents = fs.readdirSync('backend');
    console.log('✅ Backend contents:', backendContents);
    
    if (fs.existsSync('backend/src')) {
      console.log('✅ Backend/src directory exists');
      const srcContents = fs.readdirSync('backend/src');
      console.log('✅ Backend/src contents:', srcContents);
    }
  }
  
  if (fs.existsSync('dist')) {
    console.log('✅ Dist directory exists');
    const distContents = fs.readdirSync('dist');
    console.log('✅ Dist contents:', distContents);
  }
} catch (error) {
  console.error('❌ File system error:', error.message);
}

// Test if we can require the backend
try {
  console.log('🔄 Attempting to require backend...');
  require('./backend/src/index.js');
  console.log('✅ Backend required successfully');
} catch (error) {
  console.error('❌ Failed to require backend:', error.message);
  console.error('Stack trace:', error.stack);
}

console.log('�� Test completed');
