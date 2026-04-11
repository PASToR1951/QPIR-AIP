/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import api from '../lib/api.js';
import { auth, useUser } from '../lib/auth.js';
import {
  DEFAULT_CHECKLIST_PROGRESS,
  getRoleKey,
  ONBOARDING_VERSION,
} from '../lib/onboardingConfig.js';
import {
  getOnboardingHints,
  getOnboardingTasks,
  isChecklistRole,
  isWelcomeEligibleRole,
  normalizeChecklistProgress,
} from '../lib/onboardingUtils.js';
import { ONBOARDING_SIGNAL_EVENT } from '../lib/onboardingSignals.js';

const OnboardingContext = createContext(null);

function getLocalStorageKey(userId) {
  return userId ? `onboarding:${userId}` : null;
}

function sanitizeServerPayload(payload, roleKey) {
  return {
    onboarding_version_seen: Number.isInteger(payload?.onboarding_version_seen)
      ? payload.onboarding_version_seen
      : 0,
    onboarding_show_on_login: payload?.onboarding_show_on_login !== false,
    onboarding_dismissed_at: payload?.onboarding_dismissed_at ?? null,
    onboarding_completed_at: payload?.onboarding_completed_at ?? null,
    checklist_progress: normalizeChecklistProgress(
      payload?.checklist_progress ?? DEFAULT_CHECKLIST_PROGRESS,
      roleKey,
    ),
  };
}

function getInitialState(user) {
  const roleKey = getRoleKey(user?.role);
  return sanitizeServerPayload(user ?? {}, roleKey);
}

export function OnboardingProvider({ children }) {
  const user = useUser();
  const roleKey = getRoleKey(user?.role);
  const hasChecklist = isChecklistRole(roleKey);
  const checklistTasks = useMemo(() => getOnboardingTasks(roleKey), [roleKey]);
  const hints = useMemo(() => getOnboardingHints(roleKey), [roleKey]);
  const initialState = useMemo(() => getInitialState(user), [user]);
  const [serverState, setServerState] = useState(initialState);
  const [localState, setLocalState] = useState(initialState);
  const [isHydrated, setIsHydrated] = useState(false);
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [checklistOpen, setChecklistOpen] = useState(false);
  const requestIdRef = useRef(0);
  const lastServerStateRef = useRef(serverState);
  const localStateRef = useRef(localState);

  const localStorageKey = getLocalStorageKey(user?.id);

  useEffect(() => {
    lastServerStateRef.current = serverState;
  }, [serverState]);

  useEffect(() => {
    localStateRef.current = localState;
  }, [localState]);

  useEffect(() => {
    if (!user?.id) {
      const emptyState = getInitialState(null);
      startTransition(() => {
        setServerState(emptyState);
        setLocalState(emptyState);
        setWelcomeOpen(false);
        setChecklistOpen(false);
        setIsHydrated(true);
      });
      return;
    }

    const fallbackState = initialState;
    let nextState = fallbackState;

    if (localStorageKey) {
      try {
        const raw = localStorage.getItem(localStorageKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          nextState = sanitizeServerPayload({
            ...fallbackState,
            ...parsed,
          }, roleKey);
        }
      } catch {
        nextState = fallbackState;
      }
    }

    startTransition(() => {
      setServerState(fallbackState);
      setLocalState(nextState);
      setWelcomeOpen(false);
      setChecklistOpen(false);
      setIsHydrated(true);
    });
  }, [initialState, localStorageKey, roleKey, user?.id]);

  useEffect(() => {
    if (!localStorageKey || !user?.id) return;
    try {
      localStorage.setItem(localStorageKey, JSON.stringify(localState));
    } catch {
      // Local storage is only an optimization for first paint and offline fallback.
    }
  }, [localState, localStorageKey, user?.id]);

  useEffect(() => {
    if (!user?.id || auth.isExpired()) return undefined;

    let cancelled = false;
    // Use a direct API call instead of auth.refreshSession() to avoid triggering
    // auth.setSession() → dispatchSessionUpdate → useUser() re-render → initialState
    // recompute → hydration effect re-run → setWelcomeOpen(false) closing the card.
    api.get('/api/auth/me')
      .then(({ data: freshUser }) => {
        if (cancelled) return;
        const nextState = sanitizeServerPayload(freshUser, getRoleKey(freshUser.role));
        startTransition(() => {
          setServerState(nextState);
          setLocalState(nextState);
        });
      })
      .catch(() => {
        // The existing auth layer already owns redirect/expiry behavior.
      });

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const patchState = useCallback(async (patchPayload, nextState) => {
    const requestId = ++requestIdRef.current;
    startTransition(() => setLocalState(nextState));

    try {
      const response = await api.patch('/api/auth/me/onboarding', patchPayload);
      const confirmedState = sanitizeServerPayload(response.data, roleKey);
      startTransition(() => {
        setServerState(confirmedState);
        setLocalState(confirmedState);
      });
    } catch (error) {
      if (requestId === requestIdRef.current) {
        startTransition(() => setLocalState(lastServerStateRef.current));
      }
      throw error;
    }
  }, [roleKey]);

  const applyStateChange = useCallback(async (updater, patchPayload) => {
    const nextState = updater(localStateRef.current);
    await patchState(patchPayload, nextState);
  }, [patchState]);

  const recordSignal = useCallback((signal) => {
    if (!hasChecklist || !signal) return;

    const matchingTaskIds = checklistTasks
      .filter((task) => task.completeOn.includes(signal))
      .map((task) => task.id);

    if (matchingTaskIds.length === 0) return;

    const currentState = localStateRef.current;
    const nextCompletedIds = Array.from(new Set([
      ...currentState.checklist_progress.completed_task_ids,
      ...matchingTaskIds,
    ]));

    if (nextCompletedIds.length === currentState.checklist_progress.completed_task_ids.length) {
      return;
    }

    const completedAllTasks = checklistTasks.length > 0 &&
      checklistTasks.every((task) => nextCompletedIds.includes(task.id));
    const completedAt = completedAllTasks
      ? (currentState.onboarding_completed_at ?? new Date().toISOString())
      : currentState.onboarding_completed_at;

    void applyStateChange(
      (current) => ({
        ...current,
        onboarding_completed_at: completedAt,
        checklist_progress: {
          ...current.checklist_progress,
          completed_task_ids: nextCompletedIds,
        },
      }),
      {
        checklist_progress: {
          ...currentState.checklist_progress,
          completed_task_ids: nextCompletedIds,
        },
        ...(completedAt && currentState.onboarding_completed_at !== completedAt
          ? { completed_at: completedAt }
          : {}),
      },
    ).catch(() => {});
  }, [applyStateChange, checklistTasks, hasChecklist]);

  const markHintSeen = useCallback((hintId) => {
    const currentState = localStateRef.current;
    if (!hintId || currentState.checklist_progress.hint_ids_seen.includes(hintId)) return;

    const nextHintIds = [...currentState.checklist_progress.hint_ids_seen, hintId];

    void applyStateChange(
      (current) => ({
        ...current,
        checklist_progress: {
          ...current.checklist_progress,
          hint_ids_seen: nextHintIds,
        },
      }),
      {
        checklist_progress: {
          ...currentState.checklist_progress,
          hint_ids_seen: nextHintIds,
        },
      },
    ).catch(() => {});
  }, [applyStateChange]);

  const setChecklistHidden = useCallback((hidden) => {
    const currentState = localStateRef.current;

    void applyStateChange(
      (current) => ({
        ...current,
        checklist_progress: {
          ...current.checklist_progress,
          panel_hidden: hidden,
        },
      }),
      {
        checklist_progress: {
          ...currentState.checklist_progress,
          panel_hidden: hidden,
        },
      },
    ).catch(() => {});
  }, [applyStateChange]);

  const toggleShowOnLogin = useCallback((value) => {
    const currentState = localStateRef.current;
    const nextValue = typeof value === 'boolean'
      ? value
      : !currentState.onboarding_show_on_login;

    void applyStateChange(
      (current) => ({
        ...current,
        onboarding_show_on_login: nextValue,
      }),
      { show_on_login: nextValue },
    ).catch(() => {});
  }, [applyStateChange]);

  const startOnboarding = useCallback(() => {
    const currentState = localStateRef.current;
    const nextState = {
      ...currentState,
      onboarding_version_seen: ONBOARDING_VERSION,
      checklist_progress: {
        ...currentState.checklist_progress,
        panel_hidden: false,
      },
    };

    setWelcomeOpen(false);
    setChecklistOpen(true);
    void patchState(
      {
        version_seen: ONBOARDING_VERSION,
        checklist_progress: {
          ...currentState.checklist_progress,
          panel_hidden: false,
        },
      },
      nextState,
    ).catch(() => {});
  }, [patchState]);

  const skipWelcome = useCallback(() => {
    const currentState = localStateRef.current;
    const dismissedAt = new Date().toISOString();
    const nextState = {
      ...currentState,
      onboarding_version_seen: ONBOARDING_VERSION,
      onboarding_dismissed_at: dismissedAt,
    };

    setWelcomeOpen(false);
    setChecklistOpen(false);
    void patchState(
      {
        version_seen: ONBOARDING_VERSION,
        dismissed_at: dismissedAt,
      },
      nextState,
    ).catch(() => {});
  }, [patchState]);

  const acknowledgePending = useCallback(() => {
    const currentState = localStateRef.current;
    const dismissedAt = new Date().toISOString();
    const nextState = {
      ...currentState,
      onboarding_version_seen: ONBOARDING_VERSION,
      onboarding_dismissed_at: dismissedAt,
    };

    setWelcomeOpen(false);
    void patchState(
      {
        version_seen: ONBOARDING_VERSION,
        dismissed_at: dismissedAt,
      },
      nextState,
    ).catch(() => {});
  }, [patchState]);

  const resetOnboarding = useCallback(() => {
    const resetState = sanitizeServerPayload({
      onboarding_version_seen: 0,
      onboarding_show_on_login: true,
      onboarding_dismissed_at: null,
      onboarding_completed_at: null,
      checklist_progress: DEFAULT_CHECKLIST_PROGRESS,
    }, roleKey);

    setChecklistOpen(false);
    setWelcomeOpen(isWelcomeEligibleRole(roleKey));
    void patchState({ reset: true }, resetState).catch(() => {});
  }, [patchState, roleKey]);

  const toggleChecklist = useCallback(() => {
    if (!hasChecklist) return;

    if (localStateRef.current.checklist_progress.panel_hidden) {
      setChecklistHidden(false);
      setChecklistOpen(true);
      return;
    }

    setChecklistOpen((open) => !open);
  }, [hasChecklist, setChecklistHidden]);

  const openChecklist = useCallback(() => {
    if (!hasChecklist) return;
    if (localStateRef.current.checklist_progress.panel_hidden) {
      setChecklistHidden(false);
    }
    setChecklistOpen(true);
  }, [hasChecklist, setChecklistHidden]);

  const closeChecklist = useCallback(() => setChecklistOpen(false), []);
  const dismissChecklist = useCallback(() => {
    setChecklistOpen(false);
    setChecklistHidden(true);
  }, [setChecklistHidden]);

  useEffect(() => {
    if (!hasChecklist) return undefined;

    const handleSignal = (event) => {
      const signal = event.detail?.signal;
      if (signal) recordSignal(signal);
    };

    window.addEventListener(ONBOARDING_SIGNAL_EVENT, handleSignal);
    return () => window.removeEventListener(ONBOARDING_SIGNAL_EVENT, handleSignal);
  }, [hasChecklist, recordSignal]);

  const completedTaskIds = localState.checklist_progress.completed_task_ids;
  const completedCount = checklistTasks.filter((task) => completedTaskIds.includes(task.id)).length;
  const isComplete = hasChecklist && checklistTasks.length > 0 && completedCount === checklistTasks.length;
  const showUpdatedContentBadge = !localState.onboarding_show_on_login &&
    localState.onboarding_version_seen < ONBOARDING_VERSION &&
    hasChecklist;

  const contextValue = useMemo(() => ({
    user,
    roleKey,
    isHydrated,
    hasChecklist,
    isWelcomeEligible: isWelcomeEligibleRole(roleKey),
    onboarding: localState,
    hints,
    tasks: checklistTasks,
    completedCount,
    isComplete,
    welcomeOpen,
    checklistOpen,
    showUpdatedContentBadge,
    setWelcomeOpen,
    setChecklistOpen,
    openChecklist,
    closeChecklist,
    toggleChecklist,
    dismissChecklist,
    toggleShowOnLogin,
    startOnboarding,
    skipWelcome,
    acknowledgePending,
    resetOnboarding,
    recordSignal,
    markHintSeen,
  }), [
    acknowledgePending,
    checklistOpen,
    checklistTasks,
    closeChecklist,
    completedCount,
    dismissChecklist,
    hasChecklist,
    hints,
    isComplete,
    isHydrated,
    localState,
    markHintSeen,
    openChecklist,
    recordSignal,
    resetOnboarding,
    roleKey,
    showUpdatedContentBadge,
    skipWelcome,
    startOnboarding,
    toggleChecklist,
    toggleShowOnLogin,
    user,
    welcomeOpen,
  ]);

  return (
    <OnboardingContext.Provider value={contextValue}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}
