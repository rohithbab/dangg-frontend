/**
 * Legal / policy-consent repository.
 *
 * Consent is captured right after OTP verification (an auth session exists, but
 * public.users may not yet). We record acceptance of the whole policy *bundle*
 * at CURRENT_POLICY_VERSION, and can read back the latest accepted version to
 * decide whether a returning user must re-accept after a policy bump.
 *
 * DEV_MODE (USE_MOCK_DATA): no real session exists at the consent step, so we
 * no-op the write and report "already up to date" — matching the rest of the
 * auth layer's dev shortcuts.
 */
import { APP_VERSION } from '@core/config/constants';
import { USE_MOCK_DATA } from '@core/config/env';
import { mapSupabaseError } from '@core/network/apiErrorMapper';
import { getSupabaseClient } from '@core/network/supabaseClient';
import { logger } from '@core/utils/logger';

import { CURRENT_POLICY_VERSION } from '../content/policies.generated';

/**
 * Records the caller's acceptance of the current policy bundle. Idempotent on
 * (user, version) server-side. Best-effort in the sense that the screen should
 * still let the user proceed if the network hiccups — but we surface errors so
 * the caller can decide.
 */
export async function recordPolicyAcceptance(): Promise<void> {
  if (USE_MOCK_DATA) {
    logger.debug('legalApi.recordPolicyAcceptance (DEV) — skipping write');
    return;
  }
  const { error } = await getSupabaseClient().rpc('record_policy_acceptance', {
    p_policy_version: CURRENT_POLICY_VERSION,
    p_app_version: APP_VERSION,
  });
  if (error) {
    throw mapSupabaseError(error);
  }
  logger.info('legalApi.recordPolicyAcceptance stored', { version: CURRENT_POLICY_VERSION });
}

/**
 * Returns the caller's most-recently accepted policy version, or `null` if they
 * have never accepted. Used by the re-accept gate.
 */
export async function getAcceptedPolicyVersion(): Promise<string | null> {
  if (USE_MOCK_DATA) {
    return CURRENT_POLICY_VERSION;
  }
  const { data, error } = await getSupabaseClient().rpc('get_policy_acceptance');
  if (error) {
    throw mapSupabaseError(error);
  }
  const row = Array.isArray(data) ? data[0] : data;
  return (row as { policy_version?: string } | null)?.policy_version ?? null;
}

/** True when the user has accepted the version the app currently ships. */
export function isCurrentPolicyAccepted(acceptedVersion: string | null): boolean {
  return acceptedVersion === CURRENT_POLICY_VERSION;
}
