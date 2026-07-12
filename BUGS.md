# Dangg — Bug Batch Tracker

Status of the 24-item batch and which commit each maps to.
Legend: ✅ fixed & verified · 🟡 partial (blocked) · 📄 docs/verify-only

| # | Bug | Status | Commit theme |
|---|-----|--------|--------------|
| 1/15 | Female earnings: payout-history button | ✅ (already coded; was uncommitted) | female-earnings-pages |
| 2 | Recent activity shows +1.32 every chat | ✅ | duration-billing |
| 3 | Male wallet: spent −15 / +15 refund | ✅ | duration-billing |
| 4 | Delete option in chat history | ✅ per-user soft delete | delete-chat-history |
| 5 | Image + video sharing (camera/gallery) | ✅ (+ display via presigned GET) | chat-media |
| 6 | Male shows 5-min expiry (should 30s) | ✅ | request-expiry-30s |
| 7 | Male push-join loop / room entry | 🟡 blocked on FCM (disabled locally) | — |
| 8 | Empty favourites section | ✅ "No favorites added yet" | female-home |
| 9 | Remove earnings/spent from chat screens | ✅ | chat-screen-cleanup |
| 10 | Male chat-cancel button | ✅ | chat-screen-cleanup |
| 11 | Rating implementation summary | 📄 RATING_IMPLEMENTATION.md | docs |
| 12 | Male single chat costs flat 15 (→ 3s=1coin) | ✅ | duration-billing |
| 13 | Female live income = seconds × ₹0.04 | ✅ | duration-billing |
| 14 | Chat-history page not updating | ✅ verified (was stale build) | delete-chat-history |
| 16 | Remove "We'll send ₹1 to verify" (UPI) | ✅ | ui-fixes |
| 17 | Chat-declined page UI | ✅ Neue redesign | ui-fixes |
| 18 | Female "busy" while in a chat | ✅ | busy-state |
| 19 | Background → don't end + push "please join" | 🟡 tracking + no-eject + timer done; **push blocked on FCM** | background-presence |
| 20 | Male force-close → update female | ✅ presence heartbeat | force-close-presence |
| 21 | Remove refund concept | ✅ | duration-billing |
| 22 | Recent-activity "See all" + Earnings shortcut | ✅ | female-earnings-pages |
| 23 | Female background → male timer resume | ✅ pause/resume | background-presence |
| 24 | Female force-close → update male | ✅ presence heartbeat | force-close-presence |

## Backend migrations added (must also deploy to prod)
`20260616160000` verification-status RPC · `20260703120000` settlement (superseded) ·
`20260707120000` chat media · `20260712120000` busy · `20260712140000` presence heartbeat ·
`20260712160000` duration billing · `20260712180000` chat hide · `20260712200000` background presence

## Still open (needs Firebase / decision)
- **#7 + #19-push**: FCM is disabled locally (`No Firebase App`) — the "please join" push and
  push-driven room entry need `google-services.json` + a native rebuild.
- **#23 billing**: on-screen timer pauses during background, but settlement still bills
  `ended − started`; excluding paused seconds needs a tracked-pause subtraction.
