-- ============================================================================
-- Seed faq_items
-- ============================================================================
-- faq_items has existed since the initial schema, but nothing was ever
-- inserted into it — RxHelp was still reading FAQ content from a
-- hardcoded mock array in the app itself. Migrating that screen to read
-- from this table (see the help store rewrite) would otherwise turn a
-- working FAQ page into an empty one, since the real content was never
-- carried over. This seeds the same content that was in the mock array,
-- so nothing is lost in the migration.

insert into public.faq_items (question, answer, category) values
  (
    'How do I post an RxRFQ or a MediScope request?',
    'Open RxRFQs or MediScope from the Services tab, tap the + button, fill in what you''re looking for, and publish. Other facilities on the network can then respond.',
    'Getting Started'
  ),
  (
    'How does a donation claim work?',
    'When you find a donation you''d like, open it and tap Claim Items to select what you need and how much. The donor reviews and approves claims from their donation''s details page.',
    'Getting Started'
  ),
  (
    'How do I switch between light and dark theme?',
    'Go to Settings and choose your preferred appearance under Theme.',
    'Account'
  ),
  (
    'Can I edit a job listing after posting it?',
    'Yes — open the listing from My Jobs and use the edit icon. Applicant details and application counts are preserved.',
    'RxJobs'
  ),
  (
    'How long does ad approval take?',
    'Ads are reviewed by a system admin after payment. Most are reviewed within one business day; you''ll see the status change from Pending to Live once approved.',
    'RxAds'
  ),
  (
    'Who can see my posts and requests?',
    'Posts appear in the community feed to everyone. RxRFQs and MediScope requests respect the visibility settings you choose when creating them — you can restrict them to a region, facility type, or specific facilities.',
    'Privacy'
  ),
  (
    'Can I remove a comment or post I made?',
    'Currently posts and comments don''t have a delete option from your device — reach out via Report a Bug if you need something removed urgently.',
    'Community'
  );
