import React, { useState } from 'react';
import {
  XCircle, ArrowLeft, Buildings, IdentificationBadge, ShieldStar,
  UserPlus, CaretRight, Eye, EyeSlash, UsersThree,
} from '@phosphor-icons/react';
import { SearchableSelect } from './SearchableSelect.jsx';
import { MultiSelect } from './MultiSelect.jsx';

const inputCls =
  'w-full px-3 py-2 text-sm bg-white dark:bg-dark-base border border-slate-200 dark:border-dark-border rounded-xl text-slate-700 dark:text-slate-300 placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all';
const selectCls =
  'w-full px-3 py-2 text-sm bg-white dark:bg-dark-base border border-slate-200 dark:border-dark-border rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all';

const SALUTATIONS = ['Mr.', 'Ms.', 'Mrs.', 'Dr.'];

/* ─────────────────────────────────────────────────────────── *
 *  Step 1 — Role picker
 * ─────────────────────────────────────────────────────────── */
const ROLES = [
  {
    value: 'School',
    label: 'School',
    icon: Buildings,
    description: 'Tied to a single school. Submits AIPs and PIRs on behalf of the school.',
    group: 'field',
    iconColor: 'text-sky-500',
    activeBg: 'bg-sky-50 dark:bg-sky-950/30 border-sky-400 dark:border-sky-600',
    hoverBg: 'hover:border-sky-300 dark:hover:border-sky-700 hover:bg-sky-50/50 dark:hover:bg-sky-950/20',
    iconBg: 'bg-sky-100 dark:bg-sky-950/50',
  },
  {
    value: 'Division Personnel',
    label: 'Division Personnel',
    icon: IdentificationBadge,
    description: 'Division-level account. Manages programs and reviews school submissions.',
    group: 'field',
    iconColor: 'text-violet-500',
    activeBg: 'bg-violet-50 dark:bg-violet-950/30 border-violet-400 dark:border-violet-600',
    hoverBg: 'hover:border-violet-300 dark:hover:border-violet-700 hover:bg-violet-50/50 dark:hover:bg-violet-950/20',
    iconBg: 'bg-violet-100 dark:bg-violet-950/50',
  },
  {
    value: 'Admin',
    label: 'Administrator',
    icon: ShieldStar,
    description: 'Full system access. Can manage users, settings, deadlines, and all data.',
    group: 'system',
    iconColor: 'text-rose-500',
    activeBg: 'bg-rose-50 dark:bg-rose-950/30 border-rose-400 dark:border-rose-600',
    hoverBg: 'hover:border-rose-300 dark:hover:border-rose-700 hover:bg-rose-50/50 dark:hover:bg-rose-950/20',
    iconBg: 'bg-rose-100 dark:bg-rose-950/50',
  },
  {
    value: 'Observer',
    label: 'Observer',
    icon: Eye,
    description: 'Read-only monitoring account. Can view dashboards, submissions, exports, and observer notes.',
    group: 'system',
    iconColor: 'text-slate-500',
    activeBg: 'bg-slate-50 dark:bg-slate-900/30 border-slate-400 dark:border-slate-600',
    hoverBg: 'hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-900/20',
    iconBg: 'bg-slate-100 dark:bg-slate-900/50',
  },
  {
    value: 'Cluster Coordinator',
    label: 'Cluster Coordinator',
    icon: UsersThree,
    description: 'School Head who notes school PIRs from their cluster. Also submits their own PIRs to CES-CID.',
    group: 'review-chain',
    iconColor: 'text-amber-500',
    activeBg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-400 dark:border-amber-600',
    hoverBg: 'hover:border-amber-300 dark:hover:border-amber-700 hover:bg-amber-50/50 dark:hover:bg-amber-950/20',
    iconBg: 'bg-amber-100 dark:bg-amber-950/50',
  },
];

function RoleCard({ role, selected, onSelect }) {
  const Icon = role.icon;
  const isActive = selected === role.value;
  return (
    <button
      type="button"
      onClick={() => onSelect(role.value)}
      className={`relative flex flex-col gap-3 p-5 rounded-2xl border-2 text-left transition-all w-full
        ${isActive
          ? role.activeBg + ' shadow-md'
          : 'bg-white dark:bg-dark-surface border-slate-200 dark:border-dark-border ' + role.hoverBg
        }`}
    >
      {isActive && (
        <span className="absolute top-3 right-3 w-4 h-4 rounded-full bg-indigo-600 flex items-center justify-center">
          <span className="w-2 h-2 rounded-full bg-white" />
        </span>
      )}
      <span className={`w-10 h-10 rounded-xl flex items-center justify-center ${role.iconBg}`}>
        <Icon size={22} weight="duotone" className={role.iconColor} />
      </span>
      <div>
        <p className="text-sm font-black text-slate-900 dark:text-slate-100">{role.label}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{role.description}</p>
      </div>
    </button>
  );
}

function RolePicker({ selected, onSelect }) {
  const field = ROLES.filter(r => r.group === 'field');
  const system = ROLES.filter(r => r.group === 'system');
  const reviewChain = ROLES.filter(r => r.group === 'review-chain');

  return (
    <div className="space-y-5">
      {/* Field users group */}
      <div>
        <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2.5 px-0.5">
          Field Users
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {field.map(r => <RoleCard key={r.value} role={r} selected={selected} onSelect={onSelect} />)}
        </div>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-slate-100 dark:bg-dark-border" />
        <span className="text-[10px] text-slate-400 dark:text-slate-600 font-bold uppercase tracking-widest">Review Chain</span>
        <div className="flex-1 h-px bg-slate-100 dark:bg-dark-border" />
      </div>

      {/* Review chain group */}
      <div className="flex flex-col gap-3">
        {reviewChain.map(r => <RoleCard key={r.value} role={r} selected={selected} onSelect={onSelect} />)}
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-slate-100 dark:bg-dark-border" />
        <span className="text-[10px] text-slate-400 dark:text-slate-600 font-bold uppercase tracking-widest">System</span>
        <div className="flex-1 h-px bg-slate-100 dark:bg-dark-border" />
      </div>

      {/* System group */}
      <div className="flex flex-col gap-3">
        {system.map(r => <RoleCard key={r.value} role={r} selected={selected} onSelect={onSelect} />)}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── *
 *  Step 2 — Details form
 * ─────────────────────────────────────────────────────────── */
function getPasswordStrength(password) {
  if (!password) return null;
  if (password.length < 6) return 'weak';
  if (password.length < 10) return 'moderate';
  return 'strong';
}

const STRENGTH_CONFIG = {
  weak:     { label: 'Weak',     bars: 1, color: 'bg-rose-500',   text: 'text-rose-500'   },
  moderate: { label: 'Moderate', bars: 2, color: 'bg-amber-400',  text: 'text-amber-500'  },
  strong:   { label: 'Strong',   bars: 3, color: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' },
};

function DetailsForm({ form, setForm, schools, programs, clusters = [] }) {
  const [showPassword, setShowPassword] = useState(false);
  const isDepedEmail = true;
  const strength = getPasswordStrength(form.password);

  const emailLocal = isDepedEmail ? form.email.replace(/@deped\.gov\.ph$/, '') : form.email;

  const handleEmailChange = (e) => {
    const val = e.target.value.replace(/@.*$/, '');
    setForm(f => ({ ...f, email: isDepedEmail ? val + '@deped.gov.ph' : e.target.value }));
  };

  return (
    <div className="space-y-4">
      {(['Admin', 'Cluster Coordinator', 'Observer'].includes(form.role)) && (
        <div className="grid grid-cols-[100px_1fr] gap-3">
          <div>
            <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
              Title
            </label>
            <select value={form.salutation} onChange={e => setForm(f => ({ ...f, salutation: e.target.value }))} className={selectCls}>
              <option value="">—</option>
              {SALUTATIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
              Full Name
            </label>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className={inputCls}
              placeholder={form.role === 'Cluster Coordinator' ? 'Cluster Coordinator Name' : form.role === 'Observer' ? 'Observer Name' : 'Administrator Name'}
            />
          </div>
        </div>
      )}

      {form.role === 'School' && (
        <>
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest -mb-1">School Head</p>
          <div className="grid grid-cols-[100px_1fr_80px] gap-3">
            <div>
              <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
                Title
              </label>
              <select value={form.salutation} onChange={e => setForm(f => ({ ...f, salutation: e.target.value }))} className={selectCls}>
                <option value="">—</option>
                {SALUTATIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
                First Name <span className="text-rose-500">*</span>
              </label>
              <input
                value={form.first_name}
                onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))}
                className={inputCls}
                placeholder="Juan"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
                M.I.
              </label>
              <input
                value={form.middle_initial}
                onChange={e => setForm(f => ({ ...f, middle_initial: e.target.value }))}
                className={inputCls}
                placeholder="D"
                maxLength={1}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
              Surname <span className="text-rose-500">*</span>
            </label>
            <input
              value={form.last_name}
              onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))}
              className={inputCls}
              placeholder="Dela Cruz"
            />
          </div>
        </>
      )}

      {form.role === 'Division Personnel' && (
        <>
          <div className="grid grid-cols-[100px_1fr_80px] gap-3">
            <div>
              <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
                Title
              </label>
              <select value={form.salutation} onChange={e => setForm(f => ({ ...f, salutation: e.target.value }))} className={selectCls}>
                <option value="">—</option>
                {SALUTATIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
                First Name <span className="text-rose-500">*</span>
              </label>
              <input
                value={form.first_name}
                onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))}
                className={inputCls}
                placeholder="Juan"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
                M.I.
              </label>
              <input
                value={form.middle_initial}
                onChange={e => setForm(f => ({ ...f, middle_initial: e.target.value }))}
                className={inputCls}
                placeholder="D"
                maxLength={1}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
              Surname <span className="text-rose-500">*</span>
            </label>
            <input
              value={form.last_name}
              onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))}
              className={inputCls}
              placeholder="Dela Cruz"
            />
          </div>
        </>
      )}

      <div>
        <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
          Position / Designation
        </label>
        <input
          value={form.position}
          onChange={e => setForm(f => ({ ...f, position: e.target.value }))}
          className={inputCls}
          placeholder="e.g. Education Program Supervisor I"
        />
      </div>

      <div>
        <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
          Email <span className="text-rose-500">*</span>
        </label>
        {isDepedEmail ? (
          <div className="flex items-center border border-slate-200 dark:border-dark-border rounded-xl overflow-hidden bg-white dark:bg-dark-base focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
            <input
              value={emailLocal}
              onChange={handleEmailChange}
              className="flex-1 min-w-0 px-3 py-2 text-sm bg-transparent text-slate-700 dark:text-slate-300 placeholder-slate-400 focus:outline-none"
              placeholder="username"
            />
            <span className="px-3 py-2 text-sm text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-dark-surface border-l border-slate-200 dark:border-dark-border whitespace-nowrap select-none">
              @deped.gov.ph
            </span>
          </div>
        ) : (
          <input
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            className={inputCls}
            placeholder="admin@example.com"
          />
        )}
      </div>

      <div>
        <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
          Password <span className="text-rose-500">*</span>
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            className={inputCls + ' pr-10'}
            placeholder="Min. 6 characters"
          />
          <button
            type="button"
            onClick={() => setShowPassword(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            {showPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
          </button>
        </div>

        {strength && (() => {
          const cfg = STRENGTH_CONFIG[strength];
          return (
            <div className="mt-2 space-y-1.5">
              <div className="flex gap-1">
                {[1, 2, 3].map(n => (
                  <div
                    key={n}
                    className={`h-1 flex-1 rounded-full transition-all duration-300 ${n <= cfg.bars ? cfg.color : 'bg-slate-200 dark:bg-dark-border'}`}
                  />
                ))}
              </div>
              <p className={`text-[11px] font-bold ${cfg.text}`}>
                {cfg.label} password
                {strength === 'weak' && ' — must be at least 6 characters'}
                {strength === 'moderate' && ' — longer passwords are more secure'}
              </p>
            </div>
          );
        })()}
      </div>

      {form.role === 'School' && (
        <div>
          <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
            Assigned School <span className="text-rose-500">*</span>
          </label>
          <SearchableSelect
            options={schools.map(s => ({ value: s.id, label: s.name }))}
            value={form.school_id}
            onChange={v => setForm(f => ({ ...f, school_id: v }))}
            placeholder="Select school"
          />
          <p className="mt-1.5 text-[11px] text-slate-400 dark:text-slate-500">
            Only schools without an existing account are listed.
          </p>
        </div>
      )}

      {form.role === 'Cluster Coordinator' && (
        <div>
          <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
            Assigned Cluster <span className="text-rose-500">*</span>
          </label>
          <SearchableSelect
            options={clusters.map(c => ({ value: c.id, label: c.name || `Cluster ${c.cluster_number}` }))}
            value={form.cluster_id}
            onChange={v => setForm(f => ({ ...f, cluster_id: v }))}
            placeholder="Select cluster"
          />
        </div>
      )}

      {form.role === 'Division Personnel' && (
        <div>
          <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
            Assigned Programs
          </label>
          <MultiSelect
            options={programs.filter(p => p.school_level_requirement === 'Division').map(p => ({ value: p.id, label: p.title }))}
            selected={form.program_ids}
            onChange={v => setForm(f => ({ ...f, program_ids: v }))}
            placeholder="Select programs"
          />
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── *
 *  Wizard shell
 * ─────────────────────────────────────────────────────────── */
const ROLE_META = Object.fromEntries(ROLES.map(r => [r.value, r]));

export function CreateUserWizard({ open, onClose, onSave, schools, programs, clusters = [], loading, error }) {
  const emptyForm = {
    salutation: '', name: '', first_name: '', middle_initial: '', last_name: '', position: '',
    email: '', password: '', role: null, school_id: null, cluster_id: null, program_ids: [],
  };
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(emptyForm);

  if (!open) return null;

  const handleClose = () => {
    setStep(1);
    setForm(emptyForm);
    onClose();
  };

  const handleBack = () => setStep(1);

  const handleNext = () => {
    if (!form.role) return;
    setStep(2);
  };

  const handleSave = () => onSave(form);

  const selectedMeta = form.role ? ROLE_META[form.role] : null;
  const SelectedIcon = selectedMeta?.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

      {/* Panel */}
      <div className="relative z-10 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl shadow-[0_32px_80px_-16px_rgba(0,0,0,0.22)] dark:shadow-[0_32px_80px_-16px_rgba(0,0,0,0.6)] w-full max-w-lg flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 dark:border-dark-border shrink-0">
          {step === 2 && (
            <button
              onClick={handleBack}
              className="p-1.5 -ml-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-dark-border transition-colors"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <UserPlus size={16} weight="bold" className="text-indigo-500" />
              <h2 className="text-sm font-black text-slate-900 dark:text-slate-100">Create New User</h2>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              {/* Step dots */}
              {[1, 2].map(s => (
                <span
                  key={s}
                  className={`h-1.5 rounded-full transition-all ${s === step ? 'w-5 bg-indigo-500' : s < step ? 'w-1.5 bg-indigo-300 dark:bg-indigo-700' : 'w-1.5 bg-slate-200 dark:bg-dark-border'}`}
                />
              ))}
              <span className="text-[11px] text-slate-400 dark:text-slate-500 ml-1">
                Step {step} of 2 — {step === 1 ? 'Select Role' : `${selectedMeta?.label} Details`}
              </span>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-dark-border transition-colors"
          >
            <XCircle size={22} weight="fill" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {step === 1 && (
            <RolePicker selected={form.role} onSelect={v => setForm(f => ({ ...f, role: v, school_id: null, cluster_id: null, program_ids: [] }))} />
          )}
          {step === 2 && (
            <DetailsForm form={form} setForm={setForm} schools={schools} programs={programs} clusters={clusters} />
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 px-6 py-4 border-t border-slate-100 dark:border-dark-border flex items-center justify-between gap-3">
          {error && <p className="flex-1 text-xs font-bold text-rose-600 dark:text-rose-400">{error}</p>}
          {!error && <span />}
          <div className="flex items-center gap-2">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-border rounded-xl transition-colors"
            >
              Cancel
            </button>
            {step === 1 ? (
              <button
                onClick={handleNext}
                disabled={!form.role}
                className="flex items-center gap-1.5 px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {selectedMeta && SelectedIcon && (
                  <SelectedIcon size={16} weight="duotone" />
                )}
                {form.role ? `Continue as ${selectedMeta.label}` : 'Select a role'}
                <CaretRight size={14} weight="bold" />
              </button>
            ) : (
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex items-center gap-1.5 px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors disabled:opacity-50"
              >
                <UserPlus size={16} weight="bold" />
                {loading ? 'Creating…' : 'Create User'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateUserWizard;
