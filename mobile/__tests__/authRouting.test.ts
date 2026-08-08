/**
 * Cold-start routing decisions (alpha round 2, issues 1-3).
 *
 * These lock in the behaviour that regressed: a restored session must resume
 * where the user left off instead of falling back to Login.
 */
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

let mockOnboardingSeen = false;

jest.mock('@core/storage/prefsStorage', () => ({
  PrefsKey: { OnboardingSeen: 'ONBOARDING_SEEN' },
  prefsStorage: {
    getBool: (): boolean => mockOnboardingSeen,
    getString: (): string | null => null,
    setString: (): void => undefined,
    remove: (): void => undefined,
  },
}));

import { resolveInitialRoute } from '../src/navigation/authRouting';
import { UserRole, VerificationStatus } from '../src/types/domain';

describe('resolveInitialRoute', () => {
  beforeEach(() => {
    mockOnboardingSeen = false;
  });

  describe('logged out', () => {
    it('sends a first-time install to the account-type picker', () => {
      expect(resolveInitialRoute(false, false, null, VerificationStatus.None)).toBe('AccountType');
    });

    it('sends a returning logged-out user to Login', () => {
      mockOnboardingSeen = true;
      expect(resolveInitialRoute(false, false, null, VerificationStatus.None)).toBe('LoginPhone');
    });
  });

  describe('authenticated, signup incomplete (issue 1)', () => {
    it('resumes at the Profile step rather than Login', () => {
      mockOnboardingSeen = true;
      expect(resolveInitialRoute(true, true, null, VerificationStatus.None)).toBe('SignupProfile');
    });
  });

  describe('authenticated female (issue 2)', () => {
    it('restores the waiting-for-approval screen when verification is pending', () => {
      mockOnboardingSeen = true;
      expect(resolveInitialRoute(true, false, UserRole.Female, VerificationStatus.Pending)).toBe(
        'FemaleSignupVerificationSubmitted',
      );
    });

    it('routes to verification info when no photo has been submitted', () => {
      expect(resolveInitialRoute(true, false, UserRole.Female, VerificationStatus.None)).toBe(
        'FemaleSignupVerificationInfo',
      );
    });

    it('routes a rejected female back into the verification flow', () => {
      expect(resolveInitialRoute(true, false, UserRole.Female, VerificationStatus.Rejected)).toBe(
        'FemaleSignupVerificationInfo',
      );
    });
  });

  describe('users the auth stack should not hold', () => {
    // RootNavigator swaps these to their app stacks; the auth stack never
    // renders. The fallback only matters if that swap is ever delayed.
    it('does not strand a verified female on an auth screen', () => {
      mockOnboardingSeen = true;
      expect(resolveInitialRoute(true, false, UserRole.Female, VerificationStatus.Verified)).toBe(
        'LoginPhone',
      );
    });

    it('does not route a male into the female verification flow', () => {
      mockOnboardingSeen = true;
      expect(resolveInitialRoute(true, false, UserRole.Male, VerificationStatus.None)).toBe(
        'LoginPhone',
      );
    });
  });
});
