import { ROLE_REGISTRY } from './onboarding/roles/index.js';

export const ONBOARDING_VERSION = 1;

export const DEFAULT_CHECKLIST_PROGRESS = {
  completed_task_ids: [],
  hint_ids_seen: [],
  panel_hidden: false,
};

// ── Role key lookup ───────────────────────────────────────────────────────────
// Maps DB role strings → short internal keys. Single source of truth for role
// naming: add or rename roles here only.
const ROLE_KEY_MAP = {
  'School':               'school',
  'Division Personnel':   'division',
  'CES-SGOD':             'ces',
  'CES-ASDS':             'ces',
  'CES-CID':              'ces',
  'Cluster Coordinator':  'cluster',
  'Admin':                'admin',
  'Observer':             'observer',
  'Pending':              'pending',
};

export function getRoleKey(role) {
  return ROLE_KEY_MAP[role] ?? 'unknown';
}

// ── Role registry ─────────────────────────────────────────────────────────────
// One entry per internal role key. Adding a new role means adding one module
// under lib/onboarding/roles instead of editing this file directly.
export { ROLE_REGISTRY };

// ── Excluded auto-open paths ──────────────────────────────────────────────────
export const EXCLUDED_AUTO_OPEN_PATHS = new Set([
  '/login',
  '/oauth/callback',
  '/docs',
  '/getting-started',
  '/faq',
  '/privacy',
  '/changelog',
]);
