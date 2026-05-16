# Assets

Drop static assets here. RN uses `require(...)` for bundled images and
auto-picks the right density (`@2x`, `@3x`) at runtime.

## Required to-be-added when designs land

Screens currently render with `Icon`-based / shape placeholders. Once
PNGs are dropped in, the splash and onboarding screens will pick them up
via a small helper that falls back to the placeholder if the require fails.

### App logo

- `images/logo.png` (1x — 96 px square)
- `images/logo@2x.png` (192 px)
- `images/logo@3x.png` (288 px)
- `images/wordmark.png` — "Dangg" wordmark, transparent background

### Male onboarding carousel — 3 slides

- `images/onboarding_slide_1.png`
- `images/onboarding_slide_2.png`
- `images/onboarding_slide_3.png`

### Verification + success

- `images/verification_illustration.png` (~120 px square)
- `images/success_illustration.png` (~120 px)

### Default avatars

- `images/default_avatar_female.png`
- `images/default_avatar_male.png`

### Empty-state illustrations

- `images/empty_no_chats.png`
- `images/empty_no_transactions.png`
- `images/empty_no_favourites.png`
- `images/empty_offline.png`

### Custom icons

Anything not covered by a future icon library lives in `icons/`.

### Fonts

The app uses the system sans-serif for v1 (SF Pro on iOS, Roboto on
Android). To switch to Inter, drop the TTFs into `fonts/` and run
`npx react-native-asset` (configured in `react-native.config.js`).
