/**
 * Earnings + transactions data for the female Earnings dashboard.
 *
 * Returns empty/zero values until the backend is wired. Production hits the
 * `payouts` + `coin_transactions` tables and the `payout_details` row.
 */
import { USE_MOCK_DATA } from '@core/config/env';
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
  if (USE_MOCK_DATA) {
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
  if (USE_MOCK_DATA) {
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
  // The view returns JSON, so date/number fields arrive as strings — map them
  // to real types. Without this `occurredAt` is a string and the UI crashes on
  // `occurredAt.getTime()` (TransactionItem).
  const rows = (data ?? []) as ReadonlyArray<Record<string, unknown>>;
  return rows.map(row => ({
    id: String(row.id),
    kind: row.kind as TransactionKind,
    title: (row.title as string | null) ?? '',
    subtitle: (row.subtitle as string | null) ?? '',
    amountInr: row.amountInr != null ? Number(row.amountInr) : 0,
    status: (row.status as TransactionStatus | null) ?? 'completed',
    occurredAt: new Date((row.occurredAt as string | number) ?? Date.now()),
  }));
}

/** Submits a payout request. Returns the new payout id. */
export async function requestPayout(amountInr: number): Promise<string> {
  if (USE_MOCK_DATA) {
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
  const { data, error } = await getSupabaseClient().functions.invoke('payouts-request', {
    body: { coinsToWithdraw: amountInr },
  });
  if (error) {
    throw mapSupabaseError(error);
  }
  const id = (data as { payoutId?: string }).payoutId;
  if (!id) {
    throw new AppException('SERVER', 'Payout created without an id');
  }
  return id;
}

/**
 * Updates the saved bank/UPI payout details. Writes to the real
 * `payout_details` table (NOT `female_payout_details` — that table never
 * existed) with its actual columns, scoped to the caller via RLS. Upsert on
 * `female_id` so editing replaces the single row; the unused side's columns
 * are cleared so switching bank↔UPI doesn't leave stale data.
 */
export async function updatePayoutDetails(payload: {
  kind: 'bank' | 'upi';
  holderName?: string;
  accountNumber?: string;
  ifsc?: string;
  upiId?: string;
}): Promise<void> {
  if (USE_MOCK_DATA) {
    return;
  }
  const client = getSupabaseClient();
  const { data: userData, error: userErr } = await client.auth.getUser();
  if (userErr || !userData.user) {
    throw mapSupabaseError(userErr ?? new Error('You must be signed in'));
  }
  const row =
    payload.kind === 'bank'
      ? {
          female_id: userData.user.id,
          method: 'bank',
          account_holder_name: payload.holderName?.trim() ?? null,
          account_number: payload.accountNumber ?? null,
          ifsc_code: payload.ifsc?.toUpperCase() ?? null,
          upi_id: null,
        }
      : {
          female_id: userData.user.id,
          method: 'upi',
          upi_id: payload.upiId?.trim() ?? null,
          account_holder_name: null,
          account_number: null,
          ifsc_code: null,
        };
  const { error } = await client.from('payout_details').upsert(row, { onConflict: 'female_id' });
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
  if (USE_MOCK_DATA) {
    return { kind: 'upi', upiId: 'aanya@okaxis' };
  }
  const { data, error } = await getSupabaseClient()
    .from('payout_details')
    .select('method, account_holder_name, account_number, ifsc_code, upi_id')
    .maybeSingle();
  if (error) {
    throw mapSupabaseError(error);
  }
  if (!data) {
    return null;
  }
  const row = data as {
    method: 'bank' | 'upi';
    account_holder_name: string | null;
    account_number: string | null;
    ifsc_code: string | null;
    upi_id: string | null;
  };
  if (row.method === 'upi') {
    return { kind: 'upi', upiId: row.upi_id ?? '' };
  }
  const acct = row.account_number ?? '';
  const masked = acct.length > 4 ? `••••${acct.slice(-4)}` : acct;
  return {
    kind: 'bank',
    holderName: row.account_holder_name ?? '',
    accountNumberMasked: masked,
    ifsc: row.ifsc_code ?? '',
  };
}

/* ───────────────────────── Payout history (F9 / F10) ───────────────────────── */

/** UI-collapsed payout state: amber / green / red families. */
export type PayoutUiStatus = 'processing' | 'paid' | 'failed' | 'cancelled';

export type PayoutRecord = {
  id: string;
  amountInr: number;
  status: PayoutUiStatus;
  /** e.g. "HDFC Bank •••• 5521" or "aanya@okaxis". */
  methodLabel: string;
  requestedAt: Date;
  completedAt: Date | null;
  reference: string | null;
};

/** Collapses the DB payout_status enum into the four UI families. */
function toUiStatus(raw: string): PayoutUiStatus {
  switch (raw) {
    case 'completed':
    case 'paid':
      return 'paid';
    case 'failed':
    case 'rejected':
      return 'failed';
    case 'cancelled':
      return 'cancelled';
    default:
      return 'processing'; // pending / approved / processing
  }
}

/** Human label for a frozen payout_method_snapshot row. */
function methodLabelFromSnapshot(snap: unknown): string {
  if (typeof snap !== 'object' || snap === null) {
    return 'Payout';
  }
  const s = snap as Record<string, unknown>;
  if (s.method === 'upi' && typeof s.upi_id === 'string') {
    return s.upi_id;
  }
  const acct = typeof s.account_number === 'string' ? s.account_number : '';
  const tail = acct.length > 4 ? acct.slice(-4) : acct;
  return tail ? `Bank •••• ${tail}` : 'Bank transfer';
}

const mockPayouts: PayoutRecord[] = [
  {
    id: 'po-1',
    amountInr: 4210,
    status: 'processing',
    methodLabel: 'HDFC Bank •••• 5521',
    requestedAt: new Date('2026-06-24T04:30:00'),
    completedAt: null,
    reference: 'PAY-8K2QX9',
  },
  {
    id: 'po-2',
    amountInr: 3000,
    status: 'paid',
    methodLabel: 'HDFC Bank •••• 5521',
    requestedAt: new Date('2026-06-18T10:00:00'),
    completedAt: new Date('2026-06-19T11:10:00'),
    reference: 'PAY-7QW12A',
  },
  {
    id: 'po-3',
    amountInr: 1250,
    status: 'paid',
    methodLabel: 'HDFC Bank •••• 5521',
    requestedAt: new Date('2026-06-09T09:00:00'),
    completedAt: new Date('2026-06-10T09:00:00'),
    reference: 'PAY-5JK90B',
  },
  {
    id: 'po-4',
    amountInr: 2500,
    status: 'failed',
    methodLabel: 'HDFC Bank •••• 5521',
    requestedAt: new Date('2026-05-28T12:00:00'),
    completedAt: null,
    reference: 'PAY-2MN44C',
  },
];

function mapPayoutRow(row: Record<string, unknown>): PayoutRecord {
  const requestedAt = new Date((row.requested_at as string | number) ?? Date.now());
  const completedRaw = row.completed_at as string | null | undefined;
  return {
    id: String(row.id),
    amountInr: row.payout_amount_paisa != null ? Number(row.payout_amount_paisa) / 100 : 0,
    status: toUiStatus(String(row.status ?? 'pending')),
    methodLabel: methodLabelFromSnapshot(row.payout_method_snapshot),
    requestedAt,
    completedAt: completedRaw ? new Date(completedRaw) : null,
    reference: typeof row.id === 'string' ? `PAY-${row.id.slice(0, 6).toUpperCase()}` : null,
  };
}

/** Full payout history for the current female, newest first. */
export async function listPayouts(): Promise<ReadonlyArray<PayoutRecord>> {
  if (USE_MOCK_DATA) {
    return mockPayouts;
  }
  const { data, error } = await getSupabaseClient()
    .from('payouts')
    .select('id, payout_amount_paisa, payout_method_snapshot, status, requested_at, completed_at')
    .order('requested_at', { ascending: false });
  if (error) {
    throw mapSupabaseError(error);
  }
  return ((data ?? []) as ReadonlyArray<Record<string, unknown>>).map(mapPayoutRow);
}

/** A single payout for the detail screen (F10). */
export async function getPayout(id: string): Promise<PayoutRecord | null> {
  if (USE_MOCK_DATA) {
    return mockPayouts.find(p => p.id === id) ?? null;
  }
  const { data, error } = await getSupabaseClient()
    .from('payouts')
    .select('id, payout_amount_paisa, payout_method_snapshot, status, requested_at, completed_at')
    .eq('id', id)
    .maybeSingle();
  if (error) {
    throw mapSupabaseError(error);
  }
  return data ? mapPayoutRow(data as Record<string, unknown>) : null;
}
