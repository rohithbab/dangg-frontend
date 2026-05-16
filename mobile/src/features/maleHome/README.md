# Male Home (spec 2.6, 2.7)

## Screens

- MaleHomeScreen — default tab after male login
- FemaleProfilePreviewScreen — opened from a female card body

## Components

- FavouritesCarousel — horizontal FlashList
- AvailableFemaleCard — vertical list row
- FemaleSearchFilterSheet — bottom sheet for filters

## Architecture notes

- Available-female list paginated (FlashList, limit 20).
- Search input debounced via `useDebounce` before triggering the query.
- Favourites are optimistic — local toggle then reconcile with backend.
- Subscribe to favourites' `online_status` so a watched female lighting
  up appears instantly.

## External integrations

- Supabase Realtime — favourites' presence.
