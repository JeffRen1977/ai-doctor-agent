# Railway Environment Variables Setup Guide

## 🚀 **Essential Environment Variables for Railway Deployment**

### ⚠️ **CRITICAL: You MUST set these in Railway for your app to work!**

---

## 🔧 **How to Set Environment Variables in Railway:**

1. **Go to Railway Dashboard**
2. **Click on your service** (`ai-doctor-agent-production`)
3. **Click "Variables" tab**
4. **Add each variable** with its value
5. **Click "Add"** after each one
6. **Redeploy** your service

---

## 📋 **Required Environment Variables:**

### **1. Server Configuration**
```bash
PORT=8000
NODE_ENV=production
```

### **2. JWT Configuration (REQUIRED for authentication)**
```bash
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```
**⚠️ IMPORTANT:** Generate a strong random string for this!

### **3. Firebase Configuration (REQUIRED for database)**
```bash
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY_ID=your-firebase-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour Firebase Private Key Here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your-firebase-client-email
FIREBASE_CLIENT_ID=your-firebase-client-id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_X509_CERT_URL=your-firebase-client-x509-cert-url
```

### **4. Gemini AI Configuration (REQUIRED for AI features)**
```bash
GEMINI_API_KEY=your-gemini-api-key
```

### **5. CORS Configuration (Optional but recommended)**
```bash
FRONTEND_URL=https://ai-doctor-agent-production.up.railway.app
```

---

## 🔑 **How to Get These Values:**

### **JWT_SECRET:**
```bash
# Generate a random string (run this in terminal)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### **Firebase Configuration:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings → Service Accounts
4. Click "Generate New Private Key"
5. Download the JSON file
6. Copy values from the JSON to Railway

### **Gemini API Key:**
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the key to Railway

---

## 🚨 **What Happens Without These Variables:**

- ❌ **JWT_SECRET missing**: Users can't login/register
- ❌ **Firebase missing**: No database access, app crashes
- ❌ **Gemini missing**: AI chat and diet analysis won't work
- ❌ **App will fail** to start or function properly

---

## ✅ **After Setting Variables:**

1. **Railway will automatically redeploy**
2. **Your app will start successfully**
3. **All features will work properly**
4. **Healthcheck will pass**

---

## 🎯 **Quick Setup Checklist:**

- [ ] Set `JWT_SECRET` (generate random string)
- [ ] Set all Firebase variables (from service account JSON)
- [ ] Set `GEMINI_API_KEY` (from Google AI Studio)
- [ ] Set `NODE_ENV=production`
- [ ] Redeploy service
- [ ] Test app functionality

---

## 🔍 **Testing After Setup:**

Visit your Railway domain and test:
- ✅ User registration/login
- ✅ Diet analysis
- ✅ Chat functionality
- ✅ Health records
- ✅ Device sync

**Your AI Doctor Agent will be fully functional once these variables are set!** 🎉
