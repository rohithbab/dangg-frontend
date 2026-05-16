# Female Home (spec 1.14)

## Screens

- FemaleHomeScreen — default tab after female login.

## Components (feature-local)

- AvailabilityToggleCard — online/offline toggle with status text.
- StatsGrid — 2×2 grid (Total Earnings, Today, Rating, Total Chats).
- RecentActivityList — last 3 chats (no "See more").

## Architecture notes

- Availability toggle is a single PATCH on `females.online_status` — fire
  optimistically; rollback on failure.
- Subscribe to realtime channel `chat_requests:female_id=eq.<uid>` via
  `useRealtimeChannel` so incoming popups show even from home.
- Stats grid: one joined query (`females` + aggregate over
  `chat_sessions where started_at >= today`).
- Recent activity is paginated (`usePagination`, limit 20 default).

## External integrations

- Supabase Realtime — incoming chat-request popup.
