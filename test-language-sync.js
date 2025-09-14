#!/usr/bin/env node

/**
 * Language Synchronization Test
 * 
 * This script tests if the language synchronization between frontend and backend is working.
 * It simulates the frontend API calls to update language settings.
 */

const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3000/api';
const TEST_EMAIL = 'test@example.com'; // Replace with your test email
const TEST_PASSWORD = 'testpassword';   // Replace with your test password

async function testLanguageSync() {
  console.log('🧪 Testing Language Synchronization');
  console.log('=====================================\n');

  try {
    // Step 1: Login and get token
    console.log('🔐 Step 1: Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful, token length:', token.length);

    // Step 2: Get current AI settings
    console.log('\n🔍 Step 2: Getting current AI settings...');
    const currentSettingsResponse = await axios.get(`${BASE_URL}/user-settings/ai`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('📊 Current settings:', currentSettingsResponse.data.data);

    // Step 3: Test language update to English
    console.log('\n🌐 Step 3: Testing language update to English...');
    const englishUpdateResponse = await axios.put(`${BASE_URL}/user-settings/ai`, {
      language: 'en'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ English update response:', englishUpdateResponse.data);

    // Step 4: Verify English setting was saved
    console.log('\n🔍 Step 4: Verifying English setting was saved...');
    const englishVerifyResponse = await axios.get(`${BASE_URL}/user-settings/ai`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const englishLanguage = englishVerifyResponse.data.data.language;
    console.log('📊 Language after English update:', englishLanguage);
    
    if (englishLanguage === 'en') {
      console.log('✅ English language setting saved successfully!');
    } else {
      console.log('❌ English language setting NOT saved correctly!');
    }

    // Step 5: Test language update to Chinese
    console.log('\n🌐 Step 5: Testing language update to Chinese...');
    const chineseUpdateResponse = await axios.put(`${BASE_URL}/user-settings/ai`, {
      language: 'zh'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Chinese update response:', chineseUpdateResponse.data);

    // Step 6: Verify Chinese setting was saved
    console.log('\n🔍 Step 6: Verifying Chinese setting was saved...');
    const chineseVerifyResponse = await axios.get(`${BASE_URL}/user-settings/ai`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const chineseLanguage = chineseVerifyResponse.data.data.language;
    console.log('📊 Language after Chinese update:', chineseLanguage);
    
    if (chineseLanguage === 'zh') {
      console.log('✅ Chinese language setting saved successfully!');
    } else {
      console.log('❌ Chinese language setting NOT saved correctly!');
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(50));
    
    if (englishLanguage === 'en' && chineseLanguage === 'zh') {
      console.log('🎉 Language synchronization is working correctly!');
      console.log('✅ Both English and Chinese language updates work');
    } else {
      console.log('⚠️ Language synchronization has issues:');
      if (englishLanguage !== 'en') {
        console.log('❌ English update failed');
      }
      if (chineseLanguage !== 'zh') {
        console.log('❌ Chinese update failed');
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    console.log('\n💡 Make sure to:');
    console.log('1. Update TEST_EMAIL and TEST_PASSWORD in the script');
    console.log('2. Start the backend server (npm run dev:backend)');
    console.log('3. Ensure the user account exists');
  }
}

// Run the test
testLanguageSync();
