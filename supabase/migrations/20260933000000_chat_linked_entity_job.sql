-- ============================================================================
-- Extend chat_linked_entity_type with 'job' — for sharing a job listing
-- to chat, alongside the existing rfq/mediscope/donation support.
-- ============================================================================
alter type chat_linked_entity_type add value if not exists 'job';
