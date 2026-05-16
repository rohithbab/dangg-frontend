module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
    project: false,
  },
  extends: [
    '@react-native',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
  ],
  plugins: ['@typescript-eslint', 'react-hooks', 'import', 'react-native'],
  settings: {
    'import/resolver': {
      typescript: { project: './tsconfig.json' },
      node: { extensions: ['.js', '.jsx', '.ts', '.tsx'] },
      'babel-module': {},
    },
    react: { version: 'detect' },
  },
  rules: {
    // `@typescript-eslint/func-call-spacing` was removed from
    // @typescript-eslint v8 (moved to @stylistic). The React Native preset
    // still references it — turn it off explicitly so lint runs cleanly.
    '@typescript-eslint/func-call-spacing': 'off',

    // `void promise` is the project convention for fire-and-forget calls
    // (intentional unawaited Promises). Don't warn on it.
    'no-void': ['error', { allowAsStatement: true }],

    // `tabBar` / `pageBuilder`-style render props in React Navigation are
    // expected to be inline functions returning JSX — `no-unstable-nested-components`
    // misfires here. Allow JSX-as-prop.
    'react/no-unstable-nested-components': ['warn', { allowAsProps: true }],

    // Style-only formatting warnings — Prettier owns formatting.
    curly: 'off',

    'no-console': 'error',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
    '@typescript-eslint/consistent-type-imports': [
      'error',
      { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
    ],
    'react-hooks/exhaustive-deps': 'error',
    'react-hooks/rules-of-hooks': 'error',
    'react-native/no-inline-styles': 'error',
    'react-native/no-unused-styles': 'error',
    'react-native/no-raw-text': 'off',
    'import/order': [
      'error',
      {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        pathGroups: [
          { pattern: '@theme/**', group: 'internal', position: 'before' },
          { pattern: '@core/**', group: 'internal', position: 'before' },
          { pattern: '@navigation/**', group: 'internal', position: 'before' },
          { pattern: '@store/**', group: 'internal', position: 'before' },
          { pattern: '@features/**', group: 'internal', position: 'before' },
          { pattern: '@assets/**', group: 'internal', position: 'before' },
          { pattern: '@app-types/**', group: 'internal', position: 'before' },
        ],
        pathGroupsExcludedImportTypes: ['builtin'],
        'newlines-between': 'always',
        alphabetize: { order: 'asc', caseInsensitive: true },
      },
    ],
    'import/no-unresolved': 'off',
    'import/no-named-as-default': 'off',
    'import/no-named-as-default-member': 'off',
    'import/namespace': 'off',
  },
  overrides: [
    {
      files: ['__tests__/**/*', '**/*.test.{ts,tsx}'],
      env: { jest: true },
      rules: {
        'no-console': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
    {
      files: ['*.js', 'babel.config.js', 'metro.config.js', 'jest.config.js'],
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
      },
    },
  ],
  ignorePatterns: ['node_modules/', 'android/', 'ios/', 'build/', 'coverage/', '*.config.js'],
};
