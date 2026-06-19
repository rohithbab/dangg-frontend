/**
 * Male wallet API — balance, purchases, transactions.
 *
 * `processPayment` opens Razorpay's native checkout overlay on Android and on
 * real devices; only the iOS Simulator (where the Razorpay SDK can't run) falls
 * back to a mock payment proof so the create-order → verify → credit flow can
 * still be exercised.
 */
import { Platform } from 'react-native';
import RazorpayCheckout from 'react-native-razorpay';

import { AppColors } from '@theme/colors';

import { Env, USE_MOCK_DATA } from '@core/config/env';
import { mapSupabaseError } from '@core/network/apiErrorMapper';
import { getSupabaseClient } from '@core/network/supabaseClient';
import { logger } from '@core/utils/logger';

import { COIN_PACKAGES, type CoinPackage, getPackageById } from '../constants';
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
  if (USE_MOCK_DATA) {
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
  const snapshot = data as { coinBalance: number; totalCoinsPurchased: number; chatsStarted: number };
  const store = useWalletStore.getState();
  store.setBalance(snapshot.coinBalance);
  store.setTotals({ totalCoinsPurchased: snapshot.totalCoinsPurchased, chatsStarted: snapshot.chatsStarted });
  return snapshot;
}

/** Returns the static coin-package catalogue. */
export function listPackages(): ReadonlyArray<CoinPackage> {
  return COIN_PACKAGES;
}

type CreateOrderData = {
  paymentId: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  razorpayKeyId: string;
  packageName: string;
  totalCoins: number;
};

type VerifyData = {
  status: string;
  coinsCredited: number;
  newBalance: number | null;
  transactionId: string | null;
};

/**
 * Real Razorpay purchase:
 *   1. `payments-create-order` → a Razorpay order + the publishable key.
 *   2. Open the native Razorpay checkout overlay (user pays).
 *   3. `payments-verify` with the returned signature → the server verifies it,
 *      captures the payment, and credits coins. We sync the authoritative
 *      balance it returns.
 *
 * The webhook (`webhooks-razorpay`) is the backstop that also credits coins if
 * the client dies after paying — so a missed verify never loses a purchase.
 */
export async function processPayment(packageId: string): Promise<PaymentOutcome> {
  const pkg = getPackageById(packageId);
  if (!pkg) {
    return { ok: false, reason: 'Unknown package' };
  }
  const client = getSupabaseClient();

  // The static catalogue uses slug ids ('popular'), but payments-create-order
  // resolves a package by its DB UUID. Map the chosen package to the matching
  // active DB row (catalogue + DB are kept in sync on price + coin count).
  const { data: dbPkgs, error: pkgErr } = await client
    .from('coin_packages')
    .select('id, price_paisa, coins')
    .eq('is_active', true);
  if (pkgErr) {
    logger.warn('coin_packages lookup failed', pkgErr);
    return { ok: false, reason: 'Could not start payment. Please try again.' };
  }
  const dbPkg = ((dbPkgs ?? []) as Array<{ id: string; price_paisa: number; coins: number }>).find(
    p => p.price_paisa === pkg.priceInr * 100 && p.coins === pkg.baseCoins,
  );
  if (!dbPkg) {
    return { ok: false, reason: 'This package is no longer available.' };
  }

  // 1. Create the order server-side (with the DB UUID).
  const { data: orderResp, error: orderError } = await client.functions.invoke(
    'payments-create-order',
    { body: { packageId: dbPkg.id } },
  );
  if (orderError) {
    logger.warn('payments-create-order failed', orderError);
    return { ok: false, reason: 'Could not start payment. Please try again.' };
  }
  const order = (orderResp as { data?: CreateOrderData } | null)?.data;
  if (!order?.razorpayOrderId) {
    return { ok: false, reason: 'Could not start payment. Please try again.' };
  }

  // 2. Collect the payment proof by opening Razorpay's native checkout overlay.
  //    The ONLY platform where the Razorpay SDK can't run is the iOS Simulator,
  //    so we mock the proof ONLY there (DEV_MODE on iOS). Android (emulator +
  //    device) and iOS devices always open the real overlay.
  //    NOTE: the iOS-sim mock path relies on a server-side verify bypass that
  //    MUST be removed before launch.
  const useMockProof = Env.devMode && Platform.OS === 'ios';
  let razorpayPaymentId: string;
  let razorpaySignature: string;
  if (useMockProof) {
    razorpayPaymentId = `pay_dev_${Date.now()}`;
    razorpaySignature = 'mock_signature_bypass';
  } else {
    try {
      const result = await RazorpayCheckout.open({
        key: order.razorpayKeyId,
        order_id: order.razorpayOrderId,
        amount: order.amount,
        currency: order.currency || 'INR',
        name: 'Dangg',
        description: `${order.totalCoins} coins — ${order.packageName}`,
        theme: { color: AppColors.primary },
      });
      razorpayPaymentId = result.razorpay_payment_id;
      razorpaySignature = result.razorpay_signature;
    } catch (e) {
      logger.info('Razorpay checkout cancelled/failed', e);
      return { ok: false, reason: 'Payment cancelled' };
    }
  }

  // 3. Verify + capture server-side.
  const { data: verifyResp, error: verifyError } = await client.functions.invoke(
    'payments-verify',
    {
      body: {
        paymentId: order.paymentId,
        razorpayOrderId: order.razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
      },
    },
  );
  if (verifyError) {
    logger.error('payments-verify failed', verifyError);
    return {
      ok: false,
      reason: 'Payment received but not confirmed yet. If charged, it will reflect shortly.',
    };
  }
  const verify = (verifyResp as { data?: VerifyData } | null)?.data;
  if (verify?.status !== 'success') {
    return { ok: false, reason: 'Payment verification failed' };
  }

  // Sync the authoritative balance from the server.
  if (typeof verify.newBalance === 'number') {
    useWalletStore.getState().setBalance(verify.newBalance);
  } else {
    useWalletStore.getState().credit(verify.coinsCredited);
  }
  return {
    ok: true,
    transactionId: verify.transactionId ?? `txn-${Date.now()}`,
    coinsAdded: verify.coinsCredited,
    bonusCoins: pkg.bonusCoins,
    newBalance: useWalletStore.getState().coinBalance,
  };
}

const MOCK_WALLET_TXS = (): WalletTransaction[] => [
  {
    id: 'wtx-1',
    kind: 'purchase',
    title: 'Coins Purchased',
    subtitle: '500 Coins Package',
    coinDelta: 500,
    status: 'completed',
    occurredAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
  },
  {
    id: 'wtx-2',
    kind: 'chat',
    title: 'Chat with Priya',
    subtitle: 'Chat request accepted',
    coinDelta: -50,
    status: 'completed',
    occurredAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
  },
  {
    id: 'wtx-3',
    kind: 'refund',
    title: 'Refunded Coins',
    subtitle: 'Expired request (Kiara)',
    coinDelta: 75,
    status: 'completed',
    occurredAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
  },
  {
    id: 'wtx-4',
    kind: 'purchase',
    title: 'Coins Purchased',
    subtitle: '500 Coins Package',
    coinDelta: 500,
    status: 'completed',
    occurredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
  },
];

export async function listTransactions(
  filter: WalletTransactionFilter = 'all',
): Promise<ReadonlyArray<WalletTransaction>> {
  if (USE_MOCK_DATA) {
    const txs = MOCK_WALLET_TXS();
    if (filter === 'all') {
      return txs;
    }
    return txs.filter(t => t.kind === filter);
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
  // The view returns JSON, so date/number fields arrive as strings — map them
  // to real types. Without this `occurredAt` is a string and the Wallet screen
  // crashes on `occurredAt.getFullYear()`/`.getTime()`.
  const rows = (data ?? []) as ReadonlyArray<Record<string, unknown>>;
  return rows.map(row => ({
    id: String(row.id),
    kind: row.kind as WalletTransactionKind,
    title: (row.title as string | null) ?? '',
    subtitle: (row.subtitle as string | null) ?? '',
    coinDelta: row.coinDelta != null ? Number(row.coinDelta) : 0,
    status: (row.status as WalletTransactionStatus | null) ?? 'completed',
    occurredAt: new Date((row.occurredAt as string | number) ?? Date.now()),
  }));
}
