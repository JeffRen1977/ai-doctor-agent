const axios = require('axios');

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

function getFitbitRedirectUri() {
  return FITBIT_REDIRECT_URI;
}

/**
 * Exchanges a Fitbit authorization code for an access token.
 * @param {string} code The authorization code from Fitbit.
 */
async function exchangeFitbitCodeForToken(code) {
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

    // Store the access token
    fitbitAccessToken = response.data.access_token;
    console.log('Fitbit Access Token obtained successfully!');
    // In a real app, you would also get a refresh_token and user_id here.
    // You would save the access_token, refresh_token, and its expiry time to your database.

  } catch (error) {
    console.error('Error exchanging Fitbit code for token:', error.response ? error.response.data : error.message);
    throw new Error('Could not get access token from Fitbit.');
  }
}

/**
 * Fetches user's activity summary from the Fitbit API.
 */
async function getFitbitData() {
  if (!fitbitAccessToken) {
    throw new Error('Not authenticated with Fitbit.');
  }

  try {
    // Example: Get activity summary for today. The date is YYYY-MM-DD.
    const today = new Date().toISOString().slice(0, 10);
    const response = await axios.get(`https://api.fitbit.com/1/user/-/activities/date/${today}.json`, {
      headers: {
        'Authorization': `Bearer ${fitbitAccessToken}`,
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching data from Fitbit:', error.response ? error.response.data : error.message);
    // This could be due to an expired token. A real app would handle token refreshing.
    throw new Error('Could not fetch data from Fitbit.');
  }
}

module.exports = {
  getFitbitRedirectUri,
  exchangeFitbitCodeForToken,
  getFitbitData,
};
