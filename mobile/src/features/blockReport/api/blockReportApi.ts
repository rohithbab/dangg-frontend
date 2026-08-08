/**
 * Block / report another user.
 *
 * The `users-block`, `users-unblock` and `reports-submit` Edge Functions have
 * been deployed since Phase 1 but nothing in the app called them — the sheet
 * that collects the input was never wired to a backend. This module is that
 * wiring.
 */
import { USE_MOCK_DATA } from '@core/config/env';
import { extractEdgeFunctionError, mapSupabaseError } from '@core/network/apiErrorMapper';
import { AppException } from '@core/network/apiException';
import { getSupabaseClient } from '@core/network/supabaseClient';
import { logger } from '@core/utils/logger';

/** Mirrors the `report_reason` enum the backend validates against. */
export type ReportReason =
  | 'harassment'
  | 'inappropriate_content'
  | 'fake_profile'
  | 'fraud_scam'
  | 'spam'
  | 'underage'
  | 'other';

/**
 * The sheet shows human-readable reasons; the backend accepts only the enum.
 * Anything unmapped degrades to `other` rather than failing validation — a
 * report with a slightly coarse category still reaches a moderator, which is
 * the outcome that matters.
 */
const REASON_BY_LABEL: Readonly<Record<string, ReportReason>> = {
  Harassment: 'harassment',
  Spam: 'spam',
  'Fraud / scam': 'fraud_scam',
  'Inappropriate behavior': 'inappropriate_content',
  'Misrepresentation (did not match profile)': 'fake_profile',
  'Scam / asking for off-platform contact': 'fraud_scam',
  'Not responsive in chat': 'other',
  Other: 'other',
};

export function toReportReason(label: string): ReportReason {
  return REASON_BY_LABEL[label] ?? 'other';
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** Blocks a user. Idempotent server-side — re-blocking is not an error. */
export async function blockUser(blockedUserId: string, reason?: string): Promise<void> {
  if (USE_MOCK_DATA) {
    await sleep(500);
    logger.debug('blockUser (DEV)', { blockedUserId });
    return;
  }
  const { error } = await getSupabaseClient().functions.invoke('users-block', {
    body: { blockedUserId, ...(reason ? { reason: reason.slice(0, 500) } : {}) },
  });
  if (error) {
    throw await toAppException(error, 'users-block');
  }
}

export async function unblockUser(blockedUserId: string): Promise<void> {
  if (USE_MOCK_DATA) {
    await sleep(500);
    logger.debug('unblockUser (DEV)', { blockedUserId });
    return;
  }
  const { error } = await getSupabaseClient().functions.invoke('users-unblock', {
    body: { blockedUserId },
  });
  if (error) {
    throw await toAppException(error, 'users-unblock');
  }
}

/**
 * Files a report against another user.
 *
 * The backend caps reporters at 5 per rolling 24h and answers 409 past that;
 * surfaced as a plain-language message rather than a generic failure.
 */
export async function reportUser(params: {
  reportedUserId: string;
  reason: ReportReason;
  description?: string;
  contextChatRequestId?: string;
}): Promise<void> {
  if (USE_MOCK_DATA) {
    await sleep(700);
    logger.debug('reportUser (DEV)', { reportedUserId: params.reportedUserId });
    return;
  }
  const description = params.description?.trim();
  const { error } = await getSupabaseClient().functions.invoke('reports-submit', {
    body: {
      reportedUserId: params.reportedUserId,
      reason: params.reason,
      // The backend rejects an empty string — omit the key instead.
      ...(description ? { description: description.slice(0, 2000) } : {}),
      ...(params.contextChatRequestId ? { contextChatRequestId: params.contextChatRequestId } : {}),
    },
  });
  if (error) {
    const detail = await extractEdgeFunctionError(error);
    if (detail?.status === 409) {
      throw new AppException(
        'VALIDATION',
        "You've reported the maximum number of users today. Please try again tomorrow.",
      );
    }
    throw await toAppException(error, 'reports-submit');
  }
}

/**
 * `functions.invoke` collapses every failure into "non-2xx status code";
 * unwrap the real envelope so logs and the UI say what actually went wrong.
 */
async function toAppException(error: unknown, fn: string): Promise<Error> {
  const detail = await extractEdgeFunctionError(error);
  logger.warn(`${fn} failed`, { status: detail?.status, code: detail?.code });
  if (detail?.message) {
    return new AppException('SERVER', detail.message);
  }
  return mapSupabaseError(error);
}
