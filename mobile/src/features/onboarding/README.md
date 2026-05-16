# Onboarding

## Screens

- **AccountTypeScreen** (`/onboarding/account-type`) — Female vs Male.
- **MaleOnboardingCarousel** (`/onboarding/male`) — 3 slides shown after
  male signup completes.

## Architecture notes

- Persist chosen role to `prefsStorage.setString(PrefsKey.LastRole, ...)`.
- Carousel uses `react-native-reanimated`-based gestures on `FlatList` or
  a paged `ScrollView` for smooth swipes.
- "Skip" lives on slides 1 & 2; slide 3 shows the **Get Started** CTA.

## External integrations

None.
