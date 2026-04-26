import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../lib/api.js';
import { useTextMeasure } from '../../lib/useTextMeasure';
import { ActivitiesTab } from './pirReview/ActivitiesTab.jsx';
import { FactorsTab } from './pirReview/FactorsTab.jsx';
import { OverviewTab } from './pirReview/OverviewTab.jsx';
import { PIRFullFormView } from './pirReview/PIRFullFormView.jsx';
import { PIRReviewHeader } from './pirReview/PIRReviewHeader.jsx';
import { PIRReviewStatus } from './pirReview/PIRReviewStatus.jsx';
import { buildPirReviewDerived } from './pirReview/pirReviewDerived.js';

export default function AdminPIRReview() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [pir, setPir] = useState(null);
  const [sub, setSub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [signatoryConfig, setSignatoryConfig] = useState(null);

  const [activeTab, setActiveTab] = useState('overview');
  const [reviewView, setReviewView] = useState('summary');
  const [viewMode, setViewMode] = useState('inline');

  const { measureText } = useTextMeasure({ font: '12px Inter', lineHeight: 18 });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    setSignatoryConfig(null);
    Promise.all([
      api.get(`/api/admin/pirs/${id}`),
      api.get(`/api/admin/submissions/${id}?type=pir`),
    ]).then(([pirRes, subRes]) => {
      if (cancelled) return;
      setPir(pirRes.data);
      setSub(subRes.data);
    }).catch(() => {
      if (!cancelled) setLoadError('Failed to load PIR data. Please try again.');
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    if (!sub) return;

    let cancelled = false;
    const clusterId = sub?.aip?.school?.cluster_id ?? sub?.aip?.school?.cluster?.id;
    setSignatoryConfig(null);
    api.get('/api/config', clusterId ? { params: { cluster_id: clusterId } } : undefined)
      .then((res) => {
        if (!cancelled) setSignatoryConfig(res.data);
      })
      .catch(() => {
        if (!cancelled) setSignatoryConfig(null);
      });

    return () => { cancelled = true; };
  }, [sub]);

  if (loading || loadError) {
    return (
      <PIRReviewStatus
        loadError={loadError}
        loading={loading}
        navigate={navigate}
      />
    );
  }

  // ── Derived state ───────────────────────────────────────────────────────

  const {
    allAipActivities,
    clusterLogo,
    clusterNumber,
    factors,
    flaggedCount,
    lowCount,
    metCount,
    overallFinPct,
    overallPhysPct,
    partialCount,
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
  } = buildPirReviewDerived({ pir, sub });

  const TABS = [
    { key: 'overview',    label: 'Overview' },
    { key: 'activities',  label: `Activities${flaggedCount > 0 ? ` (${flaggedCount} ⚠)` : ` (${reviews.length})`}` },
    { key: 'factors',     label: 'Factors' },
  ];

  return (
    <div className="space-y-6">
      <PIRReviewHeader
        clusterLogo={clusterLogo}
        clusterNumber={clusterNumber}
        navigate={navigate}
        onReviewViewChange={setReviewView}
        program={program}
        quarter={quarter}
        reviewView={reviewView}
        school={school}
        schoolLogo={schoolLogo}
        showDetails={reviewView === 'summary'}
        status={status}
      />

      {reviewView === 'summary' ? (
        <>
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
              metCount={metCount}
              overallFinPct={overallFinPct}
              overallPhysPct={overallPhysPct}
              reviews={reviews}
              submittedBy={submittedBy}
              sub={sub}
              totalFinAcc={totalFinAcc}
              totalFinTarget={totalFinTarget}
              totalFlags={totalFlags}
              totalPhysAcc={totalPhysAcc}
              totalPhysTarget={totalPhysTarget}
              lowCount={lowCount}
              partialCount={partialCount}
              pir={pir}
            />
          )}

          {activeTab === 'activities' && (
            <ActivitiesTab
              allAipActivities={allAipActivities}
              measureText={measureText}
              reviews={reviews}
              setViewMode={setViewMode}
              viewMode={viewMode}
            />
          )}

          {activeTab === 'factors' && (
            <FactorsTab factors={factors} />
          )}
        </>
      ) : (
        <PIRFullFormView
          pir={pir}
          signatoryConfig={signatoryConfig}
          sub={sub}
        />
      )}
    </div>
  );
}
