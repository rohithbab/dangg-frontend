# Wallet (spec 2.8 → 2.13)

## Screens

- WalletScreen (segmented control: Wallet | Transaction)
- PaymentProcessingScreen
- PaymentSuccessScreen
- PaymentFailedScreen

## Components

- WalletView / TransactionView
- CoinPackageCard
- CoinPurchaseConfirmModal
- InsufficientCoinsModal

## Services

- `services/razorpayService.ts` — wraps `react-native-razorpay`'s native
  module. Returns a typed Promise resolving to `{ paymentId }` on success
  or rejecting with our typed `AppException`.

## Architecture notes

- Coin purchase is a 2-stage call:
  1. `POST /functions/v1/razorpay-create-order` → `razorpay_order_id`.
  2. Razorpay SDK opens native checkout sheet.
  3. Backend `razorpay-webhook` credits coins; the app subscribes to
     `coin_transactions:male_id=eq.<uid>` realtime to confirm before
     showing the success screen — never trust the SDK callback alone.
- Transactions paginated (limit 20).

## External integrations

- **react-native-razorpay** — pinned in `package.json`. Initialised
  lazily inside `razorpayService.ts`.
- Supabase Realtime for payment confirmation.
