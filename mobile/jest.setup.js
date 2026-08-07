/**
 * Native-module stubs for the Jest environment.
 *
 * These packages reach for JSI bindings or native modules that do not exist
 * under node, so anything importing them transitively fails to load without a
 * stub here.
 */
/* eslint-env jest */

// Ships its own Jest setup that registers the native gesture module.
// eslint-disable-next-line @typescript-eslint/no-require-imports
require('react-native-gesture-handler/jestSetup');

jest.mock('react-native-config', () => ({
  __esModule: true,
  default: {
    SUPABASE_URL: 'http://localhost:54321',
    SUPABASE_ANON_KEY: 'test-anon-key',
    APP_ENV: 'test',
    DEV_MODE: 'false',
  },
}));

jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn().mockImplementation(() => {
    const store = new Map();
    return {
      set: (k, v) => store.set(k, v),
      getString: k => store.get(k),
      getBoolean: k => store.get(k),
      getNumber: k => store.get(k),
      delete: k => store.delete(k),
      clearAll: () => store.clear(),
    };
  }),
}));

jest.mock('react-native-keychain', () => ({
  setGenericPassword: jest.fn().mockResolvedValue(true),
  getGenericPassword: jest.fn().mockResolvedValue(false),
  resetGenericPassword: jest.fn().mockResolvedValue(true),
}));

// `require` is unavoidable here: jest.mock factories are hoisted above the
// import section, so an ESM import of the mock would not be initialised yet.
// eslint-disable-next-line @typescript-eslint/no-require-imports
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

// Ships an official mock for the native connectivity module.
jest.mock('@react-native-community/netinfo', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('@react-native-community/netinfo/jest/netinfo-mock.js'),
);

// eslint-disable-next-line @typescript-eslint/no-require-imports
jest.mock('react-native-permissions', () => require('react-native-permissions/mock'));

jest.mock('react-native-vision-camera', () => ({
  Camera: 'Camera',
  useCameraDevice: () => undefined,
  useCameraPermission: () => ({ hasPermission: true, requestPermission: jest.fn() }),
}));

jest.mock('react-native-razorpay', () => ({
  __esModule: true,
  default: { open: jest.fn().mockResolvedValue({ razorpay_payment_id: 'test' }) },
}));

// Firebase reaches for the RNFBAppModule native module at import time.
jest.mock('@react-native-firebase/messaging', () => {
  const messaging = () => ({
    hasPermission: jest.fn().mockResolvedValue(1),
    requestPermission: jest.fn().mockResolvedValue(1),
    getToken: jest.fn().mockResolvedValue('test-fcm-token'),
    onMessage: jest.fn().mockReturnValue(jest.fn()),
    onTokenRefresh: jest.fn().mockReturnValue(jest.fn()),
    onNotificationOpenedApp: jest.fn().mockReturnValue(jest.fn()),
    getInitialNotification: jest.fn().mockResolvedValue(null),
    setBackgroundMessageHandler: jest.fn(),
  });
  messaging.AuthorizationStatus = { AUTHORIZED: 1, PROVISIONAL: 2, DENIED: 0 };
  return { __esModule: true, default: messaging };
});
