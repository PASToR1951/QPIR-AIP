import {
  EXCLUDED_AUTO_OPEN_PATHS,
  ROLE_REGISTRY,
} from './onboardingConfig.js';

// ── Role predicate helpers ────────────────────────────────────────────────────

export function isChecklistRole(roleKey) {
  return ROLE_REGISTRY[roleKey]?.hasChecklist === true;
}

export function isWelcomeEligibleRole(roleKey) {
  return ROLE_REGISTRY[roleKey]?.isWelcomeEligible === true;
}

// ── Auto-welcome suppression ──────────────────────────────────────────────────

export function shouldSuppressAutoWelcome(pathname = '') {
  if (EXCLUDED_AUTO_OPEN_PATHS.has(pathname)) return true;
  for (const path of EXCLUDED_AUTO_OPEN_PATHS) {
    if (pathname.startsWith(`${path}/`)) return true;
  }
  return false;
}

export function isChecklistLandingPage(roleKey, pathname = '') {
  switch (roleKey) {
    case 'school':
    case 'division':
      return pathname === '/';
    case 'ces':
      return pathname === '/ces';
    case 'cluster':
      return pathname === '/cluster-head';
    case 'admin':
      return pathname === '/admin';
    default:
      return false;
  }
}

// ── Public data accessors ─────────────────────────────────────────────────────
// Derived from ROLE_REGISTRY — no data duplication.

// WelcomeCard reads this as a plain object keyed by roleKey.
export const onboardingContent = Object.fromEntries(
  Object.entries(ROLE_REGISTRY)
    .filter(([, cfg]) => cfg.content !== null)
    .map(([key, cfg]) => [key, cfg.content]),
);

export function getOnboardingTasks(roleKey) {
  return ROLE_REGISTRY[roleKey]?.tasks ?? [];
}

export function getOnboardingHints(roleKey) {
  return ROLE_REGISTRY[roleKey]?.hints ?? [];
}

export function getPracticeTasks(roleKey) {
  return ROLE_REGISTRY[roleKey]?.practiceTasks ?? [];
}

export function hasPracticeMode(roleKey) {
  return (ROLE_REGISTRY[roleKey]?.practiceTasks?.length ?? 0) > 0;
}

// ── Checklist progress normalizer ─────────────────────────────────────────────

export function normalizeChecklistProgress(progress, roleKey) {
  const tasks = getOnboardingTasks(roleKey);
  const validTaskIds = new Set(tasks.map((task) => task.id));
  const source = progress && typeof progress === 'object' ? progress : {};

  return {
    completed_task_ids: Array.isArray(source.completed_task_ids)
      ? source.completed_task_ids.filter((taskId) => validTaskIds.has(taskId))
      : [],
    hint_ids_seen: Array.isArray(source.hint_ids_seen)
      ? source.hint_ids_seen.filter((hintId) => typeof hintId === 'string' && hintId.trim().length > 0)
      : [],
    panel_hidden: Boolean(source.panel_hidden),
  };
}
