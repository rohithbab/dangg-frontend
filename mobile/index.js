/**
 * @format
 */

// Polyfill `URL` and friends for the Supabase SDK before anything else loads.
import 'react-native-url-polyfill/auto';
// Gesture handler must be the very first import after the polyfill —
// `react-native-screens` and `react-native-gesture-handler` cooperate.
import 'react-native-gesture-handler';
// Global stylesheet interceptor for dynamic dark mode
import './src/theme/darkModeInterceptor';

import messaging from '@react-native-firebase/messaging';
import { AppRegistry } from 'react-native';
import Config from 'react-native-config';
import { enableScreens } from 'react-native-screens';

import App from './App';
import { name as appName } from './app.json';
import { logger } from './src/core/utils/logger';

// Required by `@react-navigation/native-stack` — opts the app into native
// container views, which is what makes navigation buttery on both platforms.
enableScreens(true);

// FCM background/quit message handler — MUST be registered at module scope.
// Guarded so the app still boots when Firebase isn't configured (no
// google-services.json, or ENABLE_FIREBASE !== 'true'). Notification messages
// are rendered by the OS; this only needs to exist (extend for data-only msgs).
if (Config.ENABLE_FIREBASE === 'true') {
  try {
    messaging().setBackgroundMessageHandler(async () => {});
  } catch (e) {
    logger.warn('FCM background handler not registered:', e?.message ?? e);
  }
}

AppRegistry.registerComponent(appName, () => App);
