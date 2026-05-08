import { ROLE_REGISTRY } from './roles/index.js';
import { resolveTaskTourSteps } from '../tourChapters.js';

function collectTargets(role) {
  const targets = new Set();

  for (const task of role.tasks ?? []) {
    for (const step of resolveTaskTourSteps(task)) {
      const names = Array.isArray(step.target) ? step.target : [step.target];
      for (const name of names) {
        if (name) targets.add(name);
      }
      if (step.prerequisiteTarget) targets.add(step.prerequisiteTarget);
    }
  }

  for (const hint of role.hints ?? []) {
    if (hint.target) targets.add(hint.target);
  }

  return targets;
}

function checkTargets(currentRoleKey) {
  const role = ROLE_REGISTRY[currentRoleKey];
  if (!role) return;

  const expected = collectTargets(role);
  if (expected.size === 0) return;

  const matched = new Set();
  for (const el of document.querySelectorAll('[data-tour]')) {
    matched.add(el.getAttribute('data-tour'));
  }

  const missing = [];
  for (const name of expected) {
    if (!matched.has(name)) missing.push(name);
  }

  if (missing.length > 0) {
    console.warn(
      `[onboarding] Missing data-tour targets for role "${currentRoleKey}" on ${location.pathname}:`,
      missing
    );
  }
}

export function scheduleTargetValidation(currentRoleKey) {
  if (typeof window === 'undefined') return undefined;
  const timer = window.setTimeout(() => checkTargets(currentRoleKey), 2000);
  return () => window.clearTimeout(timer);
}
