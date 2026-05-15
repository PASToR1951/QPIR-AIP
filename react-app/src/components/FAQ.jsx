import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, MagnifyingGlass as Search, CaretDown as ChevronDown, CaretUp as ChevronUp, Question as HelpCircle, BookOpen, WarningCircle as AlertCircle, Shield, Gear, ChatCircle } from '@phosphor-icons/react';
import api from '../lib/api.js';
import Footer from './ui/Footer';
import { EndOfListCue } from './ui/EndOfListCue.jsx';

const ICON_MAP = {
  HelpCircle,
  BookOpen,
  AlertCircle,
  Shield,
  Gear,
  ChatCircle,
};

// Local fallback used only when the live API call fails (e.g. offline).
// The canonical content lives in the database and is editable by admins
// via /admin/faq.
const FAQ_FALLBACK = [
  {
    category: "General",
    icon: HelpCircle,
    questions: [
      {
        q: "What is the AIP-PIR Portal?",
        a: "The AIP-PIR Portal is the Schools Division of Guihulngan City's digital system for managing Annual Implementation Plans and Program Implementation Reviews in one role-aware workflow."
      },
      {
        q: "What does AIP stand for and what is it for?",
        a: "AIP stands for Annual Implementation Plan. It is the planning baseline for the fiscal year and identifies target outcomes, projects, activities, timelines, persons involved, expected outputs, and budget sources."
      },
      {
        q: "What does PIR stand for and what is it for?",
        a: "PIR stands for Program Implementation Review. It is the monitoring record that compares actual accomplishments and budget utilization against the AIP baseline, including facilitating and hindering factors."
      },
      {
        q: "Who can use the portal?",
        a: "The Beta Build supports School Users, Division Personnel, CES reviewers (CES-SGOD, CES-ASDS, CES-CID), Admin users, Observers with read-only access, and Pending accounts awaiting administrator assignment. Your role controls which schools, programs, and review queues you can access."
      },
      {
        q: "What does Apir mean in this system?",
        a: "Apir is Filipino for high five. The name AIP-PIR links planning and review as the two hands that meet to complete the program implementation cycle."
      },
      {
        q: "Which DepEd office runs this system?",
        a: "The portal is operated by the Department of Education, Schools Division of Guihulngan City. Issues, account requests, and policy questions should be directed to the SDO."
      },
      {
        q: "Is this a final release?",
        a: "No. The portal is currently labeled Beta 3 (v1.2.0-beta). Workflows, statuses, and reports may continue to evolve based on user feedback before a stable release."
      }
    ]
  },
  {
    category: "Accounts & Sign-In",
    icon: HelpCircle,
    questions: [
      {
        q: "How do I sign in to the portal?",
        a: "The portal supports password sign-in, magic-link sign-in via email, and Google OAuth sign-in when configured for the deployment. Use whichever method has been provisioned for your account."
      },
      {
        q: "Can I sign in with Google?",
        a: "Yes, when OAuth is configured for the deployment. Use the Google DepEd sign-in button on the login page; the backend verifies the DepEd account before starting a portal session."
      },
      {
        q: "What is a magic link?",
        a: "A magic link is a one-time sign-in URL sent to your email. Clicking it verifies your identity and starts a session without a password. Magic links expire after a short window and can only be used once."
      },
      {
        q: "I forgot my password. How do I reset it?",
        a: "Contact the SDO IT department or your administrator. Self-service password reset is not currently available; an administrator can issue a new password or arrange a magic-link sign-in."
      },
      {
        q: "Why is my account stuck in Pending status?",
        a: "New accounts, including OAuth sign-ups, are created in Pending state with restricted access. An administrator must assign your role (School, Division Personnel, CES, Observer, or Admin) before you can use role-specific features."
      },
      {
        q: "Why does the portal mention cookies after login?",
        a: "The portal stores the session in an HttpOnly cookie that the browser sends with each request. If login succeeds but you return to the login page, check whether your browser blocks cookies for the portal domain or whether the HTTPS or tunnel origin is misconfigured."
      },
      {
        q: "Can multiple people share one school account?",
        a: "The Beta Build enforces one active School-role account per school so AIP and PIR ownership stays clear. Contact the SDO administrator if the assigned account needs to be changed."
      },
      {
        q: "How long does my session stay signed in?",
        a: "Each session has a server-side expiry. Closing the browser tab does not necessarily sign you out, but the session is revoked when you click Logout, when an administrator revokes it, or when it reaches its expiry."
      },
      {
        q: "What happens when I log out?",
        a: "Logout revokes your server-side session, clears the authentication cookie, and removes locally cached drafts and session metadata in the browser. You will need to sign in again to resume work."
      },
      {
        q: "Can I be signed in on multiple devices?",
        a: "Yes. Each sign-in creates its own session row. Administrators can review and revoke individual sessions if a device is lost or compromised."
      }
    ]
  },
  {
    category: "AIP Submissions",
    icon: BookOpen,
    questions: [
      {
        q: "How do I create an AIP?",
        a: "Open the AIP form for your assigned program and fiscal year, fill in activities under the Planning, Implementation, and Monitoring and Evaluation phases, then save a draft or submit. School users submit on behalf of their school; Division Personnel can submit division-level AIPs."
      },
      {
        q: "What are the AIP activity phases?",
        a: "Each activity is grouped under one of three phases: Planning, Implementation, or Monitoring and Evaluation. The phase reflects when in the program lifecycle the activity occurs and is used to organize the AIP and the resulting PIR review rows."
      },
      {
        q: "Can I have more than one AIP for the same program and year?",
        a: "No. The system enforces one school AIP per school, program, and fiscal year. Division-level AIPs follow a similar rule per division user. If you need to revise an approved AIP, contact your administrator."
      },
      {
        q: "Why can't I submit my school AIP?",
        a: "School AIPs require focal-person assignments on the selected program before they can enter the recommendation workflow. If the program has no assigned focal persons, ask your administrator to set them up first."
      },
      {
        q: "Why can't I see certain programs?",
        a: "Programs are filtered by school level, explicit restrictions, and Division Personnel program assignments. Restricted programs such as ALS school-based options only appear for authorized schools."
      },
      {
        q: "What happens after I submit an AIP?",
        a: "A school AIP enters For Recommendation and appears in the queue of the assigned focal person. After focal recommendation it moves to For CES Review for the appropriate functional division. Division-level AIPs follow a simpler path managed by Division Personnel."
      },
      {
        q: "What does it mean when my AIP is Returned?",
        a: "A focal person or CES reviewer has sent the AIP back for correction with remarks. Open the same record, address the remarks, and resubmit. The record returns to the appropriate review queue."
      },
      {
        q: "Can I delete an AIP after submitting it?",
        a: "Submitted AIPs cannot be deleted from the user interface so the audit trail stays intact. Draft AIPs can be discarded. If an approved AIP needs to be retracted, contact your administrator."
      }
    ]
  },
  {
    category: "PIR Submissions",
    icon: BookOpen,
    questions: [
      {
        q: "Can I submit a PIR without an approved AIP?",
        a: "No. A PIR can only be created after an AIP has been submitted for the same school or Division Personnel account, program, and fiscal year."
      },
      {
        q: "Why are my AIP activities already filled in on the PIR form?",
        a: "The PIR form loads the linked AIP activities automatically so your accomplishments stay traceable to the original plan. You only need to fill in the physical and financial accomplishment details."
      },
      {
        q: "Why are some activities missing from my PIR?",
        a: "The PIR form uses timeline-aware filtering. It only shows activities whose implementation months overlap with the quarter you are currently reviewing."
      },
      {
        q: "Can I submit multiple PIRs for one AIP?",
        a: "Yes. You can submit one PIR per quarter for each AIP in a fiscal year (Q1, Q2, Q3, and Q4). The system enforces one PIR per AIP and reporting period."
      },
      {
        q: "What is the difference between physical and financial accomplishments?",
        a: "Physical accomplishments capture what was actually done, such as numbers of beneficiaries reached or outputs produced. Financial accomplishments capture the corresponding amounts utilized against the planned budget."
      },
      {
        q: "What are facilitating and hindering factors?",
        a: "Factors describe conditions that helped or hindered implementation. The PIR groups them by type — institutional, technical, infrastructure, learning resources, environmental, and other — and lets you attach recommendations alongside them."
      },
      {
        q: "What is a MOV?",
        a: "MOV stands for Means of Verification. It is the document, file, or record that substantiates an accomplishment, such as attendance sheets, photos, or output files referenced in the PIR."
      },
      {
        q: "What happens if I miss a PIR deadline?",
        a: "Deadlines and trimester windows are configured by the administrator. Submission outside the configured window may be blocked or marked late depending on configuration. Contact your administrator if you missed a deadline."
      },
      {
        q: "Why does my PIR enter For Admin Review instead of For CES Review?",
        a: "If you submit a PIR while signed in with a CES role, the record routes to For Admin Review because a CES user cannot review their own submission. The administrator handles the record from the consolidation view."
      }
    ]
  },
  {
    category: "Review & Workflow Statuses",
    icon: AlertCircle,
    questions: [
      {
        q: "What does Draft mean?",
        a: "Draft is a saved-but-not-submitted record that only you (the owner) can see and edit. Drafts persist on the server so you can resume work from another device."
      },
      {
        q: "What does For Recommendation mean?",
        a: "A school-owned AIP or PIR is in the focal-person queue for the program. The assigned focal person can recommend it (sending it to CES Review) or return it for correction."
      },
      {
        q: "What does For CES Review mean?",
        a: "An AIP or PIR with this status is in the CES queue for the program's functional division. CES-SGOD reviews SGOD programs, CES-ASDS reviews OSDS programs, and CES-CID reviews CID programs and programs without a declared division."
      },
      {
        q: "What does Under Review mean?",
        a: "A CES reviewer has explicitly started reviewing the PIR. This status indicates active review and helps avoid two reviewers acting on the same record at once."
      },
      {
        q: "What does For Admin Review mean?",
        a: "A PIR submitted by a CES-role user enters this holding state because CES users cannot review their own work. Administrators see the record in the consolidation view."
      },
      {
        q: "What does Approved mean?",
        a: "The reviewer has accepted the record. Approved records become read-only. For AIPs, approval is what unlocks the corresponding PIR."
      },
      {
        q: "What does Returned mean?",
        a: "A reviewer sent the record back for correction. The submitter receives a notification with the reviewer's remarks and can edit and resubmit."
      },
      {
        q: "What happens when a PIR is returned?",
        a: "You receive an in-app notification with the reviewer remarks. Open the same program and quarter, make the correction, then submit again. Returned PIRs go back to the appropriate recommendation or CES review queue."
      },
      {
        q: "Can I edit a PIR while it is being reviewed?",
        a: "No. PIRs in active review statuses are locked until a reviewer returns them. Draft and Returned PIRs can be edited; approved or terminal submissions stay locked."
      },
      {
        q: "Who is a Focal Person?",
        a: "A Focal Person is a Division Personnel user assigned to one or more programs. They review school submissions before CES review and can either recommend or return them with remarks."
      },
      {
        q: "Which CES role reviews which programs?",
        a: "CES-SGOD reviews SGOD programs, CES-ASDS reviews OSDS programs, and CES-CID reviews CID programs and any programs that do not yet have a declared functional division."
      },
      {
        q: "Can Admin approve school AIPs or PIRs directly?",
        a: "Admin users have oversight tools but do not act as focal or CES reviewers for the normal school review chain. AIP and PIR approvals go through the configured focal and CES roles."
      }
    ]
  },
  {
    category: "Drafts, Editing & Documents",
    icon: BookOpen,
    questions: [
      {
        q: "Can I save my progress and continue later?",
        a: "Yes. Save Draft stores your form state server-side so you can continue later from another device. PIR drafts are tied to the selected program, year, and quarter."
      },
      {
        q: "How long does my draft stay saved?",
        a: "Drafts remain available until you submit the record, discard the draft, or your administrator deletes related data. They are not auto-expired."
      },
      {
        q: "My draft did not restore. What should I check?",
        a: "Make sure you selected the same program, fiscal year, and quarter you were using when you saved the draft. If it still does not appear, contact the SDO IT department."
      },
      {
        q: "Can two people edit the same draft at the same time?",
        a: "Drafts are owned by a single account. The system protects against duplicate submissions for the same school, program, and period, but coordination among co-authors should happen outside the system."
      },
      {
        q: "Can I download or print my AIP or PIR?",
        a: "Yes. Each submitted record has a print-ready document view generated directly from the stored data. Use your browser's print dialog or print-to-PDF to save a copy."
      },
      {
        q: "Why does my downloaded document look different in another browser?",
        a: "Generated documents rely on browser rendering and print settings, which vary between browsers and operating systems. For consistent output, prefer the same browser and use the standard A4 print preset."
      }
    ]
  },
  {
    category: "Notifications & Announcements",
    icon: BookOpen,
    questions: [
      {
        q: "Where do I see notifications?",
        a: "The bell icon in the dashboard header opens your notification list. Unread notifications are highlighted and clicking a notification jumps to the related record when available."
      },
      {
        q: "Are notifications real-time?",
        a: "Yes. The portal keeps an event stream open so workflow updates appear without manually refreshing. If the stream is blocked, the notification list still loads from the standard API on each navigation."
      },
      {
        q: "How do notification links work?",
        a: "In-app notifications include entity metadata when available. Clicking supported notifications opens the related AIP, PIR, or announcement instead of leaving you to search for it manually."
      },
      {
        q: "What should I do if real-time notifications stop updating?",
        a: "Refresh the page first. If a tunnel proxy or CORS issue blocks the live event stream, the portal still loads existing notifications from the normal notifications API."
      },
      {
        q: "What is an announcement?",
        a: "Announcements are messages posted by administrators to inform users about deadlines, system changes, or operational notices. They can target all users or specific roles."
      }
    ]
  },
  {
    category: "Programs, Schools & Deadlines",
    icon: BookOpen,
    questions: [
      {
        q: "What is a cluster?",
        a: "A cluster groups related schools for organizational reporting. Schools belong to one cluster, and reports can be aggregated by cluster in addition to school and division levels."
      },
      {
        q: "Where do school and cluster logos come from?",
        a: "The portal uses an uploaded school logo first, then the uploaded cluster logo, then the bundled default cluster logo when no upload exists."
      },
      {
        q: "What is a trimester deadline?",
        a: "Trimester deadlines define submission windows for specific reporting periods. The administrator configures the open and close dates and optional grace periods that the system enforces."
      },
      {
        q: "Why is a program tagged with a functional division?",
        a: "Each program carries a division attribute (SGOD, OSDS, CID, or unassigned). The division determines which CES role reviews the program and how it appears in division-level reports."
      },
      {
        q: "What is a program restriction?",
        a: "Some programs are restricted to certain schools, such as ALS school-based options for specific school types. Restrictions hide the program from schools that should not submit it and prevent accidental encoding."
      }
    ]
  },
  {
    category: "Admin & Configuration",
    icon: HelpCircle,
    questions: [
      {
        q: "What can Admin manage?",
        a: "Admin users can manage overview metrics, users, schools, clusters, programs, deadlines, submissions, PIR review, reports, backups, settings, announcements, audit logs, school logos, and cluster logos."
      },
      {
        q: "How do I add or remove a user?",
        a: "From the Users page in the admin console, an administrator can create accounts, change roles, deactivate accounts, or anonymize accounts that should no longer be associated with personal data."
      },
      {
        q: "How do reports work?",
        a: "Admin users can generate compliance, monitoring, budget, workload, accomplishment, factor, AIP funnel, and cluster summary reports. Reports can typically be exported as CSV or XLSX where supported."
      },
      {
        q: "How do backups work?",
        a: "Backups are triggered or scheduled through the admin console. The status view shows recent backup runs. The portal does not run database backups itself; it integrates with the configured backup service."
      },
      {
        q: "Can Admin restore deleted data?",
        a: "Soft-deleted records keep a deletion timestamp rather than removing rows, which preserves history. Restoring data requires administrator action and may depend on the configured backup retention policy."
      },
      {
        q: "What is an audit log?",
        a: "The audit log captures administrative actions and selected workflow events for accountability. Admin users can review the log to investigate changes."
      }
    ]
  },
  {
    category: "Privacy & Data Handling",
    icon: HelpCircle,
    questions: [
      {
        q: "What personal data does the portal store?",
        a: "The portal stores account profile information (name, email, role, school assignment), authentication metadata, sessions, submission ownership, review remarks, and activity logs needed to operate the workflow."
      },
      {
        q: "Can I export my personal data?",
        a: "Yes. Administrators can produce a personal-data export for a user account in support of Data Privacy Act obligations. Contact the administrator to request an export."
      },
      {
        q: "Can my account be anonymized or deleted?",
        a: "Accounts can be soft-deleted or anonymized by an administrator. Anonymization removes personal identifiers while retaining workflow history so review records remain consistent."
      },
      {
        q: "Are my submissions kept forever?",
        a: "Submissions are retained as part of the official AIP and PIR record. They are not auto-purged. Retention beyond the operating period follows DepEd policy and the administrator's configuration."
      },
      {
        q: "How are sessions and cookies protected?",
        a: "Sessions are stored in HttpOnly cookies that JavaScript cannot read, paired with a server-side session row that can be revoked. This reduces exposure to client-side token theft."
      }
    ]
  },
  {
    category: "Technical Support",
    icon: AlertCircle,
    questions: [
      {
        q: "I see a duplicate submission error. What does it mean?",
        a: "The system prevents two submissions for the same school, program, and reporting period from being created at once. If you see this error, refresh the list — your previous submission likely already saved successfully."
      },
      {
        q: "The page is not loading. What should I do?",
        a: "First, refresh the page. If the issue persists, check your internet connection, try signing out and back in, and clear your browser's site data for the portal. If it still fails, contact the SDO IT department with the error message and approximate time."
      },
      {
        q: "I see a CORS or cookie warning. What is happening?",
        a: "This usually indicates that the portal is being accessed through an unexpected origin or that browser cookies are blocked. Confirm the URL matches the official portal address and that cookies are enabled for that domain."
      },
      {
        q: "Why am I being signed out unexpectedly?",
        a: "Possible causes include session expiry, the session being revoked by an administrator, sign-in from another device that invalidated this one, or a backend restart. Sign in again and contact support if it keeps happening."
      },
      {
        q: "How do I report a bug or request a feature?",
        a: "Contact the SDO IT department or your administrator with a description of the issue, the steps to reproduce it, and approximate timestamps. Screenshots help. Feature requests are tracked alongside the Beta release roadmap."
      },
      {
        q: "Where can I find user documentation?",
        a: "The Help Center hosts this FAQ plus role-aware onboarding inside the dashboard. Detailed system documentation is also maintained as a technical reference and is available from the administrator on request."
      }
    ]
  }
];

const FAQItem = ({ item }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`border-2 rounded-lg transition-all duration-300 overflow-hidden ${isOpen ? 'border-pink-200 bg-white dark:bg-dark-surface shadow-md' : 'border-slate-100 dark:border-dark-border bg-slate-50 dark:bg-dark-base hover:border-slate-200 dark:hover:border-dark-border hover:bg-white dark:hover:bg-dark-surface'}`}>
      <button 
        className="w-full flex items-start justify-between gap-3 p-4 sm:p-5 md:p-6 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="font-bold text-sm sm:text-base leading-snug text-slate-800 dark:text-slate-100 min-w-0">{item.q}</span>
        <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isOpen ? 'bg-pink-100 dark:bg-pink-950/30 text-pink-600' : 'bg-slate-200 dark:bg-dark-border text-slate-500 dark:text-slate-400'}`}>
          {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-4 pb-4 sm:px-5 sm:pb-5 md:px-6 md:pb-6 pt-0 border-t border-slate-100 dark:border-dark-border mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
          {item.a}
        </div>
      </div>
    </div>
  );
};

export default function FAQ() {
  const [searchQuery, setSearchQuery] = useState('');
  const [faqData, setFaqData] = useState(FAQ_FALLBACK);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await api.get('/api/faqs');
        if (cancelled) return;
        if (Array.isArray(res.data) && res.data.length > 0) {
          const shaped = res.data.map((group) => ({
            category: group.category,
            icon: ICON_MAP[group.icon_key] || HelpCircle,
            questions: (group.questions || []).map((q) => ({ q: q.q, a: q.a })),
          }));
          setFaqData(shaped);
        }
      } catch {
        // Keep fallback content silently — the page should still be useful offline.
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  // Flatten and filter questions based on search
  const filteredData = useMemo(() => faqData.map(category => ({
    ...category,
    questions: category.questions.filter(q =>
      q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.a.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.questions.length > 0), [faqData, searchQuery]);
  const filteredQuestionCount = filteredData.reduce((sum, category) => sum + category.questions.length, 0);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-base flex flex-col font-sans">
      <div className="bg-white dark:bg-dark-surface border-b border-slate-200 dark:border-dark-border sticky top-0 z-50 shadow-sm">
        <div className="max-w-5xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <Link to="/" className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-slate-100 dark:bg-dark-border text-slate-500 dark:text-slate-400 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-dark-border hover:text-slate-700 dark:hover:text-slate-200 transition-all shrink-0">
              <ArrowLeft size={20} weight="bold" />
            </Link>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight truncate">Help Center / FAQ</h1>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Frequently Asked Questions</p>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 w-full max-w-5xl mx-auto px-3 sm:px-4 py-6 md:py-12 relative z-10">
        
        {/* Header Area */}
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-slate-100 tracking-tight mb-3 sm:mb-4">How can we help?</h1>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 font-medium max-w-xl mx-auto mb-6 sm:mb-8">
            Search our knowledge base or browse categories below to find answers to the most common questions about the AIP-PIR Portal.
          </p>
          
          <div className="relative max-w-2xl mx-auto">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 sm:h-6 sm:w-6 text-slate-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-11 sm:pl-12 pr-4 py-3.5 sm:py-4 md:py-5 border-2 border-slate-200 dark:border-dark-border rounded-lg leading-5 bg-white dark:bg-dark-surface placeholder-slate-400 dark:placeholder-slate-500 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 text-base sm:text-lg transition-all shadow-sm focus:shadow-md"
              placeholder="Search for answers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* FAQ List */}
        <div className="space-y-6 md:space-y-10 mb-12 md:mb-16">
          {filteredData.length > 0 ? (
            <>
              {filteredData.map((category, idx) => {
                const Icon = category.icon;
                return (
                  <div key={idx} className="bg-white dark:bg-dark-surface p-4 sm:p-6 md:p-8 rounded-lg border border-slate-200 dark:border-dark-border shadow-sm">
                    <div className="flex items-start sm:items-center gap-3 mb-5 sm:mb-6">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 rounded-lg flex items-center justify-center border border-indigo-100 dark:border-indigo-900 shrink-0">
                        <Icon size={26} />
                      </div>
                      <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 leading-tight">{category.category}</h2>
                    </div>
                    <div className="space-y-4">
                      {category.questions.map((item, qIdx) => (
                        <FAQItem key={qIdx} item={item} />
                      ))}
                    </div>
                  </div>
                );
              })}
              <EndOfListCue
                count={filteredQuestionCount}
                message={searchQuery ? 'End of matching FAQ results' : 'End of FAQ list'}
                countLabel="question"
                showCount
                className="pt-2"
              />
            </>
          ) : (
            <div className="text-center px-4 py-12 sm:py-16 bg-white dark:bg-dark-surface rounded-lg border border-slate-200 dark:border-dark-border shadow-sm">
              <div className="w-16 h-16 bg-slate-100 dark:bg-dark-border rounded-lg flex items-center justify-center mx-auto mb-4">
                <Search size={32} className="text-slate-300 dark:text-slate-600" />
              </div>
              <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-2">No results found</h3>
              <p className="text-slate-500 dark:text-slate-400 font-medium max-w-sm mx-auto">
                We couldn't find any questions matching "{searchQuery}". Try using different keywords or contact the helpdesk.
              </p>
              <button 
                onClick={() => setSearchQuery('')}
                className="mt-6 px-6 py-2.5 bg-slate-800 text-white font-bold rounded-lg text-sm hover:bg-slate-700 transition-colors"
              >
                Clear Search
              </button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
