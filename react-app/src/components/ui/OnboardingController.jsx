import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useOnboarding } from '../../hooks/useOnboarding.jsx';
import { auth } from '../../lib/auth.js';
import {
  shouldSuppressAutoWelcome,
  isChecklistRole,
  isChecklistLandingPage,
} from '../../lib/onboardingUtils.js';
import WelcomeCard from './WelcomeCard.jsx';
import OnboardingChecklist from './OnboardingChecklist.jsx';
import OnboardingTour from './OnboardingTour.jsx';

function getSessionPromptKey(userId, expiry) {
  return userId && expiry
    ? `onboarding:loginPrompt:${userId}:${expiry}`
    : null;
}

function getRouteSignal(roleKey, pathname) {
  if (['school', 'division'].includes(roleKey)) {
    if (pathname === '/') return 'author.dashboard_visited';
    if (pathname === '/aip' || pathname === '/pir') return 'author.form_visited';
  }

  if (roleKey === 'ces') {
    if (pathname === '/ces') return 'ces.queue_visited';
  }

  if (roleKey === 'cluster') {
    if (pathname === '/cluster-head') return 'cluster.queue_visited';
  }

  if (roleKey === 'admin') {
    if (pathname === '/admin') return 'admin.overview_visited';
    if (pathname === '/admin/users') return 'admin.users_visited';
    if (pathname === '/admin/schools' || pathname === '/admin/programs') return 'admin.resources_visited';
    if (pathname === '/admin/submissions') return 'admin.submissions_visited';
    if (pathname === '/admin/reports' || pathname === '/admin/settings') return 'admin.reports_settings_visited';
  }

  return null;
}

function OnboardingHints() {
  const location = useLocation();
  const { hints, onboarding, tasks, markHintSeen } = useOnboarding();
  const [visibleHint, setVisibleHint] = useState(null);

  const nextHint = useMemo(() => {
    return hints.find((hint) => {
      if (hint.pathname !== location.pathname) return false;
      if (onboarding.checklist_progress.hint_ids_seen.includes(hint.id)) return false;
      if (hint.requiredTaskId && !onboarding.checklist_progress.completed_task_ids.includes(hint.requiredTaskId)) {
        return false;
      }
      if (hint.pendingTaskId && onboarding.checklist_progress.completed_task_ids.includes(hint.pendingTaskId)) {
        return false;
      }
      return true;
    }) ?? null;
  }, [hints, location.pathname, onboarding.checklist_progress.completed_task_ids, onboarding.checklist_progress.hint_ids_seen]);

  useEffect(() => {
    if (!nextHint) {
      const timer = window.setTimeout(() => setVisibleHint(null), 0);
      return () => window.clearTimeout(timer);
    }

    const timer = window.setTimeout(() => {
      const target = document.querySelector(`[data-tour="${nextHint.target}"]`);
      if (!target) return;
      const rect = target.getBoundingClientRect();
      setVisibleHint({
        ...nextHint,
        top: Math.max(16, rect.bottom + 12),
        left: Math.min(window.innerWidth - 304, Math.max(16, rect.left)),
      });
      markHintSeen(nextHint.id);
    }, 550);

    return () => window.clearTimeout(timer);
  }, [markHintSeen, nextHint]);

  if (!visibleHint) return null;

  const task = tasks.find((item) => item.id === visibleHint.pendingTaskId);

  return (
    <div
      className="fixed z-[102] max-w-[288px] rounded-2xl border border-slate-200 dark:border-dark-border bg-white/96 dark:bg-dark-surface/96 p-4 shadow-xl backdrop-blur"
      style={{
        top: visibleHint.top,
        left: visibleHint.left,
      }}
    >
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
        First Action Hint
      </p>
      <h4 className="mt-1 text-sm font-black text-slate-900 dark:text-slate-100">
        {visibleHint.title}
      </h4>
      <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
        {visibleHint.description}
      </p>
      {task && (
        <p className="mt-3 text-xs font-bold text-slate-400 dark:text-slate-500">
          Related checklist task: {task.label}
        </p>
      )}
      <button
        type="button"
        onClick={() => setVisibleHint(null)}
        className="mt-3 text-xs font-black uppercase tracking-[0.18em] text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-300"
      >
        Dismiss
      </button>
    </div>
  );
}

export default function OnboardingController() {
  const location = useLocation();
  const {
    user,
    roleKey,
    isHydrated,
    hasChecklist,
    isWelcomeEligible,
    onboarding,
    tasks,
    completedCount,
    isComplete,
    welcomeOpen,
    checklistOpen,
    setWelcomeOpen,
    setChecklistOpen,
    toggleChecklist,
    dismissChecklist,
    toggleShowOnLogin,
    startOnboarding,
    skipWelcome,
    acknowledgePending,
    recordSignal,
  } = useOnboarding();
  const hasAutoOpenedRef = useRef('');
  const [activeTaskTour, setActiveTaskTour] = useState(null);
  const showChecklistOnPage = isChecklistLandingPage(roleKey, location.pathname);
  // Holds tour data for a task whose target route hasn't been reached yet.
  // Activated by the route effect once the user navigates to the correct page.
  const pendingTourRef = useRef(null);

  // Launch a tour for a checklist task.
  // If the task lives on the current route, activates immediately.
  // If it requires a different route, arms pendingTourRef so it activates on arrival.
  const launchTour = useCallback((task) => {
    if (!task?.tourSteps?.length) return;
    const data = { id: task.id, title: task.label, steps: task.tourSteps, route: task.route ?? null };
    if (!task.route || task.route === location.pathname) {
      pendingTourRef.current = null;
      setActiveTaskTour(data);
    } else {
      pendingTourRef.current = data;
      setActiveTaskTour(null);
    }
  }, [location.pathname]);

  // Activate a pending tour on arrival, or close the active tour when leaving its route.
  // Intentionally omits `activeTaskTour` from deps so the effect only runs on
  // route changes — not on the render where setActiveTaskTour itself fires, which
  // would immediately close a just-launched cross-route tour.
  useEffect(() => {
    if (pendingTourRef.current?.route === location.pathname) {
      setActiveTaskTour(pendingTourRef.current);
      pendingTourRef.current = null;
      return;
    }
    setActiveTaskTour((cur) =>
      cur?.route && location.pathname !== cur.route ? null : cur
    );
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const signal = getRouteSignal(roleKey, location.pathname);
    if (signal) {
      recordSignal(signal);
    }
  }, [location.pathname, recordSignal, roleKey]);

  useEffect(() => {
    if (!isHydrated || !user?.id || !isWelcomeEligible) return undefined;
    if (shouldSuppressAutoWelcome(location.pathname)) return undefined;

    const promptKey = getSessionPromptKey(user.id, auth.getExpiry());
    if (!promptKey || sessionStorage.getItem(promptKey)) return undefined;
    if (!onboarding.onboarding_show_on_login) return undefined;

    const signature = `${promptKey}:${location.pathname}`;
    if (hasAutoOpenedRef.current === signature) return undefined;

    const timer = window.setTimeout(() => {
      sessionStorage.setItem(promptKey, '1');
      hasAutoOpenedRef.current = signature;
      setChecklistOpen(false);
      setWelcomeOpen(true);
    }, 400);

    return () => window.clearTimeout(timer);
  }, [
    isHydrated,
    isWelcomeEligible,
    location.pathname,
    onboarding.onboarding_show_on_login,
    setChecklistOpen,
    setWelcomeOpen,
    user?.id,
  ]);

  if (!user?.id) return null;
  if (!isChecklistRole(roleKey) && roleKey !== 'pending') return null;

  return (
    <>
      <WelcomeCard
        open={welcomeOpen}
        roleKey={roleKey}
        showOnLogin={onboarding.onboarding_show_on_login}
        onToggleShowOnLogin={toggleShowOnLogin}
        onGetStarted={() => {
          startOnboarding();
          // Auto-launch the first incomplete task's tour.
          // Prefer a task whose route matches the current page (immediate);
          // fall back to the first incomplete task overall (pending on nav).
          const doneIds = onboarding.checklist_progress.completed_task_ids;
          const first =
            tasks.find((t) => !doneIds.includes(t.id) && t.tourSteps?.length && t.route === location.pathname) ??
            tasks.find((t) => !doneIds.includes(t.id) && t.tourSteps?.length);
          if (first) launchTour(first);
        }}
        onSkip={skipWelcome}
        onDismissPending={acknowledgePending}
      />

      {hasChecklist && isHydrated && (
        <>
          {showChecklistOnPage && (
            <OnboardingChecklist
              open={checklistOpen}
              hidden={onboarding.checklist_progress.panel_hidden}
              tasks={tasks}
              completedIds={onboarding.checklist_progress.completed_task_ids}
              completedCount={completedCount}
              isComplete={isComplete}
              onToggle={toggleChecklist}
              onDismiss={dismissChecklist}
              onTaskClick={(task) => {
                setChecklistOpen(true);
                launchTour(task);
              }}
              onClose={() => setChecklistOpen(false)}
              sidebarOffset={roleKey === 'admin'}
              hidePill={roleKey === 'admin'}
            />
          )}
          {activeTaskTour && (
            <OnboardingTour
              key={`checklist-task-tour:${activeTaskTour.id}`}
              open
              title={activeTaskTour.title}
              steps={activeTaskTour.steps}
              onClose={(reason) => {
                if (reason === 'completed') {
                  // Auto-advance to the next incomplete task on the same route.
                  const doneIds = onboarding.checklist_progress.completed_task_ids;
                  const next = tasks.find((t) =>
                    t.id !== activeTaskTour.id &&
                    !doneIds.includes(t.id) &&
                    t.tourSteps?.length &&
                    t.route === location.pathname
                  );
                  if (next) {
                    launchTour(next);
                    return;
                  }
                }
                setActiveTaskTour(null);
              }}
            />
          )}
          <OnboardingHints />
        </>
      )}
    </>
  );
}
