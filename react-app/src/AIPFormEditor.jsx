import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { FormHeader } from './components/ui/FormHeader';
import { FormBoxHeader } from './components/ui/FormBoxHeader';
import { DocumentPreviewModal } from './components/ui/DocumentPreviewModal';
import { AIPDocument } from './components/docs/AIPDocument';
import WizardStepper from './components/ui/WizardStepper';
import SectionHeader from './components/ui/SectionHeader';
import SignatureBlock from './components/ui/SignatureBlock';
import FinalizeCard from './components/ui/FinalizeCard';
import WizardStickyNav from './components/ui/WizardStickyNav';

import AIPProfileSection from './components/forms/aip/AIPProfileSection';
import AIPGoalsTargetsSection from './components/forms/aip/AIPGoalsTargetsSection';
import AIPActionPlanSection from './components/forms/aip/AIPActionPlanSection';

/**
 * Renders the AIP form in readonly, wizard, or full mode.
 * All state lives in AIPForm — this component is purely presentational.
 */
export default function AIPFormEditor({
  // Mode
  appMode,
  toggleAppMode,
  motionProps,
  isMobile,

  // Program + year
  depedProgram,
  year,
  setYear,

  // Edit state
  isEditing,
  aipStatus,

  // Form fields
  outcome,
  sipTitle,
  setSipTitle,
  projectCoord,
  setProjectCoord,
  selectedTarget,
  objectives,
  indicators,
  activities,
  expandedActivityId,
  setExpandedActivityId,
  preparedByName,
  setPreparedByName,
  preparedByTitle,
  setPreparedByTitle,
  approvedByName,
  setApprovedByName,
  approvedByTitle,
  setApprovedByTitle,
  coordinatorSuggestions,
  personsTerms,

  // Form handlers
  onOutcomeChange,
  onTargetChange,
  onObjectiveChange,
  onAddObjective,
  onRemoveObjective,
  onIndicatorChange,
  onAddIndicator,
  onRemoveIndicator,
  onActivityChange,
  onAddActivity,
  onAddActivityPhase,
  onRemoveActivity,

  // Step navigation
  currentStep,
  totalSteps,
  onNextStep,
  onPrevStep,
  onEditSection,
  reviewAreaRef,

  // Save state
  isSaving,
  isSaved,
  lastSavedTime,
  lastAutoSavedTime,
  onSaveForLater,

  // Submit state
  isSubmitted,
  showFinalConfirm,
  onShowFinalConfirm,

  // Preview
  isPreviewOpen,
  onPreviewOpen,

  // Navigation
  onBack,
  onHome,
  onEditAIP,
  onDeleteSubmission,
}) {
  const showWizardStickyNav = appMode === 'wizard' && isMobile;

  // ── Readonly view ─────────────────────────────────────────────────────────────

  if (appMode === 'readonly') {
    return (
      <motion.div key="readonly" {...motionProps}>
        <FormHeader
          title="Annual Implementation Plan"
          programName={depedProgram}
          onBack={onBack}
          theme="pink"
        />
        <div className="bg-slate-50 dark:bg-dark-base min-h-screen font-sans print:bg-white">
          {/* Lock banner */}
          <div className="max-w-5xl mx-auto px-4 pt-4 pb-4 sm:pt-8 print:hidden">
            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 shadow-sm dark:border-emerald-900/50 dark:bg-emerald-950/30 sm:px-5">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600 shrink-0">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <span className="text-sm font-bold text-emerald-800 dark:text-emerald-300 flex-1">
                This form has been submitted{aipStatus && aipStatus !== 'Submitted' ? ` — currently ${aipStatus.toLowerCase()}` : ' and is read-only'}.
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                {(aipStatus === 'Submitted' || aipStatus === 'Returned') && (
                  <button
                    onClick={onEditAIP}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-pink-600 text-white text-xs font-bold hover:bg-pink-700 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                    Edit
                  </button>
                )}
                <button
                  onClick={onDeleteSubmission}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 border border-red-200 dark:border-red-900/50 text-xs font-bold hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                  </svg>
                  Delete
                </button>
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-700 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
                  </svg>
                  Print / Save PDF
                </button>
              </div>
            </div>
          </div>
          {/* Document */}
          <div className="max-w-5xl mx-auto px-4 pb-12">
            <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-dark-border dark:bg-dark-surface sm:p-8 print:rounded-none print:border-none print:p-0 print:shadow-none">
              <AIPDocument
                year={year}
                outcome={outcome}
                depedProgram={depedProgram}
                sipTitle={sipTitle}
                projectCoord={projectCoord}
                objectives={objectives}
                indicators={indicators}
                activities={activities}
                preparedByName={preparedByName}
                preparedByTitle={preparedByTitle}
                approvedByName={approvedByName}
                approvedByTitle={approvedByTitle}
              />
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // ── Wizard / Full editor ──────────────────────────────────────────────────────

  return (
    <motion.div key="form" data-tour="aip-form-active" {...motionProps}>
      <div className="bg-slate-50 dark:bg-dark-base min-h-screen flex flex-col text-slate-800 dark:text-slate-100 font-sans relative print:py-0 print:bg-white print:text-black">
        <FormHeader
          title={isEditing ? 'Edit Annual Implementation Plan' : 'Annual Implementation Plan'}
          programName={depedProgram}
          onSave={isEditing ? undefined : onSaveForLater}
          onBack={onBack}
          onHome={isEditing ? undefined : onHome}
          isSaving={isSaving}
          isSaved={isSaved}
          lastSavedTime={lastSavedTime}
          lastAutoSavedTime={lastAutoSavedTime}
          theme="pink"
          appMode={appMode}
          toggleAppMode={toggleAppMode}
        />

        <DocumentPreviewModal
          isOpen={isPreviewOpen}
          onClose={() => onPreviewOpen(false)}
          title="AIP Document Preview"
          subtitle={`Annual Implementation Plan Cycle ${year}`}
          filename={`AIP_${year}${sipTitle ? '_' + sipTitle.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '') : ''}`}
        >
          <AIPDocument
            year={year}
            outcome={outcome}
            depedProgram={depedProgram}
            sipTitle={sipTitle}
            projectCoord={projectCoord}
            objectives={objectives}
            indicators={indicators}
            activities={activities}
            preparedByName={preparedByName}
            preparedByTitle={preparedByTitle}
            approvedByName={approvedByName}
            approvedByTitle={approvedByTitle}
          />
        </DocumentPreviewModal>

        <style>{`
          @media print {
            @page { margin: 1cm; }
            body { background-color: white !important; color: black !important; }
            .print-reset { background: transparent !important; color: black !important; border-color: black !important; }
          }
        `}</style>

        {/* MAIN CONTAINER */}
        <div className={`container mx-auto relative z-10 mt-4 mb-10 max-w-5xl px-3 sm:mt-6 sm:px-4 md:mt-8 md:px-0 print:hidden ${showWizardStickyNav ? 'pb-32' : ''}`}>

          {/* Independent Header Card (Wizard View) */}
          {appMode === 'wizard' && (
            <div className="mb-5 rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-md dark:border-dark-border dark:bg-dark-surface sm:mb-6 sm:rounded-[2rem] sm:p-6">
              <FormBoxHeader
                title="Annual Implementation Plan"
                badge={`CY ${year}`}
                compact={true}
              />
            </div>
          )}

          <div className="relative rounded-[2rem] border border-slate-200 bg-white p-4 shadow-xl dark:border-dark-border dark:bg-dark-surface sm:p-6 md:rounded-[2.5rem] md:p-12">

            {/* FULL VIEW HEADER */}
            {appMode === 'full' && (
              <FormBoxHeader
                title="Annual Implementation Plan"
                badge={`CY ${year}`}
              />
            )}

            {/* WIZARD MODE: STEPPER */}
            {appMode === 'wizard' && (
              <div data-tour="form-step-nav">
                <WizardStepper
                  steps={[
                    { num: 1, label: 'Alignment' },
                    { num: 2, label: 'Targets' },
                    { num: 3, label: 'Action Plan' },
                    { num: 4, label: 'M&E' },
                    { num: 5, label: 'Signatures' },
                    { num: 6, label: 'Finalize' },
                  ]}
                  currentStep={currentStep}
                  theme="pink"
                />
              </div>
            )}

            <form onSubmit={(e) => e.preventDefault()}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={appMode}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15 }}
                >
                  <div className="min-h-[300px]">

                    {/* SECTION 1: PROFILE / ALIGNMENT */}
                    <div className={`${(appMode === 'full' || currentStep === 1) ? 'block' : 'hidden'} ${appMode === 'full' ? 'mb-16' : ''}`}>
                      <AIPProfileSection
                        appMode={appMode}
                        outcome={outcome}
                        setOutcome={onOutcomeChange}
                        selectedTarget={selectedTarget}
                        setSelectedTarget={onTargetChange}
                        year={year}
                        setYear={setYear}
                        depedProgram={depedProgram}
                        sipTitle={sipTitle}
                        setSipTitle={setSipTitle}
                        projectCoord={projectCoord}
                        setProjectCoord={setProjectCoord}
                        coordinatorSuggestions={coordinatorSuggestions}
                      />
                    </div>

                    {/* SECTION 2: GOALS AND TARGETS */}
                    <div className={`${(appMode === 'full' || currentStep === 2) ? 'block animate-in fade-in slide-in-from-bottom-4 duration-200' : 'hidden'} ${appMode === 'full' ? 'mb-16' : ''}`}>
                      <AIPGoalsTargetsSection
                        appMode={appMode}
                        objectives={objectives}
                        handleObjectiveChange={onObjectiveChange}
                        addObjective={onAddObjective}
                        removeObjective={onRemoveObjective}
                        indicators={indicators}
                        handleIndicatorChange={onIndicatorChange}
                        addIndicator={onAddIndicator}
                        removeIndicator={onRemoveIndicator}
                      />
                    </div>

                    {/* SECTION 3: ACTION PLAN & BUDGET */}
                    <div className={`${(appMode === 'full' || currentStep === 3 || currentStep === 4) ? 'block animate-in fade-in slide-in-from-bottom-4 duration-200' : 'hidden'} ${appMode === 'full' ? 'mb-16' : ''}`}>
                      <AIPActionPlanSection
                        appMode={appMode}
                        currentStep={currentStep}
                        activities={activities}
                        expandedActivityId={expandedActivityId}
                        setExpandedActivityId={setExpandedActivityId}
                        handleActivityChange={onActivityChange}
                        handleRemoveActivity={onRemoveActivity}
                        handleAddActivityPhase={onAddActivityPhase}
                        personsTerms={personsTerms}
                      />
                    </div>

                    {/* SECTION 5: SIGNATURES */}
                    {(appMode === 'full' || currentStep === 5) && (
                      <div className="animate-in fade-in slide-in-from-bottom-4 duration-200">
                        <SectionHeader
                          icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>}
                          title="Signatures"
                          subtitle="Finalize with necessary approvals."
                          theme="pink"
                          appMode={appMode}
                        />
                        <div className="relative mb-2 overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-dark-border dark:bg-dark-surface sm:p-8 md:rounded-3xl md:p-12">
                          <svg className="absolute inset-0 h-full w-full opacity-20 dark:opacity-40 stroke-slate-300 dark:stroke-dark-border" style={{ maskImage: 'linear-gradient(to bottom, transparent, black 30%)' }} xmlns="http://www.w3.org/2000/svg"><defs><pattern id="diagonal-lines" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="20" strokeWidth="2"></line></pattern></defs><rect width="100%" height="100%" fill="url(#diagonal-lines)"></rect></svg>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-24 relative z-10">
                            <SignatureBlock
                              label="Prepared by"
                              name={preparedByName}
                              title={preparedByTitle}
                              onNameChange={setPreparedByName}
                              onTitleChange={setPreparedByTitle}
                              namePlaceholder="FULL NAME"
                              titlePlaceholder="Title / Position"
                              theme="pink"
                            />
                            <SignatureBlock
                              label="Approved"
                              name={approvedByName}
                              title={approvedByTitle}
                              onNameChange={setApprovedByName}
                              onTitleChange={setApprovedByTitle}
                              namePlaceholder="FULL NAME"
                              titlePlaceholder="Title / Position"
                              theme="pink"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* SECTION 6: FINAL REVIEW & SUBMIT */}
                    {(appMode === 'full' || currentStep === 6) && (
                      <div className="animate-in fade-in slide-in-from-bottom-4 duration-200">
                        {appMode === 'wizard' && (
                          <div ref={reviewAreaRef} data-tour="form-review-submit">
                            <FinalizeCard
                              isSubmitted={isSubmitted}
                              onSubmit={() => onShowFinalConfirm(true)}
                              onPreview={() => onPreviewOpen(true)}
                              theme="pink"
                              submitLabel={isEditing ? 'Save Changes' : undefined}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* WIZARD MODE: NAVIGATION BUTTONS */}
                  {appMode === 'wizard' && !showWizardStickyNav && (
                    <div className="mt-12 flex justify-between items-center pt-6 border-t border-slate-200 dark:border-dark-border">
                      <button
                        type="button"
                        onClick={onPrevStep}
                        disabled={currentStep === 1}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-dark-surface hover:bg-slate-200 dark:hover:bg-dark-border disabled:opacity-40 disabled:cursor-not-allowed transition-colors active:scale-95"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ pointerEvents: 'none' }}><path d="m15 18-6-6 6-6" /></svg>
                        Back
                      </button>
                      {currentStep < totalSteps && (
                        <button
                          type="button"
                          onClick={onNextStep}
                          className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white bg-pink-600 hover:bg-pink-700 transition-colors active:scale-95 shadow-md"
                        >
                          Continue
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ pointerEvents: 'none' }}><path d="m9 18 6-6-6-6" /></svg>
                        </button>
                      )}
                    </div>
                  )}

                  {/* FINAL ACTION BUTTONS (Full view only) */}
                  {appMode === 'full' && (
                    <div ref={reviewAreaRef} data-tour="form-review-submit" className="print:hidden relative z-10 mt-12 flex flex-col items-center justify-center rounded-[1.75rem] border border-slate-200 bg-white p-5 text-center shadow-lg dark:border-dark-border dark:bg-dark-surface sm:rounded-[2rem] sm:p-8">
                      <h3 className="text-slate-800 dark:text-slate-100 font-bold text-xl mb-6">Ready to finalize your plan?</h3>
                      <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={() => onPreviewOpen(true)}
                          className="inline-flex h-14 items-center justify-center gap-3 rounded-2xl bg-white dark:bg-dark-surface border-2 border-slate-200 dark:border-dark-border px-8 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-dark-base transition-colors active:scale-95 w-full sm:w-auto shadow-sm"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                          Preview Layout
                        </button>
                        <button
                          type="button"
                          onClick={() => onShowFinalConfirm(true)}
                          disabled={isSubmitted}
                          className="inline-flex h-14 items-center justify-center rounded-2xl bg-pink-600 px-8 py-1 text-sm font-bold text-white transition-colors gap-3 hover:bg-pink-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto shadow-md"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                          {isSubmitted ? 'Submitted' : isEditing ? 'Save Changes' : 'Confirm & Submit'}
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </form>
          </div>
        </div>

        <WizardStickyNav
          show={showWizardStickyNav}
          theme="pink"
          onPrevious={onPrevStep}
          onNext={currentStep < totalSteps ? onNextStep : () => onShowFinalConfirm(true)}
          previousDisabled={currentStep === 1}
          nextLabel={currentStep < totalSteps ? 'Continue' : isEditing ? 'Save Changes' : 'Submit AIP'}
          showNext
        />
      </div>
    </motion.div>
  );
}
