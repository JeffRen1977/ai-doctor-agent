const express = require('express');
const wearableService = require('../services/wearableService');
const { authenticateToken } = require('../middleware/auth');
const { requireConsent } = require('../middleware/requireConsent');
const { CONSENT_PURPOSES } = require('../models/consent');

const router = express.Router();

// This is a placeholder for your Fitbit App credentials.
// You need to get these from the Fitbit Developer Portal.
const FITBIT_CLIENT_ID = process.env.FITBIT_CLIENT_ID || 'YOUR_FITBIT_CLIENT_ID';
const FITBIT_CLIENT_SECRET = process.env.FITBIT_CLIENT_SECRET || 'YOUR_FITBIT_CLIENT_SECRET';

// Route to start the Fitbit authorization process
// This will redirect the user to Fitbit's login and permission screen.
router.get('/fitbit/auth', authenticateToken, (req, res) => {
  const scopes = 'activity heartrate sleep profile weight nutrition'; // Define the data scopes you want to access
  const redirectUrl = `https://www.fitbit.com/oauth2/authorize?response_type=code&client_id=${FITBIT_CLIENT_ID}&scope=${encodeURIComponent(scopes)}&redirect_uri=${wearableService.getFitbitRedirectUri()}`;
  res.redirect(redirectUrl);
});

// Route that Fitbit redirects back to after user authorization
router.get('/fitbit/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.status(400).send('Authorization code is missing.');
  }

  try {
    // For now, we'll redirect to a page where the user can complete the setup
    // In a real app, you'd want to handle this more securely
    res.redirect(`http://localhost:3000/devices?code=${code}&provider=fitbit`);
  } catch (error) {
    console.error('Fitbit callback error:', error);
    res.status(500).send('Failed to authenticate with Fitbit.');
  }
});

// Complete Fitbit authentication with user email
router.post('/fitbit/complete-auth', authenticateToken, async (req, res) => {
  try {
    const { code } = req.body;
    const userEmail = req.user.email;

    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    // Exchange the authorization code for an access token
    const tokenData = await wearableService.exchangeFitbitCodeForToken(code, userEmail);
    
    res.json({
      success: true,
      message: 'Fitbit connected successfully',
      data: {
        connected: true,
        lastSync: new Date().toISOString(),
        userId: tokenData.user_id
      }
    });
  } catch (error) {
    console.error('Fitbit authentication error:', error);
    res.status(500).json({ error: 'Failed to authenticate with Fitbit' });
  }
});

// Route to fetch data from Fitbit API
router.get('/fitbit/data', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user.email;
    const data = await wearableService.getFitbitData(userEmail);
    
    res.json({
      success: true,
      message: 'Fitbit data fetched successfully',
      data: data
    });
  } catch (error) {
    console.error('Fitbit data fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch data from Fitbit' });
  }
});

// Get user's wearable device status
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user.email;
    
    // Get connection status for all device types
    const fitbitData = await wearableService.getUserWearableData(userEmail, 'fitbit');
    const appleData = await wearableService.getUserWearableData(userEmail, 'apple');
    
    const status = {
      fitbit: {
        connected: !!fitbitData,
        lastSync: fitbitData?.lastSync || null,
        dataAvailable: !!fitbitData
      },
      apple: {
        connected: !!appleData,
        lastSync: appleData?.lastSync || null,
        dataAvailable: !!appleData
      }
    };
    
    res.json({
      success: true,
      message: 'Device status retrieved successfully',
      data: status
    });
  } catch (error) {
    console.error('Error getting device status:', error);
    res.status(500).json({ error: 'Failed to get device status' });
  }
});

// Generate mock data for demonstration
router.post('/mock/generate', authenticateToken, requireConsent(CONSENT_PURPOSES.HEALTH_STORAGE), async (req, res) => {
  try {
    const userEmail = req.user.email;
    const { deviceType = 'fitbit' } = req.body;
    
    console.log(`🔄 Generating mock ${deviceType} data for user:`, userEmail);
    
    const mockData = await wearableService.getMockWearableData(userEmail, deviceType);
    
    res.json({
      success: true,
      message: `Mock ${deviceType} data generated successfully`,
      data: mockData
    });
  } catch (error) {
    console.error('Error generating mock data:', error);
    res.status(500).json({ error: 'Failed to generate mock data' });
  }
});

// Get comprehensive mock health summary
router.get('/mock/summary', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user.email;
    
    console.log(`📊 Generating mock health summary for user:`, userEmail);
    
    const mockSummary = await wearableService.getMockHealthSummary(userEmail);
    
    res.json({
      success: true,
      message: 'Mock health summary generated successfully',
      data: mockSummary
    });
  } catch (error) {
    console.error('Error generating mock summary:', error);
    res.status(500).json({ error: 'Failed to generate mock summary' });
  }
});

// Sync data from all connected devices (with mock fallback)
router.post('/sync', authenticateToken, requireConsent(CONSENT_PURPOSES.HEALTH_STORAGE), async (req, res) => {
  try {
    const userEmail = req.user.email;
    const { useMock = false } = req.body;
    const results = {};
    
    if (useMock) {
      // Generate mock data for demonstration
      console.log(`🔄 Generating mock data for user:`, userEmail);
      
      const fitbitMockData = await wearableService.getMockWearableData(userEmail, 'fitbit');
      const appleMockData = await wearableService.getMockWearableData(userEmail, 'apple');
      
      results.fitbit = { success: true, data: fitbitMockData, isMock: true };
      results.apple = { success: true, data: appleMockData, isMock: true };
      
      res.json({
        success: true,
        message: 'Mock device sync completed successfully',
        data: results
      });
      return;
    }
    
    // Try to sync real Fitbit data
    try {
      const fitbitData = await wearableService.getFitbitData(userEmail);
      results.fitbit = { success: true, data: fitbitData, isMock: false };
    } catch (fitbitError) {
      console.log('Fitbit sync failed, generating mock data instead');
      const fitbitMockData = await wearableService.getMockWearableData(userEmail, 'fitbit');
      results.fitbit = { success: true, data: fitbitMockData, isMock: true, fallback: true };
    }
    
    // Try to sync Apple Health data (if available)
    try {
      const appleData = await wearableService.getUserWearableData(userEmail, 'apple');
      if (appleData) {
        results.apple = { success: true, data: appleData, isMock: false };
      } else {
        // Generate mock Apple Health data
        const appleMockData = await wearableService.getMockWearableData(userEmail, 'apple');
        results.apple = { success: true, data: appleMockData, isMock: true, fallback: true };
      }
    } catch (appleError) {
      console.log('Apple Health sync failed, generating mock data instead');
      const appleMockData = await wearableService.getMockWearableData(userEmail, 'apple');
      results.apple = { success: true, data: appleMockData, isMock: true, fallback: true };
    }
    
    res.json({
      success: true,
      message: 'Device sync completed (with mock fallback)',
      data: results
    });
  } catch (error) {
    console.error('Device sync error:', error);
    res.status(500).json({ error: 'Failed to sync devices' });
  }
});

// Upload Apple Health data (CSV export)
router.post('/apple/upload', authenticateToken, requireConsent(CONSENT_PURPOSES.HEALTH_STORAGE), async (req, res) => {
  try {
    const userEmail = req.user.email;
    const { healthData } = req.body;
    
    if (!healthData) {
      return res.status(400).json({ error: 'Health data is required' });
    }
    
    const processedData = await wearableService.processAppleHealthData(userEmail, healthData);
    
    res.json({
      success: true,
      message: 'Apple Health data processed successfully',
      data: processedData
    });
  } catch (error) {
    console.error('Apple Health data processing error:', error);
    res.status(500).json({ error: 'Failed to process Apple Health data' });
  }
});

// Get user's wearable data summary (with mock data support)
router.get('/summary', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user.email;
    const { days = 7, useMock = false } = req.query;
    
    if (useMock) {
      // Generate mock summary
      const mockSummary = await wearableService.getMockHealthSummary(userEmail);
      
      res.json({
        success: true,
        message: 'Mock wearable data summary retrieved successfully',
        data: mockSummary,
        isMock: true
      });
      return;
    }
    
    // Get data from all connected devices
    const fitbitData = await wearableService.getUserWearableData(userEmail, 'fitbit');
    const appleData = await wearableService.getUserWearableData(userEmail, 'apple');
    
    // If no real data available, generate mock data
    if (!fitbitData && !appleData) {
      console.log('No real data available, generating mock summary');
      const mockSummary = await wearableService.getMockHealthSummary(userEmail);
      
      res.json({
        success: true,
        message: 'Mock wearable data summary retrieved successfully (no real data available)',
        data: mockSummary,
        isMock: true,
        fallback: true
      });
      return;
    }
    
    // Process and summarize the real data
    const summary = {
      totalSteps: 0,
      totalCalories: 0,
      averageHeartRate: 0,
      totalSleepHours: 0,
      lastSync: null,
      devices: [],
      isMock: false
    };
    
    if (fitbitData) {
      summary.devices.push('Fitbit');
      summary.lastSync = fitbitData.lastSync;
      
      // Extract summary data from Fitbit
      if (fitbitData.activity?.summary) {
        summary.totalSteps += fitbitData.activity.summary.steps || 0;
        summary.totalCalories += fitbitData.activity.summary.caloriesOut || 0;
      }
      
      if (fitbitData.heartRate?.activities_heart) {
        const heartRates = fitbitData.heartRate.activities_heart
          .filter(hr => hr.value?.restingHeartRate)
          .map(hr => hr.value.restingHeartRate);
        
        if (heartRates.length > 0) {
          summary.averageHeartRate = heartRates.reduce((a, b) => a + b, 0) / heartRates.length;
        }
      }
      
      if (fitbitData.sleep?.sleep?.[0]?.duration) {
        summary.totalSleepHours += fitbitData.sleep.sleep[0].duration / 60;
      }
    }
    
    if (appleData) {
      summary.devices.push('Apple Health');
      if (!summary.lastSync || new Date(appleData.lastSync) > new Date(summary.lastSync)) {
        summary.lastSync = appleData.lastSync;
      }
      
      // Extract summary data from Apple Health
      if (appleData.activity) {
        summary.totalSteps += appleData.activity.steps || 0;
        summary.totalCalories += appleData.activity.calories || 0;
      }
      
      if (appleData.heartRate) {
        summary.averageHeartRate = appleData.heartRate.current || 0;
      }
      
      if (appleData.sleep) {
        summary.totalSleepHours += appleData.sleep.total / 60;
      }
    }
    
    res.json({
      success: true,
      message: 'Wearable data summary retrieved successfully',
      data: summary
    });
  } catch (error) {
    console.error('Error getting wearable summary:', error);
    res.status(500).json({ error: 'Failed to get wearable summary' });
  }
});

module.exports = router;
