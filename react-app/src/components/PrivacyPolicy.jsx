import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Shield,
  Database,
  Eye,
  LockKey as Lock,
  UserCircle,
  EnvelopeIcon as Mail,
  ClockCountdown as Clock,
  Trash,
  DownloadSimple as Download,
  PencilSimple as Pencil,
  CaretDown as ChevronDown,
  CaretUp as ChevronUp,
} from '@phosphor-icons/react';
import Footer from './ui/Footer';

const EFFECTIVE_DATE = 'April 3, 2026';
const DPO_EMAIL = 'guihulngan.city@deped.gov.ph';
const NPC_EMAIL = 'info@privacy.gov.ph';

const sections = [
  {
    id: 'collected-data',
    icon: Database,
    title: 'What Data We Collect',
    content: (
      <div className="space-y-3 text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
        <p>The AIP-PIR Portal collects and processes the following personal information:</p>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li><span className="font-semibold text-slate-700 dark:text-slate-300">Identity data</span> — full name, official DepEd email address</li>
          <li><span className="font-semibold text-slate-700 dark:text-slate-300">Affiliation data</span> — school name, position/designation, division assignment</li>
          <li><span className="font-semibold text-slate-700 dark:text-slate-300">Account data</span> — hashed password, assigned role (Division Personnel, CES, Cluster Coordinator, Admin)</li>
          <li><span className="font-semibold text-slate-700 dark:text-slate-300">Submission data</span> — AIP and PIR form contents, program targets, accomplishment rates, timestamps</li>
          <li><span className="font-semibold text-slate-700 dark:text-slate-300">Activity data</span> — login timestamps, administrative action logs (audit trail)</li>
        </ul>
        <p className="text-xs text-slate-400 dark:text-slate-500 pt-1">
          We do not collect sensitive personal information as defined under RA 10173 §3(l) (e.g., health, religious belief, or government-issued IDs) unless specifically required and explicitly consented to.
        </p>
      </div>
    ),
  },
  {
    id: 'purpose',
    icon: Eye,
    title: 'Why We Collect It',
    content: (
      <div className="space-y-3 text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
        <p>Your personal information is collected for the following specific, legitimate purposes:</p>
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>To authenticate and authorize your access to the portal based on your assigned role</li>
          <li>To associate your AIP and PIR submissions with the correct school and division program</li>
          <li>To enable division-level monitoring, review, and approval of program implementation plans</li>
          <li>To generate statistical reports for the DepEd Division of Guihulngan City</li>
          <li>To maintain an audit trail for accountability and compliance purposes</li>
        </ol>
        <p>
          The legal basis for processing is <span className="font-semibold text-slate-700 dark:text-slate-300">performance of a function vested by law</span> under RA 10173 §12(e), in relation to DepEd Order No. 8, s. 2015 (Policy Guidelines on Classroom Assessment).
        </p>
      </div>
    ),
  },
  {
    id: 'access',
    icon: UserCircle,
    title: 'Who Has Access',
    content: (
      <div className="space-y-3 text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
        <p>Access to your data is strictly role-based:</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse mt-1">
            <thead>
              <tr className="bg-slate-100 dark:bg-dark-border text-slate-700 dark:text-slate-300">
                <th className="text-left p-2 rounded-tl-lg font-semibold">Role</th>
                <th className="text-left p-2 font-semibold">What They Can See</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
              {[
                ['Division Personnel', 'Own submissions only'],
                ['Cluster Coordinator', 'Submissions of schools under their cluster'],
                ['CES Personnel', 'All submissions within their strand (SGOD / ASDS / CID)'],
                ['Admin', 'All data, audit logs, and user management'],
                ['External / Unauthorized', 'No access — system is not publicly accessible'],
              ].map(([role, access]) => (
                <tr key={role} className="hover:bg-slate-50 dark:hover:bg-dark-surface transition-colors">
                  <td className="p-2 font-medium text-slate-700 dark:text-slate-300">{role}</td>
                  <td className="p-2 text-slate-500 dark:text-slate-400">{access}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Data is <span className="font-semibold">never sold, rented, or disclosed</span> to third parties outside of DepEd without your explicit consent, except when required by law.
        </p>
      </div>
    ),
  },
  {
    id: 'retention',
    icon: Clock,
    title: 'How Long We Keep It',
    content: (
      <div className="space-y-3 text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
        <p>We retain personal data only as long as necessary:</p>
        <ul className="list-disc list-inside space-y-2 pl-2">
          <li><span className="font-semibold text-slate-700 dark:text-slate-300">Active accounts</span> — retained for as long as your account is active in the system</li>
          <li><span className="font-semibold text-slate-700 dark:text-slate-300">Deactivated accounts</span> — soft-deleted (logically removed from active use) per RA 10173 §19; underlying records retained for the minimum period required by DepEd records management policy</li>
          <li><span className="font-semibold text-slate-700 dark:text-slate-300">AIP / PIR submissions</span> — retained indefinitely for historical reporting and audit purposes, in compliance with government records retention rules</li>
          <li><span className="font-semibold text-slate-700 dark:text-slate-300">Audit logs</span> — retained for a minimum of three (3) years</li>
        </ul>
        <p>After the retention period, data is anonymized or securely disposed of in accordance with NPC guidelines.</p>
      </div>
    ),
  },
  {
    id: 'security',
    icon: Lock,
    title: 'How We Protect It',
    content: (
      <div className="space-y-3 text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
        <p>The following technical and organizational safeguards are in place:</p>
        <ul className="list-disc list-inside space-y-2 pl-2">
          <li>Passwords are hashed using <span className="font-semibold text-slate-700 dark:text-slate-300">bcrypt</span> — plaintext passwords are never stored</li>
          <li>Authentication uses <span className="font-semibold text-slate-700 dark:text-slate-300">short-lived JWTs delivered via HttpOnly, Secure cookies</span> — inaccessible to JavaScript (XSS-resistant)</li>
          <li>All data in transit is encrypted via <span className="font-semibold text-slate-700 dark:text-slate-300">HTTPS/TLS</span></li>
          <li>Role-based access controls restrict data visibility to the minimum necessary</li>
          <li>An audit log records all administrative actions for accountability</li>
          <li>Login attempts are rate-limited to prevent brute-force attacks</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'rights',
    icon: Shield,
    title: 'Your Rights Under RA 10173',
    content: (
      <div className="space-y-4 text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
        <p>As a data subject, you have the following rights under the Data Privacy Act of 2012:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { icon: Eye, right: 'Right to be Informed', desc: 'Know what data is collected and how it is used (this notice fulfills §16).' },
            { icon: UserCircle, right: 'Right to Access', desc: 'Request a copy of your personal data held by the system.' },
            { icon: Pencil, right: 'Right to Rectification', desc: 'Have inaccurate or incomplete data corrected.' },
            { icon: Trash, right: 'Right to Erasure', desc: 'Request deletion of data that is no longer necessary, subject to retention requirements.' },
            { icon: Download, right: 'Right to Data Portability', desc: 'Receive your data in a structured, commonly used, machine-readable format.' },
            { icon: Lock, right: 'Right to Object', desc: 'Object to processing based on legitimate interest, where applicable.' },
          ].map(({ icon: Icon, right, desc }) => (
            <div key={right} className="flex gap-3 p-3 rounded-xl bg-slate-50 dark:bg-dark-base border border-slate-100 dark:border-dark-border">
              <Icon size={18} className="text-indigo-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-700 dark:text-slate-300 text-xs">{right}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          To exercise any of these rights, contact our Data Privacy Officer (see below). We will respond within fifteen (15) working days as required by the NPC.
        </p>
      </div>
    ),
  },
  {
    id: 'contact',
    icon: Mail,
    title: 'Data Privacy Officer & Complaints',
    content: (
      <div className="space-y-3 text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
        <p>
          For privacy concerns, data access requests, or complaints, contact the <span className="font-semibold text-slate-700 dark:text-slate-300">Data Privacy Officer</span> of DepEd Division of Guihulngan City:
        </p>
        <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 rounded-xl p-4 space-y-1">
          <p className="font-semibold text-indigo-700 dark:text-indigo-400 text-sm">DepEd Division of Guihulngan City</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Osmeña Avenue, City of Guihulngan, Negros Oriental</p>
          <a href={`mailto:${DPO_EMAIL}`} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
            {DPO_EMAIL}
          </a>
        </div>
        <p>
          If your concern is not resolved within a reasonable time, you may file a complaint with the{' '}
          <span className="font-semibold text-slate-700 dark:text-slate-300">National Privacy Commission (NPC)</span>:
        </p>
        <div className="bg-slate-50 dark:bg-dark-base border border-slate-100 dark:border-dark-border rounded-xl p-4 space-y-1">
          <p className="font-semibold text-slate-700 dark:text-slate-300 text-sm">National Privacy Commission</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">5F Delegation Building, PICC Complex, Pasay City, Metro Manila</p>
          <a href={`mailto:${NPC_EMAIL}`} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
            {NPC_EMAIL}
          </a>
          <p className="text-xs text-slate-400 dark:text-slate-500">privacy.gov.ph</p>
        </div>
      </div>
    ),
  },
];

const Section = ({ section }) => {
  const [open, setOpen] = useState(true);
  const Icon = section.icon;

  return (
    <div className="border-2 border-slate-100 dark:border-dark-border rounded-2xl overflow-hidden transition-all duration-200">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between p-5 md:p-6 text-left focus:outline-none hover:bg-slate-50 dark:hover:bg-dark-surface transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="flex-shrink-0 w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center">
            <Icon size={18} className="text-indigo-600 dark:text-indigo-400" />
          </span>
          <span className="font-bold text-slate-800 dark:text-slate-100 text-base">{section.title}</span>
        </div>
        {open
          ? <ChevronUp size={18} className="text-slate-400 flex-shrink-0" />
          : <ChevronDown size={18} className="text-slate-400 flex-shrink-0" />}
      </button>
      {open && (
        <div className="px-5 md:px-6 pb-5 md:pb-6 border-t border-slate-100 dark:border-dark-border pt-4 bg-white dark:bg-dark-surface">
          {section.content}
        </div>
      )}
    </div>
  );
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-base flex flex-col">
      <div className="flex-1">
        {/* Hero */}
        <div className="relative bg-white dark:bg-dark-surface border-b border-slate-200 dark:border-dark-border overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/60 to-purple-50/40 dark:from-indigo-950/20 dark:to-purple-950/10 pointer-events-none" />
          <div className="max-w-4xl mx-auto px-6 py-12 md:py-16 relative">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors mb-8"
            >
              <ArrowLeft size={16} />
              Back to Login
            </Link>

            <div className="flex items-start gap-4">
              <span className="flex-shrink-0 w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center shadow-sm">
                <Shield size={28} className="text-indigo-600 dark:text-indigo-400" />
              </span>
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tighter text-slate-900 dark:text-slate-100 mb-2">
                  Privacy Notice
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  DepEd Division of Guihulngan City — AIP-PIR Portal
                </p>
                <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">
                  Effective date: {EFFECTIVE_DATE} &nbsp;·&nbsp; In accordance with <span className="font-semibold">RA 10173 (Data Privacy Act of 2012)</span>
                </p>
              </div>
            </div>

            <p className="mt-6 text-slate-600 dark:text-slate-400 text-sm leading-relaxed max-w-2xl">
              This notice explains how the DepEd Division of Guihulngan City collects, uses, stores, and protects your personal information when you use the AIP-PIR Portal. We are committed to upholding your rights as a data subject under Philippine law.
            </p>
          </div>
        </div>

        {/* Sections */}
        <div className="max-w-4xl mx-auto px-6 py-10 space-y-4">
          {sections.map((section) => (
            <Section key={section.id} section={section} />
          ))}

          {/* Amendments notice */}
          <div className="text-center text-xs text-slate-400 dark:text-slate-500 pt-4 pb-2">
            This privacy notice may be updated from time to time. Material changes will be communicated through the portal. Continued use of the system after updates constitutes acceptance of the revised notice.
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
