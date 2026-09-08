# notify-dispatch — server-side notification delivery

Replaces the client-side `addNotification`/`addBroadcastNotification` calls
sprinkled across every feature store with one server-side Edge Function,
triggered by Supabase Database Webhooks the moment the underlying row
actually changes. This fixes the core fragility of the client-side
approach: recipient resolution now runs once, reliably, server-side —
not from ~34 different call sites across 9 stores, each needing its own
(previously bug-prone) client-side logic.

**25 of this app's 28 `NotificationCategory` values are implemented.**
The remaining 3 are deliberately deferred, not overlooked — see the end
of this file for why.

## 1. Deploy the function

```bash
supabase functions deploy notify-dispatch
```

This uploads `index.ts`, `handlers.ts`, `helpers.ts`, and `types.ts` as a
single function. `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are
injected automatically — nothing to configure for those two.

## 2. Set the webhook secret

Generate any random string (e.g. `openssl rand -hex 32`) and set it:

```bash
supabase secrets set NOTIFY_WEBHOOK_SECRET=your-random-secret-here
```

You'll paste this same value into each webhook's custom header in step 3.
Without this, the function still works, but anyone who finds its URL
could insert fake notifications for any user — the service role key
inside `helpers.ts` bypasses RLS by design, so this header is the only
thing standing between "internal webhook" and "public write access."

## 3. Create the Database Webhooks

**Option A — migration (recommended, version-controlled):**

`supabase/migrations/20260905000000_notify_dispatch_webhooks.sql` creates
all 20 webhook triggers, plus the `supabase_functions.http_request()`
trigger function they call, in one file.

**The project URL and webhook secret are never hardcoded in this file** —
Postgres can't read a local `.env` (that's read by the Expo app's own
build tooling, an entirely different process from whatever runs this
SQL). They're stored in a plain table instead of a database-level custom
setting — `current_setting()` / `alter database ... set` needs true
Postgres superuser rights, which Supabase's managed `postgres` role does
**not** have (`ERROR: 42501: permission denied to set parameter`, if you
try). A table only needs ordinary privileges every role here already has:

```sql
create schema if not exists private;
create table if not exists private.app_config (
  key text primary key,
  value text not null
);
alter table private.app_config enable row level security;

insert into private.app_config (key, value) values
  ('notify_function_url', 'https://<your-project-ref>.supabase.co/functions/v1/notify-dispatch'),
  ('notify_webhook_secret', '<the exact value from `supabase secrets set NOTIFY_WEBHOOK_SECRET=...`>')
on conflict (key) do update set value = excluded.value;
```

RLS is enabled with zero policies, so nothing reaches this table through
the normal authenticated/anon/PostgREST path — only a migration or an
admin SQL-editor session (both running as the table's owner, which
bypasses RLS by default) can read it. Run this once per environment via
the SQL editor (or `supabase db execute`) **before** running the
migration, then:

```bash
supabase db push
```

If either value isn't there, the migration raises a clear error instead
of silently creating triggers pointed at nothing — the direct fix for
the actual mistake this file already went through twice (first: real
values never got substituted in; second: the `alter database` approach
this file used briefly turned out to need permissions Supabase doesn't
grant). `20260905000001_fix_notify_dispatch_webhooks.sql` exists
specifically to correct the first of those on an already-migrated
project.

A third issue surfaced only once a trigger actually fired for real (not
at migration time): `net.http_post`'s `body` parameter is `jsonb`, and
an earlier version of the trigger function cast it to `::text` instead —
Postgres can't find a matching function overload across that type
mismatch. `20260905000002_fix_notify_dispatch_http_post_types.sql`
corrects just the function body; it doesn't need to touch the triggers
themselves, since Postgres triggers call a function by name, not a
frozen copy of its definition.

Since this can't be tested against a live project from here, it's worth
a one-time sanity check before trusting it for all 20: create a single
webhook via the dashboard first (Option B, any one table), inspect its
generated trigger (**Database → Triggers**, or query
`select * from pg_trigger where tgname = '<webhook name>'`), and confirm
it matches this migration's shape. If it differs, the migration's DO
block generates every trigger from the same template — adjust it in that
one place.

This is safe to re-run (e.g. after rotating the secret — update the
`insert ... on conflict` above with the new value, then re-run) — every
trigger is dropped and recreated, not created bare.

**Option B — dashboard (manual, per-environment):**

In the Supabase dashboard: **Database → Webhooks → Create a new webhook**.
Repeat this for each row below — same function URL every time, different
table/event per row. Useful for the one-time verification above, or if
you'd rather not run raw DDL against `pg_trigger`.

Function URL: `https://<your-project-ref>.supabase.co/functions/v1/notify-dispatch`

HTTP headers for every webhook:
```
x-webhook-secret: <the value you set in step 2>
Content-Type: application/json
```

| Table | Events | Notes |
|---|---|---|
| `rxrfqs` | Update | One webhook, two handlers: draft→published broadcast and →awarded decision |
| `rxrfq_responses` | Insert | |
| `donations` | Insert | |
| `donation_responses` | Insert, Update | One handler, both events |
| `mediscope_requests` | Update | Same draft→published check as rxrfqs |
| `mediscope_responses` | Insert | |
| `jobs` | Insert | |
| `job_applications` | Insert, Update | One handler, both events |
| `ads` | Update | Fires only on pending→approved/rejected — not suspend/ban |
| `ad_comments` | Insert | |
| `consult_responses` | Insert | |
| `pharmacist_answers` | Insert | |
| `rxlink_requests` | Insert | |
| `rxlink_responses` | Insert | |
| `formulary_requests` | Update | Fires only on pending→decided |
| `facility_membership_requests` | Insert, Update | One handler, both events |
| `facility_creation_requests` | Update | Fires only on pending→decided |
| `organization_creation_requests` | Update | Fires only on pending→decided |
| `facility_organization_requests` | Insert, Update | One handler, both events |
| `profiles` | Update | Fires only when kyc_status actually changes, to verified/rejected |

Leave each webhook's "Payload" as the default (the whole row) — the
function reads `record`/`old_record` itself; no column filtering needed
on the webhook side.

## 4. Verify each one before moving to the next

After creating a webhook, trigger the real action in the app (publish an
RFQ, submit a formulary decision, etc.) and check the function's logs:

```bash
supabase functions logs notify-dispatch
```

You're looking for `insertNotification(...): sent to ...` or
`insertBroadcastNotification(...): sent to N recipient(s)`. If you see
`0 recipients`, that's the same "nobody's opted into this category yet"
situation from client-side testing — not a bug.

## 5. IMPORTANT — remove the matching client-side call once verified

Both the webhook and the original client-side `addNotification` call
would otherwise fire for the same event, producing duplicate
notifications. **Do this one table at a time, not all at once:**

1. Confirm the webhook for a table is delivering correctly (step 4).
2. Delete (or comment out) the corresponding `addNotification(...)` /
   `addBroadcastNotification(...)` call in the matching client store.
3. Move to the next table.

| Table (webhook) | Category | File → function |
|---|---|---|
| `rxrfqs` | `rxrfq_new_entry`, `rxrfq_award_decision` | `features/rxrfqs/hooks/use-rxrfq-data.ts` → `updateRxRfqStatus`, `awardRxRfqResponse` |
| `rxrfq_responses` | `rxrfq_response_received` | `features/rxrfqs/hooks/use-rxrfq-data.ts` → the response-insert function |
| `donations` | `donation_new_entry` | `features/donations/hooks/use-donation-data.ts` → `addDonation` |
| `donation_responses` | `donation_claim_received`, `donation_claim_decision` | `features/donations/hooks/use-donation-data.ts` → the claim-insert and approve/reject functions |
| `mediscope_requests` | `mediscope_new_entry` | `features/mediscope/hooks/use-mediscope-data.ts` → `addRequest`, `updateRequestStatus` |
| `mediscope_responses` | `mediscope_response_received` | `features/mediscope/hooks/use-mediscope-data.ts` → the response-insert function |
| `jobs` | `jobs_new_entry` | `features/rxjobs/hooks/use-rxjobs-data.ts` → `addJob` |
| `job_applications` | `jobs_application_received`, `jobs_application_status` | `features/rxjobs/hooks/use-rxjobs-data.ts` → the application-insert and `updateApplicationStatus` functions |
| `ads` | `ads_status_decision` | `features/ads/hooks/use-ads-data.ts` → `approveAd`, `rejectAd` |
| `ad_comments` | `ads_new_comment` | `features/ads/hooks/use-ads-data.ts` → the comment-insert function |
| `consult_responses` | `consult_response_received` | `features/help/hooks/use-help-data.ts` → the consult-response function |
| `pharmacist_answers` | `pharmacist_response_received` | `features/help/hooks/use-help-data.ts` → the pharmacist-answer function |
| `rxlink_requests` | `rxlink_new_entry` | `features/rxlink/hooks/use-rxlink-data.ts` → `submitRequest` |
| `rxlink_responses` | `rxlink_response_received` | `features/rxlink/hooks/use-rxlink-data.ts` → `respondToRequest` |
| `formulary_requests` | `formulary_request_decision` | `features/catalog/hooks/use-catalog-data.ts` → the approve/reject/merge functions |
| `facility_membership_requests` | `facility_membership_request_received`, `facility_membership_decision` | `features/profile/hooks/use-profile-data.ts` |
| `facility_creation_requests` | `facility_creation_decision` | `features/profile/hooks/use-profile-data.ts` → approve/reject functions |
| `organization_creation_requests` | `organization_creation_decision` | `features/profile/hooks/use-profile-data.ts` → approve/reject functions |
| `facility_organization_requests` | `facility_organization_request_received`, `facility_organization_decision` | `features/profile/hooks/use-profile-data.ts` |
| `profiles` | `kyc_decision` (user branch only — see below) | `features/profile/hooks/use-profile-data.ts` → `approveKyc`, `rejectKyc` (the `entityType === "user"` branch only) |

Leaving a webhook's matching client-side call in place a little longer
than necessary is harmless-but-noisy (duplicate notifications); removing
a client-side call before its webhook is confirmed working is a real gap
(the notification stops firing entirely for a moment). When in doubt,
verify first.

## 6. The 3 categories left deliberately unimplemented

Unlike every other gap this feature has hit this session, these aren't
oversights — each was checked against the actual app and found to have
no real trigger point (or to be redundant with something already
covered), not just skipped for time:

- **`chat_new_message`** — no `chat`/`chat_messages` table exists
  anywhere in this schema. This category was defined in the client-side
  `NotificationCategory` union ahead of the feature itself ever being
  built. Nothing to wire up until a chat feature exists.

- **`facility_member_added`** — the only place this app ever inserts
  into `facility_memberships` from a "someone joins" flow is inside
  `approveFacilityMembershipRequest`, which is the exact same event
  `facility_membership_decision` already notifies about (already
  implemented, `facility_membership_requests` webhook). Watching
  `facility_memberships` inserts too would fire a second, duplicate
  notification for the identical underlying event. If a future feature
  lets an admin add a member directly (bypassing the request flow
  entirely), that would be a genuinely new, distinct trigger point worth
  its own handler then.

- **`facility_added_to_organization`** — same reasoning as above, for
  the equivalent organization-side flow.

- **`kyc_decision` for facility/organization entities** — this one
  isn't in the "unimplemented" list above (the category itself works),
  but only the `profiles`-triggered branch (a user's own KYC) is wired
  up. Facility/organization KYC decisions still only fire from the
  client-side `approveKyc`/`rejectKyc` calls. Extending `handleProfiles`'s
  pattern to also watch `facilities.kyc_status` and
  `organizations.kyc_status` (recipient becomes that row's
  `admin_user_id` rather than its own `id`) follows the exact same shape
  as the existing handler — a small, mechanical addition whenever it's
  worth doing.

If any of these ever get their own real feature (direct member adds, a
chat system), come back to this file — the two-pattern approach
(`insertNotification` for a single recipient, `insertBroadcastNotification`
for everyone opted in) still applies exactly as it did to everything else
here.

## Column-name caution

Exact column names are worth double-checking against
`supabase/migrations/20260804000000_initial_schema.sql` (and
`20260806000000_facility_org_requests.sql`, `20260902000000_rxlink.sql`)
before writing any new handler — this project's client-side code hit a
few real, silent bugs earlier from assumed-but-wrong column names, e.g.
`formulary_requests` uses `created_by` (not `requested_by`, unlike most
other request tables), and `rxrfqs.awarded_vendor_id` actually stores a
`rxrfq_responses.id`, not a facility id, despite its name.
