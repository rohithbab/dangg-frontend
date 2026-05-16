/**
 * Earnings + transactions data for the female Earnings dashboard.
 *
 * Returns empty/zero values until the backend is wired. Production hits the
 * `payouts` + `transactions` tables and the `female_payout_details` row.
 */
import { Env } from '@core/config/env';
import { mapSupabaseError } from '@core/network/apiErrorMapper';
import { AppException } from '@core/network/apiException';
import { getSupabaseClient } from '@core/network/supabaseClient';

import { type Trend } from '../../femaleHome/api/femaleHomeApi';

export type EarningsBalance = {
  availableInr: number;
  pendingPayoutInr: number | null;
  monthEarningsInr: number;
  monthTrend: Trend;
  lifetimeEarningsInr: number;
};

export type TransactionKind = 'earning' | 'payout' | 'refund';
export type TransactionStatus = 'completed' | 'processing' | 'failed';

export type Transaction = {
  id: string;
  kind: TransactionKind;
  title: string;
  subtitle: string;
  amountInr: number;
  status: TransactionStatus;
  occurredAt: Date;
};

export type TransactionFilter = 'all' | 'earning' | 'payout' | 'refund';

const EMPTY_BALANCE: EarningsBalance = {
  availableInr: 0,
  pendingPayoutInr: null,
  monthEarningsInr: 0,
  monthTrend: { kind: 'flat', label: '' },
  lifetimeEarningsInr: 0,
};

/** Available + pending balances and trend stats for the Earnings hero. */
export async function getEarningsBalance(): Promise<EarningsBalance> {
  if (Env.devMode) {
    return EMPTY_BALANCE;
  }
  const { data, error } = await getSupabaseClient().rpc('female_earnings_balance');
  if (error) {
    throw mapSupabaseError(error);
  }
  return data as EarningsBalance;
}

/** Transaction list, optionally filtered by kind. */
export async function listTransactions(
  filter: TransactionFilter = 'all',
): Promise<ReadonlyArray<Transaction>> {
  if (Env.devMode) {
    return [];
  }
  let query = getSupabaseClient()
    .from('transactions')
    .select('*')
    .order('occurred_at', { ascending: false });
  if (filter !== 'all') {
    query = query.eq('kind', filter);
  }
  const { data, error } = await query;
  if (error) {
    throw mapSupabaseError(error);
  }
  return (data ?? []) as Transaction[];
}

/** Submits a payout request. Returns the new payout id. */
export async function requestPayout(amountInr: number): Promise<string> {
  if (Env.devMode) {
    throw new AppException('SERVER', 'Payouts will be available once the backend is connected');
  }
  const { data, error } = await getSupabaseClient()
    .from('payouts')
    .insert({ amount_inr: amountInr, status: 'pending' })
    .select('id')
    .single();
  if (error) {
    throw mapSupabaseError(error);
  }
  const id = (data as { id?: string }).id;
  if (!id) {
    throw new AppException('SERVER', 'Payout created without an id');
  }
  return id;
}

/** Updates the saved bank/UPI payout details. */
export async function updatePayoutDetails(payload: {
  kind: 'bank' | 'upi';
  holderName?: string;
  accountNumber?: string;
  ifsc?: string;
  upiId?: string;
}): Promise<void> {
  if (Env.devMode) {
    return;
  }
  const { error } = await getSupabaseClient().from('female_payout_details').upsert(payload);
  if (error) {
    throw mapSupabaseError(error);
  }
}

/** Returns currently-saved payout details for pre-filling the update form. */
export async function getPayoutDetails(): Promise<
  | { kind: 'bank'; holderName: string; accountNumberMasked: string; ifsc: string }
  | { kind: 'upi'; upiId: string }
  | null
> {
  if (Env.devMode) {
    return null;
  }
  const { data, error } = await getSupabaseClient()
    .from('female_payout_details')
    .select('*')
    .maybeSingle();
  if (error) {
    throw mapSupabaseError(error);
  }
  return (data as Awaited<ReturnType<typeof getPayoutDetails>>) ?? null;
}
