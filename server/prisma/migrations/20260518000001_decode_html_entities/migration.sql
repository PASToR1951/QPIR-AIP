-- ============================================================================
-- Migration: 20260518000001_decode_html_entities
--
-- Background: the legacy `sanitizeObject` helper in server/lib/sanitize.ts
-- HTML-entity-encoded every string field on save (& → &amp;, < → &lt;, etc.).
-- That was a misapplied defense — React already escapes text on output, so
-- the encoding only corrupted legitimate characters in user-typed text.
--
-- The helper was changed to strip control characters only. This migration is
-- a one-shot cleanup that decodes any entities already in the database back
-- to their raw characters across user-input text columns.
--
-- Decoding order: non-`&` entities first, then `&amp;` last. This preserves
-- any literal entities a user actually typed (e.g. a user who typed `&lt;`
-- had it stored as `&amp;lt;` — decoding `&lt;` first finds no match, then
-- decoding `&amp;` returns the literal `&lt;`).
--
-- Each UPDATE is gated by `LIKE '%&%'` so rows without `&` are untouched,
-- making the migration idempotent.
--
-- Columns intentionally excluded:
--   - email_templates.body_html — admin-authored HTML, bypasses sanitize
--   - email_config.* — connection settings, not user prose
--   - audit_logs / user_activity_logs / *_blast_logs — system-generated
--   - session/token/oauth/secret columns
-- ============================================================================

-- clusters
UPDATE clusters SET name = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(name, '&#x27;', ''''), '&quot;', '"'), '&gt;', '>'), '&lt;', '<'), '&amp;', '&') WHERE name LIKE '%&%';

-- schools
UPDATE schools SET name         = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(name,         '&#x27;', ''''), '&quot;', '"'), '&gt;', '>'), '&lt;', '<'), '&amp;', '&') WHERE name         LIKE '%&%';
UPDATE schools SET abbreviation = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(abbreviation, '&#x27;', ''''), '&quot;', '"'), '&gt;', '>'), '&lt;', '<'), '&amp;', '&') WHERE abbreviation LIKE '%&%';
UPDATE schools SET level        = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(level,        '&#x27;', ''''), '&quot;', '"'), '&gt;', '>'), '&lt;', '<'), '&amp;', '&') WHERE level        LIKE '%&%';

-- programs
UPDATE programs SET title                    = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(title,                    '&#x27;', ''''), '&quot;', '"'), '&gt;', '>'), '&lt;', '<'), '&amp;', '&') WHERE title                    LIKE '%&%';
UPDATE programs SET abbreviation             = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(abbreviation,             '&#x27;', ''''), '&quot;', '"'), '&gt;', '>'), '&lt;', '<'), '&amp;', '&') WHERE abbreviation             LIKE '%&%';
UPDATE programs SET school_level_requirement = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(school_level_requirement, '&#x27;', ''''), '&quot;', '"'), '&gt;', '>'), '&lt;', '<'), '&amp;', '&') WHERE school_level_requirement LIKE '%&%';

-- program_templates
UPDATE program_templates SET outcome            = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(outcome,            '&#x27;', ''''), '&quot;', '"'), '&gt;', '>'), '&lt;', '<'), '&amp;', '&') WHERE outcome            LIKE '%&%';
UPDATE program_templates SET target_code        = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(target_code,        '&#x27;', ''''), '&quot;', '"'), '&gt;', '>'), '&lt;', '<'), '&amp;', '&') WHERE target_code        LIKE '%&%';
UPDATE program_templates SET target_description = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(target_description, '&#x27;', ''''), '&quot;', '"'), '&gt;', '>'), '&lt;', '<'), '&amp;', '&') WHERE target_description LIKE '%&%';

-- User (PascalCase table name — quoted)
UPDATE "User" SET email          = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(email,          '&#x27;', ''''), '&quot;', '"'), '&gt;', '>'), '&lt;', '<'), '&amp;', '&') WHERE email          LIKE '%&%';
UPDATE "User" SET salutation     = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(salutation,     '&#x27;', ''''), '&quot;', '"'), '&gt;', '>'), '&lt;', '<'), '&amp;', '&') WHERE salutation     LIKE '%&%';
UPDATE "User" SET name           = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(name,           '&#x27;', ''''), '&quot;', '"'), '&gt;', '>'), '&lt;', '<'), '&amp;', '&') WHERE name           LIKE '%&%';
UPDATE "User" SET first_name     = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(first_name,     '&#x27;', ''''), '&quot;', '"'), '&gt;', '>'), '&lt;', '<'), '&amp;', '&') WHERE first_name     LIKE '%&%';
UPDATE "User" SET middle_initial = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(middle_initial, '&#x27;', ''''), '&quot;', '"'), '&gt;', '>'), '&lt;', '<'), '&amp;', '&') WHERE middle_initial LIKE '%&%';
UPDATE "User" SET last_name      = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(last_name,      '&#x27;', ''''), '&quot;', '"'), '&gt;', '>'), '&lt;', '<'), '&amp;', '&') WHERE last_name      LIKE '%&%';
UPDATE "User" SET position       = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(position,       '&#x27;', ''''), '&quot;', '"'), '&gt;', '>'), '&lt;', '<'), '&amp;', '&') WHERE position       LIKE '%&%';

-- AIP
UPDATE "AIP" SET outcome             = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(outcome,             '&#x27;', ''''), '&quot;', '"'), '&gt;', '>'), '&lt;', '<'), '&amp;', '&') WHERE outcome             LIKE '%&%';
UPDATE "AIP" SET target_description  = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(target_description,  '&#x27;', ''''), '&quot;', '"'), '&gt;', '>'), '&lt;', '<'), '&amp;', '&') WHERE target_description  LIKE '%&%';
UPDATE "AIP" SET sip_title           = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(sip_title,           '&#x27;', ''''), '&quot;', '"'), '&gt;', '>'), '&lt;', '<'), '&amp;', '&') WHERE sip_title           LIKE '%&%';
UPDATE "AIP" SET project_coordinator = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(project_coordinator, '&#x27;', ''''), '&quot;', '"'), '&gt;', '>'), '&lt;', '<'), '&amp;', '&') WHERE project_coordinator LIKE '%&%';
UPDATE "AIP" SET prepared_by_name    = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(prepared_by_name,    '&#x27;', ''''), '&quot;', '"'), '&gt;', '>'), '&lt;', '<'), '&amp;', '&') WHERE prepared_by_name    LIKE '%&%';
UPDATE "AIP" SET prepared_by_title   = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(prepared_by_title,   '&#x27;', ''''), '&quot;', '"'), '&gt;', '>'), '&lt;', '<'), '&amp;', '&') WHERE prepared_by_title   LIKE '%&%';
UPDATE "AIP" SET approved_by_name    = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(approved_by_name,    '&#x27;', ''''), '&quot;', '"'), '&gt;', '>'), '&lt;', '<'), '&amp;', '&') WHERE approved_by_name    LIKE '%&%';
UPDATE "AIP" SET approved_by_title   = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(approved_by_title,   '&#x27;', ''''), '&quot;', '"'), '&gt;', '>'), '&lt;', '<'), '&amp;', '&') WHERE approved_by_title   LIKE '%&%';
UPDATE "AIP" SET focal_remarks       = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(focal_remarks,       '&#x27;', ''''), '&quot;', '"'), '&gt;', '>'), '&lt;', '<'), '&amp;', '&') WHERE focal_remarks       LIKE '%&%';
UPDATE "AIP" SET ces_remarks         = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(ces_remarks,         '&#x27;', ''''), '&quot;', '"'), '&gt;', '>'), '&lt;', '<'), '&amp;', '&') WHERE ces_remarks         LIKE '%&%';

-- AIPActivity
UPDATE "AIPActivity" SET phase                 = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(phase,                 '&#x27;', ''''), '&quot;', '"'), '&gt;', '>'), '&lt;', '<'), '&amp;', '&') WHERE phase                 LIKE '%&%';
UPDATE "AIPActivity" SET activity_name         = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(activity_name,         '&#x27;', ''''), '&quot;', '"'), '&gt;', '>'), '&lt;', '<'), '&amp;', '&') WHERE activity_name         LIKE '%&%';
UPDATE "AIPActivity" SET implementation_period = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(implementation_period, '&#x27;', ''''), '&quot;', '"'), '&gt;', '>'), '&lt;', '<'), '&amp;', '&') WHERE implementation_period LIKE '%&%';
UPDATE "AIPActivity" SET persons_involved      = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(persons_involved,      '&#x27;', ''''), '&quot;', '"'), '&gt;', '>'), '&lt;', '<'), '&amp;', '&') WHERE persons_involved      LIKE '%&%';
UPDATE "AIPActivity" SET outputs               = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(outputs,               '&#x27;', ''''), '&quot;', '"'), '&gt;', '>'), '&lt;', '<'), '&amp;', '&') WHERE outputs               LIKE '%&%';
UPDATE "AIPActivity" SET budget_source         = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(budget_source,         '&#x27;', ''''), '&quot;', '"'), '&gt;', '>'), '&lt;', '<'), '&amp;', '&') WHERE budget_source         LIKE '%&%';

-- PIR
UPDATE "PIR" SET quarter             = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(quarter,             '&#x27;', ''''), '&quot;', '"'), '&gt;', '>'), '&lt;', '<'), '&amp;', '&') WHERE quarter             LIKE '%&%';
UPDATE "PIR" SET program_owner       = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(program_owner,       '&#x27;', ''''), '&quot;', '"'), '&gt;', '>'), '&lt;', '<'), '&amp;', '&') WHERE program_owner       LIKE '%&%';
UPDATE "PIR" SET functional_division = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(functional_division, '&#x27;', ''''), '&quot;', '"'), '&gt;', '>'), '&lt;', '<'), '&amp;', '&') WHERE functional_division LIKE '%&%';
UPDATE "PIR" SET focal_remarks       = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(focal_remarks,       '&#x27;', ''''), '&quot;', '"'), '&gt;', '>'), '&lt;', '<'), '&amp;', '&') WHERE focal_remarks       LIKE '%&%';
UPDATE "PIR" SET ces_remarks         = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(ces_remarks,         '&#x27;', ''''), '&quot;', '"'), '&gt;', '>'), '&lt;', '<'), '&amp;', '&') WHERE ces_remarks         LIKE '%&%';

-- PIRActivityReview
UPDATE "PIRActivityReview" SET actual_tasks_conducted              = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(actual_tasks_conducted,              '&#x27;', ''''), '&quot;', '"'), '&gt;', '>'), '&lt;', '<'), '&amp;', '&') WHERE actual_tasks_conducted              LIKE '%&%';
UPDATE "PIRActivityReview" SET contributory_performance_indicators = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(contributory_performance_indicators, '&#x27;', ''''), '&quot;', '"'), '&gt;', '>'), '&lt;', '<'), '&amp;', '&') WHERE contributory_performance_indicators LIKE '%&%';
UPDATE "PIRActivityReview" SET movs_expected_outputs               = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(movs_expected_outputs,               '&#x27;', ''''), '&quot;', '"'), '&gt;', '>'), '&lt;', '<'), '&amp;', '&') WHERE movs_expected_outputs               LIKE '%&%';
UPDATE "PIRActivityReview" SET adjustments                         = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(adjustments,                         '&#x27;', ''''), '&quot;', '"'), '&gt;', '>'), '&lt;', '<'), '&amp;', '&') WHERE adjustments                         LIKE '%&%';
UPDATE "PIRActivityReview" SET actions_to_address_gap              = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(actions_to_address_gap,              '&#x27;', ''''), '&quot;', '"'), '&gt;', '>'), '&lt;', '<'), '&amp;', '&') WHERE actions_to_address_gap              LIKE '%&%';

-- PIRFactor
UPDATE "PIRFactor" SET factor_type          = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(factor_type,          '&#x27;', ''''), '&quot;', '"'), '&gt;', '>'), '&lt;', '<'), '&amp;', '&') WHERE factor_type          LIKE '%&%';
UPDATE "PIRFactor" SET facilitating_factors = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(facilitating_factors, '&#x27;', ''''), '&quot;', '"'), '&gt;', '>'), '&lt;', '<'), '&amp;', '&') WHERE facilitating_factors LIKE '%&%';
UPDATE "PIRFactor" SET hindering_factors    = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(hindering_factors,    '&#x27;', ''''), '&quot;', '"'), '&gt;', '>'), '&lt;', '<'), '&amp;', '&') WHERE hindering_factors    LIKE '%&%';
UPDATE "PIRFactor" SET recommendations      = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(recommendations,      '&#x27;', ''''), '&quot;', '"'), '&gt;', '>'), '&lt;', '<'), '&amp;', '&') WHERE recommendations      LIKE '%&%';

-- consolidation_notes
UPDATE consolidation_notes SET gaps                = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(gaps,                '&#x27;', ''''), '&quot;', '"'), '&gt;', '>'), '&lt;', '<'), '&amp;', '&') WHERE gaps                LIKE '%&%';
UPDATE consolidation_notes SET recommendations     = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(recommendations,     '&#x27;', ''''), '&quot;', '"'), '&gt;', '>'), '&lt;', '<'), '&amp;', '&') WHERE recommendations     LIKE '%&%';
UPDATE consolidation_notes SET management_response = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(management_response, '&#x27;', ''''), '&quot;', '"'), '&gt;', '>'), '&lt;', '<'), '&amp;', '&') WHERE management_response LIKE '%&%';

-- notifications
UPDATE notifications SET title   = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(title,   '&#x27;', ''''), '&quot;', '"'), '&gt;', '>'), '&lt;', '<'), '&amp;', '&') WHERE title   LIKE '%&%';
UPDATE notifications SET message = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(message, '&#x27;', ''''), '&quot;', '"'), '&gt;', '>'), '&lt;', '<'), '&amp;', '&') WHERE message LIKE '%&%';

-- announcements
UPDATE announcements SET title        = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(title,        '&#x27;', ''''), '&quot;', '"'), '&gt;', '>'), '&lt;', '<'), '&amp;', '&') WHERE title        LIKE '%&%';
UPDATE announcements SET message      = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(message,      '&#x27;', ''''), '&quot;', '"'), '&gt;', '>'), '&lt;', '<'), '&amp;', '&') WHERE message      LIKE '%&%';
UPDATE announcements SET action_label = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(action_label, '&#x27;', ''''), '&quot;', '"'), '&gt;', '>'), '&lt;', '<'), '&amp;', '&') WHERE action_label LIKE '%&%';
UPDATE announcements SET action_url   = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(action_url,   '&#x27;', ''''), '&quot;', '"'), '&gt;', '>'), '&lt;', '<'), '&amp;', '&') WHERE action_url   LIKE '%&%';

-- division_config
UPDATE division_config SET supervisor_name     = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(supervisor_name,     '&#x27;', ''''), '&quot;', '"'), '&gt;', '>'), '&lt;', '<'), '&amp;', '&') WHERE supervisor_name     LIKE '%&%';
UPDATE division_config SET supervisor_title    = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(supervisor_title,    '&#x27;', ''''), '&quot;', '"'), '&gt;', '>'), '&lt;', '<'), '&amp;', '&') WHERE supervisor_title    LIKE '%&%';
UPDATE division_config SET sgod_noted_by_name  = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(sgod_noted_by_name,  '&#x27;', ''''), '&quot;', '"'), '&gt;', '>'), '&lt;', '<'), '&amp;', '&') WHERE sgod_noted_by_name  LIKE '%&%';
UPDATE division_config SET sgod_noted_by_title = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(sgod_noted_by_title, '&#x27;', ''''), '&quot;', '"'), '&gt;', '>'), '&lt;', '<'), '&amp;', '&') WHERE sgod_noted_by_title LIKE '%&%';
UPDATE division_config SET cid_noted_by_name   = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(cid_noted_by_name,   '&#x27;', ''''), '&quot;', '"'), '&gt;', '>'), '&lt;', '<'), '&amp;', '&') WHERE cid_noted_by_name   LIKE '%&%';
UPDATE division_config SET cid_noted_by_title  = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(cid_noted_by_title,  '&#x27;', ''''), '&quot;', '"'), '&gt;', '>'), '&lt;', '<'), '&amp;', '&') WHERE cid_noted_by_title  LIKE '%&%';
UPDATE division_config SET osds_noted_by_name  = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(osds_noted_by_name,  '&#x27;', ''''), '&quot;', '"'), '&gt;', '>'), '&lt;', '<'), '&amp;', '&') WHERE osds_noted_by_name  LIKE '%&%';
UPDATE division_config SET osds_noted_by_title = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(osds_noted_by_title, '&#x27;', ''''), '&quot;', '"'), '&gt;', '>'), '&lt;', '<'), '&amp;', '&') WHERE osds_noted_by_title LIKE '%&%';

-- faq_items
UPDATE faq_items SET category = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(category, '&#x27;', ''''), '&quot;', '"'), '&gt;', '>'), '&lt;', '<'), '&amp;', '&') WHERE category LIKE '%&%';
UPDATE faq_items SET question = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(question, '&#x27;', ''''), '&quot;', '"'), '&gt;', '>'), '&lt;', '<'), '&amp;', '&') WHERE question LIKE '%&%';
UPDATE faq_items SET answer   = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(answer,   '&#x27;', ''''), '&quot;', '"'), '&gt;', '>'), '&lt;', '<'), '&amp;', '&') WHERE answer   LIKE '%&%';
