# Manual Testing Guide for Language-Aware Chat

## 🚀 Quick Start Testing

### Step 1: Start the Application
```bash
# Terminal 1: Start Backend
cd backend
npm start

# Terminal 2: Start Frontend  
cd frontend
npm run dev
```

### Step 2: Access the Application
1. Open browser to `http://localhost:5173`
2. Login with your account
3. Navigate to "Doctor Chat" page

### Step 3: Test English Language
1. Go to **Settings** page (`/settings`)
2. Set **Language** to **English**
3. Click **Save Settings**
4. Go back to **Doctor Chat** page
5. Ask: `"I have a headache, what should I do?"`
6. **Expected**: Response should be in English

### Step 4: Test Chinese Language
1. Go to **Settings** page (`/settings`)
2. Set **Language** to **中文**
3. Click **Save Settings**
4. Go back to **Doctor Chat** page
5. Ask: `"我头痛，应该怎么办？"`
6. **Expected**: Response should be in Chinese

## 🔍 What to Look For

### ✅ Success Indicators

**English Setting:**
- AI responses are in English
- No Chinese characters in responses
- Suggestions are in English (Headache, Cold, Fever, etc.)
- Error messages are in English

**Chinese Setting:**
- AI responses are in Chinese
- Responses contain Chinese characters
- Suggestions are in Chinese (头痛, 感冒, 发烧, etc.)
- Error messages are in Chinese

### ❌ Failure Indicators

- English setting but Chinese responses
- Chinese setting but English responses
- Mixed language responses
- Error messages in wrong language

## 🧪 Test Scenarios

### Scenario 1: Basic Language Test
```
English Question: "I have a headache"
Expected: English response with English suggestions

Chinese Question: "我头痛"
Expected: Chinese response with Chinese suggestions
```

### Scenario 2: Complex Health Questions
```
English Question: "I feel dizzy and nauseous, what could be the cause?"
Expected: Detailed English response about possible causes

Chinese Question: "我感觉头晕和恶心，可能是什么原因？"
Expected: Detailed Chinese response about possible causes
```

### Scenario 3: Language Switching
```
1. Set language to English
2. Ask a question → Get English response
3. Set language to Chinese
4. Ask same question → Get Chinese response
```

## 🐛 Troubleshooting

### Problem: Responses still in wrong language
**Solution:**
1. Check browser cache (hard refresh: Ctrl+F5)
2. Verify settings are saved (check Settings page)
3. Restart backend server
4. Check browser console for errors

### Problem: Authentication errors
**Solution:**
1. Make sure you're logged in
2. Check if JWT token is valid
3. Try logging out and back in

### Problem: API errors
**Solution:**
1. Check backend server is running
2. Verify API keys are configured
3. Check backend console logs

## 📱 Browser Testing

### Chrome DevTools
1. Open DevTools (F12)
2. Go to Network tab
3. Send a chat message
4. Look for `/api/chat/send` request
5. Check response contains correct language

### Console Logs
Look for these logs in browser console:
```
🤖 Using AI provider: gemini, language: en for chat
💬 Using AI provider for health chat: gemini, language: en
```

## 🔧 Backend Testing

### Check Backend Logs
```bash
cd backend
npm start
# Look for language logs in terminal
```

### Test API Directly
```bash
# Get your token from browser DevTools or login API
curl -X POST http://localhost:3000/api/chat/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"message":"I have a headache"}'
```

## 📊 Expected Results

### English Response Example
```json
{
  "message": "I understand you're experiencing a headache. Here are some professional recommendations:\n\n1. **Professional Health Advice**: Rest in a quiet, dark room and apply a cold compress to your forehead or neck.\n\n2. **Possible Symptom Analysis**: Headaches can be caused by stress, dehydration, lack of sleep, or tension.\n\n3. **Suggested Next Steps**: Stay hydrated, get adequate sleep, and consider over-the-counter pain relief if appropriate.\n\n4. **Important Notes**: If your headache is severe, sudden, or accompanied by other symptoms, seek immediate medical attention.",
  "suggestions": ["Headache", "Cold", "Fever", "Cough", "Insomnia", "Stomach pain", "Fatigue", "Anxiety"]
}
```

### Chinese Response Example
```json
{
  "message": "我理解您正在经历头痛。以下是一些专业建议：\n\n1. **专业健康建议**：在安静、黑暗的房间休息，并在前额或颈部敷冷敷。\n\n2. **可能的症状分析**：头痛可能由压力、脱水、睡眠不足或紧张引起。\n\n3. **建议的下一步行动**：保持水分，获得充足的睡眠，如果合适的话考虑非处方止痛药。\n\n4. **注意事项**：如果您的头痛严重、突然发作或伴有其他症状，请立即就医。",
  "suggestions": ["头痛", "感冒", "发烧", "咳嗽", "失眠", "胃痛", "疲劳", "焦虑"]
}
```

## ✅ Test Checklist

- [ ] Backend server running (port 3000)
- [ ] Frontend server running (port 5173)
- [ ] User logged in successfully
- [ ] Settings page accessible
- [ ] Language setting can be changed and saved
- [ ] English questions get English responses
- [ ] Chinese questions get Chinese responses
- [ ] Suggestions match selected language
- [ ] Error messages match selected language
- [ ] Language switching works correctly
- [ ] No console errors in browser
- [ ] Backend logs show correct language parameter

## 🎯 Quick Verification

**Fast Test (30 seconds):**
1. Login to app
2. Go to Settings → Set Language to English → Save
3. Go to Chat → Ask "Hello, I have a headache"
4. Verify response is in English
5. Go to Settings → Set Language to Chinese → Save  
6. Go to Chat → Ask "你好，我头痛"
7. Verify response is in Chinese

If both steps 4 and 7 work correctly, the language-aware chat is functioning properly! 🎉
