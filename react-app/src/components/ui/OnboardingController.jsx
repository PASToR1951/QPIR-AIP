import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { usePracticeMode } from '../../context/PracticeModeContext.jsx';
import { useOnboarding } from '../../hooks/useOnboarding.jsx';
import { auth } from '../../lib/auth.js';
import {
  shouldSuppressAutoWelcome,
  isChecklistRole,
  isChecklistLandingPage,
} from '../../lib/onboardingUtils.js';
import { resolveTaskTourSteps } from '../../lib/tourChapters.js';
import OnboardingCompletionCard from './OnboardingCompletionCard.jsx';
import WelcomeCard from './WelcomeCard.jsx';
import OnboardingChecklist from './OnboardingChecklist.jsx';
import OnboardingTour from './OnboardingTour.jsx';
import OnboardingHint from './OnboardingHint.jsx';

function getSessionPromptKey(userId, expiry) {
  return userId && expiry
    ? `onboarding:loginPrompt:${userId}:${expiry}`
    : null;
}

function getRouteSignal(roleKey, pathname) {
  if (['school', 'division'].includes(roleKey)) {
    if (pathname === '/') return 'author.dashboard_visited';
    if (pathname === '/aip') return 'author.aip_form_visited';
    if (pathname === '/pir') return 'author.pir_form_visited';
  }

  if (roleKey === 'division') {
    if (pathname === '/division') return 'division.focal_queue_visited';
    if (pathname.startsWith('/division/')) return 'division.focal_review_opened';
  }

  if (roleKey === 'ces') {
    if (pathname === '/ces') return 'ces.queue_visited';
    if (pathname === '/aip') return 'ces.aip_form_visited';
    if (pathname === '/pir') return 'ces.pir_form_visited';
  }

  if (roleKey === 'admin') {
    if (pathname === '/admin') return 'admin.overview_visited';
    if (pathname === '/admin/users') return 'admin.users_visited';
    if (pathname === '/admin/schools' || pathname === '/admin/programs') return 'admin.resources_visited';
    if (pathname === '/admin/submissions') return 'admin.submissions_visited';
    if (pathname === '/admin/reports' || pathname === '/admin/settings' || pathname === '/admin/consolidation-template') return 'admin.reports_settings_visited';
  }

  if (roleKey === 'observer') {
    if (pathname === '/admin') return 'observer.overview_visited';
    if (pathname === '/admin/submissions') return 'observer.submissions_visited';
    if (pathname === '/admin/consolidation-template') return 'observer.consolidation_visited';
  }

  return null;
}

function taskMatchesPath(task, pathname) {
  if (!task) return false;
  if (task.route === pathname) return true;
  if (task.routePrefix && pathname.startsWith(task.routePrefix)) return true;
  if (Array.isArray(task.routes) && task.routes.includes(pathname)) return true;
  return false;
}

function OnboardingHints() {
  const location = useLocation();
  const { hints, onboarding, tasks, markHintSeen } = useOnboarding();
  const [activeHint, setActiveHint] = useState(null);

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
      const clearTimer = window.setTimeout(() => setActiveHint(null), 0);
      return () => window.clearTimeout(clearTimer);
    }

    const timer = window.setTimeout(() => {
      setActiveHint(nextHint);
      markHintSeen(nextHint.id);
    }, 550);

    return () => window.clearTimeout(timer);
  }, [markHintSeen, nextHint]);

  if (!activeHint) return null;

  const task = tasks.find((item) => item.id === activeHint.pendingTaskId);

  return (
    <OnboardingHint
      hintId={activeHint.id}
      target={activeHint.target}
      title={activeHint.title}
      description={activeHint.description}
      relatedTaskLabel={task?.label}
      onDismiss={() => setActiveHint(null)}
    />
  );
}

export default function OnboardingController() {
  const location = useLocation();
  const { canPractice, openIntro } = usePracticeMode();
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
  const completionShownRef = useRef(false);
  const completionPendingRef = useRef(false);
  const completionReadyRef = useRef(false);
  const completionPrevCompleteRef = useRef(false);
  const [activeTaskTour, setActiveTaskTour] = useState(null);
  const [completionOpen, setCompletionOpen] = useState(false);
  const showChecklistOnPage = isChecklistLandingPage(roleKey, location.pathname);
  const completionStorageKey = user?.id ? `onboarding:completion:${user.id}` : null;
  // Holds tour data for a task whose target route hasn't been reached yet.
  // Activated by the route effect once the user navigates to the correct page.
  const pendingTourRef = useRef(null);

  // Launch a tour for a checklist task.
  // If the task lives on the current route, activates immediately.
  // If it requires a different route, arms pendingTourRef so it activates on arrival.
  const launchTour = useCallback((task) => {
    const steps = resolveTaskTourSteps(task);
    if (!steps.length) return;
    const data = {
      id: task.id,
      title: task.label,
      steps,
      route: task.route ?? null,
      routePrefix: task.routePrefix ?? null,
      routes: task.routes ?? null,
    };
    if (!task.route || taskMatchesPath(task, location.pathname)) {
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
    if (taskMatchesPath(pendingTourRef.current, location.pathname)) {
      setActiveTaskTour(pendingTourRef.current);
      pendingTourRef.current = null;
      return;
    }
    setActiveTaskTour((cur) =>
      cur?.route && !taskMatchesPath(cur, location.pathname) ? null : cur
    );
  }, [location.pathname]);

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

  useEffect(() => {
    completionShownRef.current = false;
    completionPendingRef.current = false;
    completionReadyRef.current = false;
    completionPrevCompleteRef.current = false;
    setCompletionOpen(false);
  }, [user?.id]);

  useEffect(() => {
    if (!isHydrated || !user?.id) return undefined;

    if (!completionReadyRef.current) {
      completionReadyRef.current = true;
      completionPrevCompleteRef.current = isComplete;
      return undefined;
    }

    const justCompleted = !completionPrevCompleteRef.current && isComplete;
    const justReset = completionPrevCompleteRef.current && !isComplete;
    completionPrevCompleteRef.current = isComplete;

    if (justReset) {
      completionPendingRef.current = false;
      return undefined;
    }

    if (justCompleted) {
      completionPendingRef.current = true;
    }

    if (!isComplete) return undefined;
    if (!completionPendingRef.current) return undefined;
    if (!showChecklistOnPage) return undefined;
    if (completionShownRef.current) {
      completionPendingRef.current = false;
      return undefined;
    }
    if (!completionStorageKey || sessionStorage.getItem(completionStorageKey)) {
      completionPendingRef.current = false;
      return undefined;
    }

    const timer = window.setTimeout(() => {
      sessionStorage.setItem(completionStorageKey, '1');
      completionShownRef.current = true;
      completionPendingRef.current = false;
      setCompletionOpen(true);
    }, 800);

    return () => window.clearTimeout(timer);
  }, [completionStorageKey, isComplete, isHydrated, showChecklistOnPage, user?.id]);

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
            tasks.find((t) => !doneIds.includes(t.id) && resolveTaskTourSteps(t).length && taskMatchesPath(t, location.pathname)) ??
            tasks.find((t) => !doneIds.includes(t.id) && resolveTaskTourSteps(t).length);
          if (first) launchTour(first);
        }}
        onSkip={skipWelcome}
        onDismissPending={acknowledgePending}
      />

      <OnboardingCompletionCard
        open={completionOpen}
        canPractice={canPractice}
        onGetStarted={() => setCompletionOpen(false)}
        onTryPractice={() => {
          setCompletionOpen(false);
          openIntro();
        }}
      />

      {hasChecklist && isHydrated && (
        <>
          {showChecklistOnPage && (!isComplete || checklistOpen) && (
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
              stepStorageKey={user?.id ? `tour:step:${user.id}:${activeTaskTour.id}` : undefined}
              onClose={(reason) => {
                if (reason === 'completed') {
                  // Auto-advance to the next incomplete task on the same route.
                  const doneIds = onboarding.checklist_progress.completed_task_ids;
                  const next = tasks.find((t) =>
                    t.id !== activeTaskTour.id &&
                    !doneIds.includes(t.id) &&
                    resolveTaskTourSteps(t).length &&
                    taskMatchesPath(t, location.pathname)
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
