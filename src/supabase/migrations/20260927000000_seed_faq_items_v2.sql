-- ============================================================================
-- Seed additional faq_items — features added this session.
-- ============================================================================
-- Scoped to what a regular user would actually wonder about, not
-- internal/admin mechanics: phone verification, why a verified profile
-- can't be edited directly, what an account restriction means, how an
-- ownership transfer works, and why a listing might disappear. Admin-
-- side tools (account moderation, content moderation, etc.) aren't
-- FAQ material themselves — this is the user-facing side of each.

insert into public.faq_items (question, answer, category) values
  (
    'Why do I need to verify my phone number?',
    'Phone verification helps confirm you''re a real person and adds an extra layer of trust for facilities and organizations you interact with. Go to your profile and tap Verify Now next to your phone number, then enter the code you receive.',
    'Account'
  ),
  (
    'I verified my phone but it still shows as unverified',
    'A phone number needs both verification and admin approval before it shows as fully verified — this second step is a manual review, so there can be a short delay after you enter the code.',
    'Account'
  ),
  (
    'Why can''t I edit my facility or organization profile directly?',
    'Once a facility or organization profile is verified, changes go through a review request instead of a direct edit, so the verified information stays trustworthy for everyone who relies on it. Open your profile and tap Request Profile Update — an admin reviews and applies the change.',
    'Account'
  ),
  (
    'My account shows as suspended or banned — what does this mean?',
    'This means an admin has restricted your account, usually for a policy violation. The reason and, for a suspension, when it lifts, are shown on the screen you''re redirected to. If you believe this was a mistake, use Report a Bug to reach support.',
    'Account'
  ),
  (
    'How do I take over ownership of a facility or organization that''s already registered?',
    'If you''re a KYC-verified user and not already the owner, open the facility or organization''s profile and tap Request Ownership. Attach supporting documents and a reason — an admin reviews the request and, if approved, transfers ownership to you.',
    'Account'
  ),
  (
    'An RxRFQ, MediScope request, job, or donation I was viewing disappeared — why?',
    'An admin may have removed it for violating platform policy. If it was yours, you''ll see the reason on its details page, and it''s still visible to you there even though it no longer appears in feeds or search.',
    'Community'
  );
