# Chat Requests — Phase 1 (spec 1.28, 2.24 → 2.29)

Phase 1 covers the **request lifecycle** only. Active chat is Phase 2 and
intentionally out of scope.

## Screens

- ChatRequestSentScreen (male waiting)
- ChatRequestAcceptedScreen (bridge to Phase 2)
- ChatRequestDeclinedScreen
- ChatRequestTimeoutScreen
- QueuePositionScreen
- LikeDislikeRatingScreen (post-chat — Phase 2 will navigate here)

## Components

- IncomingChatRequestModal (female receives — auto-decline countdown 30s)

## Architecture notes

- Male subscribes to `chat_requests:male_id=eq.<uid>` UPDATE events.
- Female subscribes to `chat_requests:female_id=eq.<uid>` INSERT events.
- `POST /functions/v1/chat-request-create` is **non-idempotent** — never
  wrap in `retryWithBackoff`.
- 402 from create → insufficient coins → route to Wallet.
- 429 → queue full → push QueuePositionScreen.

## External integrations

- Supabase Realtime.
