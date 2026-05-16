/**
 * Male wallet API — balance, purchases, transactions.
 *
 * Starts with zero coins and empty transaction history until the backend is
 * wired. `processPayment` resolves to a real success in dev (so the demo
 * flow walks end-to-end and credits the wallet store) — production will
 * trigger Razorpay's checkout overlay instead.
 */
import { Env } from '@core/config/env';
import { mapSupabaseError } from '@core/network/apiErrorMapper';
import { getSupabaseClient } from '@core/network/supabaseClient';

import { COIN_PACKAGES, type CoinPackage, getPackageById, totalCoinsFor } from '../constants';
import { useWalletStore } from '../store/walletStore';

export type WalletTransactionKind = 'purchase' | 'chat' | 'refund';
export type WalletTransactionStatus = 'completed' | 'processing' | 'failed';

export type WalletTransaction = {
  id: string;
  kind: WalletTransactionKind;
  title: string;
  subtitle: string;
  /** Signed in COINS — positive credits, negative debits. */
  coinDelta: number;
  status: WalletTransactionStatus;
  occurredAt: Date;
};

export type WalletTransactionFilter = 'all' | 'purchase' | 'chat' | 'refund';

export type PaymentOutcome =
  | { ok: true; transactionId: string; coinsAdded: number; bonusCoins: number; newBalance: number }
  | { ok: false; reason: string };

/** Initial fetch of the male's wallet snapshot — call once at login. */
export async function fetchWalletSnapshot(): Promise<{
  coinBalance: number;
  totalCoinsPurchased: number;
  chatsStarted: number;
}> {
  if (Env.devMode) {
    const s = useWalletStore.getState();
    return {
      coinBalance: s.coinBalance,
      totalCoinsPurchased: s.totalCoinsPurchased,
      chatsStarted: s.chatsStarted,
    };
  }
  const { data, error } = await getSupabaseClient().rpc('male_wallet_snapshot');
  if (error) {
    throw mapSupabaseError(error);
  }
  return data as { coinBalance: number; totalCoinsPurchased: number; chatsStarted: number };
}

/** Returns the static coin-package catalogue. */
export function listPackages(): ReadonlyArray<CoinPackage> {
  return COIN_PACKAGES;
}

/**
 * Processes a payment for a coin package.
 *
 * In dev we credit the wallet immediately and return success so the demo
 * walks through. Production will open Razorpay's SDK overlay and reconcile
 * via the webhook.
 */
export async function processPayment(packageId: string): Promise<PaymentOutcome> {
  const pkg = getPackageById(packageId);
  if (!pkg) {
    return { ok: false, reason: 'Unknown package' };
  }
  if (Env.devMode) {
    const coinsAdded = totalCoinsFor(pkg);
    useWalletStore.getState().credit(coinsAdded);
    const newBalance = useWalletStore.getState().coinBalance;
    return {
      ok: true,
      transactionId: `local-${Date.now()}`,
      coinsAdded,
      bonusCoins: pkg.bonusCoins,
      newBalance,
    };
  }
  throw new Error('processPayment production path not yet wired');
}

/** Transaction history, optionally filtered. */
export async function listTransactions(
  filter: WalletTransactionFilter = 'all',
): Promise<ReadonlyArray<WalletTransaction>> {
  if (Env.devMode) {
    return [];
  }
  let query = getSupabaseClient()
    .from('male_transactions')
    .select('*')
    .order('occurred_at', { ascending: false });
  if (filter !== 'all') {
    query = query.eq('kind', filter);
  }
  const { data, error } = await query;
  if (error) {
    throw mapSupabaseError(error);
  }
  return (data ?? []) as WalletTransaction[];
}
