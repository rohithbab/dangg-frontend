# Notifications (spec 1.27, 2.23)

## Screens

- NotificationsScreen

## Architecture notes

- Paginated FlashList against `/rest/v1/notifications` (limit 20).
- Unread badge count comes from a separate count query — keep both stores
  in sync to avoid double-counting on optimistic mark-as-read.
- "Mark all read" PATCH on `is_read=eq.false`.
- Subscribe to realtime INSERTs to bump the unread badge.
- Notification tap deep-links via `linking.ts` config in
  `src/navigation/`.

## External integrations

- FCM (handled by `core/services/fcmService.ts`).
- Supabase Realtime.
