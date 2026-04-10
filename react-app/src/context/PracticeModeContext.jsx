/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { getRoleKey, getPracticeTasks, hasPracticeMode } from '../lib/onboardingConfig.js';
import { ONBOARDING_SIGNAL_EVENT, emitOnboardingSignal } from '../lib/onboardingSignals.js';
import { useUser } from '../lib/auth.js';

const PracticeModeContext = createContext(null);

export function PracticeModeProvider({ children }) {
  const user = useUser();
  const roleKey = getRoleKey(user?.role);
  const tasks = useMemo(() => getPracticeTasks(roleKey), [roleKey]);
  const canPractice = hasPracticeMode(roleKey);

  const [active, setActive] = useState(false);
  const [completedIds, setCompletedIds] = useState([]);
  const [activeTaskId, setActiveTaskId] = useState(null);

  // Reset state when role changes (e.g. after re-login)
  const prevRoleKeyRef = useRef(roleKey);
  useEffect(() => {
    if (prevRoleKeyRef.current !== roleKey) {
      prevRoleKeyRef.current = roleKey;
      setActive(false);
      setCompletedIds([]);
      setActiveTaskId(null);
    }
  }, [roleKey]);

  // Listen for practice signals and complete matching tasks
  useEffect(() => {
    if (!active) return undefined;
    const handler = (event) => {
      const signal = event.detail?.signal;
      if (!signal?.startsWith('practice.')) return;
      const matched = tasks.filter((t) => t.completeOn.includes(signal));
      if (matched.length === 0) return;
      setCompletedIds((prev) => {
        const incoming = matched.map((t) => t.id).filter((id) => !prev.includes(id));
        return incoming.length > 0 ? [...prev, ...incoming] : prev;
      });
    };
    window.addEventListener(ONBOARDING_SIGNAL_EVENT, handler);
    return () => window.removeEventListener(ONBOARDING_SIGNAL_EVENT, handler);
  }, [active, tasks]);

  const enterPracticeMode = useCallback(() => {
    setCompletedIds([]);
    setActiveTaskId(null);
    setActive(true);
  }, []);

  const exitPracticeMode = useCallback(() => {
    setActive(false);
    setCompletedIds([]);
    setActiveTaskId(null);
  }, []);

  const openPracticeTask = useCallback((taskId) => {
    setActiveTaskId(taskId);
  }, []);

  const closePracticeTask = useCallback(() => {
    setActiveTaskId(null);
  }, []);

  /**
   * Called by PracticeInteractionModal when the user completes a mock action.
   * Emits the first completeOn signal for the task so the signal listener picks it up.
   */
  const completePracticeAction = useCallback(
    (taskId) => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;
      emitOnboardingSignal(task.completeOn[0]);
      setActiveTaskId(null);
    },
    [tasks],
  );

  const completedCount = tasks.filter((t) => completedIds.includes(t.id)).length;
  const isComplete = tasks.length > 0 && completedCount === tasks.length;

  const value = useMemo(
    () => ({
      active,
      roleKey,
      canPractice,
      tasks,
      completedIds,
      completedCount,
      isComplete,
      activeTaskId,
      enterPracticeMode,
      exitPracticeMode,
      openPracticeTask,
      closePracticeTask,
      completePracticeAction,
    }),
    [
      active,
      activeTaskId,
      canPractice,
      closePracticeTask,
      completePracticeAction,
      completedCount,
      completedIds,
      enterPracticeMode,
      exitPracticeMode,
      isComplete,
      openPracticeTask,
      roleKey,
      tasks,
    ],
  );

  return (
    <PracticeModeContext.Provider value={value}>
      {children}
    </PracticeModeContext.Provider>
  );
}

export function usePracticeMode() {
  const ctx = useContext(PracticeModeContext);
  if (!ctx) throw new Error('usePracticeMode must be used within PracticeModeProvider');
  return ctx;
}
