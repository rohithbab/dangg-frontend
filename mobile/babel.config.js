module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        alias: {
          '@theme': './src/theme',
          '@core': './src/core',
          '@navigation': './src/navigation',
          '@store': './src/store',
          '@features': './src/features',
          '@assets': './src/assets',
          '@app-types': './src/types',
        },
        extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
      },
    ],
    // react-native-reanimated/plugin must be LAST — see package docs.
    'react-native-reanimated/plugin',
  ],
};
