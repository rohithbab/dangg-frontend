# Project Structure

This document defines the folder structure for both the Flutter mobile app and the Supabase backend. Keep this in sync with the actual repo.

## Top-Level Layout

```
[app-name]/
├── CLAUDE.md                          # Top-level project context (for Claude Code)
├── PROJECT_STRUCTURE.md               # This file
├── API_REFERENCE.md                   # API endpoint listing
├── mobile_app_screen_spec.md          # UI/UX screen-by-screen spec
├── .env.example                       # Template for environment variables
├── .gitignore
├── README.md                          # Quick-start setup instructions
├── mobile/                            # Flutter app
└── supabase/                          # Backend (DB, functions, migrations)
```

---

# Flutter Mobile App (`mobile/`)

## Architecture Convention

Each feature follows a **three-layer pattern**:
- **`data/`** — Repository interfaces, models, Supabase calls, DTOs
- **`application/`** — Riverpod providers, controllers, state notifiers
- **`presentation/`** — Screens, widgets, popups (UI only, no logic)

Shared utilities go in `core/` (cross-cutting) or `shared/` (used by multiple features).

## Folder Structure

```
mobile/
├── android/
├── ios/
├── lib/
│   ├── main.dart                      # App entry, init Supabase + FCM
│   ├── app.dart                       # MaterialApp config + ProviderScope
│   ├── router.dart                    # GoRouter routes
│   │
│   ├── theme/
│   │   ├── app_theme.dart             # ThemeData (light theme only for v1)
│   │   ├── colors.dart                # Color tokens (female-pink, male-blue, neutrals)
│   │   ├── typography.dart            # TextStyle tokens
│   │   └── spacing.dart               # SizedBox tokens (xs, sm, md, lg, xl)
│   │
│   ├── core/                          # Cross-cutting infrastructure
│   │   ├── config/
│   │   │   ├── env.dart               # Reads from --dart-define or .env
│   │   │   └── app_constants.dart
│   │   ├── network/
│   │   │   ├── supabase_client.dart   # Singleton Supabase init
│   │   │   ├── cloudinary_service.dart
│   │   │   └── api_exception.dart
│   │   ├── storage/
│   │   │   ├── secure_storage.dart    # flutter_secure_storage wrapper
│   │   │   └── prefs_storage.dart     # shared_preferences wrapper
│   │   ├── services/
│   │   │   ├── fcm_service.dart       # Push notification handling
│   │   │   ├── permission_service.dart
│   │   │   └── connectivity_service.dart
│   │   ├── widgets/                   # Reusable across features
│   │   │   ├── primary_button.dart
│   │   │   ├── secondary_button.dart
│   │   │   ├── app_text_field.dart
│   │   │   ├── otp_input.dart         # 6-box OTP input widget
│   │   │   ├── app_card.dart
│   │   │   ├── status_dot.dart        # Online/offline/available indicator
│   │   │   ├── empty_state.dart
│   │   │   ├── loading_overlay.dart
│   │   │   ├── error_view.dart
│   │   │   ├── app_app_bar.dart
│   │   │   └── app_bottom_nav.dart
│   │   ├── utils/
│   │   │   ├── validators.dart        # Phone, email, password validators
│   │   │   ├── formatters.dart        # ₹ currency, time-ago, masked phone
│   │   │   ├── date_utils.dart
│   │   │   └── extensions.dart
│   │   └── error/
│   │       ├── failures.dart
│   │       └── exceptions.dart
│   │
│   ├── features/
│   │   ├── splash/
│   │   │   └── presentation/splash_screen.dart
│   │   │
│   │   ├── onboarding/
│   │   │   └── presentation/
│   │   │       ├── account_type_screen.dart      # Female/Male choice
│   │   │       └── male_onboarding_carousel.dart # 3-slide welcome
│   │   │
│   │   ├── auth/
│   │   │   ├── data/
│   │   │   │   ├── auth_repository.dart
│   │   │   │   └── models/
│   │   │   │       ├── auth_user.dart
│   │   │   │       └── verification_status.dart  # enum: none, pending, verified
│   │   │   ├── application/
│   │   │   │   ├── auth_controller.dart          # Riverpod notifier
│   │   │   │   └── auth_state.dart
│   │   │   └── presentation/
│   │   │       ├── female_signup/
│   │   │       │   ├── female_signup_basic_info_screen.dart
│   │   │       │   ├── otp_verification_screen.dart   # Reused by both
│   │   │       │   ├── bank_upi_details_screen.dart
│   │   │       │   ├── verification_info_screen.dart
│   │   │       │   ├── face_capture_screen.dart
│   │   │       │   └── verification_submitted_screen.dart
│   │   │       ├── male_signup/
│   │   │       │   └── male_signup_basic_info_screen.dart
│   │   │       ├── login/
│   │   │       │   ├── female_login_phone_screen.dart
│   │   │       │   ├── female_login_password_screen.dart
│   │   │       │   ├── male_login_screen.dart
│   │   │       │   └── verification_pending_popup.dart
│   │   │       └── forgot_password/
│   │   │           ├── forgot_password_phone_screen.dart
│   │   │           ├── forgot_password_otp_screen.dart
│   │   │           └── forgot_password_new_screen.dart
│   │   │
│   │   ├── female_home/
│   │   │   ├── data/female_home_repository.dart
│   │   │   ├── application/female_home_controller.dart
│   │   │   └── presentation/
│   │   │       ├── female_home_screen.dart
│   │   │       ├── widgets/
│   │   │       │   ├── availability_toggle_card.dart
│   │   │       │   ├── stats_grid.dart
│   │   │       │   └── recent_activity_list.dart
│   │   │
│   │   ├── earnings/
│   │   │   ├── data/earnings_repository.dart
│   │   │   ├── application/
│   │   │   │   ├── earnings_controller.dart
│   │   │   │   └── payout_controller.dart
│   │   │   └── presentation/
│   │   │       ├── earnings_dashboard_screen.dart
│   │   │       ├── payout_confirmation_popup.dart
│   │   │       ├── payout_status_banner.dart
│   │   │       ├── bank_upi_update_screen.dart
│   │   │       └── chat_history_list.dart
│   │   │
│   │   ├── male_home/
│   │   │   ├── data/female_listing_repository.dart
│   │   │   ├── application/male_home_controller.dart
│   │   │   └── presentation/
│   │   │       ├── male_home_screen.dart
│   │   │       ├── widgets/
│   │   │       │   ├── favourites_carousel.dart
│   │   │       │   ├── available_female_card.dart
│   │   │       │   └── female_search_filter_sheet.dart
│   │   │       └── female_profile_preview_screen.dart
│   │   │
│   │   ├── wallet/
│   │   │   ├── data/
│   │   │   │   ├── wallet_repository.dart
│   │   │   │   └── razorpay_service.dart
│   │   │   ├── application/
│   │   │   │   ├── wallet_controller.dart
│   │   │   │   └── purchase_controller.dart
│   │   │   └── presentation/
│   │   │       ├── wallet_screen.dart                  # Slider tabs (Wallet | Transaction)
│   │   │       ├── wallet_view.dart
│   │   │       ├── transaction_view.dart
│   │   │       ├── coin_package_card.dart
│   │   │       ├── coin_purchase_confirm_popup.dart
│   │   │       ├── payment_processing_screen.dart
│   │   │       ├── payment_success_screen.dart
│   │   │       ├── payment_failed_screen.dart
│   │   │       └── insufficient_coins_popup.dart
│   │   │
│   │   ├── profile/
│   │   │   ├── data/profile_repository.dart
│   │   │   ├── application/profile_controller.dart
│   │   │   └── presentation/
│   │   │       ├── female_profile_screen.dart
│   │   │       ├── male_profile_screen.dart
│   │   │       ├── edit_profile_pic_sheet.dart
│   │   │       ├── help_support_screen.dart
│   │   │       ├── report_issue_screen.dart
│   │   │       ├── about_app_screen.dart
│   │   │       ├── settings_screen.dart
│   │   │       ├── change_password_screen.dart
│   │   │       ├── delete_account_warning_screen.dart
│   │   │       ├── delete_account_confirm_screen.dart
│   │   │       └── logout_confirmation_dialog.dart
│   │   │
│   │   ├── chat_requests/                       # Phase 1: request flow only
│   │   │   ├── data/chat_request_repository.dart
│   │   │   ├── application/chat_request_controller.dart
│   │   │   └── presentation/
│   │   │       ├── incoming_chat_request_popup.dart    # Female receives
│   │   │       ├── chat_request_sent_screen.dart       # Male waiting
│   │   │       ├── chat_request_accepted_screen.dart   # Bridge to Phase 2
│   │   │       ├── chat_request_declined_screen.dart
│   │   │       ├── chat_request_timeout_screen.dart
│   │   │       ├── queue_position_screen.dart
│   │   │       └── like_dislike_rating_screen.dart     # Post-chat (Phase 2 trigger)
│   │   │
│   │   ├── chat_session/                       # Phase 2 placeholder
│   │   │   └── PHASE_2_PLACEHOLDER.md
│   │   │
│   │   ├── notifications/
│   │   │   ├── data/notifications_repository.dart
│   │   │   ├── application/notifications_controller.dart
│   │   │   └── presentation/notifications_screen.dart
│   │   │
│   │   ├── block_report/
│   │   │   ├── data/block_report_repository.dart
│   │   │   └── presentation/block_report_bottom_sheet.dart
│   │   │
│   │   └── common/                          # App-wide screens
│   │       ├── offline_overlay.dart
│   │       ├── update_required_screen.dart
│   │       ├── maintenance_screen.dart
│   │       ├── account_suspended_screen.dart
│   │       ├── session_expired_dialog.dart
│   │       └── generic_error_screen.dart
│   │
│   └── shared/
│       ├── providers/
│       │   ├── session_provider.dart        # Auth state
│       │   ├── connectivity_provider.dart
│       │   └── notification_provider.dart   # Unread count
│       └── models/                          # Cross-feature models
│           ├── user.dart
│           ├── female_profile.dart
│           ├── male_profile.dart
│           ├── chat_request.dart
│           ├── chat_session.dart
│           ├── coin_transaction.dart
│           ├── payout.dart
│           ├── rating.dart
│           ├── favourite.dart
│           └── notification.dart
│
├── assets/
│   ├── images/                             # Illustrations, default avatars
│   ├── icons/                              # Custom icons
│   └── fonts/                              # Inter or SF Pro
│
├── test/                                   # Unit + widget tests
│   ├── auth/
│   ├── wallet/
│   └── ...
│
├── integration_test/                       # End-to-end tests
│
├── pubspec.yaml
├── analysis_options.yaml
├── .gitignore
└── README.md
```

## Key Flutter Dependencies (`pubspec.yaml`)

```yaml
dependencies:
  flutter:
    sdk: flutter

  # State & routing
  flutter_riverpod: ^2.5.0
  go_router: ^14.0.0

  # Backend
  supabase_flutter: ^2.5.0

  # Storage
  flutter_secure_storage: ^9.0.0
  shared_preferences: ^2.2.0

  # Push notifications
  firebase_core: ^3.0.0
  firebase_messaging: ^15.0.0

  # Payments
  razorpay_flutter: ^1.3.0

  # Image / media
  cached_network_image: ^3.3.0
  image_picker: ^1.0.0
  camera: ^0.10.0

  # Permissions
  permission_handler: ^11.0.0

  # Connectivity
  connectivity_plus: ^6.0.0

  # Utility
  intl: ^0.19.0
  uuid: ^4.0.0
  freezed_annotation: ^2.4.0
  json_annotation: ^4.8.0

dev_dependencies:
  build_runner: ^2.4.0
  freezed: ^2.4.0
  json_serializable: ^6.7.0
  flutter_lints: ^4.0.0
```

---

# Supabase Backend (`supabase/`)

## Folder Structure

```
supabase/
├── config.toml                            # Project config (link to ap-south-1)
├── seed.sql                               # Seed data for local dev
│
├── migrations/                            # Timestamped, ordered, immutable
│   ├── 20260513000001_create_users.sql
│   ├── 20260513000002_create_females.sql
│   ├── 20260513000003_create_males.sql
│   ├── 20260513000004_create_chat_requests.sql
│   ├── 20260513000005_create_chat_sessions.sql
│   ├── 20260513000006_create_ratings.sql
│   ├── 20260513000007_create_favourites.sql
│   ├── 20260513000008_create_coin_packages.sql
│   ├── 20260513000009_create_coin_transactions.sql
│   ├── 20260513000010_create_payouts.sql
│   ├── 20260513000011_create_notifications.sql
│   ├── 20260513000012_create_reports_blocks.sql
│   ├── 20260513000013_create_fcm_tokens.sql
│   ├── 20260513000014_create_otp_audit.sql
│   ├── 20260513000015_rls_policies_users.sql
│   ├── 20260513000016_rls_policies_chat.sql
│   ├── 20260513000017_rls_policies_payments.sql
│   ├── 20260513000018_rls_policies_admin.sql
│   ├── 20260513000019_views_dashboards.sql      # Materialized/regular views
│   └── 20260513000020_functions_triggers.sql    # PL/pgSQL helpers
│
├── functions/                             # Edge Functions (Deno)
│   ├── send-sms-hook/                     # Supabase Auth → MSG91 bridge
│   │   └── index.ts
│   ├── razorpay-create-order/             # Initiate coin purchase
│   │   └── index.ts
│   ├── razorpay-webhook/                  # Credit coins on payment success
│   │   └── index.ts
│   ├── chat-request-create/               # Male initiates chat request
│   │   └── index.ts
│   ├── chat-request-respond/              # Female accepts/declines
│   │   └── index.ts
│   ├── chat-rate/                         # Male submits like/dislike
│   │   └── index.ts
│   ├── payout-request/                    # Female requests payout
│   │   └── index.ts
│   ├── admin-verification-action/         # Admin approves/rejects female photo
│   │   └── index.ts
│   ├── admin-payout-action/               # Admin approves/completes/rejects
│   │   └── index.ts
│   ├── upload-signature/                  # Generate signed Cloudinary upload params
│   │   └── index.ts
│   ├── fcm-register/                      # Save FCM token for user
│   │   └── index.ts
│   ├── send-fcm/                          # Internal: dispatch push (called by triggers)
│   │   └── index.ts
│   ├── account-delete/                    # Soft/hard delete user
│   │   └── index.ts
│   └── _shared/                           # Shared TS utilities
│       ├── supabase_admin.ts
│       ├── msg91_client.ts
│       ├── razorpay_client.ts
│       ├── cloudinary_signer.ts
│       └── fcm_client.ts
│
└── storage/                               # Bucket definitions (declarative)
    ├── verification-photos/               # Private bucket, admin-only read
    └── (cloudinary handles other media)
```

## Database Schema Overview

Core tables (detailed columns documented per migration file):

| Table | Purpose | Key fields |
|---|---|---|
| `users` | Base account (extends `auth.users`) | id (FK to auth.users), role, name, age, gender, created_at |
| `females` | Female-specific profile | user_id, online_status, verification_status, bank_account_json, upi_id, total_earnings, available_balance, claimed_amount, ratings_avg, total_chats |
| `males` | Male-specific profile | user_id, coin_balance, total_coins_purchased, total_coins_spent |
| `chat_requests` | Request lifecycle | id, male_id, female_id, status (pending/accepted/declined/timeout/cancelled), created_at, responded_at |
| `chat_sessions` | Completed chats (Phase 2 will populate; Phase 1 has rows after admin manually marks complete or post-Phase 2) | id, male_id, female_id, started_at, ended_at, duration_seconds, coins_spent, female_earnings |
| `ratings` | Like/dislike from male post-chat | id, chat_session_id, male_id, female_id, rating (like/dislike), comment, created_at |
| `favourites` | Male's favourited females | male_id, female_id, created_at |
| `coin_packages` | Catalog (admin-managed) | id, coin_amount, price_inr, label, is_active |
| `coin_transactions` | Purchases + spends | id, male_id, type (purchase/spend), coins, amount_inr (for purchase), razorpay_order_id, status |
| `payouts` | Female payout requests | id, female_id, amount, status (pending/approved/completed/rejected), upi_id, requested_at, processed_at, admin_notes |
| `notifications` | In-app notification list | id, user_id, type, title, body, payload_json, is_read, created_at |
| `reports` | User-submitted reports | id, reporter_id, target_id, reason, comment |
| `blocks` | User blocks | blocker_id, blocked_id, created_at |
| `fcm_tokens` | Device push tokens | id, user_id, token, platform, last_seen |
| `verification_audit` | Admin verification history | id, female_id, admin_id, action, notes, created_at |
| `payout_audit` | Admin payout history | id, payout_id, admin_id, action (approve/complete/reject), notes, created_at |

## RLS (Row Level Security) Principles

- **Default deny.** Every table starts with `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`.
- **Authenticated users** can read/write their own rows only (`auth.uid() = user_id`).
- **Admin role** (custom claim `role = 'admin'` in JWT) bypasses normal RLS via dedicated policies.
- **Service role** (Edge Functions) uses `SUPABASE_SERVICE_ROLE_KEY` and bypasses RLS entirely — use only for system operations.
- **Read access to other users:**
  - Males can read females marked `online_status = 'online'` (basic fields only: name, avatar, rating, fav count).
  - Females cannot read male profiles.

## Realtime Channels

| Channel | Filter | Subscriber | Purpose |
|---|---|---|---|
| `chat_requests:female_id=eq.<uid>` | new INSERT | Female | Receive incoming chat request popup |
| `chat_requests:male_id=eq.<uid>` | UPDATE status | Male | See accept/decline/timeout |
| `females:user_id=eq.<uid>` | UPDATE online_status | Male (favourites) | See favourite go online |
| `notifications:user_id=eq.<uid>` | new INSERT | Both | In-app notification badge |
| `coin_transactions:male_id=eq.<uid>` | UPDATE status | Male | Payment confirmation in real-time |
| `payouts:female_id=eq.<uid>` | UPDATE status | Female | Payout status changes |

---

# Admin Dashboard (`admin-dashboard/`) — Phase 2 build, structure for reference

```
admin-dashboard/
├── src/
│   ├── pages/
│   │   ├── analytics.tsx
│   │   ├── revenue.tsx
│   │   ├── payout.tsx
│   │   ├── verification.tsx
│   │   ├── users.tsx
│   │   ├── chats.tsx
│   │   └── chat-transcript.tsx
│   ├── components/
│   ├── hooks/
│   ├── api/
│   └── types/
├── public/
└── package.json
```

Recommended stack: Next.js or Vite + React + shadcn/ui + Tanstack Query + Supabase JS client with admin JWT.
