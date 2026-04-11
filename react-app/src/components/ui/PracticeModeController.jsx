import { useEffect, useState } from 'react';
import { usePracticeMode } from '../../context/PracticeModeContext.jsx';
import { useAccessibility } from '../../context/AccessibilityContext.jsx';
import PracticeModeBanner from './PracticeModeBanner.jsx';
import PracticeInteractionModal from './PracticeInteractionModal.jsx';
import OnboardingChecklist from './OnboardingChecklist.jsx';

export default function PracticeModeController() {
  const {
    active,
    tasks,
    completedIds,
    completedCount,
    isComplete,
    activeTaskId,
    exitPracticeMode,
    openPracticeTask,
    closePracticeTask,
    completePracticeAction,
  } = usePracticeMode();

  if (!active) return null;

  return (
    <ActivePracticeModeView
      tasks={tasks}
      completedIds={completedIds}
      completedCount={completedCount}
      isComplete={isComplete}
      activeTaskId={activeTaskId}
      exitPracticeMode={exitPracticeMode}
      openPracticeTask={openPracticeTask}
      closePracticeTask={closePracticeTask}
      completePracticeAction={completePracticeAction}
    />
  );
}

function ActivePracticeModeView({
  tasks,
  completedIds,
  completedCount,
  isComplete,
  activeTaskId,
  exitPracticeMode,
  openPracticeTask,
  closePracticeTask,
  completePracticeAction,
}) {
  const { settings } = useAccessibility();
  const [checklistOpen, setChecklistOpen] = useState(true);

  // Auto-exit 5 s after all tasks done (respects reduceMotion — stays open if enabled)
  useEffect(() => {
    if (!isComplete || settings.reduceMotion) return undefined;
    const timer = window.setTimeout(exitPracticeMode, 5000);
    return () => window.clearTimeout(timer);
  }, [exitPracticeMode, isComplete, settings.reduceMotion]);

  const activeTask = tasks.find((t) => t.id === activeTaskId) ?? null;

  return (
    <>
      {/* Sticky banner across the top */}
      <PracticeModeBanner onExit={exitPracticeMode} />

      {/* Practice checklist — reuses Phase 1 OnboardingChecklist with practice tasks.
          Tasks have no route, so clicking one calls onTaskClick (opens the modal). */}
      <OnboardingChecklist
        open={checklistOpen}
        hidden={false}
        tasks={tasks}
        completedIds={completedIds}
        completedCount={completedCount}
        isComplete={isComplete}
        onToggle={() => setChecklistOpen((o) => !o)}
        onDismiss={exitPracticeMode}
        onTaskClick={(task) => openPracticeTask(task.id)}
        onClose={() => setChecklistOpen(false)}
      />

      {/* Practice interaction modal */}
      {activeTask && (
        <PracticeInteractionModal
          task={activeTask}
          onComplete={completePracticeAction}
          onClose={closePracticeTask}
        />
      )}
    </>
  );
}
