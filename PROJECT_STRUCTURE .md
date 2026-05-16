# Project Structure — Dangg Mobile (React Native CLI)

This document defines the folder structure for the React Native CLI mobile app. Keep this in sync with the actual repo.

## Top-Level Layout

```
dangg/
├── CLAUDE.md                          # Top-level project context (for Claude Code)
├── PROJECT_STRUCTURE.md               # This file
├── API_REFERENCE.md                   # API endpoint listing
├── mobile_app_screen_spec.md          # UI/UX screen-by-screen spec
├── .env.example                       # Template for environment variables
├── .gitignore
├── README.md                          # Quick-start setup instructions
└── mobile/                            # React Native CLI app
```

---

# React Native Mobile App (`mobile/`)

## Architecture Convention

Each feature follows a **layered pattern**:
- **`api/`** — Supabase calls, repository functions, error mapping (one file per logical group)
- **`hooks/`** — Custom hooks (Zustand selectors, react-query-style data hooks, business-logic hooks)
- **`screens/`** — Screen-level React components (one per screen)
- **`components/`** — Feature-local presentational components (not shared elsewhere)
- **`types.ts`** — Feature-specific TypeScript types
- **`schemas.ts`** — Zod schemas for form validation (where applicable)

Shared infrastructure goes in `core/` (used by 2+ features) or `theme/`, `navigation/`, `store/`.

## Folder Structure

```
mobile/
├── android/                           # Android native config (RN-generated)
├── ios/                               # iOS native config (RN-generated)
├── src/
│   ├── theme/
│   │   ├── colors.ts                  # AppColors token object
│   │   ├── typography.ts              # AppTypography token object
│   │   ├── spacing.ts                 # AppSpacing token object
│   │   ├── radii.ts                   # AppRadii token object
│   │   ├── shadows.ts                 # AppShadows token object
│   │   ├── theme.ts                   # Combines all + light/dark variants
│   │   ├── useTheme.ts                # Hook to access theme in components
│   │   └── index.ts                   # Re-exports
│   │
│   ├── core/                          # Cross-cutting infrastructure
│   │   ├── config/
│   │   │   ├── env.ts                 # Typed env access (via react-native-config)
│   │   │   └── constants.ts           # App constants (timeouts, limits, etc.)
│   │   ├── network/
│   │   │   ├── supabaseClient.ts      # Singleton init
│   │   │   ├── cloudinaryService.ts   # Signed upload helper
│   │   │   ├── apiException.ts        # Typed exception classes
│   │   │   ├── apiErrorMapper.ts      # Maps Supabase errors to typed exceptions
│   │   │   └── retryPolicy.ts         # Exponential backoff helper
│   │   ├── storage/
│   │   │   ├── secureStorage.ts       # react-native-keychain wrapper
│   │   │   └── prefsStorage.ts        # react-native-mmkv wrapper
│   │   ├── services/
│   │   │   ├── fcmService.ts          # Firebase Messaging setup + handlers
│   │   │   ├── permissionService.ts   # Typed permission requests
│   │   │   └── connectivityService.ts # NetInfo wrapper
│   │   ├── utils/
│   │   │   ├── validators.ts          # phoneIndian, password, otp, name, upiId, ifsc
│   │   │   ├── formatters.ts          # inr, timeAgo, maskedPhone, duration
│   │   │   ├── dateUtils.ts           # startOfDay, startOfWeek, isToday, etc.
│   │   │   ├── logger.ts              # Centralized logger (silent in production)
│   │   │   └── debouncer.ts           # Debouncer class
│   │   ├── hooks/
│   │   │   ├── useDebounce.ts         # Debounced value hook
│   │   │   ├── usePagination.ts       # Cursor / offset pagination state
│   │   │   ├── useConnectivity.ts     # Online/offline observer
│   │   │   ├── useSafeAreaStyles.ts   # Safe-area-aware style helpers
│   │   │   └── useKeyboardVisible.ts  # Keyboard state listener
│   │   └── components/                # SHARED components used across features
│   │       ├── PrimaryButton.tsx
│   │       ├── SecondaryButton.tsx
│   │       ├── TextButton.tsx
│   │       ├── TextField.tsx          # Validated text input with label/error
│   │       ├── OtpInput.tsx           # 6-box auto-advance OTP input
│   │       ├── Card.tsx
│   │       ├── StatusDot.tsx          # online/offline/available indicator
│   │       ├── Avatar.tsx             # Cached circular avatar with fallback
│   │       ├── EmptyState.tsx
│   │       ├── LoadingOverlay.tsx
│   │       ├── ErrorView.tsx
│   │       ├── AppBar.tsx             # Themed header
│   │       ├── BottomNav.tsx          # Role-aware bottom navigation tabs
│   │       ├── ConfirmationDialog.tsx
│   │       ├── BottomSheet.tsx        # Wrapper with handle + dim backdrop
│   │       └── PaginationLoader.tsx
│   │
│   ├── navigation/
│   │   ├── RootNavigator.tsx          # Top-level switcher (auth vs app)
│   │   ├── AuthNavigator.tsx          # Splash, onboarding, signup, login stack
│   │   ├── FemaleTabNavigator.tsx     # Bottom tabs: Home | Earnings | Profile
│   │   ├── MaleTabNavigator.tsx       # Bottom tabs: Wallet | Home | Profile
│   │   ├── ChatNavigator.tsx          # Chat request flow + future Phase 2 chat
│   │   ├── types.ts                   # Route param types (RootStackParamList, etc.)
│   │   ├── linking.ts                 # Deep linking config
│   │   └── PlaceholderScreen.tsx      # "Coming soon" generic screen
│   │
│   ├── store/                         # Global Zustand stores
│   │   ├── sessionStore.ts            # Auth state (session, user role, verification status)
│   │   ├── connectivityStore.ts       # Online/offline
│   │   ├── userStore.ts               # Current user profile
│   │   └── index.ts                   # Re-exports
│   │
│   ├── features/
│   │   ├── splash/
│   │   │   ├── screens/
│   │   │   │   └── SplashScreen.tsx
│   │   │   ├── components/
│   │   │   │   ├── LogoAnimation.tsx
│   │   │   │   └── DevModePill.tsx
│   │   │   └── README.md
│   │   │
│   │   ├── onboarding/
│   │   │   ├── screens/
│   │   │   │   ├── AccountTypeScreen.tsx
│   │   │   │   └── MaleOnboardingCarousel.tsx
│   │   │   ├── components/
│   │   │   │   ├── AccountTypeCard.tsx
│   │   │   │   └── OnboardingSlide.tsx
│   │   │   └── README.md
│   │   │
│   │   ├── auth/
│   │   │   ├── api/
│   │   │   │   └── authApi.ts         # sendOtp, verifyOtp, etc.
│   │   │   ├── hooks/
│   │   │   │   ├── useAuthMutations.ts
│   │   │   │   └── useSignupDraft.ts
│   │   │   ├── store/
│   │   │   │   └── signupDraftStore.ts # Zustand store for in-progress signup
│   │   │   ├── schemas/
│   │   │   │   ├── signupSchema.ts    # Zod schemas
│   │   │   │   ├── loginSchema.ts
│   │   │   │   └── passwordSchema.ts
│   │   │   ├── screens/
│   │   │   │   ├── female/
│   │   │   │   │   ├── FemaleSignupBasicInfoScreen.tsx
│   │   │   │   │   ├── BankUpiDetailsScreen.tsx
│   │   │   │   │   ├── VerificationInfoScreen.tsx
│   │   │   │   │   ├── FaceCaptureScreen.tsx
│   │   │   │   │   └── VerificationSubmittedScreen.tsx
│   │   │   │   ├── male/
│   │   │   │   │   └── MaleSignupBasicInfoScreen.tsx
│   │   │   │   ├── login/
│   │   │   │   │   ├── FemaleLoginPhoneScreen.tsx
│   │   │   │   │   ├── FemaleLoginPasswordScreen.tsx
│   │   │   │   │   └── MaleLoginScreen.tsx
│   │   │   │   ├── forgotPassword/
│   │   │   │   │   ├── ForgotPasswordPhoneScreen.tsx
│   │   │   │   │   ├── ForgotPasswordOtpScreen.tsx
│   │   │   │   │   └── ForgotPasswordNewScreen.tsx
│   │   │   │   └── shared/
│   │   │   │       └── OtpVerificationScreen.tsx
│   │   │   ├── components/
│   │   │   │   ├── VerificationPendingModal.tsx
│   │   │   │   └── PasswordStrengthMeter.tsx
│   │   │   ├── types.ts
│   │   │   └── README.md
│   │   │
│   │   ├── femaleHome/
│   │   │   ├── api/
│   │   │   ├── hooks/
│   │   │   ├── screens/
│   │   │   │   └── FemaleHomeScreen.tsx
│   │   │   ├── components/
│   │   │   │   ├── AvailabilityToggleCard.tsx
│   │   │   │   ├── StatsGrid.tsx
│   │   │   │   └── RecentActivityList.tsx
│   │   │   └── README.md
│   │   │
│   │   ├── earnings/
│   │   │   ├── api/
│   │   │   ├── hooks/
│   │   │   ├── screens/
│   │   │   │   ├── EarningsDashboardScreen.tsx
│   │   │   │   └── BankUpiUpdateScreen.tsx
│   │   │   ├── components/
│   │   │   │   ├── PayoutStatusBanner.tsx
│   │   │   │   ├── PayoutConfirmationModal.tsx
│   │   │   │   └── ChatHistoryList.tsx
│   │   │   └── README.md
│   │   │
│   │   ├── maleHome/
│   │   │   ├── api/
│   │   │   ├── hooks/
│   │   │   ├── screens/
│   │   │   │   ├── MaleHomeScreen.tsx
│   │   │   │   └── FemaleProfilePreviewScreen.tsx
│   │   │   ├── components/
│   │   │   │   ├── FavouritesCarousel.tsx
│   │   │   │   ├── AvailableFemaleCard.tsx
│   │   │   │   └── FemaleSearchFilterSheet.tsx
│   │   │   └── README.md
│   │   │
│   │   ├── wallet/
│   │   │   ├── api/
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   │   └── razorpayService.ts
│   │   │   ├── screens/
│   │   │   │   ├── WalletScreen.tsx           # Slider tabs (Wallet | Transaction)
│   │   │   │   ├── PaymentProcessingScreen.tsx
│   │   │   │   ├── PaymentSuccessScreen.tsx
│   │   │   │   └── PaymentFailedScreen.tsx
│   │   │   ├── components/
│   │   │   │   ├── WalletView.tsx
│   │   │   │   ├── TransactionView.tsx
│   │   │   │   ├── CoinPackageCard.tsx
│   │   │   │   ├── CoinPurchaseConfirmModal.tsx
│   │   │   │   └── InsufficientCoinsModal.tsx
│   │   │   └── README.md
│   │   │
│   │   ├── profile/
│   │   │   ├── api/
│   │   │   ├── hooks/
│   │   │   ├── screens/
│   │   │   │   ├── FemaleProfileScreen.tsx
│   │   │   │   ├── MaleProfileScreen.tsx
│   │   │   │   ├── HelpSupportScreen.tsx
│   │   │   │   ├── ReportIssueScreen.tsx
│   │   │   │   ├── AboutAppScreen.tsx
│   │   │   │   ├── SettingsScreen.tsx
│   │   │   │   ├── ChangePasswordScreen.tsx
│   │   │   │   └── DeleteAccountFlowScreens.tsx
│   │   │   ├── components/
│   │   │   │   ├── EditProfilePicSheet.tsx
│   │   │   │   └── LogoutConfirmationModal.tsx
│   │   │   └── README.md
│   │   │
│   │   ├── chatRequests/              # Phase 1: request flow only
│   │   │   ├── api/
│   │   │   ├── hooks/
│   │   │   ├── screens/
│   │   │   │   ├── ChatRequestSentScreen.tsx
│   │   │   │   ├── ChatRequestAcceptedScreen.tsx  # Phase 2 bridge
│   │   │   │   ├── ChatRequestDeclinedScreen.tsx
│   │   │   │   ├── ChatRequestTimeoutScreen.tsx
│   │   │   │   ├── QueuePositionScreen.tsx
│   │   │   │   └── LikeDislikeRatingScreen.tsx
│   │   │   ├── components/
│   │   │   │   └── IncomingChatRequestModal.tsx  # Female receives
│   │   │   └── README.md
│   │   │
│   │   ├── chatSession/               # Phase 2 placeholder
│   │   │   └── PHASE_2_PLACEHOLDER.md
│   │   │
│   │   ├── notifications/
│   │   │   ├── api/
│   │   │   ├── hooks/
│   │   │   ├── screens/
│   │   │   │   └── NotificationsScreen.tsx
│   │   │   └── README.md
│   │   │
│   │   ├── blockReport/
│   │   │   ├── api/
│   │   │   ├── components/
│   │   │   │   └── BlockReportBottomSheet.tsx
│   │   │   └── README.md
│   │   │
│   │   └── common/                    # App-wide infrastructure screens
│   │       ├── OfflineOverlay.tsx
│   │       ├── UpdateRequiredScreen.tsx
│   │       ├── MaintenanceScreen.tsx
│   │       ├── AccountSuspendedScreen.tsx
│   │       ├── SessionExpiredModal.tsx
│   │       ├── GenericErrorScreen.tsx
│   │       └── PlaceholderScreen.tsx  # "Coming soon" routes target
│   │
│   ├── assets/
│   │   ├── images/                    # PNGs, with .gitkeep for now
│   │   ├── icons/                     # Custom icons
│   │   └── fonts/                     # Inter or SF Pro
│   │
│   └── types/                         # Global TS types
│       ├── api.ts                     # Shared API response types
│       ├── domain.ts                  # Core domain types (User, FemaleProfile, etc.)
│       └── index.ts
│
├── __tests__/                         # Jest tests (folder skeleton only)
├── App.tsx                            # Root component
├── index.js                           # RN entry point (registers App)
├── babel.config.js
├── metro.config.js
├── tsconfig.json                      # TypeScript strict config
├── .eslintrc.js                       # ESLint strict config
├── .prettierrc.js                     # Prettier config
├── jest.config.js
├── package.json                       # Locked dependency versions
├── package-lock.json
├── .env.example
├── .gitignore
└── README.md
```

## Key Dependencies (`package.json`)

```json
{
  "dependencies": {
    "react": "18.3.1",
    "react-native": "0.76.5",

    "@react-navigation/native": "7.0.14",
    "@react-navigation/native-stack": "7.2.0",
    "@react-navigation/bottom-tabs": "7.2.0",
    "react-native-screens": "4.4.0",
    "react-native-safe-area-context": "5.1.0",
    "react-native-gesture-handler": "2.21.2",

    "zustand": "5.0.2",
    "react-hook-form": "7.54.2",
    "zod": "3.24.1",
    "@hookform/resolvers": "3.10.0",

    "react-native-reanimated": "3.16.6",
    "@shopify/flash-list": "1.7.3",

    "@supabase/supabase-js": "2.47.10",
    "react-native-url-polyfill": "2.0.0",

    "react-native-mmkv": "3.2.0",
    "react-native-keychain": "9.2.2",
    "react-native-config": "1.5.5",

    "react-native-fast-image": "8.6.3",
    "react-native-vision-camera": "4.6.4",
    "react-native-image-picker": "8.0.0",
    "react-native-permissions": "5.2.5",

    "@react-native-community/netinfo": "11.4.1",
    "@react-native-firebase/app": "21.7.0",
    "@react-native-firebase/messaging": "21.7.0",

    "react-native-razorpay": "2.3.0",

    "date-fns": "4.1.0"
  },
  "devDependencies": {
    "typescript": "5.7.2",
    "@types/react": "18.3.18",
    "@types/jest": "29.5.14",
    "@react-native/eslint-config": "0.76.5",
    "eslint": "8.57.1",
    "eslint-plugin-import": "2.31.0",
    "eslint-plugin-react-hooks": "5.1.0",
    "eslint-plugin-react-native": "5.0.0",
    "prettier": "3.4.2",
    "jest": "29.7.0",
    "@testing-library/react-native": "13.0.1",
    "babel-plugin-module-resolver": "5.0.2"
  }
}
```

> **Pin exact versions** (no `^` or `~`) for production stability. Versions above are reference points; verify latest stable when scaffolding and pin to those.

## Path Aliases (`tsconfig.json` + `babel.config.js`)

Use these aliases for clean imports — never use relative `../../../` paths:

```
@theme        →  src/theme
@core         →  src/core
@navigation   →  src/navigation
@store        →  src/store
@features     →  src/features
@assets       →  src/assets
@types        →  src/types
```

Example: `import { PrimaryButton } from '@core/components/PrimaryButton';`

## State Management Patterns

- **Global state (Zustand):** Auth session, current user, connectivity, app-wide toggles.
- **Server state:** Fetched via Supabase SDK directly inside custom hooks; cached via Zustand stores or local component state per feature.
- **Form state:** React Hook Form, per screen, schema-validated with Zod.
- **UI state:** Local `useState` for ephemeral UI concerns (modal open, toggle states).

> **Default to `autoDispose`-like behavior:** Zustand stores are global by nature, so use `subscribeWithSelector` middleware and ensure components subscribe only to the slice they need (via selector functions) to avoid unnecessary re-renders.

## Performance Patterns for 1K Concurrent Users

1. **All lists use `FlashList`** (from `@shopify/flash-list`). Never `ScrollView` + `.map()` for lists > ~10 items.
2. **All remote images use `FastImage`**. Never `<Image source={{ uri }}>`.
3. **Pagination is mandatory.** Every list-fetching API method accepts `limit` and `offset` (or cursor) with sane defaults.
4. **Memoize aggressively but deliberately.** `React.memo` on pure presentational components rendered in lists. `useMemo`/`useCallback` only where deps change rarely.
5. **Subscribe to Realtime channels per screen, unsubscribe on unmount.** Helper hook in `core/hooks/`.
6. **Hermes JS engine.** Enabled by default in RN 0.70+; verify in `android/app/build.gradle` and `ios/Podfile`.
7. **Native screens.** `react-native-screens` enabled at app root (`enableScreens(true)`).
8. **Debounce all search/filter inputs.** `useDebounce` hook from `core/hooks/`.
9. **No N+1 queries.** Supabase joins via `select=*,related_table(*)` syntax.
10. **Reanimated 3 worklets** for any animation (splash, transitions, list-item gestures).

## Linting & Type Checking

- `npx tsc --noEmit` must pass with zero errors.
- `npx eslint . --max-warnings 0` must pass.
- `npx prettier --check .` must pass.
- These run in CI pre-merge.

## Build Verification

- `npm install` runs clean.
- `cd ios && pod install` succeeds.
- `npx react-native run-android` boots successfully.
- `npx react-native run-ios` boots successfully (macOS).
- App lands on placeholder splash screen and routing skeleton works.

---

# Admin Dashboard (`admin-dashboard/`) — Separate repo

```
admin-dashboard/
├── src/
│   ├── pages/
│   │   ├── analytics.tsx
│   │   ├── revenue.tsx
│   │   ├── payout.tsx
│   │   ├── verification.tsx
│   │   ├── users.tsx
│   │   ├── chats.tsx
│   │   └── chat-transcript.tsx
│   ├── components/
│   ├── hooks/
│   ├── api/
│   └── types/
├── public/
└── package.json
```

Recommended stack: Next.js or Vite + React + shadcn/ui + Tanstack Query + Supabase JS client with admin JWT.

---

# Supabase Backend (`supabase/`) — Separate repo

See backend repo for migrations, edge functions, and RLS policies. Tables and endpoints are documented in `API_REFERENCE.md` of this repo.
