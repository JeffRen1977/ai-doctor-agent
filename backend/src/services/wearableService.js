const axios = require('axios');
const { db } = require('../config/firebase');
const { doc, setDoc, getDoc, updateDoc } = require('firebase/firestore');

// --- IMPORTANT --- 
// In a real app, you would store and retrieve these tokens from your database for each user.
// This is a temporary in-memory store for demonstration purposes only.
let fitbitAccessToken = null;

// --- IMPORTANT ---
// You must register this exact URI in your Fitbit App settings
const FITBIT_REDIRECT_URI = 'http://localhost:8000/api/wearables/fitbit/callback';

// You need to get these from the Fitbit Developer Portal
const FITBIT_CLIENT_ID = process.env.FITBIT_CLIENT_ID || 'YOUR_FITBIT_CLIENT_ID';
const FITBIT_CLIENT_SECRET = process.env.FITBIT_CLIENT_SECRET || 'YOUR_FITBIT_CLIENT_SECRET';

// Apple HealthKit configuration
const APPLE_HEALTHKIT_CONFIG = {
  // For iOS apps, you'll need to implement HealthKit integration
  // This is a placeholder for the web-based approach
  redirectUri: 'http://localhost:8000/api/wearables/apple/callback',
  scopes: ['activity', 'heart_rate', 'sleep', 'nutrition', 'body_metrics']
};

function getFitbitRedirectUri() {
  return FITBIT_REDIRECT_URI;
}

function getAppleHealthKitRedirectUri() {
  return APPLE_HEALTHKIT_CONFIG.redirectUri;
}

/**
 * Exchanges a Fitbit authorization code for an access token.
 * @param {string} code The authorization code from Fitbit.
 * @param {string} userEmail User's email for storing tokens
 */
async function exchangeFitbitCodeForToken(code, userEmail) {
  const credentials = Buffer.from(`${FITBIT_CLIENT_ID}:${FITBIT_CLIENT_SECRET}`).toString('base64');
  const params = new URLSearchParams();
  params.append('code', code);
  params.append('grant_type', 'authorization_code');
  params.append('redirect_uri', FITBIT_REDIRECT_URI);

  try {
    const response = await axios.post('https://api.fitbit.com/oauth2/token', params, {
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    // Store the access token and user info
    const tokenData = {
      access_token: response.data.access_token,
      refresh_token: response.data.refresh_token,
      expires_in: response.data.expires_in,
      user_id: response.data.user_id,
      scope: response.data.scope,
      token_type: response.data.token_type,
      created_at: new Date().toISOString()
    };

    // Store in Firebase for the specific user
    await storeUserWearableTokens(userEmail, 'fitbit', tokenData);
    
    console.log('Fitbit Access Token obtained and stored successfully for user:', userEmail);
    return tokenData;

  } catch (error) {
    console.error('Error exchanging Fitbit code for token:', error.response ? error.response.data : error.message);
    throw new Error('Could not get access token from Fitbit.');
  }
}

/**
 * Store wearable device tokens for a specific user
 * @param {string} userEmail User's email
 * @param {string} deviceType Type of device (fitbit, apple, etc.)
 * @param {object} tokenData Token information
 */
async function storeUserWearableTokens(userEmail, deviceType, tokenData) {
  try {
    const userWearablesRef = doc(db, 'userWearables', userEmail);
    const userWearablesDoc = await getDoc(userWearablesRef);
    
    if (userWearablesDoc.exists()) {
      // Update existing document
      await updateDoc(userWearablesRef, {
        [`${deviceType}Tokens`]: tokenData,
        [`${deviceType}Connected`]: true,
        [`${deviceType}LastSync`]: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } else {
      // Create new document
      await setDoc(userWearablesRef, {
        userEmail,
        [`${deviceType}Tokens`]: tokenData,
        [`${deviceType}Connected`]: true,
        [`${deviceType}LastSync`]: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    
    console.log(`✅ ${deviceType} tokens stored for user:`, userEmail);
  } catch (error) {
    console.error(`❌ Error storing ${deviceType} tokens:`, error);
    throw error;
  }
}

/**
 * Get user's wearable device tokens
 * @param {string} userEmail User's email
 * @param {string} deviceType Type of device
 */
async function getUserWearableTokens(userEmail, deviceType) {
  try {
    const userWearablesRef = doc(db, 'userWearables', userEmail);
    const userWearablesDoc = await getDoc(userWearablesRef);
    
    if (!userWearablesDoc.exists()) {
      return null;
    }
    
    const data = userWearablesDoc.data();
    return data[`${deviceType}Tokens`] || null;
  } catch (error) {
    console.error(`❌ Error getting ${deviceType} tokens:`, error);
    return null;
  }
}

/**
 * Fetches user's activity summary from the Fitbit API.
 * @param {string} userEmail User's email
 */
async function getFitbitData(userEmail) {
  try {
    const tokenData = await getUserWearableTokens(userEmail, 'fitbit');
    
    if (!tokenData || !tokenData.access_token) {
      throw new Error('Not authenticated with Fitbit.');
    }

    // Check if token is expired
    const tokenAge = Date.now() - new Date(tokenData.created_at).getTime();
    if (tokenAge > (tokenData.expires_in * 1000)) {
      // Token expired, try to refresh
      await refreshFitbitToken(userEmail, tokenData.refresh_token);
      // Get updated tokens
      const updatedTokenData = await getUserWearableTokens(userEmail, 'fitbit');
      if (!updatedTokenData) {
        throw new Error('Failed to refresh Fitbit token.');
      }
      tokenData.access_token = updatedTokenData.access_token;
    }

    // Fetch various data types from Fitbit
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    
    const [activityData, heartRateData, sleepData, bodyData] = await Promise.all([
      // Activity data
      axios.get(`https://api.fitbit.com/1/user/-/activities/date/${today}.json`, {
        headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
      }),
      // Heart rate data
      axios.get(`https://api.fitbit.com/1/user/-/activities/heart/date/${today}/1d.json`, {
        headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
      }),
      // Sleep data
      axios.get(`https://api.fitbit.com/1.2/user/-/sleep/date/${today}.json`, {
        headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
      }),
      // Body metrics
      axios.get(`https://api.fitbit.com/1/user/-/body/log/weight/date/${today}.json`, {
        headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
      })
    ]);

    const combinedData = {
      date: today,
      activity: activityData.data,
      heartRate: heartRateData.data,
      sleep: sleepData.data,
      body: bodyData.data,
      source: 'fitbit',
      lastSync: new Date().toISOString()
    };

    // Store the data in Firebase
    await storeWearableData(userEmail, 'fitbit', combinedData);
    
    return combinedData;
    
  } catch (error) {
    console.error('Error fetching data from Fitbit:', error.response ? error.response.data : error.message);
    throw new Error('Could not fetch data from Fitbit.');
  }
}

/**
 * Refresh Fitbit access token
 * @param {string} userEmail User's email
 * @param {string} refreshToken Refresh token
 */
async function refreshFitbitToken(userEmail, refreshToken) {
  try {
    const credentials = Buffer.from(`${FITBIT_CLIENT_ID}:${FITBIT_CLIENT_SECRET}`).toString('base64');
    const params = new URLSearchParams();
    params.append('grant_type', 'refresh_token');
    params.append('refresh_token', refreshToken);

    const response = await axios.post('https://api.fitbit.com/oauth2/token', params, {
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const newTokenData = {
      access_token: response.data.access_token,
      refresh_token: response.data.refresh_token || refreshToken,
      expires_in: response.data.expires_in,
      user_id: response.data.user_id,
      scope: response.data.scope,
      token_type: response.data.token_type,
      created_at: new Date().toISOString()
    };

    // Update stored tokens
    await storeUserWearableTokens(userEmail, 'fitbit', newTokenData);
    
    console.log('✅ Fitbit token refreshed successfully for user:', userEmail);
    return newTokenData;
    
  } catch (error) {
    console.error('❌ Error refreshing Fitbit token:', error);
    throw error;
  }
}

/**
 * Store wearable data in Firebase
 * @param {string} userEmail User's email
 * @param {string} deviceType Type of device
 * @param {object} data Data to store
 */
async function storeWearableData(userEmail, deviceType, data) {
  try {
    const userWearablesRef = doc(db, 'userWearables', userEmail);
    const userWearablesDoc = await getDoc(userWearablesRef);
    
    if (userWearablesDoc.exists()) {
      // Update existing document with new data
      await updateDoc(userWearablesRef, {
        [`${deviceType}Data`]: data,
        [`${deviceType}LastSync`]: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } else {
      // Create new document
      await setDoc(userWearablesRef, {
        userEmail,
        [`${deviceType}Data`]: data,
        [`${deviceType}LastSync`]: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    
    console.log(`✅ ${deviceType} data stored for user:`, userEmail);
  } catch (error) {
    console.error(`❌ Error storing ${deviceType} data:`, error);
    throw error;
  }
}

/**
 * Get user's wearable data
 * @param {string} userEmail User's email
 * @param {string} deviceType Type of device
 */
async function getUserWearableData(userEmail, deviceType) {
  try {
    const userWearablesRef = doc(db, 'userWearables', userEmail);
    const userWearablesDoc = await getDoc(userWearablesRef);
    
    if (!userWearablesDoc.exists()) {
      return null;
    }
    
    const data = userWearablesDoc.data();
    return data[`${deviceType}Data`] || null;
  } catch (error) {
    console.error(`❌ Error getting ${deviceType} data:`, error);
    return null;
  }
}

/**
 * Apple HealthKit integration (placeholder for web-based approach)
 * Note: Full HealthKit integration requires iOS app development
 * This is a web-based alternative using Health app export
 */
async function processAppleHealthData(userEmail, healthData) {
  try {
    // Process exported Apple Health data
    // This would typically come from a CSV export or similar
    const processedData = {
      date: new Date().toISOString().slice(0, 10),
      source: 'apple_health',
      data: healthData,
      lastSync: new Date().toISOString()
    };

    // Store the processed data
    await storeWearableData(userEmail, 'apple', processedData);
    
    return processedData;
  } catch (error) {
    console.error('❌ Error processing Apple Health data:', error);
    throw error;
  }
}

module.exports = {
  getFitbitRedirectUri,
  getAppleHealthKitRedirectUri,
  exchangeFitbitCodeForToken,
  getFitbitData,
  getUserWearableData,
  processAppleHealthData,
  storeUserWearableTokens,
  getUserWearableTokens
};
