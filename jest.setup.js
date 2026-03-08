/**
 * Load backend/.env before any tests run so adapter init (OPENAI_API_KEY, etc.) sees env.
 * Jest does not run backend/src/index.js, so dotenv is not loaded otherwise.
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });
