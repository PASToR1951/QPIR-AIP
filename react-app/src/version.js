/**
 * QPIR-AIP Version & Changelog Registry
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

export const CURRENT_VERSION = '1.0.0-beta';

export const CHANGELOG = [
  {
    version: '1.0.0-beta',
    date: '2026-03-14',
    title: 'Initial Beta Release',
    description:
      'First public beta of the QPIR-AIP Portal — the AIP-PIR management system for DepEd Division of Guihulngan City.',
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
