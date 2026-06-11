import { Platform } from 'react-native';
import Config from 'react-native-config';

/**
 * The Android emulator cannot reach the host machine's `localhost` — that
 * resolves to the emulator itself. `10.0.2.2` is the emulator's alias for the
 * host loopback. iOS Simulator shares the host's localhost, so it's untouched.
 * Real (non-local) URLs pass through unchanged, so this is a no-op in prod.
 * NOTE: a PHYSICAL Android device needs the Mac's LAN IP instead — set
 * SUPABASE_URL to that directly for on-device testing.
 */
function resolveLocalhostForAndroid(raw: string): string {
  if (Platform.OS !== 'android') {
    return raw;
  }
  return raw.replace('localhost', '10.0.2.2').replace('127.0.0.1', '10.0.2.2');
}

/**
 * Typed accessor over `react-native-config`.
 *
 * Values come from the `.env` file (or platform overrides) at native build
 * time — never read raw `process.env` from JS, and never read `Config.*`
 * directly outside this module.
 *
 * Set values via `mobile/.env` (see `.env.example`). Toggle dev shortcuts
 * with `DEV_MODE=true`. Firebase remains opt-in via `ENABLE_FIREBASE=true`
 * to avoid crashing the boot when `google-services.json` is not present.
 */
export const Env = {
  appEnv: (Config.APP_ENV ?? 'development') as 'development' | 'staging' | 'production',
  /** True when running with dev shortcuts (mocked OTPs, deterministic verification status). */
  devMode: Config.DEV_MODE === 'true',
  /** True when Firebase Messaging should be initialised at startup. */
  enableFirebase: Config.ENABLE_FIREBASE === 'true',

  supabaseUrl: resolveLocalhostForAndroid(Config.SUPABASE_URL ?? ''),
  supabaseAnonKey: Config.SUPABASE_ANON_KEY ?? '',

  cloudinaryCloudName: Config.CLOUDINARY_CLOUD_NAME ?? '',
  cloudinaryUploadPreset: Config.CLOUDINARY_UPLOAD_PRESET ?? '',

  razorpayKeyId: Config.RAZORPAY_KEY_ID ?? '',

  fcmProjectId: Config.FCM_PROJECT_ID ?? '',
} as const;

/** Returns the names of required env keys that are missing. Used by `App.tsx` boot. */
export function missingRequiredEnv(): string[] {
  const missing: string[] = [];
  if (!Env.supabaseUrl) {
    missing.push('SUPABASE_URL');
  }
  if (!Env.supabaseAnonKey) {
    missing.push('SUPABASE_ANON_KEY');
  }
  return missing;
}

export const isProduction = (): boolean => Env.appEnv === 'production';
export const isStaging = (): boolean => Env.appEnv === 'staging';
export const isDevelopment = (): boolean => Env.appEnv === 'development';

/**
 * Master kill-switch for in-app MOCK DATA.
 *
 * When false (the default now), every feature API and auth call hits the real
 * backend — no canned data — even while `DEV_MODE=true` keeps dev conveniences
 * (dev FABs, simulator permission/camera bypass) enabled. Flip to true only to
 * run the app fully offline against the bundled mock fixtures.
 *
 * Typed `boolean` (not the literal `false`) on purpose so call sites like
 * `if (USE_MOCK_DATA)` are not narrowed to dead code by the compiler.
 */
export const USE_MOCK_DATA: boolean = false;
