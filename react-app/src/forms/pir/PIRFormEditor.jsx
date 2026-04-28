import React, { Suspense, lazy, useCallback } from 'react';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import { generatePIRPdf } from '../../lib/formPdfExport.js';

import { FormHeader } from '../../components/ui/FormHeader';
import { FormBoxHeader } from '../../components/ui/FormBoxHeader';
import { DocumentPreviewModal } from '../../components/ui/DocumentPreviewModal';
import WizardStepper from '../../components/ui/WizardStepper';
import SectionHeader from '../../components/ui/SectionHeader';
import SignatureBlock from '../../components/ui/SignatureBlock';
import FinalizeCard from '../../components/ui/FinalizeCard';
import WizardStickyNav from '../../components/ui/WizardStickyNav';
import PIRProfileSection from '../../components/forms/pir/PIRProfileSection';
import PIRIndicatorsSection from '../../components/forms/pir/PIRIndicatorsSection';
import PIRMonitoringEvaluationSection from '../../components/forms/pir/PIRMonitoringEvaluationSection';
import PIRFactorsSection from '../../components/forms/pir/PIRFactorsSection';
import PIRActionItemsSection from '../../components/forms/pir/PIRActionItemsSection';
import { useFormShellContext } from '../shared/formShellContext.jsx';
import {
    selectActionItems,
    selectActivities,
    selectBudget,
    selectFactors,
    selectIndicatorTargets,
    selectProfile,
    selectPirSubmission,
    selectPirUi,
    selectRemovedAipActivities,
    usePirDispatch,
    usePirSelector,
} from './pirContext.jsx';

const LazyPIRDocument = lazy(() => (
    import('../../components/docs/PIRDocument.jsx').then((module) => ({ default: module.PIRDocument }))
));
const LazyAIPDocument = lazy(() => (
    import('../../components/docs/AIPDocument.jsx').then((module) => ({ default: module.AIPDocument }))
));

function PreviewFallback() {
    return (
        <div className="px-6 py-8 text-center text-sm font-medium text-slate-500 dark:text-slate-400">
            Loading preview...
        </div>
    );
}

function resolveNotedBy({ user, isDivisionPersonnel, functionalDivision, notedBy, clusterHead, supervisorName, supervisorTitle }) {
    // Division Personnel -> division-specific chief
    if (isDivisionPersonnel && functionalDivision && notedBy?.[functionalDivision]?.name) {
        return notedBy[functionalDivision];
    }
    // Cluster Coordinator -> CID chief
    if (user?.role === 'Cluster Coordinator' && notedBy?.CID?.name) {
        return notedBy.CID;
    }
    // School user -> their admin-designated Cluster Head
    if (user?.role === 'School' && clusterHead?.name) {
        return clusterHead;
    }
    // Fallback -> legacy supervisor from DivisionConfig
    return { name: supervisorName, title: supervisorTitle };
}

export default function PIRFormEditor({
    quarterString,
    supervisorName,
    supervisorTitle,
    notedBy,
    clusterHead,
    user,
    isDivisionPersonnel,
    aipActivitiesLoading,
    isPreviewOpen,
    onPreviewOpen,
    isAIPPreviewOpen,
    onAIPPreviewOpen,
    aipDocumentData,
    onViewAIP,
    onSaveForLater,
    onBack,
    onHome,
    onEditPIR,
    onDeletePIR,
    onShowFinalConfirm,
    toggleAppMode,
    handleRemoveActivity,
    handleActivityChange,
    handleAddActivity,
    handleAddUnplannedActivity,
    handleRestoreActivity,
    calculateGap,
    isSaving,
    isSaved,
    lastSavedTime,
    lastAutoSavedTime,
}) {
    const {
        appMode,
        currentStep,
        nextStep,
        prevStep,
        isMobile,
    } = useFormShellContext();
    const dispatch = usePirDispatch();
    const profile = usePirSelector(selectProfile);
    const budget = usePirSelector(selectBudget);
    const indicatorTargets = usePirSelector(selectIndicatorTargets);
    const activities = usePirSelector(selectActivities);
    const removedAIPActivities = usePirSelector(selectRemovedAipActivities);
    const factors = usePirSelector(selectFactors);
    const actionItems = usePirSelector(selectActionItems);
    const ui = usePirSelector(selectPirUi);
    const submission = usePirSelector(selectPirSubmission);
    const usesSchoolTerminology = user?.role === 'School';

    const resolvedNotedBy = resolveNotedBy({
        user,
        isDivisionPersonnel,
        functionalDivision: profile.functionalDivision,
        notedBy,
        clusterHead,
        supervisorName,
        supervisorTitle,
    });

    const handleReadonlyPrint = useCallback(() => {
        const prev = document.title;
        const safeProgram = profile.program ? `_${profile.program.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '')}` : '';
        const safeQuarter = quarterString ? `_${quarterString.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '')}` : '';
        document.title = `PIR${safeQuarter}${safeProgram}`;

        const style = document.createElement('style');
        style.id = '__pir-landscape-print__';
        style.textContent = '@media print { @page { size: 13in 8.5in; margin: 1cm; } }';
        document.head.appendChild(style);

        window.print();

        window.addEventListener('afterprint', () => {
            document.title = prev;
            style.remove();
        }, { once: true });
    }, [profile.program, quarterString]);

    const handleDownloadPirPdf = useCallback(() => {
        generatePIRPdf({
            quarter: quarterString,
            supervisorName: resolvedNotedBy.name,
            supervisorTitle: resolvedNotedBy.title,
            program: profile.program,
            school: profile.school,
            owner: profile.owner,
            budgetFromDivision: budget.fromDivision,
            budgetFromCoPSF: budget.fromCoPSF,
            functionalDivision: profile.functionalDivision,
            usesSchoolTerminology,
            indicatorTargets,
            activities,
            factors,
            actionItems,
        });
    }, [quarterString, resolvedNotedBy, profile, budget, usesSchoolTerminology, indicatorTargets, activities, factors, actionItems]);

    if (appMode === 'readonly') {
        return (
            <>
                <FormHeader title="Quarterly Program Implementation Review" programName={profile.program} onBack={onBack} theme="blue" />
                <div className="min-h-screen bg-slate-50 font-sans dark:bg-dark-base print:bg-white">
                    <div className="mx-auto max-w-[1500px] px-4 pb-4 pt-8 print:hidden">
                        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3.5 shadow-sm dark:border-emerald-900/50 dark:bg-emerald-950/30">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-emerald-600">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                            <span className="flex-1 text-sm font-bold text-emerald-800 dark:text-emerald-300">
                                This form has been submitted{submission.pirStatus && submission.pirStatus !== 'Submitted' ? ` — currently ${submission.pirStatus.toLowerCase()} by reviewers` : ' and is read-only'}.
                            </span>
                            <div className="flex items-center gap-2">
                                {['For CES Review', 'For Cluster Head Review', 'Returned'].includes(submission.pirStatus) && (
                                    <>
                                        <button
                                            onClick={onEditPIR}
                                            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-blue-700"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                            </svg>
                                            Edit
                                        </button>
                                        <button
                                            onClick={onDeletePIR}
                                            className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-bold text-red-600 transition-colors hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/30 dark:hover:bg-red-900/40"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="3 6 5 6 21 6" />
                                                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                                <path d="M10 11v6" />
                                                <path d="M14 11v6" />
                                                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                                            </svg>
                                            Delete
                                        </button>
                                    </>
                                )}
                                <button
                                    aria-label="Download PIR PDF"
                                    onClick={handleDownloadPirPdf}
                                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50 dark:border-dark-border dark:bg-dark-surface dark:text-slate-200 dark:hover:bg-dark-base"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                        <polyline points="7 10 12 15 17 10" />
                                        <line x1="12" y1="15" x2="12" y2="3" />
                                    </svg>
                                    Download PDF
                                </button>
                                <button
                                    aria-label="Print PIR"
                                    onClick={handleReadonlyPrint}
                                    className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-slate-700"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="6 9 6 2 18 2 18 9" />
                                        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                                        <rect x="6" y="14" width="12" height="8" />
                                    </svg>
                                    Print
                                </button>
                            </div>
                        </div>
                    {submission.cesRemarks && (
                        <div className={[
                            'mt-3 rounded-2xl border p-5 print:hidden',
                            submission.pirStatus === 'Returned'
                                ? 'border-amber-200 bg-amber-50 dark:border-amber-700/40 dark:bg-amber-950/10'
                                : 'border-teal-200 bg-teal-50 dark:border-teal-700/40 dark:bg-teal-950/10',
                        ].join(' ')}>
                            <p className={[
                                'mb-2 text-[11px] font-black uppercase tracking-widest',
                                submission.pirStatus === 'Returned'
                                    ? 'text-amber-700 dark:text-amber-400'
                                    : 'text-teal-700 dark:text-teal-400',
                            ].join(' ')}>
                                Reviewer Remarks
                            </p>
                            <p className={[
                                'text-sm leading-relaxed whitespace-pre-wrap',
                                submission.pirStatus === 'Returned'
                                    ? 'text-amber-900 dark:text-amber-200'
                                    : 'text-teal-900 dark:text-teal-200',
                            ].join(' ')}>
                                {submission.cesRemarks}
                            </p>
                        </div>
                    )}
                    </div>
                    <div className="mx-auto max-w-[1500px] px-4 pb-12">
                        <div className="rounded-2xl border border-slate-100 bg-white p-8 shadow-sm dark:border-dark-border dark:bg-dark-surface print:rounded-none print:border-none print:p-0 print:shadow-none">
                            <Suspense fallback={<PreviewFallback />}>
                                <LazyPIRDocument
                                    quarter={quarterString}
                                    supervisorName={resolvedNotedBy.name}
                                    supervisorTitle={resolvedNotedBy.title}
                                    program={profile.program}
                                    school={profile.school}
                                    owner={profile.owner}
                                    budgetFromDivision={budget.fromDivision}
                                    budgetFromCoPSF={budget.fromCoPSF}
                                    functionalDivision={profile.functionalDivision}
                                    usesSchoolTerminology={usesSchoolTerminology}
                                    indicatorTargets={indicatorTargets}
                                    activities={activities}
                                    factors={factors}
                                    actionItems={actionItems}
                                />
                            </Suspense>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <div className="relative flex min-h-screen flex-col bg-slate-50 font-sans text-slate-800 dark:bg-dark-base dark:text-slate-100 print:bg-white print:text-black">
            <FormHeader
                title={submission.isEditing ? 'Edit Submitted PIR' : 'Quarterly Programs Implementation Review'}
                programName={profile.program}
                onSave={submission.isEditing ? undefined : onSaveForLater}
                onBack={onBack}
                onHome={submission.isEditing ? undefined : onHome}
                isSaving={isSaving}
                isSaved={isSaved}
                lastSavedTime={lastSavedTime}
                lastAutoSavedTime={lastAutoSavedTime}
                theme="blue"
                appMode={appMode}
                toggleAppMode={toggleAppMode}
            />

            <DocumentPreviewModal
                isOpen={isPreviewOpen}
                onClose={() => onPreviewOpen(false)}
                title="PIR Print Preview"
                subtitle="Quarterly Program Implementation Review"
                filename={`PIR_${quarterString.replace(/\s+/g, '_')}${profile.program ? `_${profile.program.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '')}` : ''}`}
                landscape
                onDownloadPdf={handleDownloadPirPdf}
            >
                <Suspense fallback={<PreviewFallback />}>
                    <LazyPIRDocument
                        quarter={quarterString}
                        supervisorName={resolvedNotedBy.name}
                        supervisorTitle={resolvedNotedBy.title}
                        program={profile.program}
                        school={profile.school}
                        owner={profile.owner}
                        budgetFromDivision={budget.fromDivision}
                        budgetFromCoPSF={budget.fromCoPSF}
                        functionalDivision={profile.functionalDivision}
                        usesSchoolTerminology={usesSchoolTerminology}
                        indicatorTargets={indicatorTargets}
                        activities={activities}
                        factors={factors}
                        actionItems={actionItems}
                    />
                </Suspense>
            </DocumentPreviewModal>

            <DocumentPreviewModal
                isOpen={isAIPPreviewOpen}
                onClose={() => onAIPPreviewOpen(false)}
                title="Annual Implementation Plan"
                subtitle={`AIP Reference — ${profile.program}`}
                filename={`AIP_${aipDocumentData?.year ?? ''}${aipDocumentData?.sipTitle ? `_${aipDocumentData.sipTitle.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '')}` : ''}`}
                landscape
            >
                {aipDocumentData && (
                    <Suspense fallback={<PreviewFallback />}>
                        <LazyAIPDocument
                            year={String(aipDocumentData.year)}
                            outcome={aipDocumentData.outcome}
                            targetDescription={aipDocumentData.targetDescription}
                            depedProgram={aipDocumentData.depedProgram}
                            usesSchoolTerminology={aipDocumentData.isSchoolOwned ?? usesSchoolTerminology}
                            sipTitle={aipDocumentData.sipTitle}
                            projectCoord={aipDocumentData.projectCoord}
                            objectives={aipDocumentData.objectives}
                            indicators={aipDocumentData.indicators}
                            activities={aipDocumentData.activities}
                            preparedByName={aipDocumentData.preparedByName}
                            preparedByTitle={aipDocumentData.preparedByTitle}
                            approvedByName={aipDocumentData.approvedByName}
                            approvedByTitle={aipDocumentData.approvedByTitle}
                        />
                    </Suspense>
                )}
            </DocumentPreviewModal>

            {profile.program && (
                <button
                    onClick={onViewAIP}
                    className="fixed bottom-6 left-6 z-50 flex items-center gap-2.5 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-xl transition-all active:scale-95 hover:bg-blue-700 print:hidden"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <polyline points="10 9 9 9 8 9" />
                    </svg>
                    View AIP
                </button>
            )}

            <div className={`container relative z-10 mx-auto mb-12 mt-8 px-4 print:hidden md:px-0 ${appMode === 'wizard' ? 'max-w-5xl' : 'max-w-[1500px]'} ${appMode === 'wizard' && isMobile ? 'pb-28' : ''}`}>
                {appMode === 'wizard' && (
                    <div className="mb-6 rounded-[2rem] border border-white/40 bg-white/70 p-6 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-dark-surface/60 ring-1 ring-slate-900/5">
                        <FormBoxHeader
                            title="Quarterly Program Implementation Review"
                            badge={quarterString}
                            compact={true}
                        />
                    </div>
                )}

                <div className="relative rounded-[2.5rem] border border-white/40 bg-white/70 p-6 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-dark-surface/60 md:p-12 ring-1 ring-slate-900/5">
                    {appMode === 'full' && (
                        <FormBoxHeader
                            title="Quarterly Program Implmentation Review"
                            subtitle="Division Monitoring Evaluation and Adjustment"
                            badge={quarterString}
                        />
                    )}

                    {appMode === 'wizard' && (
                        <div data-tour="form-step-nav">
                            <WizardStepper
                                steps={[
                                    { num: 1, label: 'Profile' },
                                    { num: 2, label: 'Indicators' },
                                    { num: 3, label: 'Review' },
                                    { num: 4, label: 'Factors' },
                                    { num: 5, label: 'Action Items' },
                                    { num: 6, label: 'Finalize' },
                                ]}
                                currentStep={currentStep}
                                theme="blue"
                            />
                        </div>
                    )}

                    <form onSubmit={(event) => event.preventDefault()}>
                        <AnimatePresence mode="wait">
                            <Motion.div
                                key={appMode}
                                initial={{ opacity: 0, y: 15, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -15, scale: 0.98 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            >
                                <div className="min-h-[320px]">
                                    <PIRProfileSection
                                        isDivisionPersonnel={isDivisionPersonnel}
                                        user={user}
                                        quarterString={quarterString}
                                    />

                                    <PIRIndicatorsSection usesSchoolTerminology={usesSchoolTerminology} />

                                    <PIRMonitoringEvaluationSection
                                        appMode={appMode}
                                        currentStep={currentStep}
                                        isLoadingActivities={aipActivitiesLoading}
                                        activities={activities}
                                        expandedActivityId={ui.expandedActivityId}
                                        setExpandedActivityId={(activityId) => dispatch({ type: 'SET_EXPANDED_ACTIVITY_ID', payload: activityId })}
                                        calculateGap={calculateGap}
                                        handleRemoveActivity={handleRemoveActivity}
                                        handleActivityChange={handleActivityChange}
                                        handleAddActivity={handleAddActivity}
                                        handleAddUnplannedActivity={handleAddUnplannedActivity}
                                        isAddingActivity={ui.isAddingActivity}
                                        removedAIPActivities={removedAIPActivities}
                                        handleRestoreActivity={handleRestoreActivity}
                                    />

                                    <PIRFactorsSection showRecommendations={true} />

                                    <PIRActionItemsSection />

                                    <div className={`${(appMode === 'full' || currentStep === 6) ? 'block animate-in fade-in slide-in-from-bottom-4 duration-200' : 'hidden'} ${appMode === 'full' ? 'mb-16' : ''}`}>
                                        <SectionHeader
                                            icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>}
                                            title="Signatures"
                                            subtitle="Finalize with necessary approvals."
                                            theme="blue"
                                            appMode={appMode}
                                        />

                                        <div className="relative mb-2 overflow-hidden rounded-3xl border border-white/40 bg-white/40 p-8 shadow-lg backdrop-blur-md ring-1 ring-slate-900/5 dark:border-white/10 dark:bg-dark-surface/40 md:p-12">
                                            <svg className="absolute inset-0 h-full w-full stroke-blue-300/30 dark:stroke-blue-900/20" style={{ maskImage: 'linear-gradient(to bottom, transparent, black 30%)' }} xmlns="http://www.w3.org/2000/svg"><defs><pattern id="diagonal-lines-pir" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="20" strokeWidth="2"></line></pattern></defs><rect width="100%" height="100%" fill="url(#diagonal-lines-pir)"></rect></svg>
                                            <div className="relative z-10 grid grid-cols-1 gap-12 md:grid-cols-2 md:gap-24">
                                                <SignatureBlock
                                                    label="Prepared by"
                                                    name={profile.owner}
                                                    title="Program Owner"
                                                    onNameChange={(value) => dispatch({ type: 'SET_PROFILE_FIELD', payload: { field: 'owner', value } })}
                                                    namePlaceholder="NAME OF PROGRAM OWNER"
                                                    theme="blue"
                                                />
                                                <SignatureBlock
                                                    label="Noted"
                                                    name={resolvedNotedBy.name}
                                                    title={resolvedNotedBy.title}
                                                    readOnly
                                                    theme="blue"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {appMode === 'wizard' && currentStep === 6 && (
                                        <div data-tour="form-review-submit" className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-200">
                                            <FinalizeCard
                                                isSubmitted={submission.isSubmitted}
                                                onSubmit={() => onShowFinalConfirm(true)}
                                                onPreview={() => onPreviewOpen(true)}
                                                theme="blue"
                                                submitLabel={submission.isEditing ? 'Save Changes' : undefined}
                                            />
                                        </div>
                                    )}
                                </div>

                                {appMode === 'wizard' && !isMobile && (
                                    <div className="mt-12 flex items-center justify-between border-t border-slate-200 pt-6 dark:border-dark-border">
                                        <button
                                            type="button"
                                            onClick={prevStep}
                                            disabled={currentStep === 1}
                                            className={`group relative inline-flex h-12 items-center justify-center gap-2 rounded-xl px-6 font-medium transition-all duration-300 ${currentStep === 1 ? 'cursor-not-allowed text-slate-300 dark:text-slate-600' : 'border border-slate-200/50 bg-white/50 backdrop-blur-sm text-slate-600 shadow-sm hover:bg-white hover:shadow hover:border-slate-300 active:scale-95 dark:border-dark-border dark:bg-dark-surface/50 dark:text-slate-300 dark:hover:bg-dark-surface'}`}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:-translate-x-1"><polyline points="15 18 9 12 15 6"></polyline></svg>
                                            Back
                                        </button>

                                        {currentStep < 6 && (
                                            <button
                                                type="button"
                                                onClick={nextStep}
                                                className="group relative overflow-hidden inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 font-bold text-white shadow-[0_8px_16px_rgba(79,70,229,0.3)] transition-all duration-300 hover:shadow-[0_8px_24px_rgba(79,70,229,0.5)] hover:scale-[1.02] active:scale-95"
                                            >
                                                <span className="relative z-10 flex items-center gap-2">
                                                    Continue
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-1"><polyline points="9 18 15 12 9 6"></polyline></svg>
                                                </span>
                                            </button>
                                        )}
                                    </div>
                                )}

                                {appMode === 'full' && (
                                    <div data-tour="form-review-submit" className="relative z-10 mt-12 flex flex-col items-center justify-center rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-lg dark:border-dark-border dark:bg-dark-surface">
                                        <h3 className="mb-6 text-xl font-bold text-slate-800 dark:text-slate-100">Ready to finalize your review?</h3>

                                        <div className="flex w-full flex-col gap-4 sm:w-auto sm:flex-row">
                                            <button
                                                type="button"
                                                onClick={() => onPreviewOpen(true)}
                                                className="inline-flex h-14 w-full items-center justify-center gap-3 rounded-2xl border-2 border-slate-200 bg-white px-8 text-sm font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 active:scale-95 dark:border-dark-border dark:bg-dark-surface dark:text-slate-200 dark:hover:bg-dark-base sm:w-auto"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                                Print Preview
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => onShowFinalConfirm(true)}
                                                disabled={submission.isSubmitted}
                                                className="inline-flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-blue-600 px-8 py-1 text-sm font-bold text-white transition-colors hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                                                {submission.isSubmitted ? 'Submitted' : submission.isEditing ? 'Save Changes' : 'Confirm & Submit'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </Motion.div>
                        </AnimatePresence>
                    </form>
                </div>
            </div>

            <WizardStickyNav
                show={appMode === 'wizard' && isMobile}
                theme="blue"
                onPrevious={prevStep}
                onNext={currentStep < 6 ? nextStep : () => onShowFinalConfirm(true)}
                previousDisabled={currentStep === 1}
                nextLabel={currentStep < 6 ? 'Continue' : submission.isEditing ? 'Save Changes' : 'Submit PIR'}
                showNext
            />
        </div>
    );
}
