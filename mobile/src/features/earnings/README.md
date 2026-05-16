# Earnings (spec 1.15 → 1.17)

## Screens

- EarningsDashboardScreen
- BankUpiUpdateScreen

## Components

- PayoutStatusBanner
- PayoutConfirmationModal
- ChatHistoryList (with [Today]/[Week]/[Month] filter pills)

## Architecture notes

- Payout request always claims the full `available_balance` (single Edge
  Function call: `POST /functions/v1/payout-request`).
- A 409 → an active payout exists; render the banner in "Pending" state
  instead of throwing.
- Bank/UPI form reuses `Validators.upiId` / `Validators.ifsc`.
- Chat history is FlashList + paginated.

## External integrations

- Razorpay does NOT touch this feature (payouts are manual admin actions).
