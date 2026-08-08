module.exports = {
  preset: 'react-native',
  setupFiles: ['<rootDir>/jest.setup.js'],
  // The default preset only transforms react-native itself, so any ESM-shipping
  // native package (react-native-config, mmkv, keychain, …) throws
  // "Cannot use import statement outside a module" the moment a test imports a
  // module that touches one.
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community|-firebase)?|@react-navigation|react-native-.*|lucide-react-native)/)',
  ],
};
