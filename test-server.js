const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8000;

// MIME types for static files
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject'
};

// Function to serve static files
function serveStaticFile(res, filePath) {
  try {
    console.log(`🔍 Attempting to serve: ${filePath}`);
    
    if (!fs.existsSync(filePath)) {
      console.log(`❌ File not found: ${filePath}`);
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'File not found', path: filePath }));
      return;
    }
    
    const extname = path.extname(filePath);
    const contentType = mimeTypes[extname] || 'application/octet-stream';
    
    console.log(`✅ Serving file: ${filePath} (${contentType})`);
    const content = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  } catch (error) {
    console.error(`❌ Error serving file ${filePath}:`, error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      error: 'Internal server error', 
      path: filePath,
      message: error.message 
    }));
  }
}

// Create HTTP server
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // Health check endpoint
  if (pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'OK',
      message: 'Test server is running',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      env: process.env.NODE_ENV || 'development',
      port: PORT,
      path: pathname
    }));
    return;
  }
  
  // Test endpoint
  if (pathname === '/test') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      message: 'Test endpoint working',
      timestamp: new Date().toISOString(),
      path: pathname
    }));
    return;
  }
  
  // Debug endpoint to check file structure
  if (pathname === '/debug') {
    try {
      const currentDir = __dirname;
      const frontendPath = path.join(currentDir, 'frontend/dist');
      const indexPath = path.join(frontendPath, 'index.html');
      
      const debugInfo = {
        currentDirectory: currentDir,
        frontendPath: frontendPath,
        indexPath: indexPath,
        frontendExists: fs.existsSync(frontendPath),
        indexExists: fs.existsSync(indexPath),
        currentDirContents: fs.readdirSync(currentDir),
        frontendDirContents: fs.existsSync(frontendPath) ? fs.readdirSync(frontendPath) : 'Directory not found',
        requestedPath: pathname
      };
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(debugInfo));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message, stack: error.stack }));
    }
    return;
  }
  
  // File listing endpoint for debugging
  if (pathname === '/files') {
    try {
      const currentDir = __dirname;
      const parentDir = path.join(currentDir, '..');
      
      const fileInfo = {
        currentDirectory: currentDir,
        parentDirectory: parentDir,
        currentDirContents: fs.readdirSync(currentDir),
        parentDirContents: fs.readdirSync(parentDir),
        frontendDistExists: fs.existsSync(path.join(currentDir, 'frontend/dist')),
        distExists: fs.existsSync(path.join(currentDir, 'dist')),
        frontendDistContents: fs.existsSync(path.join(currentDir, 'frontend/dist')) ? 
          fs.readdirSync(path.join(currentDir, 'frontend/dist')) : 'Not found',
        distContents: fs.existsSync(path.join(currentDir, 'dist')) ? 
          fs.readdirSync(path.join(currentDir, 'dist')) : 'Not found'
      };
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(fileInfo));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message, stack: error.stack }));
    }
    return;
  }
  
  // API endpoints - proxy to backend if it exists
  if (pathname.startsWith('/api/')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      message: 'API endpoint requested',
      path: pathname,
      note: 'Backend API not yet loaded, using test server'
    }));
    return;
  }
  
  // Try to serve static files from frontend/dist
  const staticPath = path.join(__dirname, 'frontend/dist', pathname);
  
  // If requesting root, serve index.html
  if (pathname === '/' || pathname === '') {
    const indexPath = path.join(__dirname, 'frontend/dist/index.html');
    console.log(`🔍 Root request, looking for: ${indexPath}`);
    if (fs.existsSync(indexPath)) {
      console.log(`✅ Serving index.html`);
      serveStaticFile(res, indexPath);
    } else {
      console.log(`❌ index.html not found at: ${indexPath}`);
      // Try alternative locations
      const altPaths = [
        path.join(__dirname, 'dist/index.html'),
        path.join(__dirname, 'index.html'),
        path.join(__dirname, '..', 'frontend/dist/index.html'),
        path.join(__dirname, '..', 'dist/index.html')
      ];
      
      let found = false;
      for (const altPath of altPaths) {
        if (fs.existsSync(altPath)) {
          console.log(`✅ Found index.html at alternative path: ${altPath}`);
          serveStaticFile(res, altPath);
          found = true;
          break;
        }
      }
      
      if (!found) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Frontend not found',
          message: 'index.html not found in any expected location',
          searchedPaths: [indexPath, ...altPaths],
          currentDir: __dirname,
          availableFiles: fs.readdirSync(__dirname).slice(0, 10)
        }));
      }
    }
    return;
  }
  
  // Try to serve the requested file
  console.log(`🔍 Looking for static file: ${staticPath}`);
  
  // Try multiple possible locations for static files
  const possiblePaths = [
    staticPath,
    path.join(__dirname, 'dist', pathname),
    path.join(__dirname, pathname),
    path.join(__dirname, '..', 'frontend/dist', pathname),
    path.join(__dirname, '..', 'dist', pathname)
  ];
  
  let fileFound = false;
  for (const filePath of possiblePaths) {
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      console.log(`✅ Found static file at: ${filePath}`);
      serveStaticFile(res, filePath);
      fileFound = true;
      break;
    }
  }
  
  if (!fileFound) {
    console.log(`❌ Static file not found in any location: ${pathname}`);
    console.log(`🔍 Searched paths:`, possiblePaths);
    
    // If file not found, serve index.html for SPA routing
    const indexPath = path.join(__dirname, 'frontend/dist/index.html');
    const altIndexPaths = [
      path.join(__dirname, 'dist/index.html'),
      path.join(__dirname, 'index.html'),
      path.join(__dirname, '..', 'frontend/dist/index.html'),
      path.join(__dirname, '..', 'dist/index.html')
    ];
    
    let indexFound = false;
    for (const altIndexPath of altIndexPaths) {
      if (fs.existsSync(altIndexPath)) {
        console.log(`✅ Serving index.html for SPA routing from: ${altIndexPath}`);
        serveStaticFile(res, altIndexPath);
        indexFound = true;
        break;
      }
    }
    
    if (!indexFound) {
      console.log(`❌ index.html not available for SPA routing`);
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: 'Not found',
        path: pathname,
        message: 'File not found and index.html not available',
        searchedPaths: possiblePaths,
        indexPaths: [indexPath, ...altIndexPaths],
        currentDir: __dirname,
        availableFiles: fs.readdirSync(__dirname).slice(0, 10)
      }));
    }
  }
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Test server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`📍 Test endpoint: http://localhost:${PORT}/test`);
  console.log(`📍 Frontend: http://localhost:${PORT}/`);
  console.log(`🔍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔍 Port: ${PORT}`);
  
  // Check if frontend files exist
  const frontendPath = path.join(__dirname, 'frontend/dist');
  if (fs.existsSync(frontendPath)) {
    console.log(`✅ Frontend directory found: ${frontendPath}`);
    console.log(`📁 Frontend files: ${fs.readdirSync(frontendPath).join(', ')}`);
  } else {
    console.log(`⚠️ Frontend directory not found: ${frontendPath}`);
  }
});

// Handle graceful shutdown
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

// Error handling
server.on('error', (err) => {
  console.error('Server error:', err);
  process.exit(1);
});
