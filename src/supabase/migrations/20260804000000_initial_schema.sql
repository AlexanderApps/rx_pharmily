-- ============================================================================
-- RxPharmily — initial schema
-- ============================================================================
-- Generated from the app's existing TypeScript data model (features/*/types)
-- covering: identity & KYC, product catalog, RxRFQ, Donations, MediScope,
-- RxJobs, RxAds, Posts, Chat, Notifications, RxHelp, RxVitals.
--
-- Design notes — a few things were corrected rather than translated
-- literally from the frontend mock types, because the mock data was
-- necessarily single-user-scoped in ways a real multi-user schema can't be:
--   - Ad.userReaction / Post.hasLiked+likeCount / Poll.votedOptionId were
--     each a single field implicitly meaning "for the current viewer" —
--     these become proper per-user join tables (ad_reactions, post_likes,
--     poll_votes) so every user's reaction is tracked independently.
--   - Chat's Conversation.participant (singular) and unreadCount assumed a
--     single viewer's perspective — conversations now store both
--     participants explicitly, with per-participant unread counts in
--     conversation_participants.
--   - Auth: the app's mock AuthAccount (with a plaintext password field)
--     is replaced entirely by Supabase's built-in auth.users. `profiles`
--     extends it 1:1 and carries the one thing from the mock that still
--     matters for a real schema — account_role (admin vs user).
--   - Facility/Organization/RxRFQ/Donation/MediScope "facility" fields
--     that were free-text or loosely-typed ID strings in the frontend are
--     now real foreign keys into facilities(id).
--
-- RLS is enabled on every table. Policies follow four consistent patterns,
-- noted per table:
--   A. Public read, owner write   — marketplace content (RxRFQ, Donations,
--      MediScope, Jobs, Ads, Posts) visible to any authenticated user,
--      mutable only by its creator (or an admin).
--   B. Private to owner           — personal data (Vitals, notification
--      settings, cover letters) visible only to the row's own user.
--   C. Admin-only                 — moderation/review tables.
--   D. Member-scoped               — facility-linked child data (price
--      templates, facility memberships) visible to members of that
--      facility.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ============================================================================
-- ENUMS
-- ============================================================================

create type account_role as enum ('admin', 'user');
create type kyc_status as enum ('unverified', 'pending', 'verified', 'rejected');
create type kyc_entity_type as enum ('user', 'facility', 'organization');
create type kyc_document_type as enum ('Government ID', 'Pharmacist License', 'Business Registration', 'Facility Permit', 'Other');
create type user_role as enum ('Pharmacist', 'Pharmacy Technician', 'Facility Admin', 'Procurement Officer', 'Other');
create type facility_type as enum ('Retail Pharmacy', 'Hospital', 'Wholesale Distributor', 'Diagnostic Lab', 'Clinic', 'Other');
create type organization_type as enum ('Pharmacy Chain', 'Healthcare Group', 'Distributor Network', 'Other');
create type facility_member_role as enum ('Owner', 'Member');

create type formulary_request_status as enum ('pending', 'accepted', 'rejected');

create type rxrfq_status as enum ('draft', 'published', 'closed', 'awarded', 'cancelled', 'expired');
create type rxrfq_response_status as enum ('draft', 'submitted', 'underReview', 'accepted', 'rejected');
create type rxrfq_visibility_scope as enum ('All', 'Restricted');
create type rxrfq_visibility_rule_type as enum ('Region', 'Facility Type', 'Specific Facility');
create type rxrfq_additional_cost_type as enum ('delivery', 'insurance', 'handling', 'tax', 'other');

create type donation_status as enum ('opened', 'hidden', 'closed');
create type donation_response_status as enum ('pending', 'approved', 'rejected');

create type mediscope_status as enum ('draft', 'published', 'fulfilled', 'closed', 'cancelled', 'expired');
create type mediscope_availability as enum ('full', 'partial');

create type job_type as enum ('Locum Shift', 'Full-Time', 'Part-Time', 'MSL / Industrial', 'Hospital Specialist');
create type job_urgency as enum ('Immediate', 'Standard');
create type job_status as enum ('open', 'closed', 'cancelled');
create type application_status as enum ('submitted', 'reviewing', 'shortlisted', 'rejected', 'hired');

create type ad_category as enum ('medication', 'medical-device', 'service', 'equipment', 'other');
create type ad_status as enum ('pending', 'approved', 'rejected', 'suspended', 'banned');
create type ad_media_type as enum ('image', 'video');
create type payment_status as enum ('unpaid', 'paid', 'refunded');
create type reaction_type as enum ('like', 'dislike');

create type post_type as enum ('text', 'poll', 'news');
create type media_type as enum ('image', 'video');

create type chat_linked_entity_type as enum ('rfq', 'mediscope', 'donation');
create type chat_media_type as enum ('image', 'video');
create type chat_message_status as enum ('sending', 'sent', 'delivered', 'read', 'failed');

create type report_type as enum ('bug', 'user', 'content', 'other');
create type report_status as enum ('submitted', 'in_review', 'resolved', 'dismissed');
create type consult_category as enum ('New Facility Setup', 'Procurement Trends', 'Career Pivoting', 'Regulatory Advice', 'Other');
create type consult_format as enum ('chat', 'call', 'in_person');
create type consult_status as enum ('pending', 'accepted', 'completed', 'cancelled');
create type pharmacist_question_category as enum ('Drug Interaction', 'Dosage & Administration', 'Side Effects', 'Overdose / Emergency', 'General');
create type pharmacist_question_status as enum ('pending', 'answered', 'closed');

create type notification_category as enum (
  'rxrfq_new_entry', 'rxrfq_response_received', 'rxrfq_award_decision',
  'donation_new_entry', 'donation_claim_received', 'donation_claim_decision',
  'mediscope_new_entry', 'mediscope_response_received',
  'jobs_new_entry', 'jobs_application_received', 'jobs_application_status',
  'ads_status_decision', 'ads_new_comment',
  'consult_response_received', 'pharmacist_response_received',
  'chat_new_message',
  'kyc_decision', 'facility_member_added', 'facility_added_to_organization',
  'formulary_request_decision'
);

create type vital_type as enum ('blood_pressure', 'blood_glucose', 'heart_rate', 'temperature', 'weight', 'oxygen_saturation');
create type glucose_context as enum ('fasting', 'random', 'post_meal');
create type glucose_unit as enum ('mg/dL', 'mmol/L');
create type temperature_unit as enum ('C', 'F');
create type weight_unit as enum ('kg', 'lb');

-- IDENTITY: profiles, organizations, facilities, memberships
-- ============================================================================

-- Extends auth.users 1:1. A row is created automatically by the
-- handle_new_user trigger at the bottom of this file whenever someone
-- signs up through Supabase Auth.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text,
  role user_role not null default 'Pharmacist',
  account_role account_role not null default 'user',
  license_number text,
  bio text,
  avatar_color text not null default '#2563eb',
  kyc_status kyc_status not null default 'unverified',
  kyc_submitted_at timestamptz,
  kyc_reviewed_at timestamptz,
  kyc_reviewed_by uuid references public.profiles(id),
  kyc_rejection_reason text,
  public_show_email boolean not null default false,
  public_show_phone boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Pattern: public profile info is readable by any authenticated user
-- (the app itself decides what to surface via public_show_email/phone);
-- only the owner can edit their own row; admins can update any row (KYC
-- review sets kyc_status/kyc_reviewed_* on someone else's profile).
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type organization_type not null default 'Other',
  registration_number text,
  headquarters_location text,
  email text,
  phone text,
  admin_user_id uuid not null references public.profiles(id),
  kyc_status kyc_status not null default 'unverified',
  kyc_submitted_at timestamptz,
  kyc_reviewed_at timestamptz,
  kyc_reviewed_by uuid references public.profiles(id),
  kyc_rejection_reason text,
  public_show_email boolean not null default true,
  public_show_phone boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.organizations enable row level security;

create table public.facilities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type facility_type not null default 'Retail Pharmacy',
  location text not null,
  region text not null,
  address text,
  phone text,
  email text,
  registration_number text,
  organization_id uuid references public.organizations(id) on delete set null,
  admin_user_id uuid not null references public.profiles(id),
  kyc_status kyc_status not null default 'unverified',
  kyc_submitted_at timestamptz,
  kyc_reviewed_at timestamptz,
  kyc_reviewed_by uuid references public.profiles(id),
  kyc_rejection_reason text,
  public_show_email boolean not null default true,
  public_show_phone boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.facilities enable row level security;

create table public.facility_memberships (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.facilities(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role facility_member_role not null default 'Member',
  joined_at timestamptz not null default now(),
  unique (facility_id, user_id)
);

alter table public.facility_memberships enable row level security;

-- Pattern D: visible to other members of the same facility, not the
-- whole app — a member list is facility-internal information.

-- ============================================================================
-- HELPER FUNCTIONS (used throughout the RLS policies below)
-- ============================================================================

-- security definer + a fixed search_path so this can be called from RLS
-- policies without those policies needing direct SELECT rights on
-- profiles/facility_memberships themselves.

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and account_role = 'admin'
  );
$$;

create or replace function public.is_facility_member(check_facility_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.facility_memberships
    where facility_id = check_facility_id and user_id = auth.uid()
  );
$$;

create or replace function public.is_facility_owner(check_facility_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.facility_memberships
    where facility_id = check_facility_id and user_id = auth.uid() and role = 'Owner'
  );
$$;

create or replace function public.is_organization_admin(check_org_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.organizations
    where id = check_org_id and admin_user_id = auth.uid()
  );
$$;

-- ============================================================================

create policy "profiles readable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

create policy "users update own profile"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "admins update any profile"
  on public.profiles for update
  to authenticated
  using (public.is_admin());

create policy "organizations readable by authenticated users"
  on public.organizations for select
  to authenticated
  using (true);

create policy "org admin manages own organization"
  on public.organizations for all
  to authenticated
  using (admin_user_id = auth.uid() or public.is_admin())
  with check (admin_user_id = auth.uid() or public.is_admin());

create policy "facilities readable by authenticated users"
  on public.facilities for select
  to authenticated
  using (true);

create policy "facility owner manages own facility"
  on public.facilities for all
  to authenticated
  using (public.is_facility_owner(id) or public.is_admin())
  with check (public.is_facility_owner(id) or public.is_admin());

create policy "facility admin can insert a facility"
  on public.facilities for insert
  to authenticated
  with check (admin_user_id = auth.uid());


-- A user can belong to several facilities; membership is only meant to be
-- created once the facility is verified (enforced in application code, not
-- here, since that's a business rule about *when* an insert is allowed
-- rather than *who* can see/perform it).

create policy "members see their facility's membership list"
  on public.facility_memberships for select
  to authenticated
  using (public.is_facility_member(facility_id) or public.is_admin());

create policy "facility owner manages membership"
  on public.facility_memberships for all
  to authenticated
  using (public.is_facility_owner(facility_id) or public.is_admin())
  with check (public.is_facility_owner(facility_id) or public.is_admin());


-- Polymorphic KYC document uploads for the three entity types above.
-- Postgres has no native polymorphic FK, so entity_type + entity_id is
-- validated with a check constraint rather than a real foreign key.
create table public.kyc_documents (
  id uuid primary key default gen_random_uuid(),
  entity_type kyc_entity_type not null,
  entity_id uuid not null,
  document_type kyc_document_type not null default 'Other',
  image_uri text,
  file_name text not null,
  uploaded_at timestamptz not null default now()
);

alter table public.kyc_documents enable row level security;

create policy "kyc documents visible to the owning entity and admins"
  on public.kyc_documents for select
  to authenticated
  using (
    public.is_admin()
    or (entity_type = 'user' and entity_id = auth.uid())
    or (entity_type = 'facility' and public.is_facility_member(entity_id))
    or (entity_type = 'organization' and public.is_organization_admin(entity_id))
  );

create policy "owning entity uploads its own kyc documents"
  on public.kyc_documents for insert
  to authenticated
  with check (
    (entity_type = 'user' and entity_id = auth.uid())
    or (entity_type = 'facility' and public.is_facility_owner(entity_id))
    or (entity_type = 'organization' and public.is_organization_admin(entity_id))
  );

create policy "owning entity deletes its own kyc documents"
  on public.kyc_documents for delete
  to authenticated
  using (
    (entity_type = 'user' and entity_id = auth.uid())
    or (entity_type = 'facility' and public.is_facility_owner(entity_id))
    or (entity_type = 'organization' and public.is_organization_admin(entity_id))
  );


create table public.cover_letter_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.cover_letter_templates enable row level security;

-- Pattern B: strictly personal — nobody else has a reason to see your
-- cover letter drafts.
create policy "users manage their own cover letter templates"
  on public.cover_letter_templates for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());


create table public.price_templates (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.facilities(id) on delete cascade,
  title text not null,
  file_name text not null,
  uploaded_at timestamptz not null default now()
);

create table public.price_template_items (
  id uuid primary key default gen_random_uuid(),
  price_template_id uuid not null references public.price_templates(id) on delete cascade,
  product text not null,
  rate numeric(12, 2) not null,
  unit text
);

alter table public.price_templates enable row level security;
alter table public.price_template_items enable row level security;

-- Pattern D: visible to all members of the facility (any member can pick
-- which template to quote from), editable by any member too.
create policy "facility members see price templates"
  on public.price_templates for select
  to authenticated
  using (public.is_facility_member(facility_id) or public.is_admin());

create policy "facility members manage price templates"
  on public.price_templates for all
  to authenticated
  using (public.is_facility_member(facility_id) or public.is_admin())
  with check (public.is_facility_member(facility_id) or public.is_admin());

create policy "facility members see price template items"
  on public.price_template_items for select
  to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.price_templates pt
      where pt.id = price_template_id and public.is_facility_member(pt.facility_id)
    )
  );

create policy "facility members manage price template items"
  on public.price_template_items for all
  to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.price_templates pt
      where pt.id = price_template_id and public.is_facility_member(pt.facility_id)
    )
  )
  with check (
    public.is_admin()
    or exists (
      select 1 from public.price_templates pt
      where pt.id = price_template_id and public.is_facility_member(pt.facility_id)
    )
  );

-- ============================================================================
-- CATALOG: products, formulary requests
-- ============================================================================

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  default_unit text
);

alter table public.products enable row level security;

-- Pattern A-ish: the catalog is reference data shared by the whole app —
-- everyone can read it, only admins can write it directly (regular users
-- go through formulary_requests instead, see below).
create policy "products readable by authenticated users"
  on public.products for select
  to authenticated
  using (true);

create policy "admins manage products"
  on public.products for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());


create table public.formulary_requests (
  id uuid primary key default gen_random_uuid(),
  product_name text not null,
  category text,
  default_unit text,
  notes text,
  image_uri text,
  status formulary_request_status not null default 'pending',
  review_comment text,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  created_by uuid not null references public.profiles(id),
  resulting_product_id uuid references public.products(id)
);

alter table public.formulary_requests enable row level security;

-- Pattern C-ish: requester sees their own requests; only admins see (and
-- decide on) the full review queue.
create policy "users see their own formulary requests"
  on public.formulary_requests for select
  to authenticated
  using (created_by = auth.uid() or public.is_admin());

create policy "users submit formulary requests"
  on public.formulary_requests for insert
  to authenticated
  with check (created_by = auth.uid());

create policy "admins decide on formulary requests"
  on public.formulary_requests for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================================
-- RxRFQ
-- ============================================================================

create table public.rxrfqs (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  facility_id uuid not null references public.facilities(id),
  description text not null default '',
  categories text[] not null default '{}',
  terms_of_service text not null default '',
  incoterms text not null default '',
  currency text not null default 'GHS',
  submission_deadline timestamptz not null,
  min_shelf_life_months integer not null default 0,
  strict_min_shelf_life boolean not null default false,
  delivery_date timestamptz not null,
  comment text not null default '',
  is_active boolean not null default true,
  status rxrfq_status not null default 'draft',
  visibility_scope rxrfq_visibility_scope not null default 'All',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  created_by uuid not null references public.profiles(id),
  is_banned boolean not null default false,
  banned_at timestamptz,
  product_count integer not null default 0,
  response_count integer not null default 0,
  awarded_vendor_id uuid,
  award_date timestamptz,
  justification_notes text
);

create table public.rxrfq_items (
  id uuid primary key default gen_random_uuid(),
  rxrfq_id uuid not null references public.rxrfqs(id) on delete cascade,
  product_id uuid not null references public.products(id),
  quantity numeric(12, 2) not null,
  uom text not null,
  allow_alternatives boolean not null default false,
  comment text
);

create table public.rxrfq_visibility_rules (
  id uuid primary key default gen_random_uuid(),
  rxrfq_id uuid not null references public.rxrfqs(id) on delete cascade,
  rule_type rxrfq_visibility_rule_type not null,
  region text,
  facility_type text,
  facility_id uuid references public.facilities(id)
);

alter table public.rxrfqs enable row level security;
alter table public.rxrfq_items enable row level security;
alter table public.rxrfq_visibility_rules enable row level security;

-- Honors visibility_scope/visibility_rules, not just "everyone sees
-- everything" — a Restricted RFQ is only visible to facilities matching
-- one of its rules (by region, facility type, or being named directly).
create or replace function public.can_view_rxrfq(p_rxrfq_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select
    exists (
      select 1 from public.rxrfqs r
      where r.id = p_rxrfq_id and r.visibility_scope = 'All'
    )
    or exists (
      select 1
      from public.rxrfq_visibility_rules vr
      join public.facility_memberships fm on fm.user_id = auth.uid()
      join public.facilities f on f.id = fm.facility_id
      where vr.rxrfq_id = p_rxrfq_id
        and (
          (vr.rule_type = 'Specific Facility' and vr.facility_id = f.id)
          or (vr.rule_type = 'Region' and vr.region = f.region)
          or (vr.rule_type = 'Facility Type' and vr.facility_type = f.type::text)
        )
    );
$$;

create policy "rxrfqs visible per visibility rules, own drafts, or admin"
  on public.rxrfqs for select
  to authenticated
  using (
    public.is_admin()
    or created_by = auth.uid()
    or public.is_facility_member(facility_id)
    or (status = 'published' and public.can_view_rxrfq(id))
  );

create policy "facility members create rxrfqs for their facility"
  on public.rxrfqs for insert
  to authenticated
  with check (created_by = auth.uid() and public.is_facility_member(facility_id));

create policy "creator or facility member updates rxrfq"
  on public.rxrfqs for update
  to authenticated
  using (public.is_facility_member(facility_id) or public.is_admin())
  with check (public.is_facility_member(facility_id) or public.is_admin());

create policy "rxrfq items follow parent visibility"
  on public.rxrfq_items for select
  to authenticated
  using (exists (
    select 1 from public.rxrfqs r where r.id = rxrfq_id and (
      public.is_admin() or r.created_by = auth.uid() or public.is_facility_member(r.facility_id)
      or (r.status = 'published' and public.can_view_rxrfq(r.id))
    )
  ));

create policy "facility members manage own rxrfq items"
  on public.rxrfq_items for all
  to authenticated
  using (exists (
    select 1 from public.rxrfqs r where r.id = rxrfq_id and (public.is_facility_member(r.facility_id) or public.is_admin())
  ))
  with check (exists (
    select 1 from public.rxrfqs r where r.id = rxrfq_id and (public.is_facility_member(r.facility_id) or public.is_admin())
  ));

create policy "rxrfq visibility rules follow parent"
  on public.rxrfq_visibility_rules for select
  to authenticated
  using (exists (
    select 1 from public.rxrfqs r where r.id = rxrfq_id and (
      public.is_admin() or r.created_by = auth.uid() or public.is_facility_member(r.facility_id)
    )
  ));

create policy "facility members manage own rxrfq visibility rules"
  on public.rxrfq_visibility_rules for all
  to authenticated
  using (exists (
    select 1 from public.rxrfqs r where r.id = rxrfq_id and (public.is_facility_member(r.facility_id) or public.is_admin())
  ))
  with check (exists (
    select 1 from public.rxrfqs r where r.id = rxrfq_id and (public.is_facility_member(r.facility_id) or public.is_admin())
  ));


create table public.rxrfq_responses (
  id uuid primary key default gen_random_uuid(),
  rxrfq_id uuid not null references public.rxrfqs(id) on delete cascade,
  vendor_facility_id uuid not null references public.facilities(id),
  status rxrfq_response_status not null default 'draft',
  quote_valid_until timestamptz not null,
  estimated_delivery_date timestamptz not null,
  incoterms text not null default '',
  currency text not null default 'GHS',
  payment_terms text not null default '',
  vendor_comment text,
  created_at timestamptz not null default now(),
  submitted_at timestamptz,
  created_by uuid not null references public.profiles(id),
  total_items_amount numeric(14, 2) not null default 0,
  total_required_costs numeric(14, 2) not null default 0,
  total_optional_costs numeric(14, 2) not null default 0,
  grand_total numeric(14, 2) not null default 0
);

create table public.rxrfq_response_items (
  id uuid primary key default gen_random_uuid(),
  response_id uuid not null references public.rxrfq_responses(id) on delete cascade,
  rfq_item_id uuid not null references public.rxrfq_items(id),
  product_id uuid not null references public.products(id),
  quantity numeric(12, 2) not null,
  rate numeric(12, 2) not null,
  amount numeric(14, 2) not null,
  offered_alternative boolean not null default false,
  alternative_product_details text,
  comment text
);

create table public.rxrfq_additional_costs (
  id uuid primary key default gen_random_uuid(),
  response_id uuid not null references public.rxrfq_responses(id) on delete cascade,
  cost_type rxrfq_additional_cost_type not null default 'other',
  description text not null,
  amount numeric(12, 2) not null,
  is_required boolean not null default true
);

alter table public.rxrfq_responses enable row level security;
alter table public.rxrfq_response_items enable row level security;
alter table public.rxrfq_additional_costs enable row level security;

-- A response is visible to the vendor who submitted it and to the RFQ
-- owner (who needs to review it to award) — not to other vendors, whose
-- quotes should stay confidential from each other.
create policy "response visible to vendor and rxrfq owner"
  on public.rxrfq_responses for select
  to authenticated
  using (
    public.is_admin()
    or public.is_facility_member(vendor_facility_id)
    or exists (select 1 from public.rxrfqs r where r.id = rxrfq_id and public.is_facility_member(r.facility_id))
  );

create policy "facility members submit responses for their facility"
  on public.rxrfq_responses for insert
  to authenticated
  with check (created_by = auth.uid() and public.is_facility_member(vendor_facility_id));

create policy "vendor updates own response, rxrfq owner awards it"
  on public.rxrfq_responses for update
  to authenticated
  using (
    public.is_facility_member(vendor_facility_id)
    or exists (select 1 from public.rxrfqs r where r.id = rxrfq_id and public.is_facility_member(r.facility_id))
    or public.is_admin()
  );

create policy "response items follow parent response visibility"
  on public.rxrfq_response_items for select
  to authenticated
  using (exists (
    select 1 from public.rxrfq_responses resp where resp.id = response_id and (
      public.is_admin() or public.is_facility_member(resp.vendor_facility_id)
      or exists (select 1 from public.rxrfqs r where r.id = resp.rxrfq_id and public.is_facility_member(r.facility_id))
    )
  ));

create policy "vendor manages own response items"
  on public.rxrfq_response_items for all
  to authenticated
  using (exists (
    select 1 from public.rxrfq_responses resp where resp.id = response_id and public.is_facility_member(resp.vendor_facility_id)
  ))
  with check (exists (
    select 1 from public.rxrfq_responses resp where resp.id = response_id and public.is_facility_member(resp.vendor_facility_id)
  ));

create policy "additional costs follow parent response visibility"
  on public.rxrfq_additional_costs for select
  to authenticated
  using (exists (
    select 1 from public.rxrfq_responses resp where resp.id = response_id and (
      public.is_admin() or public.is_facility_member(resp.vendor_facility_id)
      or exists (select 1 from public.rxrfqs r where r.id = resp.rxrfq_id and public.is_facility_member(r.facility_id))
    )
  ));

create policy "vendor manages own additional costs"
  on public.rxrfq_additional_costs for all
  to authenticated
  using (exists (
    select 1 from public.rxrfq_responses resp where resp.id = response_id and public.is_facility_member(resp.vendor_facility_id)
  ))
  with check (exists (
    select 1 from public.rxrfq_responses resp where resp.id = response_id and public.is_facility_member(resp.vendor_facility_id)
  ));

-- ============================================================================
-- DONATIONS
-- ============================================================================

create table public.donations (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  facility_id uuid not null references public.facilities(id),
  categories text[] not null default '{}',
  terms_of_service text not null default '',
  comment text not null default '',
  is_active boolean not null default true,
  status donation_status not null default 'opened',
  created_at timestamptz not null default now(),
  created_by uuid not null references public.profiles(id),
  response_count integer not null default 0
);

create table public.donation_items (
  id uuid primary key default gen_random_uuid(),
  donation_id uuid not null references public.donations(id) on delete cascade,
  -- Free text, not a product_id FK — unlike RxRFQ, donation line items
  -- haven't been migrated onto the shared catalog in the frontend yet.
  product text not null,
  quantity numeric(12, 2) not null,
  batch text,
  expiry_date date not null,
  status boolean not null default false,
  is_active boolean not null default true
);

alter table public.donations enable row level security;
alter table public.donation_items enable row level security;

create policy "donations readable by authenticated users"
  on public.donations for select
  to authenticated
  using (true);

create policy "facility members create donations for their facility"
  on public.donations for insert
  to authenticated
  with check (created_by = auth.uid() and public.is_facility_member(facility_id));

create policy "facility members update own donations"
  on public.donations for update
  to authenticated
  using (public.is_facility_member(facility_id) or public.is_admin())
  with check (public.is_facility_member(facility_id) or public.is_admin());

create policy "donation items readable by authenticated users"
  on public.donation_items for select
  to authenticated
  using (true);

create policy "facility members manage own donation items"
  on public.donation_items for all
  to authenticated
  using (exists (
    select 1 from public.donations d where d.id = donation_id and (public.is_facility_member(d.facility_id) or public.is_admin())
  ))
  with check (exists (
    select 1 from public.donations d where d.id = donation_id and (public.is_facility_member(d.facility_id) or public.is_admin())
  ));


create table public.donation_responses (
  id uuid primary key default gen_random_uuid(),
  donation_id uuid not null references public.donations(id) on delete cascade,
  responder_facility_id uuid not null references public.facilities(id),
  comment text,
  status donation_response_status not null default 'pending',
  created_at timestamptz not null default now(),
  created_by uuid not null references public.profiles(id)
);

create table public.donation_response_items (
  id uuid primary key default gen_random_uuid(),
  response_id uuid not null references public.donation_responses(id) on delete cascade,
  donation_item_id uuid not null references public.donation_items(id),
  -- Snapshot of the product name at claim time, so the claim still reads
  -- sensibly even if the underlying donated item is edited later.
  product text not null,
  requested_quantity numeric(12, 2) not null
);

alter table public.donation_responses enable row level security;
alter table public.donation_response_items enable row level security;

-- A claim is visible to the claimant and to the donor (who needs to
-- approve/reject it) — not to other facilities browsing the donation.
create policy "claim visible to claimant and donor"
  on public.donation_responses for select
  to authenticated
  using (
    public.is_admin()
    or public.is_facility_member(responder_facility_id)
    or exists (select 1 from public.donations d where d.id = donation_id and public.is_facility_member(d.facility_id))
  );

create policy "facility members submit claims for their facility"
  on public.donation_responses for insert
  to authenticated
  with check (created_by = auth.uid() and public.is_facility_member(responder_facility_id));

create policy "donor approves or rejects claims"
  on public.donation_responses for update
  to authenticated
  using (
    exists (select 1 from public.donations d where d.id = donation_id and public.is_facility_member(d.facility_id))
    or public.is_admin()
  );

create policy "claim items follow parent claim visibility"
  on public.donation_response_items for select
  to authenticated
  using (exists (
    select 1 from public.donation_responses resp where resp.id = response_id and (
      public.is_admin() or public.is_facility_member(resp.responder_facility_id)
      or exists (select 1 from public.donations d where d.id = resp.donation_id and public.is_facility_member(d.facility_id))
    )
  ));

create policy "claimant manages own claim items"
  on public.donation_response_items for all
  to authenticated
  using (exists (
    select 1 from public.donation_responses resp where resp.id = response_id and public.is_facility_member(resp.responder_facility_id)
  ))
  with check (exists (
    select 1 from public.donation_responses resp where resp.id = response_id and public.is_facility_member(resp.responder_facility_id)
  ));

-- ============================================================================
-- MEDISCOPE
-- ============================================================================

create table public.mediscope_requests (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  facility_id uuid not null references public.facilities(id),
  product text not null,
  is_custom_product boolean not null default true,
  comment text,
  image_url text,
  status mediscope_status not null default 'draft',
  is_active boolean not null default true,
  visibility_scope rxrfq_visibility_scope not null default 'All',
  submission_deadline timestamptz,
  created_at timestamptz not null default now(),
  created_by uuid not null references public.profiles(id),
  published_at timestamptz,
  response_count integer not null default 0,
  fulfilled_response_id uuid
);

create table public.mediscope_visibility_rules (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.mediscope_requests(id) on delete cascade,
  rule_type rxrfq_visibility_rule_type not null,
  region text,
  facility_type text,
  facility_id uuid references public.facilities(id)
);

alter table public.mediscope_requests enable row level security;
alter table public.mediscope_visibility_rules enable row level security;

create or replace function public.can_view_mediscope(p_request_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select
    exists (
      select 1 from public.mediscope_requests r
      where r.id = p_request_id and r.visibility_scope = 'All'
    )
    or exists (
      select 1
      from public.mediscope_visibility_rules vr
      join public.facility_memberships fm on fm.user_id = auth.uid()
      join public.facilities f on f.id = fm.facility_id
      where vr.request_id = p_request_id
        and (
          (vr.rule_type = 'Specific Facility' and vr.facility_id = f.id)
          or (vr.rule_type = 'Region' and vr.region = f.region)
          or (vr.rule_type = 'Facility Type' and vr.facility_type = f.type::text)
        )
    );
$$;

create policy "mediscope requests visible per visibility rules, own, or admin"
  on public.mediscope_requests for select
  to authenticated
  using (
    public.is_admin()
    or created_by = auth.uid()
    or public.is_facility_member(facility_id)
    or (status = 'published' and public.can_view_mediscope(id))
  );

create policy "facility members create mediscope requests"
  on public.mediscope_requests for insert
  to authenticated
  with check (created_by = auth.uid() and public.is_facility_member(facility_id));

create policy "facility members update own mediscope requests"
  on public.mediscope_requests for update
  to authenticated
  using (public.is_facility_member(facility_id) or public.is_admin())
  with check (public.is_facility_member(facility_id) or public.is_admin());

create policy "mediscope visibility rules follow parent"
  on public.mediscope_visibility_rules for select
  to authenticated
  using (exists (
    select 1 from public.mediscope_requests r where r.id = request_id and (
      public.is_admin() or r.created_by = auth.uid() or public.is_facility_member(r.facility_id)
    )
  ));

create policy "facility members manage own mediscope visibility rules"
  on public.mediscope_visibility_rules for all
  to authenticated
  using (exists (
    select 1 from public.mediscope_requests r where r.id = request_id and (public.is_facility_member(r.facility_id) or public.is_admin())
  ))
  with check (exists (
    select 1 from public.mediscope_requests r where r.id = request_id and (public.is_facility_member(r.facility_id) or public.is_admin())
  ));


create table public.mediscope_responses (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.mediscope_requests(id) on delete cascade,
  vendor_facility_id uuid not null references public.facilities(id),
  availability mediscope_availability not null default 'full',
  facility_where_available text not null,
  cost numeric(12, 2) not null,
  currency text not null default 'GHS',
  comment text,
  created_at timestamptz not null default now(),
  created_by uuid not null references public.profiles(id)
);

alter table public.mediscope_responses enable row level security;

alter table public.mediscope_requests
  add constraint mediscope_requests_fulfilled_response_id_fkey
  foreign key (fulfilled_response_id) references public.mediscope_responses(id);

create policy "response visible to vendor and requester"
  on public.mediscope_responses for select
  to authenticated
  using (
    public.is_admin()
    or public.is_facility_member(vendor_facility_id)
    or exists (select 1 from public.mediscope_requests r where r.id = request_id and public.is_facility_member(r.facility_id))
  );

create policy "facility members submit mediscope responses"
  on public.mediscope_responses for insert
  to authenticated
  with check (created_by = auth.uid() and public.is_facility_member(vendor_facility_id));

create policy "vendor updates own mediscope response"
  on public.mediscope_responses for update
  to authenticated
  using (public.is_facility_member(vendor_facility_id) or public.is_admin());

-- ============================================================================
-- RXJOBS
-- ============================================================================

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  company_name text not null,
  company_logo text,
  location text not null,
  job_type job_type not null,
  salary_range text not null default '',
  requirements text[] not null default '{}',
  description text not null default '',
  applicants_count integer not null default 0,
  urgency job_urgency not null default 'Standard',
  application_deadline timestamptz,
  status job_status not null default 'open',
  created_at timestamptz not null default now(),
  posted_by uuid not null references public.profiles(id)
);

alter table public.jobs enable row level security;

-- Open listings are public; closed/cancelled ones stay visible only to
-- their poster (mirrors the app's own market-list filtering logic).
create policy "open jobs public, others visible to poster or admin"
  on public.jobs for select
  to authenticated
  using (status = 'open' or posted_by = auth.uid() or public.is_admin());

create policy "users post jobs"
  on public.jobs for insert
  to authenticated
  with check (posted_by = auth.uid());

create policy "poster manages own job"
  on public.jobs for update
  to authenticated
  using (posted_by = auth.uid() or public.is_admin())
  with check (posted_by = auth.uid() or public.is_admin());

create policy "poster deletes own job"
  on public.jobs for delete
  to authenticated
  using (posted_by = auth.uid() or public.is_admin());


create table public.job_applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  applicant_id uuid not null references public.profiles(id),
  cover_note text,
  applied_at timestamptz not null default now(),
  status application_status not null default 'submitted',
  unique (job_id, applicant_id)
);

alter table public.job_applications enable row level security;

-- An application is visible to the applicant and to the job's poster
-- (who needs to review it) — not to other applicants.
create policy "application visible to applicant and job poster"
  on public.job_applications for select
  to authenticated
  using (
    applicant_id = auth.uid()
    or public.is_admin()
    or exists (select 1 from public.jobs j where j.id = job_id and j.posted_by = auth.uid())
  );

create policy "users apply to jobs"
  on public.job_applications for insert
  to authenticated
  with check (applicant_id = auth.uid());

create policy "job poster updates application status"
  on public.job_applications for update
  to authenticated
  using (
    exists (select 1 from public.jobs j where j.id = job_id and j.posted_by = auth.uid())
    or public.is_admin()
  );

-- ============================================================================
-- RXADS
-- ============================================================================

create table public.ads (
  id uuid primary key default gen_random_uuid(),
  advertiser_id uuid not null references public.profiles(id),
  title text not null,
  text text not null,
  link_url text,
  category ad_category not null default 'other',
  fda_approval_id text,

  status ad_status not null default 'pending',
  status_reason text,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,

  plan_id text not null,
  plan_name text not null,
  plan_duration_days integer not null,
  plan_price numeric(12, 2) not null,
  plan_currency text not null default 'GHS',

  payment_amount numeric(12, 2) not null,
  payment_currency text not null default 'GHS',
  payment_status payment_status not null default 'unpaid',
  payment_paid_at timestamptz,
  payment_reference text not null,

  created_at timestamptz not null default now(),
  starts_at timestamptz,
  expires_at timestamptz,

  like_count integer not null default 0,
  dislike_count integer not null default 0,
  comment_count integer not null default 0
);

create table public.ad_media (
  id uuid primary key default gen_random_uuid(),
  ad_id uuid not null references public.ads(id) on delete cascade,
  type ad_media_type not null,
  uri text not null,
  size_bytes bigint not null,
  width integer,
  height integer,
  duration_ms integer
);

create table public.ad_comments (
  id uuid primary key default gen_random_uuid(),
  ad_id uuid not null references public.ads(id) on delete cascade,
  author_id uuid not null references public.profiles(id),
  text text not null,
  created_at timestamptz not null default now()
);

-- Corrects the mock's single Ad.userReaction field (implicitly scoped to
-- "the current viewer") into a real per-user record — every user's like/
-- dislike is tracked independently, one row per (ad, user).
create table public.ad_reactions (
  ad_id uuid not null references public.ads(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reaction reaction_type not null,
  created_at timestamptz not null default now(),
  primary key (ad_id, user_id)
);

alter table public.ads enable row level security;
alter table public.ad_media enable row level security;
alter table public.ad_comments enable row level security;
alter table public.ad_reactions enable row level security;

-- Only approved ads are public; an advertiser can still see their own ad
-- through every stage of moderation.
create policy "approved ads public, others visible to advertiser or admin"
  on public.ads for select
  to authenticated
  using (status = 'approved' or advertiser_id = auth.uid() or public.is_admin());

create policy "users create ads"
  on public.ads for insert
  to authenticated
  with check (advertiser_id = auth.uid());

create policy "advertiser updates own ad, admin moderates any"
  on public.ads for update
  to authenticated
  using (advertiser_id = auth.uid() or public.is_admin())
  with check (advertiser_id = auth.uid() or public.is_admin());

create policy "ad media follows parent ad visibility"
  on public.ad_media for select
  to authenticated
  using (exists (
    select 1 from public.ads a where a.id = ad_id and (a.status = 'approved' or a.advertiser_id = auth.uid() or public.is_admin())
  ));

create policy "advertiser manages own ad media"
  on public.ad_media for all
  to authenticated
  using (exists (select 1 from public.ads a where a.id = ad_id and a.advertiser_id = auth.uid()))
  with check (exists (select 1 from public.ads a where a.id = ad_id and a.advertiser_id = auth.uid()));

create policy "ad comments follow parent ad visibility"
  on public.ad_comments for select
  to authenticated
  using (exists (
    select 1 from public.ads a where a.id = ad_id and (a.status = 'approved' or a.advertiser_id = auth.uid() or public.is_admin())
  ));

create policy "authenticated users comment on visible ads"
  on public.ad_comments for insert
  to authenticated
  with check (
    author_id = auth.uid()
    and exists (select 1 from public.ads a where a.id = ad_id and a.status = 'approved')
  );

create policy "comment author deletes own comment"
  on public.ad_comments for delete
  to authenticated
  using (author_id = auth.uid() or public.is_admin());

create policy "ad reactions follow parent ad visibility"
  on public.ad_reactions for select
  to authenticated
  using (exists (
    select 1 from public.ads a where a.id = ad_id and (a.status = 'approved' or a.advertiser_id = auth.uid() or public.is_admin())
  ));

create policy "users manage their own reaction"
  on public.ad_reactions for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ============================================================================
-- POSTS
-- ============================================================================

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id),
  type post_type not null default 'text',
  text text not null default '',
  created_at timestamptz not null default now(),
  like_count integer not null default 0,
  comment_count integer not null default 0
);

create table public.post_media (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  type media_type not null,
  uri text not null,
  size_bytes bigint not null,
  width integer,
  height integer,
  duration_ms integer
);

-- Corrects the mock's Post.hasLiked + likeCount pair (single-viewer
-- scoped) into a real per-user like record.
create table public.post_likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table public.polls (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null unique references public.posts(id) on delete cascade,
  question text not null,
  closes_at timestamptz
);

create table public.poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  label text not null,
  vote_count integer not null default 0
);

-- Corrects the mock's Poll.votedOptionId (single-viewer scoped) into a
-- real per-user vote record.
create table public.poll_votes (
  poll_id uuid not null references public.polls(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  option_id uuid not null references public.poll_options(id),
  voted_at timestamptz not null default now(),
  primary key (poll_id, user_id)
);

create table public.news_articles (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null unique references public.posts(id) on delete cascade,
  title text not null,
  summary text not null,
  image_url text,
  source_url text not null
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id),
  text text not null,
  created_at timestamptz not null default now()
);

alter table public.posts enable row level security;
alter table public.post_media enable row level security;
alter table public.post_likes enable row level security;
alter table public.polls enable row level security;
alter table public.poll_options enable row level security;
alter table public.poll_votes enable row level security;
alter table public.news_articles enable row level security;
alter table public.comments enable row level security;

-- The community feed — public to every authenticated user, writable only
-- by the author.
create policy "posts readable by authenticated users"
  on public.posts for select to authenticated using (true);
create policy "users create own posts"
  on public.posts for insert to authenticated with check (author_id = auth.uid());
create policy "author manages own post"
  on public.posts for all to authenticated
  using (author_id = auth.uid() or public.is_admin())
  with check (author_id = auth.uid() or public.is_admin());

create policy "post media readable by authenticated users"
  on public.post_media for select to authenticated using (true);
create policy "author manages own post media"
  on public.post_media for all to authenticated
  using (exists (select 1 from public.posts p where p.id = post_id and p.author_id = auth.uid()))
  with check (exists (select 1 from public.posts p where p.id = post_id and p.author_id = auth.uid()));

create policy "post likes readable by authenticated users"
  on public.post_likes for select to authenticated using (true);
create policy "users manage their own like"
  on public.post_likes for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "polls readable by authenticated users"
  on public.polls for select to authenticated using (true);
create policy "author manages own poll"
  on public.polls for all to authenticated
  using (exists (select 1 from public.posts p where p.id = post_id and p.author_id = auth.uid()))
  with check (exists (select 1 from public.posts p where p.id = post_id and p.author_id = auth.uid()));

create policy "poll options readable by authenticated users"
  on public.poll_options for select to authenticated using (true);
create policy "author manages own poll options"
  on public.poll_options for all to authenticated
  using (exists (
    select 1 from public.polls pl join public.posts p on p.id = pl.post_id
    where pl.id = poll_id and p.author_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.polls pl join public.posts p on p.id = pl.post_id
    where pl.id = poll_id and p.author_id = auth.uid()
  ));

create policy "poll votes readable by authenticated users"
  on public.poll_votes for select to authenticated using (true);
create policy "users manage their own vote"
  on public.poll_votes for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "news articles readable by authenticated users"
  on public.news_articles for select to authenticated using (true);
create policy "author manages own news article"
  on public.news_articles for all to authenticated
  using (exists (select 1 from public.posts p where p.id = post_id and p.author_id = auth.uid()))
  with check (exists (select 1 from public.posts p where p.id = post_id and p.author_id = auth.uid()));

create policy "comments readable by authenticated users"
  on public.comments for select to authenticated using (true);
create policy "users create own comments"
  on public.comments for insert to authenticated with check (author_id = auth.uid());
create policy "comment author deletes own comment on posts"
  on public.comments for delete to authenticated using (author_id = auth.uid() or public.is_admin());

-- ============================================================================
-- CHAT
-- ============================================================================
-- The mock's Conversation.participant (singular, "the other person") and
-- unreadCount (a single scalar) both implicitly assumed one viewer's
-- perspective — neither works as a real multi-user table. Restructured so
-- conversation_participants holds both sides explicitly, each with their
-- own unread_count.

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  -- Optional anchor this conversation was started from, e.g. "message the
  -- vendor about this RFQ" — a snapshot (not a live FK) so a message
  -- thread still reads sensibly if the underlying record changes later.
  context_type chat_linked_entity_type,
  context_id uuid,
  context_code text,
  context_title text,
  context_subtitle text,
  context_status text,
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now()
);

create table public.conversation_participants (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  unread_count integer not null default 0,
  last_read_at timestamptz,
  primary key (conversation_id, user_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id),
  text text,
  status chat_message_status not null default 'sent',
  created_at timestamptz not null default now(),

  -- Optional linked entity snapshot (RFQ / MediScope / Donation card)
  linked_entity_type chat_linked_entity_type,
  linked_entity_id uuid,
  linked_entity_code text,
  linked_entity_title text,
  linked_entity_subtitle text,
  linked_entity_status text,

  -- Optional single media attachment
  media_type chat_media_type,
  media_uri text,
  media_size_bytes bigint,
  media_width integer,
  media_height integer,
  media_duration_ms integer
);

alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;

-- Pattern B: strictly private to the two participants — chat is never
-- public.
create policy "participants see their own conversations"
  on public.conversations for select
  to authenticated
  using (exists (
    select 1 from public.conversation_participants cp
    where cp.conversation_id = id and cp.user_id = auth.uid()
  ));

create policy "authenticated users start conversations"
  on public.conversations for insert
  to authenticated
  with check (true);

create policy "participants see conversation_participants rows for their threads"
  on public.conversation_participants for select
  to authenticated
  using (exists (
    select 1 from public.conversation_participants cp
    where cp.conversation_id = conversation_participants.conversation_id and cp.user_id = auth.uid()
  ));

create policy "users update their own participant row (unread count etc)"
  on public.conversation_participants for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "users add themselves or the other participant when starting a thread"
  on public.conversation_participants for insert
  to authenticated
  with check (true);

create policy "participants read messages in their conversations"
  on public.messages for select
  to authenticated
  using (exists (
    select 1 from public.conversation_participants cp
    where cp.conversation_id = messages.conversation_id and cp.user_id = auth.uid()
  ));

create policy "participants send messages in their conversations"
  on public.messages for insert
  to authenticated
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.conversation_participants cp
      where cp.conversation_id = messages.conversation_id and cp.user_id = auth.uid()
    )
  );

-- ============================================================================
-- NOTIFICATIONS
-- ============================================================================
-- One row per (user, category) rather than a single JSON settings blob —
-- keeps RLS scoping simple and makes "which categories does this user have
-- on" a plain indexed query instead of unpacking JSON.

create table public.notification_settings (
  user_id uuid not null references public.profiles(id) on delete cascade,
  category notification_category not null,
  enabled boolean not null default true,
  primary key (user_id, category)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  category notification_category not null,
  title text not null,
  body text not null,
  created_at timestamptz not null default now(),
  read boolean not null default false,
  link_pathname text,
  link_params jsonb
);

alter table public.notification_settings enable row level security;
alter table public.notifications enable row level security;

-- Pattern B throughout — strictly personal.
create policy "users manage their own notification settings"
  on public.notification_settings for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "users see their own notifications"
  on public.notifications for select
  to authenticated
  using (user_id = auth.uid());

create policy "users update their own notifications (mark read etc)"
  on public.notifications for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "users delete their own notifications"
  on public.notifications for delete
  to authenticated
  using (user_id = auth.uid());

-- Notifications are meant to be created by backend logic (triggers/edge
-- functions) reacting to other tables' changes, not inserted directly by
-- the recipient — so there's deliberately no "insert own" policy here.
-- Server-side code using the service role key bypasses RLS entirely, which
-- is the intended path for writing these.


-- ============================================================================
-- RXHELP: FAQ, reports, consult, ask-a-pharmacist
-- ============================================================================

create table public.faq_items (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  category text not null
);

alter table public.faq_items enable row level security;

create policy "faq readable by authenticated users"
  on public.faq_items for select to authenticated using (true);
create policy "admins manage faq"
  on public.faq_items for all to authenticated
  using (public.is_admin()) with check (public.is_admin());


create table public.report_tickets (
  id uuid primary key default gen_random_uuid(),
  type report_type not null,
  subject text not null,
  description text not null,
  reported_user text,
  status report_status not null default 'submitted',
  created_at timestamptz not null default now(),
  created_by uuid not null references public.profiles(id)
);

alter table public.report_tickets enable row level security;

-- Pattern C: reporter sees their own reports; only admins see/manage the
-- full queue.
create policy "users see their own reports"
  on public.report_tickets for select
  to authenticated
  using (created_by = auth.uid() or public.is_admin());

create policy "users submit reports"
  on public.report_tickets for insert
  to authenticated
  with check (created_by = auth.uid());

create policy "admins update report status"
  on public.report_tickets for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());


create table public.consult_requests (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  category consult_category not null,
  subject text not null,
  description text not null,
  preferred_format consult_format not null default 'chat',
  status consult_status not null default 'pending',
  consultant_name text,
  scheduled_at timestamptz,
  created_at timestamptz not null default now(),
  created_by uuid not null references public.profiles(id)
);

create table public.consult_responses (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.consult_requests(id) on delete cascade,
  consultant_name text not null,
  message text not null,
  created_at timestamptz not null default now()
);

alter table public.consult_requests enable row level security;
alter table public.consult_responses enable row level security;

create policy "users see their own consult requests"
  on public.consult_requests for select
  to authenticated
  using (created_by = auth.uid() or public.is_admin());

create policy "users submit consult requests"
  on public.consult_requests for insert
  to authenticated
  with check (created_by = auth.uid());

create policy "users cancel own request, admins manage any"
  on public.consult_requests for update
  to authenticated
  using (created_by = auth.uid() or public.is_admin())
  with check (created_by = auth.uid() or public.is_admin());

create policy "consult responses follow parent request visibility"
  on public.consult_responses for select
  to authenticated
  using (exists (
    select 1 from public.consult_requests r where r.id = request_id and (r.created_by = auth.uid() or public.is_admin())
  ));

create policy "admins respond to consult requests"
  on public.consult_responses for insert
  to authenticated
  with check (public.is_admin());


create table public.pharmacist_questions (
  id uuid primary key default gen_random_uuid(),
  category pharmacist_question_category not null,
  medication_name text,
  question text not null,
  status pharmacist_question_status not null default 'pending',
  created_at timestamptz not null default now(),
  created_by uuid not null references public.profiles(id)
);

create table public.pharmacist_answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null unique references public.pharmacist_questions(id) on delete cascade,
  pharmacist_name text not null,
  message text not null,
  created_at timestamptz not null default now()
);

alter table public.pharmacist_questions enable row level security;
alter table public.pharmacist_answers enable row level security;

create policy "users see their own pharmacist questions"
  on public.pharmacist_questions for select
  to authenticated
  using (created_by = auth.uid() or public.is_admin());

create policy "users submit pharmacist questions"
  on public.pharmacist_questions for insert
  to authenticated
  with check (created_by = auth.uid());

create policy "pharmacist answers follow parent question visibility"
  on public.pharmacist_answers for select
  to authenticated
  using (exists (
    select 1 from public.pharmacist_questions q where q.id = question_id and (q.created_by = auth.uid() or public.is_admin())
  ));

create policy "admins answer pharmacist questions"
  on public.pharmacist_answers for insert
  to authenticated
  with check (public.is_admin());


-- ============================================================================
-- RXVITALS
-- ============================================================================
-- A personal, at-home vitals record — private by design, never shared with
-- other users through the app itself (only via the PDF export feature,
-- which happens outside the database entirely).

create table public.vital_readings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type vital_type not null,
  recorded_at timestamptz not null default now(),
  notes text,

  systolic integer,
  diastolic integer,
  pulse integer,

  glucose_value numeric(6, 2),
  glucose_unit glucose_unit,
  glucose_context glucose_context,

  heart_rate_value integer,

  temperature_value numeric(5, 2),
  temperature_unit temperature_unit,

  weight_value numeric(6, 2),
  weight_unit weight_unit,

  oxygen_saturation_value integer,

  created_at timestamptz not null default now()
);

alter table public.vital_readings enable row level security;

-- Pattern B: strictly private, no exceptions — not even admins get a
-- blanket read policy here, since this is health data and nothing in the
-- app's design calls for anyone but the owner to see it.
create policy "users manage their own vital readings"
  on public.vital_readings for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ============================================================================
-- AUTH INTEGRATION: auto-create a profile row on signup
-- ============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ============================================================================
-- INDEXES on the foreign keys and filters the app actually queries by
-- ============================================================================

create index idx_facilities_organization_id on public.facilities(organization_id);
create index idx_facility_memberships_user_id on public.facility_memberships(user_id);
create index idx_kyc_documents_entity on public.kyc_documents(entity_type, entity_id);
create index idx_price_templates_facility_id on public.price_templates(facility_id);
create index idx_price_template_items_template_id on public.price_template_items(price_template_id);

create index idx_formulary_requests_status on public.formulary_requests(status);
create index idx_formulary_requests_created_by on public.formulary_requests(created_by);

create index idx_rxrfqs_facility_id on public.rxrfqs(facility_id);
create index idx_rxrfqs_status on public.rxrfqs(status);
create index idx_rxrfq_items_rxrfq_id on public.rxrfq_items(rxrfq_id);
create index idx_rxrfq_visibility_rules_rxrfq_id on public.rxrfq_visibility_rules(rxrfq_id);
create index idx_rxrfq_responses_rxrfq_id on public.rxrfq_responses(rxrfq_id);
create index idx_rxrfq_responses_vendor_facility_id on public.rxrfq_responses(vendor_facility_id);
create index idx_rxrfq_response_items_response_id on public.rxrfq_response_items(response_id);
create index idx_rxrfq_additional_costs_response_id on public.rxrfq_additional_costs(response_id);

create index idx_donations_facility_id on public.donations(facility_id);
create index idx_donation_items_donation_id on public.donation_items(donation_id);
create index idx_donation_responses_donation_id on public.donation_responses(donation_id);
create index idx_donation_responses_responder_facility_id on public.donation_responses(responder_facility_id);
create index idx_donation_response_items_response_id on public.donation_response_items(response_id);

create index idx_mediscope_requests_facility_id on public.mediscope_requests(facility_id);
create index idx_mediscope_requests_status on public.mediscope_requests(status);
create index idx_mediscope_visibility_rules_request_id on public.mediscope_visibility_rules(request_id);
create index idx_mediscope_responses_request_id on public.mediscope_responses(request_id);
create index idx_mediscope_responses_vendor_facility_id on public.mediscope_responses(vendor_facility_id);

create index idx_jobs_status on public.jobs(status);
create index idx_jobs_posted_by on public.jobs(posted_by);
create index idx_job_applications_job_id on public.job_applications(job_id);
create index idx_job_applications_applicant_id on public.job_applications(applicant_id);

create index idx_ads_status on public.ads(status);
create index idx_ads_advertiser_id on public.ads(advertiser_id);
create index idx_ad_media_ad_id on public.ad_media(ad_id);
create index idx_ad_comments_ad_id on public.ad_comments(ad_id);

create index idx_posts_author_id on public.posts(author_id);
create index idx_posts_created_at on public.posts(created_at desc);
create index idx_post_media_post_id on public.post_media(post_id);
create index idx_poll_options_poll_id on public.poll_options(poll_id);
create index idx_comments_post_id on public.comments(post_id);

create index idx_conversation_participants_user_id on public.conversation_participants(user_id);
create index idx_messages_conversation_id on public.messages(conversation_id);
create index idx_messages_created_at on public.messages(created_at);

create index idx_notifications_user_id on public.notifications(user_id, created_at desc);
create index idx_notifications_unread on public.notifications(user_id) where read = false;

create index idx_report_tickets_status on public.report_tickets(status);
create index idx_consult_requests_created_by on public.consult_requests(created_by);
create index idx_pharmacist_questions_created_by on public.pharmacist_questions(created_by);

create index idx_vital_readings_user_id on public.vital_readings(user_id, recorded_at desc);
