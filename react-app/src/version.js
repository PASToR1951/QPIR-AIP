/**
 * AIP-PIR Version & Changelog Registry
 * ─────────────────────────────────────────────────────────────
 * This file is the single source of truth for the application version
 * and its release history. Add a new entry to the CHANGELOG array
 * whenever there is a MAJOR change, NEW FEATURE, or BUG FIX.
 *
 * DO NOT add entries for minor decorative/cosmetic changes.
 *
 * Change types:
 *   ✨ feature      — New capability or module
 *   🐛 fix          — Bug fix
 *   ⚡ improvement  — Enhancement to existing functionality
 *   💥 breaking     — Breaking change that alters behavior
 *   📄 docs         — Documentation update
 *   🔒 security     — Security-related patch
 *
 * Usage:
 *   import { CURRENT_VERSION, CHANGELOG, getVersion } from './version';
 */

export const CURRENT_VERSION = '1.0.1-beta';

export const CHANGELOG = [
  {
    version: '1.0.1-beta',
    date: '2026-03-15',
    title: 'PIR Auto-Population & Division Personnel Foundation',
    description:
      'Introduces AIP-to-PIR activity bridging so that implementation periods and activity names are automatically carried into the PIR form. Lays the database groundwork for Division Personnel document ownership.',
    changes: [
      { type: 'feature', text: 'PIR form auto-fetches AIP activities on school/program/year selection — activity names and implementation periods are pre-filled as read-only fields' },
      { type: 'feature', text: 'Implementation Period column added to PIR print document (PIRDocument)' },
      { type: 'feature', text: 'New GET /api/aips/activities endpoint returns activity list for a given school, program, and year' },
      { type: 'improvement', text: 'PIR activity matching now uses aip_activity_id directly instead of fragile name-based string fallback' },
      { type: 'improvement', text: 'Added created_by_user_id tracking field to AIP and PIR schema — required for Division Personnel access isolation (migration pending)' },
      { type: 'docs', text: 'Division Personnel implementation plan added to TODO.md; DATABASE_SCHEMA.md and SYSTEM_DOCUMENTATION_THESIS.md updated to reflect schema and role changes' },
    ],
  },
  {
    version: '1.0.0-beta',
    date: '2026-03-14',
    title: 'Initial Beta Release',
    description:
      'First public beta of the AIP-PIR Portal — the AIP-PIR management system for DepEd Division of Guihulngan City.',
    changes: [
      { type: 'feature', text: 'AIP Form module with multi-phase activity planning (Planning, Implementation, M&E)' },
      { type: 'feature', text: 'PIR Form module with quarterly review workflow gated behind AIP completion' },
      { type: 'feature', text: 'Role-based authentication (School Users & Division Personnel)' },
      { type: 'feature', text: 'Interactive dashboard with AIP/PIR status tracking and quarterly progress overview' },
      { type: 'feature', text: 'Draft persistence — save and resume form progress via API' },
      { type: 'feature', text: 'Print-ready AIP & PIR document generation' },
      { type: 'feature', text: 'Dynamic signatory fields and DepEd Outcome Category dropdown' },
      { type: 'feature', text: 'Mobile-responsive layout across all pages' },
      { type: 'improvement', text: 'Deno runtime with Prisma ORM and PostgreSQL backend' },
      { type: 'docs', text: 'System changelog and version tracking documentation' },
    ],
  },
];

/**
 * Helper: returns the latest version string.
 */
export function getVersion() {
  return CURRENT_VERSION;
}

/**
 * Helper: returns the full changelog sorted newest-first.
 */
export function getChangelog() {
  return [...CHANGELOG].sort((a, b) => new Date(b.date) - new Date(a.date));
}

/**
 * Helper: Call this to generate a new changelog entry template
 * in the console. Useful when preparing a release.
 *
 * Usage (in browser console):
 *   import { logNewReleaseTemplate } from './version';
 *   logNewReleaseTemplate('1.1.0-beta');
 */
export function logNewReleaseTemplate(version) {
  const today = new Date().toISOString().split('T')[0];
  const template = `
{
  version: '${version}',
  date: '${today}',
  title: '',
  description: '',
  changes: [
    { type: 'feature', text: '' },
    { type: 'fix', text: '' },
    { type: 'improvement', text: '' },
  ],
},`;
  console.log('📋 New release entry template:\n', template);
  return template;
}
