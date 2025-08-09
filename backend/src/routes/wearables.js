const express = require('express');
const wearableService = require('../services/wearableService');

const router = express.Router();

// This is a placeholder for your Fitbit App credentials.
// You need to get these from the Fitbit Developer Portal.
const FITBIT_CLIENT_ID = process.env.FITBIT_CLIENT_ID || 'YOUR_FITBIT_CLIENT_ID';
const FITBIT_CLIENT_SECRET = process.env.FITBIT_CLIENT_SECRET || 'YOUR_FITBIT_CLIENT_SECRET';

// Route to start the Fitbit authorization process
// This will redirect the user to Fitbit's login and permission screen.
router.get('/fitbit/auth', (req, res) => {
  const scopes = 'activity heartrate sleep'; // Define the data scopes you want to access
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
    // Exchange the authorization code for an access token
    await wearableService.exchangeFitbitCodeForToken(code);
    // Redirect user back to the device sync page with a success message
    res.redirect('http://localhost:3000/devices?success=fitbit'); // Assuming your frontend is on port 3000 and page is /devices
  } catch (error) {
    console.error('Fitbit callback error:', error);
    res.status(500).send('Failed to authenticate with Fitbit.');
  }
});

// Route to fetch data from Fitbit API
router.get('/fitbit/data', async (req, res) => {
  try {
    const data = await wearableService.getFitbitData();
    res.json(data);
  } catch (error) {
    console.error('Fitbit data fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch data from Fitbit.' });
  }
});

module.exports = router;
