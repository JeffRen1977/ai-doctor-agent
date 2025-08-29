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
      const frontendDistPath = path.join(currentDir, 'frontend/dist');
      const distPath = path.join(currentDir, 'dist');
      
      const fileInfo = {
        currentDirectory: currentDir,
        parentDirectory: parentDir,
        frontendDistPath: frontendDistPath,
        distPath: distPath,
        currentDirContents: fs.readdirSync(currentDir),
        parentDirContents: fs.readdirSync(parentDir),
        frontendDistExists: fs.existsSync(frontendDistPath),
        distExists: fs.existsSync(distPath),
        frontendDistContents: fs.existsSync(frontendDistPath) ? fs.readdirSync(frontendDistPath) : 'Directory not found',
        distContents: fs.existsSync(distPath) ? fs.readdirSync(distPath) : 'Directory not found',
        requestedPath: pathname
      };
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(fileInfo, null, 2));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message, stack: error.stack }));
    }
    return;
  }
  
  // Asset test endpoint
  if (pathname === '/test-asset') {
    try {
      const currentDir = __dirname;
      const testAsset = '/assets/main-ce93f8d7.js'; // The exact asset that's failing
      
      const possiblePaths = [
        path.join(currentDir, 'frontend/dist', testAsset),
        path.join(currentDir, 'dist', testAsset),
        path.join(currentDir, testAsset),
        path.join(currentDir, '..', 'frontend/dist', testAsset),
        path.join(currentDir, '..', 'dist', testAsset),
        path.join(currentDir, 'frontend/dist', testAsset.substring(1)),
        path.join(currentDir, 'dist', testAsset.substring(1)),
        path.join(currentDir, testAsset.substring(1))
      ];
      
      const assetTestResults = {
        testAsset: testAsset,
        currentDirectory: currentDir,
        possiblePaths: possiblePaths,
        pathChecks: possiblePaths.map(filePath => ({
          path: filePath,
          exists: fs.existsSync(filePath),
          isFile: fs.existsSync(filePath) ? fs.statSync(filePath).isFile() : false,
          size: fs.existsSync(filePath) ? fs.statSync(filePath).size : null
        })),
        currentDirContents: fs.readdirSync(currentDir),
        frontendDistExists: fs.existsSync(path.join(currentDir, 'frontend/dist')),
        distExists: fs.existsSync(path.join(currentDir, 'dist'))
      };
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(assetTestResults, null, 2));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message, stack: error.stack }));
    }
    return;
  }
  
  // Simple HTML test endpoint
  if (pathname === '/test-html') {
    const testHtml = `
<!DOCTYPE html>
<html>
<head>
    <title>Test HTML</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .success { color: green; }
        .error { color: red; }
        .info { color: blue; }
    </style>
</head>
<body>
    <h1>Test HTML Response</h1>
    <p class="success">✅ HTML is working!</p>
    <p class="info">Current directory: ${__dirname}</p>
    <p class="info">Requested path: ${pathname}</p>
    <h2>File System Check:</h2>
    <div id="fileInfo">Loading...</div>
    
    <script>
        // Test JavaScript execution
        console.log('JavaScript is working!');
        document.getElementById('fileInfo').innerHTML = 'JavaScript executed successfully!';
    </script>
</body>
</html>`;
    
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(testHtml);
    return;
  }
  
  // Simple file test endpoint
  if (pathname === '/test-file') {
    try {
      const currentDir = __dirname;
      const testFile = path.join(currentDir, 'test-server.js');
      
      if (fs.existsSync(testFile)) {
        const content = fs.readFileSync(testFile, 'utf8');
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end(`File read successful!\nFile: ${testFile}\nSize: ${content.length} bytes\nFirst 100 chars: ${content.substring(0, 100)}`);
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end(`Test file not found: ${testFile}`);
      }
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end(`Error reading test file: ${error.message}\nStack: ${error.stack}`);
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
    
    try {
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
          console.log(`❌ index.html not found in any location, serving fallback HTML`);
          // Serve a fallback HTML with debugging info
          const fallbackHtml = `
<!DOCTYPE html>
<html>
<head>
    <title>AI Doctor Agent - Debug Mode</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .success { color: #28a745; }
        .error { color: #dc3545; }
        .info { color: #17a2b8; }
        .warning { color: #ffc107; }
        .debug-section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .endpoint { background: #f8f9fa; padding: 10px; margin: 5px 0; border-radius: 3px; font-family: monospace; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🤖 AI Doctor Agent - Debug Mode</h1>
        <p class="warning">⚠️ Frontend files not found. Running in debug mode.</p>
        
        <div class="debug-section">
            <h2>🔍 Debug Information</h2>
            <p><strong>Current Directory:</strong> <span class="info">${__dirname}</span></p>
            <p><strong>Timestamp:</strong> <span class="info">${new Date().toISOString()}</span></p>
        </div>
        
        <div class="debug-section">
            <h2>🔧 Debug Endpoints</h2>
            <div class="endpoint">/health - Health check</div>
            <div class="endpoint">/test - Test endpoint</div>
            <div class="endpoint">/test-html - HTML test</div>
            <div class="endpoint">/test-file - File system test</div>
            <div class="endpoint">/debug - File structure debug</div>
            <div class="endpoint">/files - Complete file listing</div>
        </div>
        
        <div class="debug-section">
            <h2>📁 File System Status</h2>
            <p>Checking for frontend files...</p>
            <div id="fileStatus">Loading...</div>
        </div>
        
        <div class="debug-section">
            <h2>🚀 Next Steps</h2>
            <ol>
                <li>Check the debug endpoints above</li>
                <li>Verify file locations in Railway logs</li>
                <li>Ensure frontend build completed successfully</li>
                <li>Check Dockerfile file copying</li>
            </ol>
        </div>
    </div>
    
    <script>
        // Test JavaScript execution
        console.log('Debug mode JavaScript working!');
        
        // Check file system status
        fetch('/files')
            .then(response => response.json())
            .then(data => {
                document.getElementById('fileStatus').innerHTML = 
                    '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
            })
            .catch(error => {
                document.getElementById('fileStatus').innerHTML = 
                    '<p class="error">Error fetching file status: ' + error.message + '</p>';
            });
    </script>
</body>
</html>`;
          
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(fallbackHtml);
        }
      }
    } catch (error) {
      console.error(`❌ Error serving root:`, error);
      res.writeHead(500, { 'Content-Type': 'text/html' });
      res.end(`<h1>Server Error</h1><p>Error: ${error.message}</p><pre>${error.stack}</pre>`);
    }
    return;
  }
  
  // Try to serve the requested file
  console.log(`🔍 Looking for static file: ${pathname}`);
  
  try {
    // Handle asset paths (CSS, JS, images, etc.)
    if (pathname.startsWith('/assets/') || pathname.startsWith('/icon-') || pathname.endsWith('.css') || pathname.endsWith('.js') || pathname.endsWith('.png') || pathname.endsWith('.svg')) {
      console.log(`🎯 Asset file requested: ${pathname}`);
      
      // Try multiple possible locations for static files
      const possiblePaths = [
        path.join(__dirname, 'frontend/dist', pathname),
        path.join(__dirname, 'dist', pathname),
        path.join(__dirname, pathname),
        path.join(__dirname, '..', 'frontend/dist', pathname),
        path.join(__dirname, '..', 'dist', pathname),
        // Also try without leading slash
        path.join(__dirname, 'frontend/dist', pathname.substring(1)),
        path.join(__dirname, 'dist', pathname.substring(1)),
        path.join(__dirname, pathname.substring(1))
      ];
      
      console.log(`🔍 Searching for asset in paths:`, possiblePaths);
      
      let fileFound = false;
      for (const filePath of possiblePaths) {
        try {
          if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            console.log(`✅ Found asset file at: ${filePath}`);
            serveStaticFile(res, filePath);
            fileFound = true;
            break;
          }
        } catch (pathError) {
          console.log(`⚠️ Error checking asset path ${filePath}:`, pathError.message);
          continue;
        }
      }
      
      if (!fileFound) {
        console.log(`❌ Asset file not found: ${pathname}`);
        console.log(`🔍 Searched paths:`, possiblePaths);
        
        // Return 404 for missing assets instead of trying to serve index.html
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Asset not found',
          path: pathname,
          message: 'Static asset file not found',
          searchedPaths: possiblePaths,
          currentDir: __dirname,
          availableFiles: fs.readdirSync(__dirname).slice(0, 10)
        }));
        return;
      }
    } else {
      // For non-asset paths, try to serve the file or fall back to index.html
      const possiblePaths = [
        path.join(__dirname, 'frontend/dist', pathname),
        path.join(__dirname, 'dist', pathname),
        path.join(__dirname, pathname),
        path.join(__dirname, '..', 'frontend/dist', pathname),
        path.join(__dirname, '..', 'dist', pathname)
      ];
      
      let fileFound = false;
      for (const filePath of possiblePaths) {
        try {
          if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            console.log(`✅ Found static file at: ${filePath}`);
            serveStaticFile(res, filePath);
            fileFound = true;
            break;
          }
        } catch (pathError) {
          console.log(`⚠️ Error checking path ${filePath}:`, pathError.message);
          continue;
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
          try {
            if (fs.existsSync(altIndexPath)) {
              console.log(`✅ Serving index.html for SPA routing from: ${altIndexPath}`);
              serveStaticFile(res, altIndexPath);
              indexFound = true;
              break;
            }
          } catch (indexError) {
            console.log(`⚠️ Error checking index path ${altIndexPath}:`, indexError.message);
            continue;
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
    }
  } catch (error) {
    console.error(`❌ Error in static file serving:`, error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'Internal server error',
      message: error.message,
      stack: error.stack
    }));
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
