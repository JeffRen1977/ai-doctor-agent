const axios = require('axios');
const { userWearablesRepo } = require('../repositories');

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
    const existing = await userWearablesRepo.getUserWearables(userEmail);
    const now = new Date().toISOString();
    await userWearablesRepo.setUserWearables(userEmail, {
      ...(existing || { userEmail }),
      [`${deviceType}Tokens`]: tokenData,
      [`${deviceType}Connected`]: true,
      [`${deviceType}LastSync`]: now,
      ...(existing ? {} : { createdAt: now }),
      updatedAt: now
    });
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
    const data = await userWearablesRepo.getUserWearables(userEmail);
    return data?.[`${deviceType}Tokens`] || null;
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
    const existing = await userWearablesRepo.getUserWearables(userEmail);
    const now = new Date().toISOString();
    await userWearablesRepo.setUserWearables(userEmail, {
      ...(existing || { userEmail }),
      [`${deviceType}Data`]: data,
      [`${deviceType}LastSync`]: now,
      ...(existing ? {} : { createdAt: now }),
      updatedAt: now
    });
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
    const data = await userWearablesRepo.getUserWearables(userEmail);
    return data?.[`${deviceType}Data`] || null;
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

/**
 * Generate mock wearable data for demonstration purposes
 * This simulates real device data when no actual devices are connected
 */
function generateMockWearableData(deviceType, userEmail) {
  const today = new Date();
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  
  if (deviceType === 'fitbit') {
    return generateMockFitbitData(today, yesterday);
  } else if (deviceType === 'apple') {
    return generateMockAppleHealthData(today, yesterday);
  } else {
    return generateMockGenericData(today, yesterday);
  }
}

/**
 * Generate mock Fitbit data
 */
function generateMockFitbitData(today, yesterday) {
  const baseSteps = Math.floor(Math.random() * 3000) + 5000; // 5000-8000 steps
  const baseCalories = Math.floor(Math.random() * 500) + 1800; // 1800-2300 calories
  
  return {
    date: today.toISOString().slice(0, 10),
    source: 'fitbit',
    lastSync: new Date().toISOString(),
    activity: {
      summary: {
        steps: baseSteps,
        caloriesOut: baseCalories,
        activeMinutes: Math.floor(Math.random() * 60) + 30,
        distance: (baseSteps * 0.0008).toFixed(2), // Approximate distance
        floors: Math.floor(Math.random() * 10) + 2,
        elevation: Math.floor(Math.random() * 100) + 50
      },
      goals: {
        steps: 10000,
        caloriesOut: 2500,
        activeMinutes: 60,
        distance: 8.0,
        floors: 10
      }
    },
    heartRate: {
      activities_heart: [{
        dateTime: today.toISOString().slice(0, 10),
        value: {
          customHeartRateZones: [],
          heartRateZones: [
            { name: 'Out of Range', min: 0, max: 90, minutes: Math.floor(Math.random() * 60) + 30 },
            { name: 'Fat Burn', min: 90, max: 120, minutes: Math.floor(Math.random() * 120) + 60 },
            { name: 'Cardio', min: 120, max: 150, minutes: Math.floor(Math.random() * 60) + 30 },
            { name: 'Peak', min: 150, max: 220, minutes: Math.floor(Math.random() * 30) + 10 }
          ]
        }
      }],
      activities_heart_intraday: {
        dataset: generateMockHeartRateData(today)
      }
    },
    sleep: {
      sleep: [{
        dateOfSleep: today.toISOString().slice(0, 10),
        duration: Math.floor(Math.random() * 120) + 360, // 6-8 hours in minutes
        efficiency: Math.floor(Math.random() * 20) + 80, // 80-100%
        endTime: new Date(today.getTime() - Math.floor(Math.random() * 8) * 60 * 60 * 1000).toISOString(),
        startTime: new Date(today.getTime() - (Math.floor(Math.random() * 8) + 6) * 60 * 60 * 1000).toISOString(),
        levels: {
          summary: {
            deep: Math.floor(Math.random() * 60) + 60, // 1-2 hours
            light: Math.floor(Math.random() * 120) + 180, // 3-5 hours
            rem: Math.floor(Math.random() * 60) + 60, // 1-2 hours
            wake: Math.floor(Math.random() * 30) + 15 // 15-45 minutes
          }
        }
      }]
    },
    body: {
      weight: [{
        date: today.toISOString().slice(0, 10),
        value: (Math.random() * 20 + 60).toFixed(1), // 60-80 kg
        time: today.toISOString()
      }]
    }
  };
}

/**
 * Generate mock Apple Health data
 */
function generateMockAppleHealthData(today, yesterday) {
  const baseSteps = Math.floor(Math.random() * 3000) + 5000;
  const baseCalories = Math.floor(Math.random() * 500) + 1800;
  
  return {
    date: today.toISOString().slice(0, 10),
    source: 'apple_health',
    lastSync: new Date().toISOString(),
    activity: {
      steps: baseSteps,
      calories: baseCalories,
      distance: (baseSteps * 0.0008).toFixed(2),
      activeEnergy: Math.floor(Math.random() * 300) + 400,
      exerciseMinutes: Math.floor(Math.random() * 60) + 30,
      standHours: Math.floor(Math.random() * 8) + 8
    },
    heartRate: {
      current: Math.floor(Math.random() * 40) + 60, // 60-100 bpm
      resting: Math.floor(Math.random() * 20) + 50, // 50-70 bpm
      average: Math.floor(Math.random() * 30) + 65, // 65-95 bpm
      max: Math.floor(Math.random() * 40) + 140, // 140-180 bpm
      min: Math.floor(Math.random() * 20) + 45 // 45-65 bpm
    },
    sleep: {
      total: Math.floor(Math.random() * 120) + 360, // 6-8 hours
      deep: Math.floor(Math.random() * 60) + 60,
      light: Math.floor(Math.random() * 120) + 180,
      rem: Math.floor(Math.random() * 60) + 60,
      core: Math.floor(Math.random() * 60) + 120,
      efficiency: Math.floor(Math.random() * 20) + 80
    },
    body: {
      weight: (Math.random() * 20 + 60).toFixed(1),
      bodyFat: (Math.random() * 10 + 15).toFixed(1),
      bmi: (Math.random() * 5 + 22).toFixed(1),
      height: (Math.random() * 20 + 165).toFixed(1)
    },
    nutrition: {
      water: Math.floor(Math.random() * 1000) + 1500, // 1.5-2.5L
      fiber: Math.floor(Math.random() * 20) + 15, // 15-35g
      protein: Math.floor(Math.random() * 50) + 80, // 80-130g
      carbs: Math.floor(Math.random() * 100) + 200, // 200-300g
      fat: Math.floor(Math.random() * 30) + 50 // 50-80g
    }
  };
}

/**
 * Generate mock generic wearable data
 */
function generateMockGenericData(today, yesterday) {
  return {
    date: today.toISOString().slice(0, 10),
    source: 'generic_device',
    lastSync: new Date().toISOString(),
    activity: {
      steps: Math.floor(Math.random() * 5000) + 5000,
      calories: Math.floor(Math.random() * 800) + 1500,
      distance: (Math.random() * 5 + 3).toFixed(2),
      activeMinutes: Math.floor(Math.random() * 90) + 30
    },
    heartRate: {
      current: Math.floor(Math.random() * 50) + 60,
      average: Math.floor(Math.random() * 40) + 65,
      max: Math.floor(Math.random() * 50) + 140,
      min: Math.floor(Math.random() * 30) + 45
    },
    sleep: {
      total: Math.floor(Math.random() * 120) + 360,
      quality: Math.floor(Math.random() * 30) + 70
    }
  };
}

/**
 * Generate mock heart rate data points throughout the day
 */
function generateMockHeartRateData(date) {
  const data = [];
  const baseHeartRate = 65;
  
  // Generate 24 hours of heart rate data
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) { // Every 15 minutes
      const time = new Date(date);
      time.setHours(hour, minute, 0, 0);
      
      // Simulate different heart rates throughout the day
      let heartRate;
      if (hour >= 6 && hour <= 8) {
        // Morning - slightly elevated
        heartRate = baseHeartRate + Math.floor(Math.random() * 20) + 10;
      } else if (hour >= 12 && hour <= 14) {
        // Lunch time - moderate
        heartRate = baseHeartRate + Math.floor(Math.random() * 15) + 5;
      } else if (hour >= 18 && hour <= 20) {
        // Evening exercise - higher
        heartRate = baseHeartRate + Math.floor(Math.random() * 30) + 20;
      } else if (hour >= 22 || hour <= 5) {
        // Night - lower
        heartRate = baseHeartRate + Math.floor(Math.random() * 10) - 5;
      } else {
        // Normal hours
        heartRate = baseHeartRate + Math.floor(Math.random() * 15);
      }
      
      data.push({
        time: time.toISOString().slice(11, 16), // HH:MM format
        value: Math.max(40, Math.min(180, heartRate)) // Clamp between 40-180
      });
    }
  }
  
  return data;
}

/**
 * Get mock wearable data for a user
 * This function provides mock data when no real device is connected
 */
async function getMockWearableData(userEmail, deviceType = 'fitbit') {
  try {
    console.log(`📱 Generating mock ${deviceType} data for user:`, userEmail);
    
    const mockData = generateMockWearableData(deviceType, userEmail);
    
    // Store the mock data in Firebase for consistency
    await storeWearableData(userEmail, deviceType, mockData);
    
    console.log(`✅ Mock ${deviceType} data generated and stored for user:`, userEmail);
    return mockData;
    
  } catch (error) {
    console.error(`❌ Error generating mock ${deviceType} data:`, error);
    throw error;
  }
}

/**
 * Get comprehensive health summary from mock data
 */
async function getMockHealthSummary(userEmail) {
  try {
    console.log(`📊 Generating mock health summary for user:`, userEmail);
    
    const fitbitData = generateMockWearableData('fitbit', userEmail);
    const appleData = generateMockWearableData('apple', userEmail);
    
    const summary = {
      date: new Date().toISOString().slice(0, 10),
      lastSync: new Date().toISOString(),
      overview: {
        steps: Math.max(fitbitData.activity.summary.steps, appleData.activity.steps),
        calories: Math.max(fitbitData.activity.summary.caloriesOut, appleData.activity.calories),
        activeMinutes: Math.max(fitbitData.activity.summary.activeMinutes, appleData.activity.exerciseMinutes),
        sleepHours: (fitbitData.sleep.sleep[0].duration / 60).toFixed(1),
        heartRate: appleData.heartRate.current
      },
      trends: {
        weeklySteps: generateWeeklyTrend(7000, 12000),
        weeklyCalories: generateWeeklyTrend(1800, 2500),
        weeklySleep: generateWeeklyTrend(6, 8),
        weeklyHeartRate: generateWeeklyTrend(60, 100)
      },
      insights: generateHealthInsights(fitbitData, appleData),
      recommendations: generateHealthRecommendations(fitbitData, appleData)
    };
    
    console.log(`✅ Mock health summary generated for user:`, userEmail);
    return summary;
    
  } catch (error) {
    console.error(`❌ Error generating mock health summary:`, error);
    throw error;
  }
}

/**
 * Generate weekly trend data
 */
function generateWeeklyTrend(min, max) {
  const trends = [];
  for (let i = 0; i < 7; i++) {
    trends.push(Math.floor(Math.random() * (max - min)) + min);
  }
  return trends;
}

/**
 * Generate health insights based on mock data
 */
function generateHealthInsights(fitbitData, appleData) {
  const insights = [];
  
  // Steps analysis
  const steps = Math.max(fitbitData.activity.summary.steps, appleData.activity.steps);
  if (steps < 5000) {
    insights.push({
      type: 'warning',
      category: 'activity',
      title: 'Low Activity Level',
      message: 'Your daily steps are below the recommended 10,000 steps. Consider taking more walks throughout the day.',
      priority: 'medium'
    });
  } else if (steps > 12000) {
    insights.push({
      type: 'positive',
      category: 'activity',
      title: 'Excellent Activity Level',
      message: 'Great job! You\'ve exceeded the daily step goal. Keep up the good work!',
      priority: 'low'
    });
  }
  
  // Sleep analysis
  const sleepHours = fitbitData.sleep.sleep[0].duration / 60;
  if (sleepHours < 6) {
    insights.push({
      type: 'warning',
      category: 'sleep',
      title: 'Insufficient Sleep',
      message: 'You\'re getting less than the recommended 7-9 hours of sleep. Consider improving your sleep hygiene.',
      priority: 'high'
    });
  } else if (sleepHours > 9) {
    insights.push({
      type: 'info',
      category: 'sleep',
      title: 'Adequate Sleep',
      message: 'You\'re getting sufficient sleep. This is great for your overall health and recovery.',
      priority: 'low'
    });
  }
  
  // Heart rate analysis
  const heartRate = appleData.heartRate.current;
  if (heartRate > 100) {
    insights.push({
      type: 'warning',
      category: 'heart',
      title: 'Elevated Heart Rate',
      message: 'Your current heart rate is elevated. This could be due to stress, exercise, or other factors.',
      priority: 'medium'
    });
  }
  
  return insights;
}

/**
 * Generate health recommendations based on mock data
 */
function generateHealthRecommendations(fitbitData, appleData) {
  const recommendations = [];
  
  // Activity recommendations
  const steps = Math.max(fitbitData.activity.summary.steps, appleData.activity.steps);
  if (steps < 5000) {
    recommendations.push({
      category: 'activity',
      title: 'Increase Daily Steps',
      description: 'Try to reach at least 10,000 steps daily. Start with small goals like taking the stairs or walking during breaks.',
      difficulty: 'easy',
      estimatedTime: '30 minutes'
    });
  }
  
  // Sleep recommendations
  const sleepHours = fitbitData.sleep.sleep[0].duration / 60;
  if (sleepHours < 7) {
    recommendations.push({
      category: 'sleep',
      title: 'Improve Sleep Quality',
      description: 'Aim for 7-9 hours of sleep. Create a relaxing bedtime routine and avoid screens before bed.',
      difficulty: 'medium',
      estimatedTime: '1 hour'
    });
  }
  
  // Nutrition recommendations
  const water = appleData.nutrition.water;
  if (water < 2000) {
    recommendations.push({
      category: 'nutrition',
      title: 'Increase Water Intake',
      description: 'Drink at least 2 liters of water daily. Carry a water bottle and set reminders.',
      difficulty: 'easy',
      estimatedTime: 'Throughout the day'
    });
  }
  
  return recommendations;
}

module.exports = {
  getFitbitRedirectUri,
  getAppleHealthKitRedirectUri,
  exchangeFitbitCodeForToken,
  getFitbitData,
  getUserWearableData,
  processAppleHealthData,
  storeUserWearableTokens,
  getUserWearableTokens,
  // New mock data functions
  getMockWearableData,
  getMockHealthSummary,
  generateMockWearableData
};
