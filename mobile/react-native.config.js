/**
 * React Native CLI config. `assets` lists directories whose font/asset files
 * are linked into the native iOS/Android projects via `npx react-native-asset`.
 * Bundled fonts: Inter (Light/Regular/Medium/SemiBold/Bold) — see src/theme/typography.ts.
 */
module.exports = {
  project: {
    ios: {},
    android: {},
  },
  assets: ['./src/assets/fonts'],
};
