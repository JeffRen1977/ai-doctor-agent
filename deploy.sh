#!/bin/bash

echo "🚀 Starting deployment process..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the frontend
echo "🔨 Building frontend..."
cd frontend
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Frontend build failed!"
    exit 1
fi

echo "✅ Frontend built successfully!"

# Go back to root
cd ..

# Create deployment package
echo "📦 Creating deployment package..."
mkdir -p deployment
cp -r frontend/dist/* deployment/
cp -r backend deployment/
cp package.json deployment/
cp README.md deployment/

# Create a simple start script for production
cat > deployment/start.sh << 'EOF'
#!/bin/bash

echo "🚀 Starting AI Doctor Agent..."

# Start backend
cd backend
npm install
npm start &

# Wait a moment for backend to start
sleep 5

# Start frontend (if you want to serve it with a simple server)
cd ..
npx serve -s dist -l 3000

echo "✅ Application started!"
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend: http://localhost:8000"
EOF

chmod +x deployment/start.sh

# Create Docker configuration
cat > deployment/Dockerfile << 'EOF'
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY frontend/package*.json ./frontend/

# Install dependencies
RUN npm install
RUN cd frontend && npm install

# Copy source code
COPY . .

# Build frontend
RUN cd frontend && npm run build

# Expose ports
EXPOSE 8000 3000

# Start the application
CMD ["sh", "start.sh"]
EOF

# Create docker-compose for easy deployment
cat > deployment/docker-compose.yml << 'EOF'
version: '3.8'

services:
  ai-doctor-app:
    build: .
    ports:
      - "8000:8000"
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=8000
    volumes:
      - ./uploads:/app/backend/uploads
    restart: unless-stopped

  # Optional: Add a reverse proxy (nginx)
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - ai-doctor-app
    restart: unless-stopped
EOF

# Create nginx configuration
cat > deployment/nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server ai-doctor-app:8000;
    }

    upstream frontend {
        server ai-doctor-app:3000;
    }

    server {
        listen 80;
        server_name localhost;

        # Frontend
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Backend API
        location /api/ {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Health check
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
    }
}
EOF

# Create environment file template
cat > deployment/.env.example << 'EOF'
# Server Configuration
PORT=8000
NODE_ENV=production

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Firebase Configuration
FIREBASE_API_KEY=your-firebase-api-key
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
FIREBASE_APP_ID=your-firebase-app-id

# Gemini AI Configuration
GEMINI_API_KEY=your-gemini-api-key

# Database Configuration (if using external database)
DATABASE_URL=your-database-url
EOF

# Create deployment instructions
cat > deployment/DEPLOYMENT.md << 'EOF'
# 🚀 AI Doctor Agent - Deployment Guide

## Quick Start

### Option 1: Simple Deployment
```bash
# Start the application
./start.sh
```

### Option 2: Docker Deployment
```bash
# Build and run with Docker
docker-compose up -d

# View logs
docker-compose logs -f
```

### Option 3: Manual Deployment
```bash
# Start backend
cd backend
npm install
npm start

# Start frontend (in another terminal)
cd frontend
npm install
npx serve -s dist -l 3000
```

## Environment Variables
1. Copy `.env.example` to `.env`
2. Fill in your actual API keys and configuration
3. Restart the application

## Mobile Optimization
- The app is fully responsive and mobile-friendly
- Sidebar automatically becomes a mobile overlay on small screens
- Touch-friendly interface with proper mobile navigation

## Production Considerations
- Use HTTPS in production
- Set up proper environment variables
- Configure your domain in the nginx configuration
- Set up SSL certificates
- Configure your firewall to only expose necessary ports

## Monitoring
- Health check endpoint: `/health`
- Application logs are available in the console
- Monitor memory and CPU usage

## Troubleshooting
- Check if all ports are available (8000, 3000)
- Verify environment variables are set correctly
- Check backend logs for any errors
- Ensure Firebase and Gemini API keys are valid
EOF

echo "✅ Deployment package created successfully!"
echo "📁 Deployment files are in the 'deployment' directory"
echo ""
echo "🚀 To deploy:"
echo "1. Copy the 'deployment' folder to your server"
echo "2. Run './start.sh' for simple deployment"
echo "3. Or use 'docker-compose up -d' for Docker deployment"
echo ""
echo "📱 The app is now mobile-optimized and ready for production!"
