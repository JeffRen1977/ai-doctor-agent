# Railway Environment Setup Guide

## 🚀 **Railway Configuration for AI Doctor Agent**

### **1. Environment Variables to Set in Railway:**

Go to your Railway project → Variables tab and add these:

#### **Required Variables:**
```bash
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here

# Firebase Configuration
FIREBASE_API_KEY=your-firebase-api-key
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789
FIREBASE_APP_ID=your-app-id

# Gemini AI Configuration
GEMINI_API_KEY=your-gemini-api-key

# CORS Configuration
FRONTEND_URL=https://ai-doctor-agent-production.up.railway.app

# Node Environment
NODE_ENV=production
```

#### **Optional Variables:**
```bash
# Port (Railway sets this automatically)
PORT=8000

# Database (if using external database)
MONGODB_URI=your-mongodb-connection-string
```

### **2. Railway Service Configuration:**

#### **Build Settings:**
- **Builder:** Dockerfile
- **Dockerfile Path:** Dockerfile
- **Build Command:** (auto-detected)

#### **Deploy Settings:**
- **Start Command:** `npm start`
- **Health Check Path:** `/health`
- **Health Check Timeout:** 300 seconds
- **Restart Policy:** On Failure
- **Max Retries:** 10

### **3. Domain Configuration:**

#### **Custom Domain (Optional):**
- **Domain:** `ai-doctor-agent-production.up.railway.app`
- **SSL:** Automatic (Railway handles this)

### **4. Health Check Endpoints:**

Your app provides these health check endpoints:

- **`/health`** - Basic health check (Railway uses this)
- **`/api/health`** - Detailed API health check
- **`/api/debug`** - File system debugging

### **5. Troubleshooting:**

#### **If Health Checks Fail:**
1. Check Railway logs for errors
2. Verify environment variables are set
3. Check if `/health` endpoint responds
4. Verify Docker build completes successfully

#### **If Frontend Doesn't Load:**
1. Check `/api/debug` endpoint
2. Verify frontend files are built
3. Check file paths in logs
4. Ensure CORS is configured correctly

### **6. Expected Behavior:**

After proper configuration:
- ✅ **Health checks pass** (200 status)
- ✅ **Frontend loads** at root URL
- ✅ **API endpoints work** at `/api/*`
- ✅ **Static assets serve** correctly
- ✅ **SPA routing works** for all paths

### **7. Monitoring:**

#### **Railway Dashboard:**
- **Deployments** - Build and deployment status
- **Logs** - Real-time application logs
- **Metrics** - Performance and usage data
- **Variables** - Environment configuration

#### **Application Logs:**
Look for these success messages:
```
✅ Found frontend files at: /app/dist
✅ Static files being served from: /app/dist
✅ Serving index.html for route: /
🚀 AI医生助理后端服务启动成功！
```

### **8. Quick Test Commands:**

```bash
# Test health check
curl https://ai-doctor-agent-production.up.railway.app/health

# Test API health
curl https://ai-doctor-agent-production.up.railway.app/api/health

# Test debug endpoint
curl https://ai-doctor-agent-production.up.railway.app/api/debug

# Test frontend
curl https://ai-doctor-agent-production.up.railway.app/
```

## 🎯 **Next Steps:**

1. **Set all environment variables** in Railway
2. **Redeploy** your application
3. **Check health checks** pass
4. **Test frontend loading**
5. **Verify API functionality**

Your app should work perfectly after this configuration! 🚀
