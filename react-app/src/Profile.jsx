import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  IdentificationCardIcon,
  Camera,
  Trash,
  FloppyDisk,
  ShieldCheck,
  Buildings,
  Info,
  CheckCircle,
  Warning,
} from '@phosphor-icons/react';
import { auth } from './lib/auth';
import api from './lib/api.js';
import { apiUrl } from './lib/apiBase.js';
import { DashboardHeader } from './components/ui/DashboardHeader.jsx';
import Footer from './components/ui/Footer.jsx';

const SALUTATIONS = ['', 'Mr.', 'Ms.', 'Mrs.', 'Dr.'];
const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
const ACCEPTED_PHOTO_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

const inputClass =
  'w-full rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface px-3.5 py-2.5 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#E94560]/30 transition-colors disabled:opacity-60 disabled:cursor-not-allowed';
const labelClass =
  'block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5';

function Banner({ kind, children }) {
  const styles = kind === 'success'
    ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-300';
  const Icon = kind === 'success' ? CheckCircle : Warning;
  return (
    <div className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold ${styles}`}>
      <Icon size={18} weight="fill" className="shrink-0" />
      <span>{children}</span>
    </div>
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Signatory identity fields
  const [form, setForm] = useState({
    salutation: '',
    first_name: '',
    middle_initial: '',
    last_name: '',
    position: '',
  });
  const [photo, setPhoto] = useState(null);
  const [pendingRequest, setPendingRequest] = useState(null);

  // School transfer modal state
  const [transferOpen, setTransferOpen] = useState(false);

  const loadProfile = useCallback(() => {
    setLoading(true);
    api.get('/api/profile')
      .then((r) => {
        const d = r.data;
        setUser(d);
        setForm({
          salutation: d.salutation || '',
          first_name: d.first_name || '',
          middle_initial: d.middle_initial || '',
          last_name: d.last_name || '',
          position: d.position || '',
        });
        setPhoto(d.profile_photo || null);
        setPendingRequest(d.pending_change_request || null);
      })
      .catch((e) => setError(e.friendlyMessage || 'Failed to load your profile.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!form.first_name.trim() || !form.last_name.trim()) {
      setError('First name and last name are required.');
      return;
    }
    setSaving(true);
    try {
      await api.patch('/api/profile', form);
      await auth.refreshSession(); // sync header/avatar + AIP/PIR signatory auto-fill
      setSuccess('Profile updated.');
    } catch (err) {
      setError(err.friendlyMessage || 'Could not save your profile.');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoSelect = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file
    if (!file) return;
    setError('');
    setSuccess('');
    if (!ACCEPTED_PHOTO_TYPES.includes(file.type)) {
      setError('Photo must be a PNG, JPEG, or WebP image.');
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setError('Photo must be 2 MB or smaller.');
      return;
    }
    setPhotoBusy(true);
    try {
      const data = new FormData();
      data.append('photo', file);
      const r = await api.post('/api/profile/photo', data);
      setPhoto(r.data.profile_photo);
      await auth.refreshSession();
      setSuccess('Photo updated.');
    } catch (err) {
      setError(err.friendlyMessage || 'Could not upload your photo.');
    } finally {
      setPhotoBusy(false);
    }
  };

  const handlePhotoRemove = async () => {
    setError('');
    setSuccess('');
    setPhotoBusy(true);
    try {
      await api.delete('/api/profile/photo');
      setPhoto(null);
      await auth.refreshSession();
      setSuccess('Photo removed.');
    } catch (err) {
      setError(err.friendlyMessage || 'Could not remove your photo.');
    } finally {
      setPhotoBusy(false);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.logout({ clearDrafts: true });
    } catch {
      window.alert('This browser was cleared, but the server could not confirm logout.');
    } finally {
      navigate('/login', { replace: true });
    }
  };

  const photoUrl = photo
    ? apiUrl(photo) // photo is an /api/profile/photo/:id?v=… path
    : null;
  const initial = (form.first_name || user?.email || 'U')[0]?.toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-base flex flex-col font-sans">
      <DashboardHeader user={user} onLogout={handleLogout} />

      <main className="flex-1 w-full max-w-3xl mx-auto mt-6 px-4 pb-12">
        <div className="mb-5">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors mb-4"
          >
            <ArrowLeft size={16} weight="bold" />
            Back to Dashboard
          </Link>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <IdentificationCardIcon size={22} className="text-[#E94560]" />
            My Profile
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Update your photo and signatory details.
          </p>
        </div>

        {error && <div className="mb-4"><Banner kind="error">{error}</Banner></div>}
        {success && <div className="mb-4"><Banner kind="success">{success}</Banner></div>}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-600 border-t-[#E94560] animate-spin" />
          </div>
        ) : (
          <div className="space-y-5">
            {/* Photo */}
            <section className="bg-white/60 dark:bg-dark-surface/60 backdrop-blur-md border border-slate-200 dark:border-dark-border rounded-2xl p-5">
              <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4">Profile Photo</h2>
              <div className="flex items-center gap-5">
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt="Profile"
                    className="h-20 w-20 rounded-2xl object-cover border border-slate-200 dark:border-dark-border"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 text-2xl font-black border border-indigo-200">
                    {initial}
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={ACCEPTED_PHOTO_TYPES.join(',')}
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={photoBusy}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#E94560] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#d63a52] transition-colors disabled:opacity-60"
                    >
                      <Camera size={15} weight="bold" />
                      {photo ? 'Change' : 'Upload'}
                    </button>
                    {photo && (
                      <button
                        type="button"
                        onClick={handlePhotoRemove}
                        disabled={photoBusy}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-dark-border px-3.5 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-dark-base transition-colors disabled:opacity-60"
                      >
                        <Trash size={15} weight="bold" />
                        Remove
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">
                    PNG, JPEG, or WebP · max 2 MB. Saved as WebP; location metadata is removed automatically.
                  </p>
                </div>
              </div>
            </section>

            {/* Signatory details */}
            <form onSubmit={handleSave} className="bg-white/60 dark:bg-dark-surface/60 backdrop-blur-md border border-slate-200 dark:border-dark-border rounded-2xl p-5 space-y-4">
              <div>
                <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200">Signatory details</h2>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                  This is the name and title that appear as your signature on AIP/PIR documents you prepare.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="sm:col-span-1">
                  <label className={labelClass}>Salutation</label>
                  <select
                    value={form.salutation}
                    onChange={(e) => setField('salutation', e.target.value)}
                    className={inputClass}
                  >
                    {SALUTATIONS.map((s) => (
                      <option key={s} value={s}>{s || '—'}</option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-3">
                  <label className={labelClass}>Position / Title</label>
                  <input
                    type="text"
                    value={form.position}
                    onChange={(e) => setField('position', e.target.value)}
                    placeholder="e.g. Education Program Supervisor I"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                <div className="sm:col-span-2">
                  <label className={labelClass}>First name *</label>
                  <input
                    type="text"
                    value={form.first_name}
                    onChange={(e) => setField('first_name', e.target.value)}
                    className={inputClass}
                    required
                  />
                </div>
                <div className="sm:col-span-1">
                  <label className={labelClass}>M.I.</label>
                  <input
                    type="text"
                    value={form.middle_initial}
                    onChange={(e) => setField('middle_initial', e.target.value.slice(0, 1))}
                    maxLength={1}
                    className={inputClass}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>Last name *</label>
                  <input
                    type="text"
                    value={form.last_name}
                    onChange={(e) => setField('last_name', e.target.value)}
                    className={inputClass}
                    required
                  />
                </div>
              </div>

              {/* Read-only identity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className={labelClass}>Email (login)</label>
                  <input type="text" value={user?.email || ''} disabled className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Role</label>
                  <input type="text" value={user?.role || ''} disabled className={inputClass} />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 dark:bg-white px-5 py-2.5 text-sm font-bold text-white dark:text-slate-900 hover:bg-slate-700 dark:hover:bg-slate-200 transition-colors disabled:opacity-60"
                >
                  <FloppyDisk size={16} weight="bold" />
                  {saving ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </form>

            {/* School / Cluster assignment */}
            <section className="bg-white/60 dark:bg-dark-surface/60 backdrop-blur-md border border-slate-200 dark:border-dark-border rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <Buildings size={20} className="text-slate-400 dark:text-slate-500 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200">School / Cluster assignment</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                    {user?.school_name || (user?.cluster_number ? `Cluster ${user.cluster_number}` : 'No school assigned')}
                  </p>
                  <div className="flex items-start gap-1.5 mt-2 text-[11px] text-slate-400 dark:text-slate-500">
                    <Info size={14} className="mt-px shrink-0" />
                    <span>
                      Your assignment controls which records you can access, so changes need
                      admin approval. Existing records stay with the school — they remain
                      available to whoever holds this assignment next.
                    </span>
                  </div>

                  {pendingRequest ? (
                    <div className="mt-3 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 px-3.5 py-2.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
                      A transfer request is pending admin review.
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setTransferOpen(true)}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-dark-border px-3.5 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-dark-base transition-colors"
                    >
                      Request change
                    </button>
                  )}
                </div>
              </div>
            </section>

            {/* Privacy notice */}
            <section className="bg-slate-50 dark:bg-dark-base/40 border border-slate-200 dark:border-dark-border rounded-2xl p-5">
              <h2 className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">
                <ShieldCheck size={18} className="text-emerald-600" />
                Privacy notice
              </h2>
              <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                In line with the Data Privacy Act of 2012 (RA 10173), the details on this page
                are processed only to identify you within the AIP-PIR system and to render your
                signature on documents you prepare. Your photo is stored privately and shown only
                to authenticated users; location metadata is stripped on upload. Every change you
                make here is recorded in your{' '}
                <Link to="/user-logs" className="font-semibold text-[#E94560] hover:underline">
                  activity log
                </Link>
                . To correct other information or request deletion of your account data, contact
                your system administrator.
              </p>
            </section>
          </div>
        )}
      </main>

      {transferOpen && (
        <TransferRequestModal
          currentSchoolId={user?.school_id}
          onClose={() => setTransferOpen(false)}
          onSubmitted={() => {
            setTransferOpen(false);
            setSuccess('Transfer request submitted for admin review.');
            loadProfile();
          }}
          onError={(msg) => setError(msg)}
        />
      )}

      <Footer />
    </div>
  );
}

function TransferRequestModal({ currentSchoolId, onClose, onSubmitted, onError }) {
  const [schools, setSchools] = useState([]);
  const [schoolId, setSchoolId] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get('/api/profile/school-options')
      .then((r) => setSchools(r.data.filter((s) => s.id !== currentSchoolId)))
      .catch(() => setSchools([]))
      .finally(() => setLoading(false));
  }, [currentSchoolId]);

  const submit = async (e) => {
    e.preventDefault();
    if (!schoolId) return;
    setSubmitting(true);
    try {
      await api.post('/api/profile/school-change-request', {
        requested_school_id: Number(schoolId),
        reason: reason.trim() || undefined,
      });
      onSubmitted();
    } catch (err) {
      onError(err.friendlyMessage || 'Could not submit your request.');
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1">Request school transfer</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          An administrator will review and apply this change. Your existing records stay with your current school.
        </p>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className={labelClass}>Target school *</label>
            <select
              value={schoolId}
              onChange={(e) => setSchoolId(e.target.value)}
              className={inputClass}
              required
              disabled={loading}
            >
              <option value="">{loading ? 'Loading…' : 'Select a school'}</option>
              {schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}{s.cluster_number ? ` · Cluster ${s.cluster_number}` : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Reason (optional)</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className={inputClass}
              placeholder="e.g. Reassigned to a new station effective this quarter."
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 dark:border-dark-border px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-dark-base transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !schoolId}
              className="rounded-xl bg-[#E94560] px-4 py-2 text-sm font-bold text-white hover:bg-[#d63a52] transition-colors disabled:opacity-60"
            >
              {submitting ? 'Submitting…' : 'Submit request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
