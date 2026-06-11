/**
 * Support / report-an-issue API. DEV_MODE just simulates success.
 */
import { USE_MOCK_DATA } from '@core/config/env';
import { mapSupabaseError } from '@core/network/apiErrorMapper';
import { getSupabaseClient } from '@core/network/supabaseClient';

export type IssueType = 'bug' | 'account' | 'payment' | 'userBehavior' | 'other';

export type IssueReport = {
  type: IssueType;
  description: string;
  screenshotLocalPath: string | null;
};

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** Submits a support report. */
export async function submitReport(report: IssueReport): Promise<void> {
  if (USE_MOCK_DATA) {
    await sleep(900);
    return;
  }
  const { error } = await getSupabaseClient().from('support_reports').insert({
    type: report.type,
    description: report.description,
    screenshot_path: report.screenshotLocalPath,
  });
  if (error) {
    throw mapSupabaseError(error);
  }
}
