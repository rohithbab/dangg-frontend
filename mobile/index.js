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

import { AppRegistry } from 'react-native';
import { enableScreens } from 'react-native-screens';

import App from './App';
import { name as appName } from './app.json';

// Required by `@react-navigation/native-stack` — opts the app into native
// container views, which is what makes navigation buttery on both platforms.
enableScreens(true);

AppRegistry.registerComponent(appName, () => App);
