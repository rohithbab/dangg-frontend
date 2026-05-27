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

let mockAvailableBalance = 4250;
let mockPendingPayout: number | null = null;
const mockMonthEarnings = 18500;
const mockLifetimeEarnings = 45000;

const mockTransactionsList: Transaction[] = [
  {
    id: 'etx-1',
    kind: 'earning',
    title: 'Chat Earnings',
    subtitle: 'Chat with Raj (25 mins)',
    amountInr: 300,
    status: 'completed',
    occurredAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
  },
  {
    id: 'etx-2',
    kind: 'payout',
    title: 'UPI Payout',
    subtitle: 'Transferred to aanya@okaxis',
    amountInr: 4200,
    status: 'completed',
    occurredAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
  },
  {
    id: 'etx-3',
    kind: 'earning',
    title: 'Chat Earnings',
    subtitle: 'Chat with Vikram (10 mins)',
    amountInr: 120,
    status: 'completed',
    occurredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
  },
  {
    id: 'etx-4',
    kind: 'refund',
    title: 'Refunded Earning',
    subtitle: 'User dispute resolution',
    amountInr: -60,
    status: 'completed',
    occurredAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
  },
  {
    id: 'etx-5',
    kind: 'payout',
    title: 'UPI Payout',
    subtitle: 'Transferred to aanya@okaxis',
    amountInr: 3500,
    status: 'completed',
    occurredAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
  },
];

/** Available + pending balances and trend stats for the Earnings hero. */
export async function getEarningsBalance(): Promise<EarningsBalance> {
  if (Env.devMode) {
    return {
      availableInr: mockAvailableBalance,
      pendingPayoutInr: mockPendingPayout,
      monthEarningsInr: mockMonthEarnings,
      monthTrend: { kind: 'up', label: '+12% vs last month' },
      lifetimeEarningsInr: mockLifetimeEarnings,
    };
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
    if (filter === 'all') {
      return mockTransactionsList;
    }
    return mockTransactionsList.filter(t => t.kind === filter);
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
    const payoutId = `payout-${Date.now()}`;
    mockAvailableBalance -= amountInr;
    mockPendingPayout = amountInr;

    // Fetch details to know if UPI or Bank
    const details = await getPayoutDetails();
    const dest = details
      ? details.kind === 'upi'
        ? `Withdrawal to ${details.upiId}`
        : `Withdrawal to A/C ending in ${details.accountNumberMasked}`
      : 'Withdrawal request';

    // Insert at the beginning of the list
    mockTransactionsList.unshift({
      id: payoutId,
      kind: 'payout',
      title: 'Payout Request',
      subtitle: dest,
      amountInr: amountInr,
      status: 'processing',
      occurredAt: new Date(),
    });

    return payoutId;
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
    return { kind: 'upi', upiId: 'aanya@okaxis' };
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
