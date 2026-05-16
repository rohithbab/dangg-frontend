# Block & Report (spec 1.29, 2.30)

## Components

- BlockReportBottomSheet — reused from female and male profiles.

## Architecture notes

- Two distinct writes:
  - `POST /rest/v1/reports` for moderation queue.
  - `POST /rest/v1/blocks` for one-way user-to-user block.
- Blocking does NOT auto-unfavourite — that's a separate decision.
- Submitting a report does NOT auto-block.
- Sheet uses `core/components/BottomSheet` so the look matches every other sheet.

## External integrations

None.
