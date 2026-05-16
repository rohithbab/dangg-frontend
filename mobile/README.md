# Dangg — Mobile App

React Native CLI (bare workflow) mobile app for Dangg, a text-only paid
chat marketplace.

> See `../CLAUDE.md`, `../PROJECT_STRUCTURE.md`, and `../API_REFERENCE.md`
> for product context, folder layout, and the API surface.
> Screen designs: `../mobile_app_screen_spec.md`.

## Prerequisites

- **Node.js** ≥ 18 (LTS recommended)
- **Watchman** (macOS) — `brew install watchman`
- **JDK 17** (Eclipse Temurin or equivalent)
- **Android Studio** with Android SDK 35 + NDK 27 + Build-Tools 35.0.0
- **Xcode 15+** (macOS only, for iOS — deployment target 15.1 minimum)
- **CocoaPods** (macOS) — `gem install cocoapods` or `brew install cocoapods`

Set `ANDROID_HOME` / `ANDROID_SDK_ROOT` to your Android SDK path and make
sure `platform-tools` is on `PATH`.

## Setup

```bash
cd mobile
npm install
cp .env.example .env            # then fill in your Supabase URL/anon key
cd ios && pod install && cd ..  # macOS only — installs CocoaPods
```

## Run

```bash
# Start the Metro bundler (in one terminal)
npm start

# Build + install on connected device / emulator
npm run android
npm run ios          # macOS only
```

The first Android build takes ~5-10 minutes; subsequent builds are
incremental.

## Environment variables

`react-native-config` reads `mobile/.env` at native build time and exposes
typed values via `src/core/config/env.ts`. Copy `.env.example` for the
full list.

The two flags that matter most for theme walkthroughs:

- `DEV_MODE=true` — bypass real OTP / Supabase calls (foundation only —
  feature screens will honour this once they exist).
- `ENABLE_FIREBASE=false` (default) — skip Firebase init so the app boots
  without `google-services.json`. Set to `true` only after dropping in
  your Firebase config files.

## Quality gates

```bash
npm run typecheck        # tsc --noEmit
npm run lint             # eslint . --max-warnings 0
npm run format:check     # prettier --check .
npm run verify           # all three in sequence
```

All three must pass on every PR.

## Folder map

- `src/theme/` — design tokens + composed light theme.
- `src/core/` — cross-cutting infrastructure (network, storage, services,
  utils, hooks, components). Never feature-specific.
- `src/navigation/` — typed React Navigation stacks + tabs.
- `src/store/` — global Zustand stores (session, connectivity, user).
- `src/features/<name>/{api,hooks,screens,components,types,schemas}/`
  — per-feature layered architecture.
- `src/assets/` — fonts, icons, images (drop PNGs here).
- `src/types/` — global domain + API types.

## Performance ground rules (baked into the foundation)

- **FlashList** for any list >10 items. Never `ScrollView` + `.map()`.
- **FastImage** for every remote image — never `<Image source={{ uri }}>`.
- **Pagination is mandatory** — `usePagination()` + `limit`/`offset` on
  every list endpoint.
- **Zustand selectors only** — `useSessionStore(s => s.role)`, never
  `useSessionStore()` without a selector.
- **`useRealtimeChannel`** for Supabase Realtime — auto-disposes on
  unmount, no leaks.
- **`useDebounce`** for search inputs (default 350 ms).
- **`retryWithBackoff`** only for idempotent ops — never wrap a payment /
  OTP-send / chat-request-create.
- **Hermes** is on by default; **new architecture** is also on.
- **MMKV** for non-sensitive prefs (10× faster than AsyncStorage); **Keychain**
  for tokens / FCM token / biometric flags.

## Troubleshooting

- **Gradle complains about NDK version** — install NDK 27 via Android
  Studio SDK Manager.
- **Metro errors after pulling deps** — `rm -rf node_modules ios/Pods` and
  reinstall.
- **`Unable to resolve module @theme/...`** — make sure `babel.config.js`
  has the `module-resolver` plugin and `tsconfig.json` has matching `paths`;
  restart Metro with `npm start -- --reset-cache`.
- **App crashes at boot mentioning Firebase** — set `ENABLE_FIREBASE=false`
  in `.env` (default) until `google-services.json` is in place.
