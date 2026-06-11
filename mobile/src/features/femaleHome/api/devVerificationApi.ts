import { mapSupabaseError } from '@core/network/apiErrorMapper';
import { getSupabaseClient } from '@core/network/supabaseClient';

export type DevFemaleUser = {
  id: string;
  name: string;
  phone: string;
  verification_status: 'none' | 'pending' | 'verified' | 'rejected';
};

/**
 * DEV ONLY: Fetches all female users bypassing RLS.
 */
export async function fetchDevFemales(): Promise<DevFemaleUser[]> {
  const client = getSupabaseClient();
  const { data, error } = await client.rpc('dev_list_females');
  if (error) {
    throw mapSupabaseError(error);
  }
  // If data is returned as JSON string, parse it, otherwise return it directly
  if (typeof data === 'string') {
    return JSON.parse(data) as DevFemaleUser[];
  }
  return (data || []) as DevFemaleUser[];
}

/**
 * DEV ONLY: Toggles the verification status of a female user bypassing RLS.
 */
export async function toggleDevVerification(
  femaleId: string,
): Promise<{ id: string; verification_status: string }> {
  const client = getSupabaseClient();
  const { data, error } = await client.rpc('dev_toggle_verification', {
    p_female_id: femaleId,
  });
  if (error) {
    throw mapSupabaseError(error);
  }
  if (typeof data === 'string') {
    return JSON.parse(data) as { id: string; verification_status: string };
  }
  return data as { id: string; verification_status: string };
}
