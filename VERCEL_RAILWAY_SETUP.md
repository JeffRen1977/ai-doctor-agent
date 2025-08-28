# Vercel + Railway Setup Guide

## 🚀 Connecting Your Vercel Frontend with Railway Backend

### 1. **Environment Variables in Vercel**

Go to your Vercel project dashboard and add these environment variables:

```bash
# API Configuration
VITE_API_URL=https://your-railway-app-name.railway.app
```

**How to set:**
1. Go to your Vercel project dashboard
2. Click on "Settings" → "Environment Variables"
3. Add `VITE_API_URL` with your Railway backend URL
4. Deploy again

### 2. **Get Your Railway Backend URL**

1. Go to your Railway project dashboard
2. Click on your deployed service
3. Copy the generated domain (e.g., `https://ai-doctor-backend-production.up.railway.app`)
4. Use this as your `VITE_API_URL` value

### 3. **CORS Configuration**

Your Railway backend needs to allow requests from your Vercel domain. Add this to your backend:

```javascript
// In your backend CORS configuration
app.use(cors({
  origin: [
    'https://your-vercel-app.vercel.app',
    'http://localhost:3000' // for local development
  ],
  credentials: true
}))
```

### 4. **Environment-Specific Configuration**

The API service now automatically detects the environment:

- **Local Development**: Uses `/api` (proxies to local backend)
- **Vercel Production**: Uses `VITE_API_URL` environment variable
- **Fallback**: Defaults to `/api` if no environment variable is set

### 5. **Deploy Steps**

1. **Set environment variable in Vercel**
2. **Redeploy your Vercel app**
3. **Test the connection**

### 6. **Testing the Connection**

After setup, test these endpoints:
- Login/Register
- Diet Analysis
- Health Records
- Chat functionality

### 7. **Troubleshooting**

**Common Issues:**
- **CORS errors**: Check backend CORS configuration
- **404 errors**: Verify Railway URL is correct
- **Authentication issues**: Check JWT token handling

**Debug Steps:**
1. Check browser console for errors
2. Verify environment variable is set correctly
3. Test Railway backend directly
4. Check CORS headers in Network tab

### 8. **Security Considerations**

- ✅ Use HTTPS URLs only
- ✅ Set appropriate CORS origins
- ✅ Validate JWT tokens properly
- ✅ Use environment variables for sensitive data

---

## 🎯 **Quick Setup Checklist**

- [ ] Get Railway backend URL
- [ ] Set `VITE_API_URL` in Vercel environment variables
- [ ] Configure CORS in Railway backend
- [ ] Redeploy Vercel app
- [ ] Test API connections
- [ ] Verify authentication flow

Your AI Doctor Agent will now work seamlessly between Vercel frontend and Railway backend! 🎉
