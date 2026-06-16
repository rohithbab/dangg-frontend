# Push Notifications — Dangg

Two-sided marketplace: push is the **liquidity engine** (match an online male with an online female in real time). Providers (females) are the scarce side → prioritize supply-side notifications.

**Most important notification:** female "incoming chat request". The male already spent coins; it expires in minutes. Miss it → auto-refund + churn. Everything else is secondary to making this one instant and unmissable.

---

## Female (supply) — protect & grow earnings

| Notification | Type | Priority | Why |
|---|---|---|---|
| Incoming chat request | Transactional | Max — sound, heads-up, time-sensitive | Core revenue event; must beat the expiry timer |
| Earned ₹X from a chat | Transactional | Medium | Income confirmation → comes back online |
| Payout processed / rejected | Transactional | High | Money in hand; failed payout needs action |
| Verification approved / resubmit | Transactional | High | Activates a new earner |
| Peak hours — N users online, go online | Engagement | Low (quiet-hours aware) | Pulls supply online when demand is high |
| Inactivity win-back ("users asking for you") | Marketing | Low | Reactivates dormant earners |

## Male (demand) — drive spend & retention

| Notification | Type | Priority | Why |
|---|---|---|---|
| Request accepted — start chatting | Transactional | High | Pulls straight back into the paid flow |
| Request expired/declined → coins refunded | Transactional | Medium | Transparency; prevents "I got charged" disputes |
| Low coin balance | Engagement | Medium | Revenue nudge at moment of intent |
| Your favorite is online now | Engagement | Medium | Strongest re-engagement + spend trigger |
| Coin offers / first-purchase bonus / 2× weekend | Marketing | Low | Revenue (rate-limit hard) |
| Win-back ("new providers online", "unused coins") | Marketing | Low | Reactivation |

*Phase 2 only:* "new message in chat" (deferred with active chat).

---

## Build order

**MVP (covers the full revenue loop):**
1. Incoming chat request (female)
2. Request accepted (male)
3. Request expired/declined + refund (male)
4. Payout processed/rejected (female)
5. Verification result (female)

**Then (liquidity):** favorite-online (male), peak-hours go-online (female).
**Last (marketing):** offers, win-back.

---

## Technical

- **Channels/categories:** `Chat requests` (critical), `Earnings & payouts`, `Availability`, `Promotions` (opt-out). A promo opt-out must never disable the critical channel.
- **Incoming request:** high-priority FCM **data** message → app renders its own popup + countdown + sound even when backgrounded. Server-side retry. In-app Realtime listener is primary when foregrounded.
- **Deep links:** every push → exact screen (request popup, wallet, earnings, profile).
- **Privacy:** intimate-chat app → default generic text ("You have a new chat request"); offer a **"hide notification content"** setting. No names/photos on lock screen by default.
- **Quiet hours / availability windows:** respect per-user; don't fire when a female is set offline.
- **Token lifecycle:** `fcm-register` / `fcm_tokens` — register on login, clean up on logout/uninstall.
- **Fatigue cap:** hard weekly limit on marketing pushes. Over-notifying → opt-outs → lose the channel for money pushes.
- **Don't push every in-app notification** — only the ones above.

## Current state

- Events already emitted via `notify()` helper + `notifications` table (e.g. `chat_request_accepted`).
- FCM wired but **off**: `ENABLE_FIREBASE=false`, no `google-services.json`.
- Push = a delivery layer on existing events. To go live: add `google-services.json`, set `ENABLE_FIREBASE=true`, map the MVP events → FCM.
