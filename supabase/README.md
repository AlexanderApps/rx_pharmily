# RxPharmily — Supabase schema

## Applying this migration

```
supabase link --project-ref <your-project-ref>
supabase db push
```

Or, if you're developing locally with the Supabase CLI's local stack:

```
supabase start
supabase db reset
```

## What's in here

One migration (`20260804000000_initial_schema.sql`) covering every feature
in the app: identity & KYC, product catalog, RxRFQ, Donations, MediScope,
RxJobs, RxAds, Posts, Chat, Notifications, RxHelp, RxVitals. 49 tables, RLS
enabled on all of them, plus the helper functions the policies depend on
(`is_admin()`, `is_facility_member()`, `is_facility_owner()`,
`is_organization_admin()`, `can_view_rxrfq()`, `can_view_mediscope()`).

### A few things were corrected rather than translated literally

The frontend's mock data was necessarily scoped to a single implicit
"current user," which doesn't work as a real multi-user schema. These
became proper per-user tables instead:

- `Ad.userReaction` (one field) → `ad_reactions` (one row per user per ad)
- `Post.hasLiked` + `likeCount` → `post_likes` (one row per user per post)
- `Poll.votedOptionId` → `poll_votes` (one row per user per poll)
- `Conversation.participant` (singular) + `unreadCount` (one scalar) →
  `conversation_participants` (both sides stored explicitly, each with
  their own unread count)

Auth itself is a full replacement, not a translation: the app's mock
`AuthAccount` (plaintext password, for UI-testing only) is gone entirely.
`profiles` extends Supabase's built-in `auth.users` 1:1, created
automatically by the `handle_new_user` trigger on signup, and carries the
one thing from the mock that still matters for a real schema —
`account_role` (admin vs user).

RxRFQ's and MediScope's visibility-rule system (region / facility type /
specific facility) is enforced for real in RLS via `can_view_rxrfq()` /
`can_view_mediscope()`, not simplified to "everyone sees everything." Both
features share the same `rxrfq_visibility_scope` / `rxrfq_visibility_rule_type`
enums rather than declaring duplicates, since the two systems are
identical in shape.

## What this migration does NOT do

- **No storage buckets.** Every `image_uri` / `uri` / `media_url` type
  column is a plain `text` field — wire up Supabase Storage buckets (and
  point these columns at the resulting object paths/URLs) separately.
- **No Edge Functions / triggers that write `notifications`.** The
  `notifications` table has RLS policies for read/update/delete by the
  owning user, but deliberately no "insert own" policy — notifications are
  meant to be written by backend logic reacting to other tables changing
  (a new RFQ response, a KYC decision, etc.), not inserted directly by
  whoever they're about. That backend logic — triggers, Edge Functions, or
  your API layer — isn't included here.
- **No seed data.** This is schema only.
- **Not validated against a real Postgres instance.** I don't have a
  Postgres/Supabase connection available to actually run this migration
  against — I checked it thoroughly by hand instead (table-creation order
  against all 77 foreign keys, every enum type declared vs. used, balanced
  parens and dollar-quoted function bodies), but "syntactically sound on
  review" isn't the same guarantee as "ran cleanly." Run `supabase db
  push` against a scratch project first, not production.
- **No storage/compute cost tuning.** Indexes cover the columns the app's
  existing query patterns actually filter/join on, but this hasn't been
  load-tested.
