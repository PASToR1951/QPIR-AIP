import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ConfirmationModal } from './components/ui/ConfirmationModal';
import { DashboardHeader } from './components/ui/DashboardHeader';
import Footer from './components/ui/Footer';

const PHASE_COLORS = {
    'Planning': 'text-blue-600 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/50',
    'Implementation': 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50',
    'Monitoring and Evaluation': 'text-violet-600 bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800/50',
};

export default function VerifyAIPs() {
    const navigate = useNavigate();
    const userStr = localStorage.getItem('user');
    let user = null;
    try { user = userStr ? JSON.parse(userStr) : null; } catch { /* */ }
    const token = localStorage.getItem('token');
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

    const [pendingAIPs, setPendingAIPs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedAIP, setSelectedAIP] = useState(null);
    const [modal, setModal] = useState({ isOpen: false, type: 'warning', title: '', message: '', confirmText: 'Confirm', onConfirm: () => {} });
    const closeModal = useCallback(() => setModal(prev => ({ ...prev, isOpen: false })), []);

    const fetchPending = useCallback(async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/aips/pending`, { headers: authHeaders });
            setPendingAIPs(res.data);
        } catch {
            setPendingAIPs([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // Redirect non-Division-Personnel users
        if (user?.role !== 'Division Personnel') {
            navigate('/');
            return;
        }
        fetchPending();
    }, []);

    const handleVerify = (aip) => {
        setModal({
            isOpen: true, type: 'success',
            title: 'Verify & Lock AIP',
            message: `Confirm that the digital data for "${aip.program?.title}" matches the uploaded signed document. This will allow the school to begin filing PIRs.`,
            confirmText: 'Verify & Lock',
            onConfirm: async () => {
                closeModal();
                try {
                    await axios.post(`${import.meta.env.VITE_API_URL}/api/aips/${aip.id}/verify`, {}, { headers: authHeaders });
                    setSelectedAIP(null);
                    fetchPending();
                } catch (error) {
                    setModal({
                        isOpen: true, type: 'warning',
                        title: 'Error', message: error.response?.data?.error || 'Failed to verify AIP.',
                        confirmText: 'OK', onConfirm: closeModal
                    });
                }
            }
        });
    };

    const handleReturn = (aip) => {
        setModal({
            isOpen: true, type: 'warning',
            title: 'Return for Correction',
            message: `Return "${aip.program?.title}" to the school for correction? The school will see a "Returned" status and will need to resubmit.`,
            confirmText: 'Return for Correction',
            onConfirm: async () => {
                closeModal();
                try {
                    await axios.post(`${import.meta.env.VITE_API_URL}/api/aips/${aip.id}/return`, {}, { headers: authHeaders });
                    setSelectedAIP(null);
                    fetchPending();
                } catch (error) {
                    setModal({
                        isOpen: true, type: 'warning',
                        title: 'Error', message: error.response?.data?.error || 'Failed to return AIP.',
                        confirmText: 'OK', onConfirm: closeModal
                    });
                }
            }
        });
    };

    const documentUrl = selectedAIP
        ? `${import.meta.env.VITE_API_URL}/api/aips/${selectedAIP.id}/document?token=${token}`
        : null;

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-dark-base flex flex-col font-sans">
            <DashboardHeader user={user} onLogout={handleLogout} />

            <ConfirmationModal
                isOpen={modal.isOpen}
                type={modal.type}
                title={modal.title}
                message={modal.message}
                confirmText={modal.confirmText}
                onConfirm={modal.onConfirm}
                onClose={closeModal}
            />

            <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <button
                            onClick={() => navigate('/')}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 mb-3 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                            Dashboard
                        </button>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">AIP Verification Queue</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Review pending fast-entry AIPs against their uploaded signed documents.</p>
                    </div>
                    {!loading && (
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl text-sm font-black text-amber-700 dark:text-amber-400">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                            {pendingAIPs.length} Pending
                        </div>
                    )}
                </div>

                {selectedAIP ? (
                    /* Split-screen verification view */
                    <div className="h-[calc(100vh-16rem)] flex flex-col">
                        {/* Header bar */}
                        <div className="flex items-center justify-between mb-4 flex-shrink-0">
                            <button
                                onClick={() => setSelectedAIP(null)}
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                                Back to Queue
                            </button>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => handleReturn(selectedAIP)}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                                    Return for Correction
                                </button>
                                <button
                                    onClick={() => handleVerify(selectedAIP)}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-200 dark:shadow-emerald-900/30 transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                                    Verify &amp; Lock
                                </button>
                            </div>
                        </div>

                        {/* Split panes */}
                        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
                            {/* Left: PDF viewer */}
                            <div className="bg-white dark:bg-dark-surface rounded-2xl border border-slate-200 dark:border-dark-border shadow-sm overflow-hidden flex flex-col">
                                <div className="px-5 py-3.5 border-b border-slate-100 dark:border-dark-border flex items-center gap-2 flex-shrink-0">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                                    </svg>
                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Signed Document (PDF)</span>
                                </div>
                                {selectedAIP.verification_document_path ? (
                                    <iframe
                                        src={documentUrl}
                                        className="flex-1 w-full"
                                        title="AIP Verification Document"
                                    />
                                ) : (
                                    <div className="flex-1 flex items-center justify-center">
                                        <div className="text-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300 dark:text-slate-600 mx-auto mb-3">
                                                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                                            </svg>
                                            <p className="text-sm text-slate-400 dark:text-slate-500 font-medium">No document uploaded</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Right: Digital data */}
                            <div className="bg-white dark:bg-dark-surface rounded-2xl border border-slate-200 dark:border-dark-border shadow-sm overflow-auto flex flex-col">
                                <div className="px-5 py-3.5 border-b border-slate-100 dark:border-dark-border flex items-center gap-2 flex-shrink-0">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
                                        <rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18M9 21V9"/>
                                    </svg>
                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Digital Entry Data</span>
                                </div>

                                <div className="flex-1 p-5 overflow-auto space-y-4">
                                    {/* Meta */}
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            ['Program', selectedAIP.program?.title],
                                            ['School', selectedAIP.school?.name || 'Division Personnel'],
                                            ['Year', selectedAIP.year],
                                            ['Project Coordinator', selectedAIP.project_coordinator],
                                        ].map(([label, value]) => (
                                            <div key={label} className="bg-slate-50 dark:bg-dark-base rounded-xl p-3 border border-slate-100 dark:border-dark-border">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">{label}</p>
                                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 break-words">{value || '—'}</p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Outcome */}
                                    <div className="bg-slate-50 dark:bg-dark-base rounded-xl p-3 border border-slate-100 dark:border-dark-border">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">Outcome</p>
                                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{selectedAIP.outcome || '—'}</p>
                                    </div>

                                    {/* SIP Title */}
                                    <div className="bg-slate-50 dark:bg-dark-base rounded-xl p-3 border border-slate-100 dark:border-dark-border">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">SIP / Project Title</p>
                                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{selectedAIP.sip_title || '—'}</p>
                                    </div>

                                    {/* Activities */}
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">Activities ({selectedAIP.activities?.length ?? 0})</p>
                                        <div className="space-y-2">
                                            {(selectedAIP.activities || []).map((act, i) => (
                                                <div key={act.id ?? i} className="rounded-xl border border-slate-100 dark:border-dark-border p-3 bg-slate-50/50 dark:bg-dark-base">
                                                    <div className="flex items-center gap-2 mb-1.5">
                                                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${PHASE_COLORS[act.phase] ?? ''}`}>{act.phase}</span>
                                                    </div>
                                                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-1">{act.activity_name || '—'}</p>
                                                    <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400">
                                                        <span>Period: <span className="font-semibold text-slate-700 dark:text-slate-300">{act.implementation_period || '—'}</span></span>
                                                        <span>Budget: <span className="font-semibold text-slate-700 dark:text-slate-300">₱{parseFloat(act.budget_amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span></span>
                                                        <span>Source: <span className="font-semibold text-slate-700 dark:text-slate-300">{act.budget_source || '—'}</span></span>
                                                        <span>Persons: <span className="font-semibold text-slate-700 dark:text-slate-300">{act.persons_involved || '—'}</span></span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Signatories */}
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            ['Prepared By', `${selectedAIP.prepared_by_name || '—'}${selectedAIP.prepared_by_title ? ` — ${selectedAIP.prepared_by_title}` : ''}`],
                                            ['Approved By', `${selectedAIP.approved_by_name || '—'}${selectedAIP.approved_by_title ? ` — ${selectedAIP.approved_by_title}` : ''}`],
                                        ].map(([label, value]) => (
                                            <div key={label} className="bg-slate-50 dark:bg-dark-base rounded-xl p-3 border border-slate-100 dark:border-dark-border">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">{label}</p>
                                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{value}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Queue list */
                    <div>
                        {loading ? (
                            <div className="flex items-center justify-center py-24">
                                <div className="w-6 h-6 rounded-full border-2 border-slate-300 dark:border-slate-600 border-t-amber-500 animate-spin" />
                            </div>
                        ) : pendingAIPs.length === 0 ? (
                            <div className="text-center py-24">
                                <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600">
                                        <path d="M20 6 9 17l-5-5"/>
                                    </svg>
                                </div>
                                <h3 className="text-lg font-black text-slate-700 dark:text-slate-200 mb-1">All clear!</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">No AIPs are pending verification right now.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {pendingAIPs.map(aip => (
                                    <button
                                        key={aip.id}
                                        onClick={() => setSelectedAIP(aip)}
                                        className="group bg-white dark:bg-dark-surface rounded-2xl border-2 border-amber-200/70 dark:border-amber-800/40 hover:border-amber-400 dark:hover:border-amber-600 shadow-sm hover:shadow-md transition-all duration-200 p-5 text-left active:scale-[0.98]"
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700">
                                                Pending
                                            </span>
                                            {aip.verification_document_path && (
                                                <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
                                                    PDF ✓
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1 leading-snug">{aip.program?.title}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{aip.school?.name || 'Division Personnel'} · {aip.year}</p>
                                        <p className="text-xs text-slate-400 dark:text-slate-500">{aip.activities?.length ?? 0} activities · Submitted {new Date(aip.created_at).toLocaleDateString()}</p>
                                        <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 group-hover:gap-2.5 transition-all">
                                            Review
                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}
