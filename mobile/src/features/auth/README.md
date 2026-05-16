# Auth

## Screens

### Female signup (spec 1.1 → 1.6)

- FemaleSignupBasicInfoScreen
- FemaleSignupOtpScreen (shared with male signup + forgot password)
- BankUpiDetailsScreen
- VerificationInfoScreen
- FaceCaptureScreen
- VerificationSubmittedScreen

### Female login (spec 1.7, 1.8, 1.10)

- FemaleLoginPhoneScreen — calls verification-status RPC, branches:
  - `verified` → push FemaleLoginPasswordScreen
  - `pending` → show VerificationPendingModal (stays on phone)
  - `none` → redirect to VerificationInfoScreen
- FemaleLoginPasswordScreen
- VerificationPendingModal (in `components/`)

### Male signup (spec 2.1 → 2.3)

- MaleSignupBasicInfoScreen
- OtpVerificationScreen (shared)
- MaleOnboardingCarousel (lives in `onboarding/`)

### Male login (spec 2.4)

- MaleLoginScreen (single page: phone + password)

### Forgot password (spec 1.11 → 1.13, 2.5)

- ForgotPasswordPhoneScreen
- OtpVerificationScreen (shared, `intent=forgotPassword`)
- ForgotPasswordNewScreen

## Architecture notes

- DEV_MODE bypasses every real OTP/auth call inside `api/authApi.ts`.
  The spec is: `123456` is the only accepted OTP; female phones ending in
  `1`/`2`/`3` map to `verified`/`pending`/`none`.
- All OTP flows are powered by Supabase Auth (`signInWithOtp`, `verifyOtp`).
  MSG91 delivery is owned by the backend `send-sms-hook` Edge Function;
  the app only triggers Supabase Auth.
- Never auto-retry OTP send — wrap with `OTP_RESEND_COOLDOWN_S` cooldown
  inside the OTP screen.
- Female login is a 2-step phone-then-password flow gated by a
  `verification_status` check.
- Face capture pushes raw JPEG to Supabase Storage's private
  `verification-photos` bucket (NOT Cloudinary).
- After successful auth, Supabase persists the JWT into our Keychain
  adapter automatically.

## State

- Multi-step signup data lives in `store/signupDraftStore.ts` (Zustand,
  `subscribeWithSelector`). Cleared on completion or abandonment.
- Form validation uses Zod schemas in `schemas/`, plumbed via React Hook
  Form's `zodResolver`.

## External integrations

- MSG91 SMS (backend Edge Function — app only triggers Supabase Auth).
- Supabase Storage (verification photo upload, Mumbai region).
- Cloudinary (profile-pic upload, signed-params pattern).
