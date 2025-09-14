# Testing Language-Aware Doctor Chat

This guide explains how to test the language-aware doctor chat functionality to ensure English questions get English responses and Chinese questions get Chinese responses.

## 🧪 Testing Methods

### Method 1: Frontend Testing (Recommended)

1. **Start the Application**
   ```bash
   # Start backend
   cd backend
   npm start
   
   # Start frontend (in another terminal)
   cd frontend
   npm run dev
   ```

2. **Access the Chat Page**
   - Open browser to `http://localhost:5173`
   - Login to your account
   - Navigate to "Doctor Chat" page

3. **Test Language Settings**
   - Go to Settings page (`/settings`)
   - Change language to "English" or "中文"
   - Save settings

4. **Test Chat Responses**
   - Go back to Doctor Chat page
   - Ask questions in the selected language
   - Verify responses match the selected language

### Method 2: API Testing with cURL

1. **Get Authentication Token**
   ```bash
   # Login and get token
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"your-email@example.com","password":"your-password"}'
   ```

2. **Test English Chat**
   ```bash
   # Send English question
   curl -X POST http://localhost:3000/api/chat/send \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{"message":"I have a headache, what should I do?"}'
   ```

3. **Test Chinese Chat**
   ```bash
   # Send Chinese question
   curl -X POST http://localhost:3000/api/chat/send \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{"message":"我头痛，应该怎么办？"}'
   ```

### Method 3: Direct Service Testing

Create a test file to test the AI services directly:

```javascript
// test-chat-direct.js
const aiServiceFactory = require('./src/services/aiServiceFactory');

async function testChatLanguages() {
  console.log('🧪 Testing Chat Language Handling\n');
  
  // Test English
  console.log('📝 Testing English language...');
  const englishResult = await aiServiceFactory.healthChat(
    'I have a headache, what should I do?', 
    '', 
    { provider: 'gemini', language: 'en' }
  );
  
  if (englishResult.success) {
    console.log('✅ English Response:', englishResult.message);
    console.log('📊 Contains Chinese characters:', /[\u4e00-\u9fff]/.test(englishResult.message));
  }
  
  // Test Chinese
  console.log('\n📝 Testing Chinese language...');
  const chineseResult = await aiServiceFactory.healthChat(
    '我头痛，应该怎么办？', 
    '', 
    { provider: 'gemini', language: 'zh' }
  );
  
  if (chineseResult.success) {
    console.log('✅ Chinese Response:', chineseResult.message);
    console.log('📊 Contains Chinese characters:', /[\u4e00-\u9fff]/.test(chineseResult.message));
  }
}

testChatLanguages().catch(console.error);
```

## 🔍 What to Look For

### ✅ Success Indicators

1. **English Language Setting**:
   - English questions get English responses
   - No Chinese characters in responses
   - Suggestions are in English
   - Error messages are in English

2. **Chinese Language Setting**:
   - Chinese questions get Chinese responses
   - Responses contain Chinese characters
   - Suggestions are in Chinese
   - Error messages are in Chinese

### ❌ Failure Indicators

1. **Language Mismatch**:
   - English setting but Chinese responses
   - Chinese setting but English responses
   - Mixed language responses

2. **Error Messages**:
   - API errors
   - Authentication failures
   - Service unavailable errors

## 🐛 Troubleshooting

### Common Issues

1. **API Key Problems**
   ```
   Error: API key not valid
   ```
   - Check `.env` file for valid API keys
   - Ensure Gemini API key is set

2. **Authentication Issues**
   ```
   Error: Unauthorized
   ```
   - Check if user is logged in
   - Verify JWT token is valid
   - Check user settings exist

3. **Language Not Changing**
   ```
   Responses still in wrong language
   ```
   - Verify user settings are saved
   - Check browser cache
   - Restart backend server

### Debug Steps

1. **Check Backend Logs**
   ```bash
   cd backend
   npm start
   # Look for language logs like:
   # "🤖 Using AI provider: gemini, language: en for chat"
   ```

2. **Check User Settings**
   ```bash
   # Check if settings are saved in Firebase
   curl -X GET http://localhost:3000/api/user-settings/ai \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

3. **Verify AI Service Response**
   ```bash
   # Check AI service logs for language parameter
   # Look for: "💬 Using AI provider for health chat: gemini, language: en"
   ```

## 📊 Test Cases

### Test Case 1: English Language
- **Input**: "I have a headache, what should I do?"
- **Expected**: English response with English suggestions
- **Check**: No Chinese characters in response

### Test Case 2: Chinese Language
- **Input**: "我头痛，应该怎么办？"
- **Expected**: Chinese response with Chinese suggestions
- **Check**: Contains Chinese characters

### Test Case 3: Language Switching
- **Steps**:
  1. Set language to English
  2. Ask question
  3. Change language to Chinese
  4. Ask same question
- **Expected**: Different language responses

### Test Case 4: Error Handling
- **Input**: Invalid API key scenario
- **Expected**: Error message in selected language
- **Check**: Error message language matches setting

## 🎯 Expected Results

When testing is successful, you should see:

1. **Console Logs**:
   ```
   🤖 Using AI provider: gemini, model: gemini-1.5-flash, language: en for chat
   💬 Using AI provider for health chat: gemini, language: en
   ```

2. **API Response**:
   ```json
   {
     "message": "I understand you're experiencing a headache...",
     "suggestions": ["Headache", "Cold", "Fever", "Cough"]
   }
   ```

3. **Frontend Display**:
   - Chat messages in selected language
   - Suggestions in selected language
   - Error messages in selected language

## 📝 Test Checklist

- [ ] Backend server running
- [ ] Frontend server running
- [ ] User logged in
- [ ] Language setting saved
- [ ] English questions get English responses
- [ ] Chinese questions get Chinese responses
- [ ] Suggestions match language setting
- [ ] Error messages match language setting
- [ ] Language switching works correctly
- [ ] Both Gemini and OpenAI providers work (if configured)

## 🔧 Quick Test Commands

```bash
# Test with curl (replace YOUR_TOKEN with actual token)
curl -X POST http://localhost:3000/api/chat/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"message":"I have a headache"}' | jq '.message'

# Check if response contains Chinese characters
curl -X POST http://localhost:3000/api/chat/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"message":"I have a headache"}' | jq -r '.message' | grep -q '[\u4e00-\u9fff]' && echo "Contains Chinese" || echo "No Chinese"
```
