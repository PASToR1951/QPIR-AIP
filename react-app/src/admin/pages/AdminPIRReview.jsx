import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../lib/api.js';
import { useTextMeasure } from '../../lib/useTextMeasure';
import { auth } from '../../lib/auth.js';
import { ActivitiesTab } from './pirReview/ActivitiesTab.jsx';
import { FactorsTab } from './pirReview/FactorsTab.jsx';
import { OverviewTab } from './pirReview/OverviewTab.jsx';
import { PIRReviewActionModal } from './pirReview/PIRReviewActionModal.jsx';
import { PIRReviewHeader } from './pirReview/PIRReviewHeader.jsx';
import { PIRReviewStatus } from './pirReview/PIRReviewStatus.jsx';
import { buildPirReviewDerived } from './pirReview/pirReviewDerived.js';
import { usePirReviewActions } from './pirReview/usePirReviewActions.js';

export default function AdminPIRReview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isObserver = auth.isObserver();

  const [pir, setPir] = useState(null);
  const [sub, setSub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [activeTab, setActiveTab] = useState('overview');
  const [viewMode, setViewMode] = useState('inline');

  const {
    actionError,
    actionLoading,
    adminRemarks,
    done,
    doneAction,
    feedback,
    handleAction,
    handleAdminRemarksChange,
    handleObserverNotesChange,
    handleSaveObserverNotes,
    handleSaveRemarks,
    handleTogglePresented,
    hydrateFromPir,
    modal,
    observerNotes,
    observerNotesError,
    observerNotesSaved,
    observerNotesSaving,
    openApprove,
    openReturn,
    presented,
    presentedSaving,
    remarksError,
    remarksSaved,
    remarksSaving,
    setFeedback,
    setModal,
  } = usePirReviewActions({ id, isObserver });

  const notesCache = useRef({});
  const { measureText } = useTextMeasure({ font: '12px Inter', lineHeight: 18 });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    Promise.all([
      api.get(`/api/admin/pirs/${id}`),
      api.get(`/api/admin/submissions/${id}?type=pir`),
    ]).then(([pirRes, subRes]) => {
      if (cancelled) return;
      setPir(pirRes.data);
      setSub(subRes.data);
      hydrateFromPir({
        remarks: pirRes.data.adminRemarks,
        observer: pirRes.data.observerNotes ?? subRes.data.observer_notes,
        isPresented: pirRes.data.presented,
      });
      (subRes.data.activity_reviews ?? []).forEach(rev => {
        notesCache.current[rev.id] = rev.admin_notes ?? '';
      });
    }).catch(() => {
      if (!cancelled) setLoadError('Failed to load PIR data. Please try again.');
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [id, hydrateFromPir]);

  const handleSaveNotes = (reviewId, notes) => { notesCache.current[reviewId] = notes; };

  const statusScreen = (
    <PIRReviewStatus
      done={done}
      doneAction={doneAction}
      loadError={loadError}
      loading={loading}
      navigate={navigate}
    />
  );

  if (statusScreen) return statusScreen;

  // ── Derived state ───────────────────────────────────────────────────────

  const {
    allAipActivities,
    canAct,
    clusterLogo,
    clusterNumber,
    factors,
    flaggedCount,
    lowCount,
    metCount,
    overallFinPct,
    overallPhysPct,
    partialCount,
    pirId,
    program,
    quarter,
    reviews,
    school,
    schoolLogo,
    status,
    submittedBy,
    totalFinAcc,
    totalFinTarget,
    totalFlags,
    totalPhysAcc,
    totalPhysTarget,
  } = buildPirReviewDerived({ id, pir, sub, isObserver });

  const TABS = [
    { key: 'overview',    label: 'Overview' },
    { key: 'activities',  label: `Activities${flaggedCount > 0 ? ` (${flaggedCount} ⚠)` : ` (${reviews.length})`}` },
    { key: 'factors',     label: 'Factors' },
  ];

  return (
    <div className="space-y-6">
      <PIRReviewHeader
        canAct={canAct}
        clusterLogo={clusterLogo}
        clusterNumber={clusterNumber}
        isObserver={isObserver}
        navigate={navigate}
        onOpenApprove={openApprove}
        onOpenReturn={openReturn}
        program={program}
        quarter={quarter}
        school={school}
        schoolLogo={schoolLogo}
        status={status}
      />

      {/* Tabs */}
      <div className="flex items-center border-b border-slate-200 dark:border-dark-border">
        {TABS.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-bold transition-colors relative ${activeTab === tab.key ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>
            {tab.label}
            {activeTab === tab.key && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-t" />}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <OverviewTab
          adminRemarks={adminRemarks}
          isObserver={isObserver}
          metCount={metCount}
          overallFinPct={overallFinPct}
          overallPhysPct={overallPhysPct}
          presented={presented}
          presentedSaving={presentedSaving}
          remarksError={remarksError}
          remarksSaved={remarksSaved}
          remarksSaving={remarksSaving}
          reviews={reviews}
          saveObserverNotes={handleSaveObserverNotes}
          saveRemarks={handleSaveRemarks}
          onAdminRemarksChange={handleAdminRemarksChange}
          onObserverNotesChange={handleObserverNotesChange}
          submittedBy={submittedBy}
          sub={sub}
          totalFinAcc={totalFinAcc}
          totalFinTarget={totalFinTarget}
          totalFlags={totalFlags}
          totalPhysAcc={totalPhysAcc}
          totalPhysTarget={totalPhysTarget}
          lowCount={lowCount}
          partialCount={partialCount}
          observerNotes={observerNotes}
          observerNotesError={observerNotesError}
          observerNotesSaved={observerNotesSaved}
          observerNotesSaving={observerNotesSaving}
          togglePresented={handleTogglePresented}
          pir={pir}
        />
      )}

      {activeTab === 'activities' && (
        <ActivitiesTab
          allAipActivities={allAipActivities}
          canEditNotes={!isObserver}
          handleSaveNotes={handleSaveNotes}
          measureText={measureText}
          pirId={pirId}
          reviews={reviews}
          setViewMode={setViewMode}
          viewMode={viewMode}
        />
      )}

      {activeTab === 'factors' && (
        <FactorsTab factors={factors} />
      )}

      <PIRReviewActionModal
        actionError={actionError}
        actionLoading={actionLoading}
        feedback={feedback}
        modal={modal}
        onClose={() => setModal(null)}
        onSubmit={handleAction}
        program={program}
        quarter={quarter}
        school={school}
        setFeedback={setFeedback}
      />
    </div>
  );
}
