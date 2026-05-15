# [App Name] — Project Context for Claude Code

> This file is read automatically by Claude Code on every session. Keep it updated as the project evolves.

## Project Summary

**[App Name]** is a text-only paid chat marketplace, mobile-first.

- **Female users** are service providers. They earn by chatting with paying males.
- **Male users** buy coins, spend coins to send chat requests to online females.
- **Admin** (separate web dashboard) manages verification, payouts, and disputes.

## Phase 1 vs Phase 2

| Area | Phase 1 (now) | Phase 2 (later) |
|---|---|---|
| Sign-up, login, OTP | ✅ | — |
| Profile management | ✅ | — |
| Browsing available females | ✅ | — |
| Sending chat requests | ✅ | — |
| Incoming request popup (female) | ✅ | — |
| Accept/decline (female) | ✅ | — |
| **Active chat** (text/image/video) | ❌ | ✅ |
| Queue management (5-person, 20-min) | ❌ | ✅ |
| Coin deduction during chat | ❌ | ✅ |
| Like/dislike rating screen (UI only) | ✅ | — |
| Payout flow | ✅ | — |
| Admin dashboard | ✅ (web, separate repo) | — |

Phase 2 chat experience is intentionally deferred. Build Phase 1 end-to-end first.

## Tech Stack

| Layer | Choice | Reasoning |
|---|---|---|
| Mobile app | **Flutter** | Single codebase iOS + Android |
| State management | **Riverpod** | Modern, clean, testable |
| Routing | **GoRouter** | Declarative, deep-link friendly |
| Backend | **Supabase** (`ap-south-1`, Mumbai) | Auth + Postgres + Storage + Realtime + Edge Functions in one |
| Auth | **Supabase Auth** with custom SMS hook | OTP-based phone login |
| SMS provider | **MSG91** | Cheap Indian SMS (~₹0.25/SMS) via Supabase Send SMS Hook |
| Image hosting | **Cloudinary** | CDN, transformations, free tier 25GB |
| Sensitive photos | **Supabase Storage** (private bucket) | Verification photos stay in Mumbai for DPDP compliance |
| Payments | **Razorpay** | Coin purchases, webhook-driven coin credit |
| Push notifications | **FCM** (Firebase Cloud Messaging) | Android standard; iOS via APNs through Flutter's `firebase_messaging` |
| Real-time | **Supabase Realtime** | Online status, incoming chat requests, notifications |
| API docs | OpenAPI / Swagger (generated from `API_REFERENCE.md`) | — |

**Firebase Auth is NOT used.** Firebase is only present for FCM push delivery.

## Architecture in One Diagram (text form)

```
                  ┌─────────────────────────┐
                  │   Flutter Mobile App    │
                  │   (iOS + Android)       │
                  └────────────┬────────────┘
                               │
            ┌──────────────────┼──────────────────┐
            │                  │                  │
            ▼                  ▼                  ▼
   ┌─────────────────┐ ┌──────────────┐ ┌──────────────┐
   │    Supabase     │ │  Cloudinary  │ │     FCM      │
   │  (ap-south-1)   │ │   (CDN)      │ │  (push only) │
   │                 │ └──────────────┘ └──────────────┘
   │  - Auth         │
   │  - Postgres DB  │
   │  - Storage      │──────► Verification photos (private)
   │  - Realtime     │
   │  - Edge Funcs   │
   └────────┬────────┘
            │
   ┌────────┼────────┐
   │        │        │
   ▼        ▼        ▼
 ┌─────┐ ┌─────┐ ┌──────────┐
 │MSG91│ │Razor│ │  Admin   │
 │(SMS)│ │ pay │ │Dashboard │
 └─────┘ └─────┘ │(web app, │
                 │separate) │
                 └──────────┘
```

## Authentication Flow (read this carefully)

1. **User enters mobile number** in the app.
2. App calls `supabase.auth.signInWithOtp({ phone })`.
3. Supabase generates an OTP, stores it, and invokes the **Send SMS Hook** (configured to point at our Edge Function `send-sms-hook`).
4. The hook function calls **MSG91's API** with the OTP and phone number.
5. MSG91 delivers the SMS to the user.
6. User enters the OTP in the app.
7. App calls `supabase.auth.verifyOtp({ phone, token, type: 'sms' })`.
8. Supabase verifies, issues a JWT, app stores it via Flutter Secure Storage.
9. All subsequent API calls use this JWT; Row Level Security (RLS) policies in Postgres enforce per-user access.

**Why this works:** Supabase handles session lifecycle (creation, refresh, expiry, revocation, last-login timestamps, multiple-device support). MSG91 is purely the SMS delivery pipe. No JWT bridging needed.

## Repository Layout

This project is split across three repos (or one monorepo if preferred):

```
[app-name]/
├── mobile/                  # Flutter app (Phase 1 priority)
├── supabase/                # Database, edge functions, migrations
└── admin-dashboard/         # Web admin panel (Phase 2 timing)
```

Detailed folder structure: see [`PROJECT_STRUCTURE.md`](./PROJECT_STRUCTURE.md)

API endpoints: see [`API_REFERENCE.md`](./API_REFERENCE.md)

Screen specifications: see [`mobile_app_screen_spec.md`](./mobile_app_screen_spec.md)

## Development Workflow Conventions

- **Branch strategy:** `develop` is the integration branch, feature branches off `develop`, `main` is production-ready.
- **Backend commits always go to `develop`** until release-cut to `main`.
- **One issue at a time.** No broad sweeping changes.
- **Analysis before implementation.** When asked to fix a bug, first analyze and report findings; await confirmation before writing code.
- **Verification checkpoints.** When completing a task, produce a checklist of what was done and what was deliberately skipped.
- **Migrations are immutable.** Once committed to `develop`, never edit a migration file. Add a new one to alter.

## Environment Variables (for `.env`)

```
# Supabase
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # backend only, never in app
SUPABASE_JWT_SECRET=

# MSG91
MSG91_AUTH_KEY=
MSG91_SENDER_ID=
MSG91_OTP_TEMPLATE_ID=

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_UPLOAD_PRESET=

# Razorpay
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=

# FCM
FCM_SERVER_KEY=
FCM_PROJECT_ID=
```

Never commit `.env`. Use `.env.example` as the template.

## Open Design Decisions (track here)

- [ ] Coin deduction model: per-minute vs per-message vs flat per-session
- [ ] Chat session duration cap
- [ ] Hard vs soft delete on chat transcripts (admin)
- [ ] Refund policy for failed/disconnected chats
- [ ] Female photo retake permissions after verification
- [ ] Admin: shared login vs multi-admin with audit trail
- [ ] Coin package final prices (₹100/₹250/₹500/₹1000/₹2000/₹5000 placeholders)

## Compliance Checklist (DPDP Act 2023)

- [ ] Privacy Policy + Terms of Service drafted and linked in About App
- [ ] Explicit consent at verification photo upload
- [ ] Verification photos stored in `ap-south-1` (Mumbai)
- [ ] Data retention policy documented (how long after account deletion)
- [ ] User-initiated data export endpoint
- [ ] User-initiated data deletion endpoint
- [ ] Audit log on admin actions (verification, payout, account suspension)
