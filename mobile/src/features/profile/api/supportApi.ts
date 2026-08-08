/**
 * Support / report-an-issue API. DEV_MODE just simulates success.
 */
import { USE_MOCK_DATA } from '@core/config/env';
import { mapSupabaseError } from '@core/network/apiErrorMapper';
import { uploadToR2 } from '@core/network/mediaService';
import { getSupabaseClient } from '@core/network/supabaseClient';
import { logger } from '@core/utils/logger';

export type IssueType = 'bug' | 'account' | 'payment' | 'userBehavior' | 'other';

export type IssueReport = {
  type: IssueType;
  description: string;
  screenshotLocalPath: string | null;
};

/** Client camelCase → the `support_issue_type` enum stored in Postgres. */
const ISSUE_TYPE_TO_DB: Record<IssueType, string> = {
  bug: 'bug',
  account: 'account',
  payment: 'payment',
  userBehavior: 'user_behavior',
  other: 'other',
};

/** Mirrors the CHECK on support_reports.description. */
export const DESCRIPTION_MIN = 10;
export const DESCRIPTION_MAX = 2000;

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Submits a support report.
 *
 * The screenshot is uploaded to R2 first (category `reports` → a PRIVATE
 * `reports/evidence/{uid}/…` key) and only the object key is stored. The
 * previous implementation wrote the raw device path (`file:///data/user/0/…`)
 * straight into the column, which is meaningless off-device — no admin could
 * ever open an attachment.
 *
 * A failed screenshot upload does not sink the report: the text is the part
 * that matters, so the attachment is dropped and the submission proceeds.
 */
export async function submitReport(report: IssueReport): Promise<void> {
  if (USE_MOCK_DATA) {
    await sleep(900);
    return;
  }

  let screenshotPath: string | null = null;
  if (report.screenshotLocalPath) {
    try {
      const { objectKey } = await uploadToR2('reports', report.screenshotLocalPath);
      screenshotPath = objectKey;
    } catch (e) {
      logger.warn('submitReport: screenshot upload failed, submitting without it', e);
    }
  }

  // `user_id` is left to the column DEFAULT (auth.uid()) so the client never
  // supplies an identity the RLS policy then has to second-guess.
  const { error } = await getSupabaseClient().from('support_reports').insert({
    type: ISSUE_TYPE_TO_DB[report.type],
    description: report.description,
    screenshot_path: screenshotPath,
  });
  if (error) {
    throw mapSupabaseError(error);
  }
}
