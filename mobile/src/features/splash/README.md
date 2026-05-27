# Splash

## Screens

- **SplashScreen** — initial route on cold start.

## Animation spec (to be implemented next prompt — Reanimated 3 worklets)

1. **Dangg logo** falls from offscreen-top to centre, with a small bounce
   (`Easing.out(Easing.back(1.5))`), ~700 ms.
2. Brief hold (~300 ms).
3. Logo **translates left** while the **"Dangg" wordmark** fades in and
   slides into place from behind the logo, ~700 ms.
4. After the animation finishes, route based on session + role:
   - First-time user → `AccountType`
   - Returning unauthenticated → `AccountType`
   - Returning authenticated female (verified) → `FemaleTabs`
   - Returning authenticated female (pending) → `FemaleLogin`
   - Returning authenticated female (none) → `FemaleSignupVerificationInfo`
   - Returning authenticated male → `MaleTabs`

Persist "intro seen" via `prefsStorage.setBool(PrefsKey.OnboardingSeen, true)`.

## DEV_MODE pill

When `Env.devMode` is true, render a small amber pill in the top-right
reading **DEV MODE** so it's obvious which build is running.

## External integrations

None.
