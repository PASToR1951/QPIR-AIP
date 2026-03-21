import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Input } from './components/ui/Input';
import { Select } from './components/ui/Select';
import { FormHeader } from './components/ui/FormHeader';
import { ConfirmationModal } from './components/ui/ConfirmationModal';
import WizardStepper from './components/ui/WizardStepper';
import { OUTCOME_OPTIONS } from './components/forms/aip/AIPProfileSection';

const BETA_STEPS = [
    { num: 1, label: 'Profile' },
    { num: 2, label: 'Goals' },
    { num: 3, label: 'Activities' },
    { num: 4, label: 'Submit' },
];

const PHASES = ['Planning', 'Implementation', 'Monitoring and Evaluation'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const FULL_MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MAX_PDF_SIZE = 5 * 1024 * 1024;

function derivePeriod(start, end) {
    const s = parseInt(start), e = parseInt(end);
    if (!s || !e) return '';
    return s === e ? FULL_MONTH_NAMES[s - 1] : `${FULL_MONTH_NAMES[s - 1]} to ${FULL_MONTH_NAMES[e - 1]}`;
}

export default function AIPBetaForm() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const programFromUrl = searchParams.get('program') || '';
    const submode = searchParams.get('submode') || 'full'; // 'full' | 'wizard'
    const [wizardStep, setWizardStep] = useState(1);

    const userStr = localStorage.getItem('user');
    let user = null;
    try { user = userStr ? JSON.parse(userStr) : null; } catch { /* */ }
    const token = localStorage.getItem('token');
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

    // Form state
    const [depedProgram] = useState(programFromUrl);
    const [year, setYear] = useState(String(new Date().getFullYear()));
    const [outcome, setOutcome] = useState('');
    const [sipTitle, setSipTitle] = useState('');
    const [projectCoord, setProjectCoord] = useState('');
    const [objectives, setObjectives] = useState(['']);
    const [indicators, setIndicators] = useState([{ description: '', target: '' }]);
    const [preparedByName, setPreparedByName] = useState('');
    const [preparedByTitle, setPreparedByTitle] = useState('');
    const [approvedByName, setApprovedByName] = useState('');
    const [approvedByTitle, setApprovedByTitle] = useState('');

    const [activities, setActivities] = useState([
        { id: crypto.randomUUID(), phase: 'Planning', name: '', periodStartMonth: '', periodEndMonth: '', persons: '', outputs: '', budgetAmount: '', budgetSource: '' },
        { id: crypto.randomUUID(), phase: 'Implementation', name: '', periodStartMonth: '', periodEndMonth: '', persons: '', outputs: '', budgetAmount: '', budgetSource: '' },
        { id: crypto.randomUUID(), phase: 'Monitoring and Evaluation', name: '', periodStartMonth: '', periodEndMonth: '', persons: '', outputs: '', budgetAmount: '', budgetSource: '' },
    ]);

    // PDF upload state
    const [pdfFile, setPdfFile] = useState(null);
    const [pdfError, setPdfError] = useState('');
    const [pdfCompressing, setPdfCompressing] = useState(false);
    const [compressionProgress, setCompressionProgress] = useState({ current: 0, total: 0 });
    const fileInputRef = useRef(null);

    // UI state
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [modal, setModal] = useState({ isOpen: false, type: 'warning', title: '', message: '', confirmText: 'Confirm', onConfirm: () => {} });
    const closeModal = useCallback(() => setModal(prev => ({ ...prev, isOpen: false })), []);

    useEffect(() => {
        if (!programFromUrl) navigate('/aip');
    }, [programFromUrl, navigate]);

    // Activity handlers
    const handleActivityChange = useCallback((id, field, value) => {
        setActivities(prev => prev.map(a => {
            if (a.id !== id) return a;
            const updated = { ...a, [field]: value };
            // Clear end month if it's now before start month
            if (field === 'periodStartMonth' && updated.periodEndMonth) {
                if (parseInt(value) > parseInt(updated.periodEndMonth)) {
                    updated.periodEndMonth = '';
                }
            }
            // Clear start month if it's now after end month
            if (field === 'periodEndMonth' && updated.periodStartMonth) {
                if (parseInt(value) < parseInt(updated.periodStartMonth)) {
                    updated.periodStartMonth = '';
                }
            }
            return updated;
        }));
    }, []);

    const addActivity = useCallback((phase) => {
        setActivities(prev => [...prev, {
            id: crypto.randomUUID(), phase, name: '', periodStartMonth: '', periodEndMonth: '',
            persons: '', outputs: '', budgetAmount: '', budgetSource: ''
        }]);
    }, []);

    const removeActivity = useCallback((id) => {
        setActivities(prev => {
            const target = prev.find(a => a.id === id);
            if (!target) return prev;
            const phaseCount = prev.filter(a => a.phase === target.phase).length;
            return phaseCount > 1 ? prev.filter(a => a.id !== id) : prev;
        });
    }, []);

    // PDF handler
    const compressPdf = async (file, onProgress) => {
        const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist');
        GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();

        const { default: jsPDF } = await import('jspdf');

        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await getDocument({ data: arrayBuffer }).promise;
        const totalPages = pdfDoc.numPages;

        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const pageW = 210;
        const pageH = 297;

        for (let i = 1; i <= totalPages; i++) {
            onProgress(i, totalPages);

            const page = await pdfDoc.getPage(i);
            const viewport = page.getViewport({ scale: 1.5 });

            const canvas = document.createElement('canvas');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            const ctx = canvas.getContext('2d');
            await page.render({ canvasContext: ctx, viewport }).promise;

            const imgData = canvas.toDataURL('image/jpeg', 0.8);
            const imgH = (canvas.height * pageW) / canvas.width;
            const yOffset = imgH < pageH ? (pageH - imgH) / 2 : 0;

            if (i > 1) pdf.addPage();
            pdf.addImage(imgData, 'JPEG', 0, yOffset, pageW, imgH);
        }

        const blob = pdf.output('blob');
        return new File([blob], file.name, { type: 'application/pdf' });
    };

    const handlePdfSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setPdfError('');

        if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
            setPdfError('Only PDF files are accepted.');
            setPdfFile(null);
            return;
        }

        const slugify = (str) => (str || '').trim().replace(/\s+/g, '-').replace(/[^a-zA-Z0-9\-]/g, '');
        const date = new Date().toISOString().slice(0, 10);
        const schoolSlug = slugify(user?.school_name || user?.name);
        const programSlug = slugify(depedProgram);
        const renamedFile = (f) => {
            const name = [schoolSlug, programSlug, date].filter(Boolean).join('-') + '.pdf';
            return new File([f], name, { type: 'application/pdf' });
        };

        if (file.size > MAX_PDF_SIZE) {
            setPdfCompressing(true);
            setCompressionProgress({ current: 0, total: 0 });
            try {
                const compressed = await compressPdf(file, (current, total) => {
                    setCompressionProgress({ current, total });
                });
                if (compressed.size > MAX_PDF_SIZE) {
                    setPdfError(`File is still too large after compression (${(compressed.size / 1024 / 1024).toFixed(1)} MB). Please reduce the file size manually.`);
                    setPdfFile(null);
                } else {
                    setPdfFile(renamedFile(compressed));
                }
            } catch (err) {
                console.error('PDF compression failed:', err);
                setPdfError(`Compression failed: ${err.message ?? 'Unknown error'}. Please reduce the file size manually.`);
                setPdfFile(null);
            } finally {
                setPdfCompressing(false);
                setCompressionProgress({ current: 0, total: 0 });
            }
            return;
        }
        setPdfFile(renamedFile(file));
    };

    const handleSubmit = async () => {
        if (!pdfFile) {
            setModal({
                isOpen: true, type: 'warning',
                title: 'Document Required',
                message: 'Please upload the signed and approved AIP document (PDF) before submitting.',
                confirmText: 'OK', onConfirm: closeModal
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('program_title', depedProgram);
            formData.append('year', parseInt(year));
            formData.append('outcome', outcome);
            formData.append('sip_title', sipTitle);
            formData.append('project_coordinator', projectCoord);
            formData.append('objectives', JSON.stringify(objectives.filter(o => o.trim())));
            formData.append('indicators', JSON.stringify(indicators.filter(i => i.description.trim())));
            formData.append('prepared_by_name', preparedByName);
            formData.append('prepared_by_title', preparedByTitle);
            formData.append('approved_by_name', approvedByName);
            formData.append('approved_by_title', approvedByTitle);
            formData.append('activities', JSON.stringify(activities.map(a => ({
                phase: a.phase,
                name: a.name,
                period: derivePeriod(a.periodStartMonth, a.periodEndMonth),
                periodStartMonth: a.periodStartMonth,
                periodEndMonth: a.periodEndMonth,
                persons: a.persons,
                outputs: a.outputs,
                budgetAmount: a.budgetAmount,
                budgetSource: a.budgetSource,
            }))));
            formData.append('verification_document', pdfFile);

            await axios.post(
                `${import.meta.env.VITE_API_URL}/api/aips`,
                formData,
                { headers: { ...authHeaders } }
            );

            // Draft is promoted to Submitted/Pending in the backend — no separate delete needed

            setModal({
                isOpen: true, type: 'success',
                title: 'Submitted for Verification',
                message: 'Your AIP has been submitted and is now pending verification by Division Personnel. You will not be able to file PIRs until it is verified.',
                confirmText: 'Back to Dashboard',
                onConfirm: () => navigate('/')
            });
        } catch (error) {
            setModal({
                isOpen: true, type: 'warning',
                title: 'Submission Failed',
                message: error.response?.data?.error || 'An error occurred. Please try again.',
                confirmText: 'Try Again',
                onConfirm: closeModal
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const totalBudget = activities.reduce((s, a) => s + (parseFloat(a.budgetAmount) || 0), 0);

    const goWizard = () => navigate(`/aip-beta?program=${encodeURIComponent(programFromUrl)}&submode=wizard`, { replace: true });
    const goFull = () => navigate(`/aip-beta?program=${encodeURIComponent(programFromUrl)}&submode=full`, { replace: true });
    const goNext = () => setWizardStep(s => Math.min(s + 1, 4));
    const goBack = () => setWizardStep(s => Math.max(s - 1, 1));

    const activeTab = 'bg-amber-500 text-white shadow-sm rounded-lg px-4 py-2 text-xs font-bold transition-all';
    const inactiveTab = 'text-slate-500 dark:text-slate-400 px-4 py-2 text-xs font-medium rounded-lg hover:bg-slate-200 dark:hover:bg-dark-border transition-all';

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-dark-base font-sans">
            <FormHeader
                title="AIP Fast Entry"
                programName={depedProgram}
                onBack={() => navigate('/aip')}
                theme="pink"
            />

            <ConfirmationModal
                isOpen={modal.isOpen}
                type={modal.type}
                title={modal.title}
                message={modal.message}
                confirmText={modal.confirmText}
                onConfirm={modal.onConfirm}
                onClose={closeModal}
            />

            <div className="max-w-5xl mx-auto px-6 md:px-10 py-10 space-y-8">

                {/* Beta notice + mode toggle */}
                <div className="space-y-4">
                    <div className="flex items-start gap-3 px-5 py-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-2xl shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500 shrink-0 mt-0.5">
                            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                        </svg>
                        <div>
                            <p className="text-sm font-bold text-amber-800 dark:text-amber-300">Streamlined Beta — Fast Entry Mode</p>
                            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                                This is an accelerated transcription interface. You must upload the physically signed and approved AIP document for verification.
                                Your submission will remain <span className="font-bold">Pending</span> until Division Personnel verifies it — PIR filing is blocked until then.
                            </p>
                        </div>
                    </div>

                    {/* Mode toggle with Beta badge */}
                    <div className="flex items-center gap-3">
                        <div className="flex items-center bg-slate-100 dark:bg-dark-surface rounded-xl p-1 border border-slate-200 dark:border-dark-border">
                            <button onClick={goWizard} className={submode === 'wizard' ? activeTab : inactiveTab}>
                                Step-by-Step
                            </button>
                            <button onClick={goFull} className={submode === 'full' ? activeTab : inactiveTab}>
                                Full Form
                            </button>
                        </div>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700 rounded-md">
                            <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                            Beta
                        </span>
                    </div>
                </div>

                {/* Wizard stepper */}
                {submode === 'wizard' && (
                    <WizardStepper steps={BETA_STEPS} currentStep={wizardStep} theme="pink" />
                )}

                {/* Profile Section */}
                {(submode === 'full' || wizardStep === 1) && (
                <section className="bg-white dark:bg-dark-surface rounded-2xl border border-slate-200 dark:border-dark-border shadow-sm p-8">
                    <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-5">Profile &amp; Alignment</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">Program</label>
                            <div className="px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-dark-border text-sm text-slate-700 dark:text-slate-300 font-medium border border-slate-200 dark:border-dark-border">
                                {depedProgram}
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">Fiscal Year</label>
                            <Input value={year} onChange={e => setYear(e.target.value)} type="number" min="2020" max="2040" theme="pink" />
                        </div>
                        <div className="sm:col-span-2 lg:col-span-1">
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">DepEd Outcome</label>
                            <Select value={outcome} onChange={e => setOutcome(e.target.value)} theme="pink">
                                <option value="">Select Outcome…</option>
                                {OUTCOME_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                            </Select>
                        </div>
                        <div className="sm:col-span-2">
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">SIP / Project Title</label>
                            <Input value={sipTitle} onChange={e => setSipTitle(e.target.value)} placeholder="School Improvement Project title…" theme="pink" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">Project Coordinator</label>
                            <Input value={projectCoord} onChange={e => setProjectCoord(e.target.value)} placeholder="Name…" theme="pink" />
                        </div>
                    </div>
                </section>
                )}

                {/* Objectives & Indicators */}
                {(submode === 'full' || wizardStep === 2) && (
                <section className="bg-white dark:bg-dark-surface rounded-2xl border border-slate-200 dark:border-dark-border shadow-sm p-8">
                    <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-5">Goals &amp; Targets</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">Objectives</p>
                            {objectives.map((obj, i) => (
                                <div key={i} className="flex gap-2 mb-2">
                                    <Input value={obj} onChange={e => setObjectives(prev => prev.map((o, j) => j === i ? e.target.value : o))} placeholder={`Objective ${i + 1}…`} theme="pink" className="flex-1" />
                                    {objectives.length > 1 && (
                                        <button onClick={() => setObjectives(prev => prev.filter((_, j) => j !== i))} className="px-2 text-slate-400 hover:text-red-500 transition-colors">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button onClick={() => setObjectives(prev => [...prev, ''])} className="text-xs font-bold text-pink-600 dark:text-pink-400 hover:underline mt-1">+ Add Objective</button>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">Performance Indicators</p>
                            {indicators.map((ind, i) => (
                                <div key={i} className="flex gap-2 mb-2">
                                    <Input value={ind.description} onChange={e => setIndicators(prev => prev.map((x, j) => j === i ? { ...x, description: e.target.value } : x))} placeholder="Indicator description…" theme="pink" className="flex-1" />
                                    <Input value={ind.target} onChange={e => setIndicators(prev => prev.map((x, j) => j === i ? { ...x, target: e.target.value } : x))} placeholder="Target" theme="pink" style={{ width: '6rem' }} />
                                    {indicators.length > 1 && (
                                        <button onClick={() => setIndicators(prev => prev.filter((_, j) => j !== i))} className="px-2 text-slate-400 hover:text-red-500 transition-colors">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button onClick={() => setIndicators(prev => [...prev, { description: '', target: '' }])} className="text-xs font-bold text-pink-600 dark:text-pink-400 hover:underline mt-1">+ Add Indicator</button>
                        </div>
                    </div>
                </section>
                )}

                {/* Activities Grid */}
                {(submode === 'full' || wizardStep === 3) && (
                <section className="bg-white dark:bg-dark-surface rounded-2xl border border-slate-200 dark:border-dark-border shadow-sm p-8">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Activities</h2>
                        <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                            Total Budget: <span className="font-bold text-slate-700 dark:text-slate-300">₱{totalBudget.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </span>
                    </div>

                    {PHASES.map(phase => {
                        const phaseActivities = activities.filter(a => a.phase === phase);
                        return (
                            <div key={phase} className="mb-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-xs font-black uppercase tracking-widest text-pink-600 dark:text-pink-400">{phase}</span>
                                    <div className="flex-1 h-px bg-slate-100 dark:bg-dark-border" />
                                    <button
                                        onClick={() => addActivity(phase)}
                                        className="text-xs font-bold text-pink-600 dark:text-pink-400 hover:underline"
                                    >+ Add Row</button>
                                </div>

                                {/* Spreadsheet header */}
                                <div className="hidden md:grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)_auto] gap-1.5 mb-1 px-2">
                                    {['Activity Name', 'Start', 'End', 'Budget (₱)', 'Budget Source', 'Persons', 'Outputs', ''].map((h, i) => (
                                        <span key={i} className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">{h}</span>
                                    ))}
                                </div>

                                {phaseActivities.length === 0 ? (
                                    <p className="text-xs text-slate-400 dark:text-slate-500 italic py-2 px-2">No activities yet. Click &quot;+ Add Row&quot;.</p>
                                ) : (
                                    phaseActivities.map((act) => (
                                        <div key={act.id} className="grid grid-cols-1 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)_auto] gap-1.5 mb-1.5 items-center">
                                            <input
                                                value={act.name}
                                                onChange={e => handleActivityChange(act.id, 'name', e.target.value)}
                                                placeholder="Activity name…"
                                                className="min-w-0 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-base text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-pink-200 dark:focus:ring-pink-800 focus:border-pink-300 transition-all"
                                            />
                                            <select
                                                value={act.periodStartMonth}
                                                onChange={e => handleActivityChange(act.id, 'periodStartMonth', e.target.value)}
                                                className="w-full min-w-0 px-2 py-2 rounded-lg border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-base text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-pink-200 dark:focus:ring-pink-800 transition-all"
                                            >
                                                <option value="">Start…</option>
                                                {MONTH_NAMES.map((m, idx) => <option key={m} value={idx + 1}>{m}</option>)}
                                            </select>
                                            <select
                                                value={act.periodEndMonth}
                                                onChange={e => handleActivityChange(act.id, 'periodEndMonth', e.target.value)}
                                                className="w-full min-w-0 px-2 py-2 rounded-lg border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-base text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-pink-200 dark:focus:ring-pink-800 transition-all"
                                            >
                                                <option value="">End…</option>
                                                {MONTH_NAMES.map((m, idx) => <option key={m} value={idx + 1}>{m}</option>)}
                                            </select>
                                            <input
                                                type="number"
                                                value={act.budgetAmount}
                                                onChange={e => handleActivityChange(act.id, 'budgetAmount', e.target.value)}
                                                placeholder="0.00"
                                                min="0"
                                                step="0.01"
                                                className="min-w-0 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-base text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-pink-200 dark:focus:ring-pink-800 transition-all"
                                            />
                                            <input
                                                value={act.budgetSource}
                                                onChange={e => handleActivityChange(act.id, 'budgetSource', e.target.value)}
                                                placeholder="Fund source…"
                                                className="min-w-0 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-base text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-pink-200 dark:focus:ring-pink-800 transition-all"
                                            />
                                            <input
                                                value={act.persons}
                                                onChange={e => handleActivityChange(act.id, 'persons', e.target.value)}
                                                placeholder="Persons responsible…"
                                                className="min-w-0 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-base text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-pink-200 dark:focus:ring-pink-800 transition-all"
                                            />
                                            <input
                                                value={act.outputs}
                                                onChange={e => handleActivityChange(act.id, 'outputs', e.target.value)}
                                                placeholder="Outputs…"
                                                className="min-w-0 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-base text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-pink-200 dark:focus:ring-pink-800 transition-all"
                                            />
                                            <button
                                                onClick={() => removeActivity(act.id)}
                                                className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                                                title="Remove row"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        );
                    })}
                </section>
                )}

                {/* Signatories */}
                {(submode === 'full' || wizardStep === 4) && (
                <section className="bg-white dark:bg-dark-surface rounded-2xl border border-slate-200 dark:border-dark-border shadow-sm p-8">
                    <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-5">Signatories</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">Prepared By — Name</label>
                            <Input value={preparedByName} onChange={e => setPreparedByName(e.target.value)} placeholder="Full name…" theme="pink" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">Prepared By — Title</label>
                            <Input value={preparedByTitle} onChange={e => setPreparedByTitle(e.target.value)} placeholder="Position / Designation…" theme="pink" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">Approved By — Name</label>
                            <Input value={approvedByName} onChange={e => setApprovedByName(e.target.value)} placeholder="Full name…" theme="pink" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">Approved By — Title</label>
                            <Input value={approvedByTitle} onChange={e => setApprovedByTitle(e.target.value)} placeholder="Position / Designation…" theme="pink" />
                        </div>
                    </div>
                </section>
                )}

                {/* Document Upload */}
                {(submode === 'full' || wizardStep === 4) && (
                <section className="bg-white dark:bg-dark-surface rounded-2xl border-2 border-dashed border-slate-200 dark:border-dark-border shadow-sm p-8">
                    <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">Verification Document <span className="text-red-500">*</span></h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
                        Upload the physically signed and approved AIP document. PDF only, max 5 MB.
                    </p>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,application/pdf"
                        onChange={handlePdfSelect}
                        className="hidden"
                    />

                    {pdfCompressing ? (
                        <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="w-5 h-5 rounded-full border-2 border-amber-400 border-t-transparent animate-spin shrink-0" />
                                <p className="text-sm font-bold text-amber-700 dark:text-amber-400">
                                    {compressionProgress.total > 0
                                        ? `Compressing page ${compressionProgress.current} of ${compressionProgress.total}…`
                                        : 'Loading PDF…'}
                                </p>
                            </div>
                            {compressionProgress.total > 0 && (
                                <div className="w-full bg-amber-200 dark:bg-amber-900/40 rounded-full h-1.5 overflow-hidden">
                                    <div
                                        className="bg-amber-500 h-1.5 rounded-full transition-all duration-300"
                                        style={{ width: `${(compressionProgress.current / compressionProgress.total) * 100}%` }}
                                    />
                                </div>
                            )}
                        </div>
                    ) : pdfFile ? (
                        <div className="flex items-center gap-4 p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-xl">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600 shrink-0">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
                            </svg>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300 truncate">{pdfFile.name}</p>
                                <p className="text-xs text-emerald-600 dark:text-emerald-400">{(pdfFile.size / 1024).toFixed(1)} KB</p>
                            </div>
                            <button
                                onClick={() => { setPdfFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                                className="text-emerald-600 hover:text-red-500 transition-colors p-1 rounded"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full flex flex-col items-center gap-3 py-10 rounded-xl border-2 border-dashed border-slate-200 dark:border-dark-border hover:border-pink-300 dark:hover:border-pink-700 hover:bg-pink-50/50 dark:hover:bg-pink-950/20 transition-all group"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300 dark:text-slate-600 group-hover:text-pink-400 transition-colors">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                            </svg>
                            <div className="text-center">
                                <p className="text-sm font-bold text-slate-600 dark:text-slate-300 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">Click to select PDF</p>
                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">PDF files only · max 5 MB</p>
                            </div>
                        </button>
                    )}

                    {pdfError && (
                        <p className="mt-3 text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                            {pdfError}
                        </p>
                    )}
                </section>
                )}

                {/* Footer — wizard nav or full submit */}
                {submode === 'wizard' ? (
                    <div className="flex items-center justify-between gap-4 pb-12">
                        <button
                            onClick={wizardStep === 1 ? () => navigate('/aip') : goBack}
                            className="px-6 py-3 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border hover:bg-slate-50 dark:hover:bg-dark-border transition-colors"
                        >
                            {wizardStep === 1 ? 'Cancel' : '← Back'}
                        </button>
                        {wizardStep < 4 ? (
                            <button
                                onClick={goNext}
                                className="inline-flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold bg-pink-600 hover:bg-pink-700 text-white shadow-sm shadow-pink-200 dark:shadow-pink-900/30 transition-colors"
                            >
                                Next →
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting || pdfCompressing}
                                className="inline-flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold bg-pink-600 hover:bg-pink-700 text-white shadow-sm shadow-pink-200 dark:shadow-pink-900/30 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <>
                                        <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                        Submitting…
                                    </>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M22 2L11 13"/><path d="M22 2L15 22l-4-9-9-4 20-7z"/>
                                        </svg>
                                        Submit for Verification
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="flex items-center justify-end gap-4 pb-12">
                        <button
                            onClick={() => navigate('/aip')}
                            className="px-6 py-3 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border hover:bg-slate-50 dark:hover:bg-dark-border transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || pdfCompressing}
                            className="inline-flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold bg-pink-600 hover:bg-pink-700 text-white shadow-sm shadow-pink-200 dark:shadow-pink-900/30 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <>
                                    <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                    Submitting…
                                </>
                            ) : (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M22 2L11 13"/><path d="M22 2L15 22l-4-9-9-4 20-7z"/>
                                    </svg>
                                    Submit for Verification
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
