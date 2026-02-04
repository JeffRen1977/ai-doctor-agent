#!/bin/bash

# Railway Backend Deployment Script
# This script prepares the backend for Railway deployment

set -e

echo "🚀 Starting Railway Backend Deployment..."
echo "=========================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found${NC}"
    echo "   Please run this script from the project root"
    exit 1
fi

# Check if backend directory exists
if [ ! -d "backend" ]; then
    echo -e "${RED}❌ Error: backend directory not found${NC}"
    exit 1
fi

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Check backend dependencies
echo ""
echo "📦 Installing backend dependencies..."
cd backend
npm install
cd ..

# Verify Railway configuration
echo ""
echo "🔍 Checking Railway configuration..."
if [ ! -f "railway.json" ]; then
    echo -e "${YELLOW}⚠️  Warning: railway.json not found${NC}"
    echo "   Creating default railway.json..."
    cat > railway.json << EOF
{
  "\$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "dockerfile",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 300,
    "restartPolicyType": "on_failure",
    "restartPolicyMaxRetries": 10,
    "numReplicas": 1,
    "healthcheckInterval": 30,
    "healthcheckRetries": 3
  },
  "source": {
    "branch": "release"
  }
}
EOF
    echo -e "${GREEN}✅ Created railway.json${NC}"
fi

# Check Dockerfile
if [ ! -f "Dockerfile" ]; then
    echo -e "${YELLOW}⚠️  Warning: Dockerfile not found${NC}"
    echo "   Railway will use Nixpacks or buildpacks"
fi

# Check and read environment variables from backend/.env
echo ""
echo "🔍 Reading environment variables from backend/.env..."

ENV_FILE="backend/.env"
ENV_VARS=()

if [ -f "$ENV_FILE" ]; then
    echo -e "${GREEN}✅ Found backend/.env file${NC}"
    
    # Read .env file and extract variable names
    while IFS= read -r line || [ -n "$line" ]; do
        # Skip empty lines and comments
        if [[ -z "$line" ]] || [[ "$line" =~ ^[[:space:]]*# ]]; then
            continue
        fi
        
        # Extract variable name (everything before =)
        if [[ "$line" =~ ^[[:space:]]*([A-Za-z_][A-Za-z0-9_]*)= ]]; then
            var_name="${BASH_REMATCH[1]}"
            ENV_VARS+=("$var_name")
        fi
    done < "$ENV_FILE"
    
    echo "   Found ${#ENV_VARS[@]} environment variables in backend/.env"
    
    # Display found variables (without values for security)
    echo ""
    echo "📋 Environment variables found:"
    for var in "${ENV_VARS[@]}"; do
        echo "   ✅ $var"
    done
    
    # Generate Railway environment variables file
    echo ""
    echo "📝 Generating Railway environment variables reference..."
    RAILWAY_ENV_FILE="railway-env-vars.txt"
    cat > "$RAILWAY_ENV_FILE" << EOF
# Railway Environment Variables
# Copy these to Railway project settings → Variables
# Generated from backend/.env on $(date)

EOF
    
    # Read .env and format for Railway
    while IFS= read -r line || [ -n "$line" ]; do
        # Skip empty lines and comments
        if [[ -z "$line" ]] || [[ "$line" =~ ^[[:space:]]*# ]]; then
            # Include comments in the output file
            if [[ "$line" =~ ^[[:space:]]*# ]]; then
                echo "$line" >> "$RAILWAY_ENV_FILE"
            fi
            continue
        fi
        
        # Extract variable name and value
        if [[ "$line" =~ ^[[:space:]]*([A-Za-z_][A-Za-z0-9_]*)=(.*)$ ]]; then
            var_name="${BASH_REMATCH[1]}"
            var_value="${BASH_REMATCH[2]}"
            
            # Remove quotes if present
            var_value=$(echo "$var_value" | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")
            
            # Add to Railway env file (with placeholder for sensitive values)
            if [[ "$var_name" =~ (SECRET|KEY|PASSWORD|TOKEN) ]]; then
                echo "$var_name=your-$var_name-value-here" >> "$RAILWAY_ENV_FILE"
            else
                echo "$var_name=$var_value" >> "$RAILWAY_ENV_FILE"
            fi
        fi
    done < "$ENV_FILE"
    
    echo -e "${GREEN}✅ Generated $RAILWAY_ENV_FILE${NC}"
    echo "   You can use this file as a reference when setting Railway environment variables"
    
else
    echo -e "${YELLOW}⚠️  backend/.env file not found${NC}"
    echo "   Creating template file..."
    
    # Create a template .env file
    cat > "$ENV_FILE" << 'EOF'
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here

# Firebase Configuration
FIREBASE_API_KEY=your-firebase-api-key
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789
FIREBASE_APP_ID=your-app-id

# AI Service API Keys (Optional)
GEMINI_API_KEY=your-gemini-api-key
OPENAI_API_KEY=your-openai-api-key

# Chinese AI Models (Optional)
BAIDU_API_KEY=your-baidu-api-key
BAIDU_SECRET_KEY=your-baidu-secret-key
DASHSCOPE_API_KEY=your-dashscope-api-key

# CORS Configuration
FRONTEND_URL=https://your-vercel-app.vercel.app

# Node Environment
NODE_ENV=production
EOF
    
    echo -e "${GREEN}✅ Created template backend/.env file${NC}"
    echo "   Please fill in your actual values"
fi

# Check required environment variables
echo ""
echo "🔍 Checking required environment variables..."
REQUIRED_VARS=(
    "JWT_SECRET"
    "FIREBASE_PROJECT_ID"
    "FIREBASE_API_KEY"
)

MISSING_VARS=()
if [ -f "$ENV_FILE" ]; then
    # Source the .env file to check variables
    set -a
    source "$ENV_FILE" 2>/dev/null || true
    set +a
    
    for var in "${REQUIRED_VARS[@]}"; do
        if [ -z "${!var}" ] || [[ "${!var}" =~ ^your-.*-here$ ]] || [[ "${!var}" =~ ^your-.*-key$ ]]; then
            MISSING_VARS+=("$var")
        fi
    done
else
    MISSING_VARS=("${REQUIRED_VARS[@]}")
fi

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Warning: Some required environment variables are missing or not configured:${NC}"
    for var in "${MISSING_VARS[@]}"; do
        echo "   - $var"
    done
    echo ""
    echo "   Please configure these in backend/.env file"
    echo "   Then set them in Railway project settings → Variables"
else
    echo -e "${GREEN}✅ All required environment variables are configured${NC}"
fi

echo ""
echo -e "${GREEN}✅ Backend is ready for Railway deployment!${NC}"
echo ""
echo "📋 Next steps:"
echo "   1. Push to git repository (release branch)"
echo "   2. Railway will automatically deploy from git"
echo "   3. Or connect Railway to your GitHub repository"
echo ""
echo "🔧 Environment Variables Setup:"
echo ""
if [ -f "$RAILWAY_ENV_FILE" ]; then
    echo "   📄 Reference file generated: $RAILWAY_ENV_FILE"
    echo "   📋 Copy variables from this file to Railway:"
    echo "      1. Open Railway project → Settings → Variables"
    echo "      2. Add each variable from $RAILWAY_ENV_FILE"
    echo "      3. Replace placeholder values with actual values"
    echo ""
else
    echo "   Please set these in Railway project settings → Variables:"
    echo "   - JWT_SECRET"
    echo "   - FIREBASE_API_KEY"
    echo "   - FIREBASE_AUTH_DOMAIN"
    echo "   - FIREBASE_PROJECT_ID"
    echo "   - FIREBASE_STORAGE_BUCKET"
    echo "   - FIREBASE_MESSAGING_SENDER_ID"
    echo "   - FIREBASE_APP_ID"
    echo "   - GEMINI_API_KEY (optional)"
    echo "   - OPENAI_API_KEY (optional)"
    echo "   - BAIDU_API_KEY (optional, for Chinese models)"
    echo "   - BAIDU_SECRET_KEY (optional, for Chinese models)"
    echo "   - DASHSCOPE_API_KEY (optional, for Chinese models)"
    echo ""
fi

# Add railway-env-vars.txt to .gitignore if not already there
if [ -f ".gitignore" ] && ! grep -q "railway-env-vars.txt" .gitignore; then
    echo "" >> .gitignore
    echo "# Railway environment variables reference (generated)" >> .gitignore
    echo "railway-env-vars.txt" >> .gitignore
    echo -e "${GREEN}✅ Added railway-env-vars.txt to .gitignore${NC}"
fi
echo ""
