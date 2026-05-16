import Config from 'react-native-config';

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

  supabaseUrl: Config.SUPABASE_URL ?? '',
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
