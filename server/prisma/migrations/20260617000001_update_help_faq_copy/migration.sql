-- Refresh shipped FAQ defaults while preserving admin-customized answers.

UPDATE "faq_items"
SET
  "answer" = $new$AIP stands for Annual Implementation Plan. It is the planning baseline for the fiscal year and identifies target outcomes, KPIs, baseline values, quarterly targets, projects, activities, timelines, persons involved, expected outputs, and budget sources.$new$,
  "updated_at" = CURRENT_TIMESTAMP
WHERE "category" = 'General'
  AND "question" = $q$What does AIP stand for and what is it for?$q$
  AND "answer" = $old$AIP stands for Annual Implementation Plan. It is the planning baseline for the fiscal year and identifies target outcomes, projects, activities, timelines, persons involved, expected outputs, and budget sources.$old$;

UPDATE "faq_items"
SET
  "answer" = $new$PIR stands for Program Implementation Review. It is the monitoring record that compares actual accomplishments, indicator targets, and budget utilization against the AIP baseline, including gaps, actions, facilitating factors, and hindering factors.$new$,
  "updated_at" = CURRENT_TIMESTAMP
WHERE "category" = 'General'
  AND "question" = $q$What does PIR stand for and what is it for?$q$
  AND "answer" = $old$PIR stands for Program Implementation Review. It is the monitoring record that compares actual accomplishments and budget utilization against the AIP baseline, including facilitating and hindering factors.$old$;

UPDATE "faq_items"
SET
  "answer" = $new$The current portal supports School Users, Division Personnel, CES reviewers (CES-SGOD, CES-ASDS, CES-CID), the Superintendent, Admin users, Observers with read-only access, and Pending accounts awaiting administrator assignment. Your role controls which schools, programs, and review queues you can access.$new$,
  "updated_at" = CURRENT_TIMESTAMP
WHERE "category" = 'General'
  AND "question" = $q$Who can use the portal?$q$
  AND "answer" = $old$The Beta Build supports School Users, Division Personnel, CES reviewers (CES-SGOD, CES-ASDS, CES-CID), Admin users, Observers with read-only access, and Pending accounts awaiting administrator assignment. Your role controls which schools, programs, and review queues you can access.$old$;

UPDATE "faq_items"
SET
  "answer" = $new$No. The portal is currently labeled Beta 4 Refinements (v1.3.1-beta). Workflows, statuses, and reports may continue to evolve based on user feedback before a stable release.$new$,
  "updated_at" = CURRENT_TIMESTAMP
WHERE "category" = 'General'
  AND "question" = $q$Is this a final release?$q$
  AND "answer" = $old$No. The portal is currently labeled Beta 3 (v1.2.0-beta). Workflows, statuses, and reports may continue to evolve based on user feedback before a stable release.$old$;

UPDATE "faq_items"
SET
  "answer" = $new$The current build enforces one active School-role account per school so AIP and PIR ownership stays clear. Contact the SDO administrator if the assigned account needs to be changed.$new$,
  "updated_at" = CURRENT_TIMESTAMP
WHERE "category" = 'Accounts & Sign-In'
  AND "question" = $q$Can multiple people share one school account?$q$
  AND "answer" = $old$The Beta Build enforces one active School-role account per school so AIP and PIR ownership stays clear. Contact the SDO administrator if the assigned account needs to be changed.$old$;

UPDATE "faq_items"
SET
  "answer" = $new$Open the AIP form for your assigned program and fiscal year, complete the profile, strategic alignment, goals, KPIs, baseline, quarterly target, activities, budget, and signature sections, then save a draft or submit. School users submit on behalf of their school; Division Personnel can submit division-level AIPs.$new$,
  "updated_at" = CURRENT_TIMESTAMP
WHERE "category" = 'AIP Submissions'
  AND "question" = $q$How do I create an AIP?$q$
  AND "answer" = $old$Open the AIP form for your assigned program and fiscal year, fill in activities under the Planning, Implementation, and Monitoring and Evaluation phases, then save a draft or submit. School users submit on behalf of their school; Division Personnel can submit division-level AIPs.$old$;

UPDATE "faq_items"
SET
  "answer" = $new$No. The system enforces one school AIP per school, program, and fiscal year. Division-level AIPs follow a similar rule per division user. If you need to revise an approved AIP, use the edit request flow where available or contact your administrator.$new$,
  "updated_at" = CURRENT_TIMESTAMP
WHERE "category" = 'AIP Submissions'
  AND "question" = $q$Can I have more than one AIP for the same program and year?$q$
  AND "answer" = $old$No. The system enforces one school AIP per school, program, and fiscal year. Division-level AIPs follow a similar rule per division user. If you need to revise an approved AIP, contact your administrator.$old$;

UPDATE "faq_items"
SET
  "answer" = $new$School AIPs require complete required fields, valid budget and metric entries, signatures, and focal-person assignments on the selected program before they can enter the recommendation workflow. If the program has no assigned focal persons, ask your administrator to set them up first.$new$,
  "updated_at" = CURRENT_TIMESTAMP
WHERE "category" = 'AIP Submissions'
  AND "question" = $q$Why can't I submit my school AIP?$q$
  AND "answer" = $old$School AIPs require focal-person assignments on the selected program before they can enter the recommendation workflow. If the program has no assigned focal persons, ask your administrator to set them up first.$old$;

UPDATE "faq_items"
SET
  "answer" = $new$A school AIP enters For Recommendation and appears in the queue of the assigned focal person. After focal recommendation it moves to For CES Review for the appropriate functional division. Division Personnel AIPs are accepted for their own workflow, while CES-owned AIPs route to For Superintendent Review.$new$,
  "updated_at" = CURRENT_TIMESTAMP
WHERE "category" = 'AIP Submissions'
  AND "question" = $q$What happens after I submit an AIP?$q$
  AND "answer" = $old$A school AIP enters For Recommendation and appears in the queue of the assigned focal person. After focal recommendation it moves to For CES Review for the appropriate functional division. Division-level AIPs follow a simpler path managed by Division Personnel.$old$;

UPDATE "faq_items"
SET
  "answer" = $new$For school users, no. A PIR can only be submitted after the related AIP for the same school, program, and reporting year is Approved. Division Personnel and CES-owned records still require a matching AIP record for the same program and year.$new$,
  "updated_at" = CURRENT_TIMESTAMP
WHERE "category" = 'PIR Submissions'
  AND "question" = $q$Can I submit a PIR without an approved AIP?$q$
  AND "answer" = $old$No. A PIR can only be created after an AIP has been submitted for the same school or Division Personnel account, program, and fiscal year.$old$;

UPDATE "faq_items"
SET
  "answer" = $new$Quarterly deadlines and submission windows are configured by the administrator. Submission outside the configured window may be blocked or marked late depending on configuration. Contact your administrator if you missed a deadline.$new$,
  "updated_at" = CURRENT_TIMESTAMP
WHERE "category" = 'PIR Submissions'
  AND "question" = $q$What happens if I miss a PIR deadline?$q$
  AND "answer" = $old$Deadlines and trimester windows are configured by the administrator. Submission outside the configured window may be blocked or marked late depending on configuration. Contact your administrator if you missed a deadline.$old$;

UPDATE "faq_items"
SET
  "answer" = $new$No. PIRs in active review statuses are locked until a reviewer returns them. Draft and Returned PIRs can be edited; approved, For CES Review, Under Review, and For Superintendent Review submissions stay locked.$new$,
  "updated_at" = CURRENT_TIMESTAMP
WHERE "category" = 'Review & Workflow Statuses'
  AND "question" = $q$Can I edit a PIR while it is being reviewed?$q$
  AND "answer" = $old$No. PIRs in active review statuses are locked until a reviewer returns them. Draft and Returned PIRs can be edited; approved or terminal submissions stay locked.$old$;

UPDATE "faq_items"
SET
  "answer" = $new$Admin users have oversight tools but do not act as focal, CES, or Superintendent reviewers for the normal review chain. School AIP and PIR approvals go through the configured focal and CES roles.$new$,
  "updated_at" = CURRENT_TIMESTAMP
WHERE "category" = 'Review & Workflow Statuses'
  AND "question" = $q$Can Admin approve school AIPs or PIRs directly?$q$
  AND "answer" = $old$Admin users have oversight tools but do not act as focal or CES reviewers for the normal school review chain. AIP and PIR approvals go through the configured focal and CES roles.$old$;

UPDATE "faq_items"
SET
  "question" = $newq$What is a quarterly deadline?$newq$,
  "answer" = $new$Quarterly deadlines define submission windows for specific reporting periods. The administrator configures the coverage months, open date, due date, and optional grace period that the system enforces.$new$,
  "updated_at" = CURRENT_TIMESTAMP
WHERE "category" = 'Programs, Schools & Deadlines'
  AND "question" = $oldq$What is a trimester deadline?$oldq$
  AND "answer" = $old$Trimester deadlines define submission windows for specific reporting periods. The administrator configures the open and close dates and optional grace periods that the system enforces.$old$;

UPDATE "faq_items"
SET
  "answer" = $new$Quarterly deadlines define submission windows for specific reporting periods. The administrator configures the coverage months, open date, due date, and optional grace period that the system enforces.$new$,
  "updated_at" = CURRENT_TIMESTAMP
WHERE "category" = 'Programs, Schools & Deadlines'
  AND "question" = $q$What is a quarterly deadline?$q$
  AND "answer" = $old$Quarterly deadlines define submission windows for specific reporting periods. The administrator configures the open and close dates and optional grace periods that the system enforces.$old$;

UPDATE "faq_items"
SET
  "answer" = $new$Admin users can manage overview metrics, users, schools, clusters, programs, deadlines, submissions, PIR review, reports, backups, settings, announcements, FAQs, email templates, audit logs, school logos, and cluster logos.$new$,
  "updated_at" = CURRENT_TIMESTAMP
WHERE "category" = 'Admin & Configuration'
  AND "question" = $q$What can Admin manage?$q$
  AND "answer" = $old$Admin users can manage overview metrics, users, schools, clusters, programs, deadlines, submissions, PIR review, reports, backups, settings, announcements, audit logs, school logos, and cluster logos.$old$;

UPDATE "faq_items"
SET
  "answer" = $new$The Help Center hosts this FAQ, the Getting Started guide, and role-aware onboarding inside the dashboard. Detailed system documentation is also maintained as a technical reference and is available from the administrator on request.$new$,
  "updated_at" = CURRENT_TIMESTAMP
WHERE "category" = 'Technical Support'
  AND "question" = $q$Where can I find user documentation?$q$
  AND "answer" = $old$The Help Center hosts this FAQ plus role-aware onboarding inside the dashboard. Detailed system documentation is also maintained as a technical reference and is available from the administrator on request.$old$;

INSERT INTO "faq_items" ("category", "icon_key", "question", "answer", "sort_order", "is_active")
SELECT
  'AIP Submissions',
  'BookOpen',
  $q$What are KPIs, baseline, and quarterly target fields?$q$,
  $a$These numeric AIP metrics help reviewers compare planned outcomes with later PIR accomplishments. KPIs describe the performance measure, the baseline records the starting value, and the quarterly target records the expected progress for the selected reporting period.$a$,
  next_order,
  TRUE
FROM (SELECT COALESCE(MAX("sort_order"), -1) + 1 AS next_order FROM "faq_items" WHERE "category" = 'AIP Submissions') s
WHERE NOT EXISTS (
  SELECT 1 FROM "faq_items"
  WHERE "category" = 'AIP Submissions'
    AND "question" = $q$What are KPIs, baseline, and quarterly target fields?$q$
);

INSERT INTO "faq_items" ("category", "icon_key", "question", "answer", "sort_order", "is_active")
SELECT
  'PIR Submissions',
  'BookOpen',
  $q$How do indicator quarterly targets work in PIR?$q$,
  $a$The PIR asks you to review the AIP indicators and enter the target for the selected quarter. These targets help reviewers compare planned progress with the physical and financial accomplishments you report.$a$,
  next_order,
  TRUE
FROM (SELECT COALESCE(MAX("sort_order"), -1) + 1 AS next_order FROM "faq_items" WHERE "category" = 'PIR Submissions') s
WHERE NOT EXISTS (
  SELECT 1 FROM "faq_items"
  WHERE "category" = 'PIR Submissions'
    AND "question" = $q$How do indicator quarterly targets work in PIR?$q$
);

INSERT INTO "faq_items" ("category", "icon_key", "question", "answer", "sort_order", "is_active")
SELECT
  'Review & Workflow Statuses',
  'AlertCircle',
  $q$What can the Superintendent do?$q$,
  $a$The Superintendent can review CES-owned AIPs and PIRs that route to For Superintendent Review and can monitor division activity through restricted oversight views.$a$,
  next_order,
  TRUE
FROM (SELECT COALESCE(MAX("sort_order"), -1) + 1 AS next_order FROM "faq_items" WHERE "category" = 'Review & Workflow Statuses') s
WHERE NOT EXISTS (
  SELECT 1 FROM "faq_items"
  WHERE "category" = 'Review & Workflow Statuses'
    AND "question" = $q$What can the Superintendent do?$q$
);

INSERT INTO "faq_items" ("category", "icon_key", "question", "answer", "sort_order", "is_active")
SELECT
  'Programs, Schools & Deadlines',
  'BookOpen',
  $q$What is the global reporting period picker?$q$,
  $a$The Reporting Period picker in the header selects the reporting year and quarter used by dashboards, queues, PIR forms, reports, and some admin views. If data looks missing, confirm that the selected period is correct.$a$,
  next_order,
  TRUE
FROM (SELECT COALESCE(MAX("sort_order"), -1) + 1 AS next_order FROM "faq_items" WHERE "category" = 'Programs, Schools & Deadlines') s
WHERE NOT EXISTS (
  SELECT 1 FROM "faq_items"
  WHERE "category" = 'Programs, Schools & Deadlines'
    AND "question" = $q$What is the global reporting period picker?$q$
);

INSERT INTO "faq_items" ("category", "icon_key", "question", "answer", "sort_order", "is_active")
SELECT
  'Admin & Configuration',
  'HelpCircle',
  $q$Can Admin edit the public FAQ?$q$,
  $a$Yes. Admin users can open FAQ Management to add, edit, reorder, hide, delete, rename categories, or restore missing default questions. Public FAQ changes are live immediately.$a$,
  next_order,
  TRUE
FROM (SELECT COALESCE(MAX("sort_order"), -1) + 1 AS next_order FROM "faq_items" WHERE "category" = 'Admin & Configuration') s
WHERE NOT EXISTS (
  SELECT 1 FROM "faq_items"
  WHERE "category" = 'Admin & Configuration'
    AND "question" = $q$Can Admin edit the public FAQ?$q$
);
