import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Production Android build loads the deployed web app (updates without a new Play release).
 * Override for local testing: CAPACITOR_SERVER_URL=http://192.168.x.x:3000 npm run android:sync
 */
const serverUrl =
  process.env.CAPACITOR_SERVER_URL ||
  'https://ai-doctor-agent-production.up.railway.app';

const config: CapacitorConfig = {
  appId: 'com.aidoctor.agent',
  appName: 'AI Doctor',
  webDir: 'dist',
  server: {
    url: serverUrl,
    cleartext: serverUrl.startsWith('http://'),
    androidScheme: 'https',
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
