/** Coin package catalogue. Constants so the same list drives Wallet UI + receipts. */

export type CoinPackageTag = 'popular' | 'bestDeal' | 'maxValue';

export type CoinPackage = {
  id: string;
  /** Display name only — not user-facing copy. */
  name: string;
  baseCoins: number;
  bonusCoins: number;
  priceInr: number;
  tag: CoinPackageTag | null;
};

// NOTE: `id` here is a display key only. The real purchase flow
// (payments-create-order) resolves a package by its DB UUID, so the Wallet
// screen should fetch the catalogue from `/rest/v1/coin_packages` to buy.
// Keep these values in sync with the 20260609130000_coin_system_pricing_v2
// migration (the DB is the source of truth).
export const COIN_PACKAGES: ReadonlyArray<CoinPackage> = [
  { id: 'spark', name: 'Spark', baseCoins: 30, bonusCoins: 0, priceInr: 9, tag: null },
  { id: 'starter', name: 'Starter', baseCoins: 70, bonusCoins: 0, priceInr: 19, tag: null },
  { id: 'value', name: 'Value', baseCoins: 200, bonusCoins: 0, priceInr: 49, tag: null },
  { id: 'popular', name: 'Popular', baseCoins: 450, bonusCoins: 0, priceInr: 99, tag: 'popular' },
  { id: 'power', name: 'Power', baseCoins: 1000, bonusCoins: 0, priceInr: 199, tag: 'bestDeal' },
  { id: 'mega', name: 'Mega', baseCoins: 2800, bonusCoins: 0, priceInr: 499, tag: 'maxValue' },
];

export function getPackageById(id: string): CoinPackage | null {
  return COIN_PACKAGES.find(p => p.id === id) ?? null;
}

/** Total coins delivered for a package (base + bonus). */
export function totalCoinsFor(pkg: CoinPackage): number {
  return pkg.baseCoins + pkg.bonusCoins;
}
