import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  XCircle, CaretLeft, Buildings, IdentificationBadge, CaretRight, UserPlus, WarningCircle, CheckCircle, EnvelopeSimple
} from '@phosphor-icons/react';
import { auth } from './lib/auth';
import api from './lib/api';
import { SearchableSelect } from './admin/components/SearchableSelect.jsx';
import { MultiSelect } from './admin/components/MultiSelect.jsx';

const SALUTATIONS = ['Mr.', 'Ms.', 'Mrs.', 'Dr.'];

// Helper class names
const inputCls = 'w-full px-4 py-3 bg-white/60 dark:bg-dark-base/60 backdrop-blur-sm border border-slate-200/50 dark:border-dark-border rounded-xl text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all';
const selectCls = 'w-full px-4 py-3 bg-white/60 dark:bg-dark-base/60 backdrop-blur-sm border border-slate-200/50 dark:border-dark-border rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all';

export default function OnboardingWizard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  
  const [lookups, setLookups] = useState({
    schools: [],
    programs: [],
    divisions: [],
    profile_hints: { first_name: '', last_name: '', email: '' }
  });

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    user_type: '',
    salutation: '',
    first_name: '',
    middle_initial: '',
    last_name: '',
    position: '',
    school_id: null,
    program_ids: []
  });

  // Fetch Lookups
  useEffect(() => {
    let active = true;
    api.get('/api/auth/onboarding/lookups')
      .then(res => {
        if (!active) return;
        setLookups(res.data);
        setForm(f => ({
          ...f,
          first_name: res.data.profile_hints.first_name || '',
          last_name: res.data.profile_hints.last_name || ''
        }));
        setLoading(false);
      })
      .catch(err => {
        if (!active) return;
        console.error("Failed to load onboarding lookups:", err);
        setError("Failed to load necessary data. Please try refreshing the page.");
        setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const handleNext = () => {
    setError(null);
    if (step === 1 && !form.user_type) {
      setError("Please select a role.");
      return;
    }
    if (step === 2) {
      if (!form.first_name.trim()) return setError("First name is required.");
      if (!form.last_name.trim()) return setError("Surname is required.");
    }
    setStep(s => s + 1);
  };

  const handleBack = () => {
    setError(null);
    setStep(s => Math.max(1, s - 1));
  };

  const handleSubmit = async () => {
    setError(null);
    if (form.user_type === 'School' && !form.school_id) {
      return setError("Please select your assigned school.");
    }
    
    setSaving(true);
    try {
      const res = await api.post('/api/auth/onboarding/complete-profile', form);
      const { user, expiresAt } = res.data;
      
      // Update local session
      auth.setSession(user, expiresAt);
      
      // Redirect to correct dashboard
      if (user.role === 'Division Personnel') navigate('/division', { replace: true });
      else navigate('/', { replace: true });
      
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "An error occurred while setting up your account.");
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-slate-50 dark:bg-dark-base flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  // Formatting Dropdown Options
  const schoolOptions = lookups.schools.map(s => ({
    value: s.id,
    label: `${s.cluster_name} › ${s.name} ${s.level !== 'Select Schools' ? `(${s.level})` : ''}`
  }));

  const programOptions = lookups.programs.map(p => ({
    value: p.id,
    label: `${p.division} - ${p.title}`
  }));

  return (
    <div className="min-h-screen bg-cover bg-center bg-no-repeat relative flex flex-col items-center justify-center p-4"
         style={{ backgroundImage: 'url("/images/sdo-facade.jpg")' }}>
      
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm z-0" />

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-2xl bg-white/90 dark:bg-dark-surface/95 backdrop-blur-md rounded-3xl shadow-2xl overflow-hidden border border-white/20 dark:border-white/5">
        
        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b border-slate-200/50 dark:border-dark-border/50 text-center">
          <div className="mx-auto w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl shadow-sm flex items-center justify-center mb-4 border border-slate-100 dark:border-slate-700">
             <img src="/logo192.png" alt="AIP-PIR Logo" className="w-10 h-10 object-contain drop-shadow-sm" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Complete Your Profile</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400 text-sm">Set up your account to start using the AIP-PIR Portal.</p>
          
          {lookups.profile_hints.email && (
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-semibold border border-indigo-100 dark:border-indigo-800/50">
              <EnvelopeSimple size={14} weight="bold" />
              {lookups.profile_hints.email}
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="h-1 w-full bg-slate-100 dark:bg-dark-border overflow-hidden">
          <div className="h-full bg-indigo-500 transition-all duration-500 ease-out" style={{ width: `${(step / 4) * 100}%` }} />
        </div>

        {/* Form Body */}
        <div className="p-8">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/50 flex items-start gap-3 animate-[shake_0.5s_ease-in-out]">
              <WarningCircle size={20} className="text-rose-500 mt-0.5 shrink-0" weight="fill" />
              <p className="text-sm font-medium text-rose-700 dark:text-rose-300">{error}</p>
            </div>
          )}

          {/* Step 1: Role Selection */}
          {step === 1 && (
            <div className="space-y-4 animate-[fadeIn_0.3s_ease-out]">
              <h2 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 text-center">What is your role?</h2>
              
              <button
                type="button"
                onClick={() => { setForm(f => ({ ...f, user_type: 'School' })); setError(null); }}
                className={`w-full flex items-start gap-4 p-5 rounded-2xl border-2 transition-all text-left
                  ${form.user_type === 'School' 
                    ? 'bg-sky-50 dark:bg-sky-900/20 border-sky-400 dark:border-sky-500 shadow-md ring-4 ring-sky-500/10' 
                    : 'bg-white/50 dark:bg-dark-base/50 border-slate-200 dark:border-dark-border hover:border-sky-300 hover:bg-slate-50'}`}
              >
                <div className={`p-3 rounded-xl shrink-0 ${form.user_type === 'School' ? 'bg-sky-500 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-sky-500'}`}>
                  <Buildings size={28} weight={form.user_type === 'School' ? "fill" : "duotone"} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">School-Based Personnel</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">I represent a school and will submit AIPs and PIRs.</p>
                </div>
                {form.user_type === 'School' && <CheckCircle size={24} weight="fill" className="text-sky-500 ml-auto self-center animate-[popIn_0.2s_ease-out]" />}
              </button>

              <button
                type="button"
                onClick={() => { setForm(f => ({ ...f, user_type: 'Division Personnel' })); setError(null); }}
                className={`w-full flex items-start gap-4 p-5 rounded-2xl border-2 transition-all text-left
                  ${form.user_type === 'Division Personnel' 
                    ? 'bg-violet-50 dark:bg-violet-900/20 border-violet-400 dark:border-violet-500 shadow-md ring-4 ring-violet-500/10' 
                    : 'bg-white/50 dark:bg-dark-base/50 border-slate-200 dark:border-dark-border hover:border-violet-300 hover:bg-slate-50'}`}
              >
                <div className={`p-3 rounded-xl shrink-0 ${form.user_type === 'Division Personnel' ? 'bg-violet-500 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-violet-500'}`}>
                  <IdentificationBadge size={28} weight={form.user_type === 'Division Personnel' ? "fill" : "duotone"} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Division-Based Personnel</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">I work at the division level and manage programs as a Focal Person.</p>
                </div>
                {form.user_type === 'Division Personnel' && <CheckCircle size={24} weight="fill" className="text-violet-500 ml-auto self-center animate-[popIn_0.2s_ease-out]" />}
              </button>
            </div>
          )}

          {/* Step 2: Personal Details */}
          {step === 2 && (
            <div className="space-y-5 animate-[fadeIn_0.3s_ease-out]">
               <div className="grid grid-cols-[110px_1fr_80px] gap-3">
                  <div>
                    <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Title</label>
                    <select value={form.salutation} onChange={e => setForm(f => ({ ...f, salutation: e.target.value }))} className={selectCls}>
                      <option value="">—</option>
                      {SALUTATIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 ml-1">First Name <span className="text-rose-500">*</span></label>
                    <input
                      value={form.first_name}
                      onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))}
                      className={inputCls}
                      placeholder="Juan"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 ml-1">M.I.</label>
                    <input
                      value={form.middle_initial}
                      onChange={e => setForm(f => ({ ...f, middle_initial: e.target.value }))}
                      className={inputCls + " text-center"}
                      placeholder="D"
                      maxLength={1}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Surname <span className="text-rose-500">*</span></label>
                  <input
                    value={form.last_name}
                    onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))}
                    className={inputCls}
                    placeholder="Dela Cruz"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Position / Designation</label>
                  <input
                    value={form.position}
                    onChange={e => setForm(f => ({ ...f, position: e.target.value }))}
                    className={inputCls}
                    placeholder="e.g. Master Teacher I, EPS"
                  />
                </div>
            </div>
          )}

          {/* Step 3: Assignment */}
          {step === 3 && (
            <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
              {form.user_type === 'School' ? (
                <div>
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Select Your School</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Search and select the school you represent.</p>
                  </div>
                  <SearchableSelect
                    options={schoolOptions}
                    value={form.school_id}
                    onChange={v => setForm(f => ({ ...f, school_id: v }))}
                    placeholder="Search by school name or cluster..."
                  />
                </div>
              ) : (
                <div>
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Program Ownership (Focal Person)</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Select any division-level programs you manage. You will be able to review school submissions for these programs.</p>
                  </div>
                  <MultiSelect
                    options={programOptions}
                    selected={form.program_ids}
                    onChange={v => setForm(f => ({ ...f, program_ids: v }))}
                    placeholder="Search and select programs..."
                  />
                </div>
              )}
            </div>
          )}

          {/* Step 4: Summary */}
          {step === 4 && (
            <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={32} weight="fill" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Ready to Finish!</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Please review your details before completing registration.</p>
              </div>

              <div className="bg-slate-50 dark:bg-dark-base rounded-2xl p-5 border border-slate-100 dark:border-dark-border space-y-4">
                <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                  <span className="text-slate-400 dark:text-slate-500 font-medium">Name:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {form.salutation} {form.first_name} {form.middle_initial ? `${form.middle_initial}. ` : ''}{form.last_name}
                  </span>
                  
                  <span className="text-slate-400 dark:text-slate-500 font-medium">Role:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{form.user_type}</span>
                  
                  {form.position && (
                    <>
                      <span className="text-slate-400 dark:text-slate-500 font-medium">Position:</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">{form.position}</span>
                    </>
                  )}

                  {form.user_type === 'School' && form.school_id && (
                    <>
                      <span className="text-slate-400 dark:text-slate-500 font-medium mt-2">School:</span>
                      <span className="font-bold text-indigo-600 dark:text-indigo-400 mt-2">
                        {lookups.schools.find(s => s.id === form.school_id)?.name}
                      </span>
                    </>
                  )}

                  {form.user_type === 'Division Personnel' && form.program_ids.length > 0 && (
                    <>
                      <span className="text-slate-400 dark:text-slate-500 font-medium mt-2">Programs:</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300 mt-2 line-clamp-3">
                        {form.program_ids.map(id => lookups.programs.find(p => p.id === id)?.title).join(', ')}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer Navigation */}
        <div className="px-8 py-5 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200/50 dark:border-dark-border flex items-center justify-between">
          <button
            type="button"
            onClick={handleBack}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors ${step === 1 ? 'invisible' : ''}`}
          >
            <CaretLeft size={16} weight="bold" />
            Back
          </button>

          {step < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-colors shadow-sm"
            >
              Next Step
              <CaretRight size={16} weight="bold" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-colors shadow-sm disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <UserPlus size={16} weight="bold" />
                  Complete Registration
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
