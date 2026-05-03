import { useState } from 'react';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import {
  Flask,
  Stamp,
  ArrowUUpLeft,
  UserPlus,
  UserGear,
  NotePencil,
  Table,
  X,
  CheckCircle,
} from '@phosphor-icons/react';
import { useAccessibility } from '../../context/AccessibilityContext.jsx';

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_PROGRAM = 'Basic Education Curriculum Implementation';
const MOCK_SCHOOL  = 'San Juan Elementary School';
const MOCK_QUARTER = '2nd Quarter CY 2026';

const ROLE_OPTIONS = ['School', 'Division Personnel', 'CES-SGOD', 'CES-ASDS', 'CES-CID', 'Observer'];

// ─── Sub-views ────────────────────────────────────────────────────────────────

function AIPSubmitView({ onComplete, onCancel }) {
  return (
    <View
      icon={<NotePencil size={22} className="text-pink-600 dark:text-pink-400" />}
      label="Submit AIP"
      accent="pink"
    >
      <Field label="Program" value={MOCK_PROGRAM} />
      <Field label="Fiscal Year" value="FY 2026" />
      <Field label="Status" value="Draft — ready to submit" />
      <InfoNote>
        In the real workflow, clicking Submit locks the AIP and sends it to your reviewer.
        In practice mode, nothing is saved.
      </InfoNote>
      <Actions
        confirmLabel="Submit AIP"
        confirmClass="bg-pink-600 hover:bg-pink-700 dark:bg-pink-700 dark:hover:bg-pink-600"
        onConfirm={onComplete}
        onCancel={onCancel}
      />
    </View>
  );
}

function PIRSubmitView({ onComplete, onCancel }) {
  return (
    <View
      icon={<Table size={22} className="text-blue-600 dark:text-blue-400" />}
      label="File a PIR"
      accent="blue"
    >
      <Field label="Program" value={MOCK_PROGRAM} />
      <Field label="Quarter" value={MOCK_QUARTER} />
      <Field label="Status" value="Draft — ready to file" />
      <InfoNote>
        Filing a PIR sends your quarterly report to your reviewer. In practice mode, nothing is saved.
      </InfoNote>
      <Actions
        confirmLabel="File PIR"
        confirmClass="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
        onConfirm={onComplete}
        onCancel={onCancel}
      />
    </View>
  );
}

function CESForwardView({ onComplete, onCancel }) {
  const [remarks, setRemarks] = useState('');
  return (
    <View
      icon={<Stamp size={22} className="text-teal-600 dark:text-teal-400" />}
      label="Note & Forward to SDS"
      accent="teal"
    >
      <Field label="Program" value={MOCK_PROGRAM} />
      <Field label="School" value={MOCK_SCHOOL} />
      <Field label="Quarter" value={MOCK_QUARTER} />
      <TextArea
        label="Remarks (optional)"
        placeholder="Add notes for SDS…"
        value={remarks}
        onChange={setRemarks}
        focusClass="focus:ring-teal-300 dark:focus:ring-teal-700"
      />
      <InfoNote>
        Forwarding sends the PIR to the SDS for final review. In practice mode, nothing is saved.
      </InfoNote>
      <Actions
        confirmLabel="Note & Forward"
        confirmClass="bg-teal-600 hover:bg-teal-700 dark:bg-teal-700 dark:hover:bg-teal-600"
        onConfirm={onComplete}
        onCancel={onCancel}
      />
    </View>
  );
}

function CESReturnView({ onComplete, onCancel }) {
  const [remarks, setRemarks] = useState('');
  return (
    <View
      icon={<ArrowUUpLeft size={22} className="text-amber-600 dark:text-amber-400" />}
      label="Return PIR"
      accent="amber"
    >
      <Field label="Program" value={MOCK_PROGRAM} />
      <Field label="School" value={MOCK_SCHOOL} />
      <Field label="Quarter" value={MOCK_QUARTER} />
      <TextArea
        label="Feedback / Reason for return"
        placeholder="Explain what needs to be corrected…"
        value={remarks}
        onChange={setRemarks}
        focusClass="focus:ring-amber-300 dark:focus:ring-amber-700"
      />
      <InfoNote>
        Returning sends the PIR back to the submitter with your feedback. In practice mode, nothing is saved.
      </InfoNote>
      <Actions
        confirmLabel="Return PIR"
        confirmClass="bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-500"
        onConfirm={onComplete}
        onCancel={onCancel}
      />
    </View>
  );
}

function ClusterNoteView({ onComplete, onCancel }) {
  const [remarks, setRemarks] = useState('');
  return (
    <View
      icon={<Stamp size={22} className="text-green-600 dark:text-green-400" />}
      label="Note & Approve PIR"
      accent="green"
    >
      <Field label="School" value={MOCK_SCHOOL} />
      <Field label="Program" value={MOCK_PROGRAM} />
      <Field label="Quarter" value={MOCK_QUARTER} />
      <TextArea
        label="Remarks (optional)"
        placeholder="Add your notes…"
        value={remarks}
        onChange={setRemarks}
        focusClass="focus:ring-green-300 dark:focus:ring-green-700"
      />
      <InfoNote>
        Noting a PIR marks it as approved and passes it up the chain. In practice mode, nothing is saved.
      </InfoNote>
      <Actions
        confirmLabel="Note & Approve"
        confirmClass="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600"
        onConfirm={onComplete}
        onCancel={onCancel}
      />
    </View>
  );
}

function ClusterReturnView({ onComplete, onCancel }) {
  const [remarks, setRemarks] = useState('');
  return (
    <View
      icon={<ArrowUUpLeft size={22} className="text-amber-600 dark:text-amber-400" />}
      label="Return PIR"
      accent="amber"
    >
      <Field label="School" value={MOCK_SCHOOL} />
      <Field label="Program" value={MOCK_PROGRAM} />
      <Field label="Quarter" value={MOCK_QUARTER} />
      <TextArea
        label="Feedback / Reason for return"
        placeholder="Explain what needs to be corrected…"
        value={remarks}
        onChange={setRemarks}
        focusClass="focus:ring-amber-300 dark:focus:ring-amber-700"
      />
      <InfoNote>
        Returning a PIR sends it back to the school for corrections. In practice mode, nothing is saved.
      </InfoNote>
      <Actions
        confirmLabel="Return PIR"
        confirmClass="bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-500"
        onConfirm={onComplete}
        onCancel={onCancel}
      />
    </View>
  );
}

function AdminCreateUserView({ onComplete, onCancel }) {
  const [form, setForm] = useState({ name: '', email: '', role: 'School' });
  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));
  const valid = form.name.trim() && form.email.includes('@');
  return (
    <View
      icon={<UserPlus size={22} className="text-violet-600 dark:text-violet-400" />}
      label="Create a User"
      accent="violet"
    >
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Full Name</label>
          <input
            value={form.name}
            onChange={set('name')}
            placeholder="e.g. Maria Santos"
            className="w-full text-sm rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-base text-slate-700 dark:text-slate-200 px-3 py-2 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-300 dark:focus:ring-violet-700"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Email</label>
          <input
            value={form.email}
            onChange={set('email')}
            placeholder="e.g. msantos@deped.gov.ph"
            className="w-full text-sm rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-base text-slate-700 dark:text-slate-200 px-3 py-2 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-300 dark:focus:ring-violet-700"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Role</label>
          <select
            value={form.role}
            onChange={set('role')}
            className="w-full text-sm rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-base text-slate-700 dark:text-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-300 dark:focus:ring-violet-700"
          >
            {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>
      <InfoNote>
        In the real workflow, this creates a portal account and sends an invitation. Nothing is saved here.
      </InfoNote>
      <Actions
        confirmLabel="Create User"
        confirmClass="bg-violet-600 hover:bg-violet-700 dark:bg-violet-700 dark:hover:bg-violet-600 disabled:opacity-50"
        confirmDisabled={!valid}
        onConfirm={onComplete}
        onCancel={onCancel}
      />
    </View>
  );
}

function AdminAssignRoleView({ onComplete, onCancel }) {
  const [role, setRole] = useState('School');
  return (
    <View
      icon={<UserGear size={22} className="text-violet-600 dark:text-violet-400" />}
      label="Assign a Role"
      accent="violet"
    >
      <Field label="User" value="Juan dela Cruz (practice@deped.gov.ph)" />
      <Field label="Current Role" value="Pending" />
      <div className="mt-3">
        <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">New Role</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full text-sm rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-base text-slate-700 dark:text-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-300 dark:focus:ring-violet-700"
        >
          {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>
      <InfoNote>
        Changing a role affects what the user can see and do in the portal. In practice mode, nothing is saved.
      </InfoNote>
      <Actions
        confirmLabel="Save Role"
        confirmClass="bg-violet-600 hover:bg-violet-700 dark:bg-violet-700 dark:hover:bg-violet-600"
        onConfirm={onComplete}
        onCancel={onCancel}
      />
    </View>
  );
}

// ─── Shared primitives ────────────────────────────────────────────────────────

function View({ icon, label, accent, children }) {
  const accentStrip = {
    pink:   'from-pink-400 to-rose-400',
    blue:   'from-blue-400 to-indigo-400',
    teal:   'from-teal-400 to-emerald-400',
    amber:  'from-amber-400 to-orange-400',
    green:  'from-green-400 to-emerald-400',
    violet: 'from-violet-400 to-purple-400',
  }[accent] ?? 'from-slate-300 to-slate-400';

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 dark:border-dark-border bg-white/96 dark:bg-dark-surface/96 shadow-2xl backdrop-blur">
      <div className={`h-1.5 bg-gradient-to-r ${accentStrip}`} />
      <div className="p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-base">
            {icon}
          </div>
          <h3 className="text-base font-black text-slate-900 dark:text-slate-100">{label}</h3>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div className="mb-3">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-slate-700 dark:text-slate-200">{value}</p>
    </div>
  );
}

function TextArea({ label, placeholder, value, onChange, focusClass }) {
  return (
    <div className="mt-3">
      <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        placeholder={placeholder}
        className={`w-full text-sm rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-base text-slate-700 dark:text-slate-200 px-3 py-2 placeholder-slate-400 focus:outline-none focus:ring-2 ${focusClass} resize-none`}
      />
    </div>
  );
}

function InfoNote({ children }) {
  return (
    <p className="mt-4 text-xs leading-relaxed text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-dark-border pt-3">
      {children}
    </p>
  );
}

function Actions({ confirmLabel, confirmClass, confirmDisabled, onConfirm, onCancel }) {
  return (
    <div className="mt-4 flex justify-end gap-2">
      <button
        type="button"
        onClick={onCancel}
        className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-dark-border text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-dark-border/30 transition-colors"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={onConfirm}
        disabled={confirmDisabled}
        className={`px-4 py-2 text-xs font-bold rounded-xl text-white transition-colors ${confirmClass}`}
      >
        {confirmLabel}
      </button>
    </div>
  );
}

// ─── Success state ─────────────────────────────────────────────────────────────

function SuccessView({ label, onClose }) {
  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/80 dark:bg-emerald-950/20 shadow-2xl p-6 text-center">
      <CheckCircle size={36} className="mx-auto text-emerald-500 dark:text-emerald-400 mb-3" />
      <h3 className="text-base font-black text-emerald-800 dark:text-emerald-200 mb-1">
        Task complete
      </h3>
      <p className="text-sm text-emerald-700/80 dark:text-emerald-300/70 mb-4">
        You practiced: <span className="font-bold">{label}</span>
      </p>
      <button
        type="button"
        onClick={onClose}
        className="px-5 py-2 text-xs font-black rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
      >
        Close
      </button>
    </div>
  );
}

// ─── Type → view map ──────────────────────────────────────────────────────────

const VIEWS = {
  aip_submit:        AIPSubmitView,
  pir_submit:        PIRSubmitView,
  ces_forward:       CESForwardView,
  ces_return:        CESReturnView,
  cluster_note:      ClusterNoteView,
  cluster_return:    ClusterReturnView,
  admin_create_user: AdminCreateUserView,
  admin_assign_role: AdminAssignRoleView,
};

// ─── Root export ──────────────────────────────────────────────────────────────

export default function PracticeInteractionModal({ task, onComplete, onClose }) {
  const { settings } = useAccessibility();
  const [done, setDone] = useState(false);

  const handleComplete = () => {
    onComplete(task.id);
    setDone(true);
  };

  const ViewComponent = VIEWS[task?.practiceType];

  return (
    <div className="fixed inset-0 z-[201] flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <AnimatePresence mode="wait">
        <Motion.div
          key={done ? 'success' : task?.id}
          initial={settings.reduceMotion ? false : { opacity: 0, y: 16, scale: 0.97 }}
          animate={settings.reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
          exit={settings.reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.97 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md"
        >
          {/* Practice badge */}
          {!done && (
            <div className="flex items-center gap-1.5 mb-2 px-1">
              <Flask size={12} className="text-amber-500" />
              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-600 dark:text-amber-400">
                Practice Mode
              </span>
              <button
                type="button"
                onClick={onClose}
                className="ml-auto rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                aria-label="Close practice interaction"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {done ? (
            <SuccessView label={task?.label} onClose={onClose} />
          ) : ViewComponent ? (
            <ViewComponent onComplete={handleComplete} onCancel={onClose} />
          ) : null}
        </Motion.div>
      </AnimatePresence>
    </div>
  );
}
