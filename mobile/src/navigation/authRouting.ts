import { PrefsKey, prefsStorage } from '@core/storage/prefsStorage';

import { UserRole, VerificationStatus } from '@app-types/domain';

import { type AuthStackParamList } from './types';

/**
 * Resolves the auth stack's entry screen from restored session state.
 *
 * Kept free of screen imports so it stays a pure policy function — the
 * navigator itself pulls in the whole screen tree (camera, payments) and is
 * not loadable outside a device.
 *
 * Only evaluated once AuthNavigator mounts, which RootNavigator delays until
 * the session has hydrated — so the inputs here are real values, not the
 * pre-restore blanks that used to send restored users back to Login.
 */
export function resolveInitialRoute(
  authed: boolean,
  needsProfile: boolean,
  role: UserRole | null,
  verificationStatus: VerificationStatus,
): keyof AuthStackParamList {
  if (authed) {
    // Verified phone but signup never reached the Profile step — resume there
    // rather than making them log in again.
    if (needsProfile) {
      return 'SignupProfile';
    }
    if (role === UserRole.Female) {
      if (verificationStatus === VerificationStatus.Pending) {
        return 'FemaleSignupVerificationSubmitted';
      }
      if (
        verificationStatus === VerificationStatus.None ||
        verificationStatus === VerificationStatus.Rejected
      ) {
        return 'FemaleSignupVerificationInfo';
      }
    }
  }
  // Returning logged-out user goes straight to Login; only a genuinely
  // first-time install sees the account-type picker (screen spec 0.1).
  return prefsStorage.getBool(PrefsKey.OnboardingSeen) ? 'LoginPhone' : 'AccountType';
}
