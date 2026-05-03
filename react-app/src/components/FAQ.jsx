import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, MagnifyingGlass as Search, CaretDown as ChevronDown, CaretUp as ChevronUp, Question as HelpCircle, BookOpen, WarningCircle as AlertCircle } from '@phosphor-icons/react';
import Footer from './ui/Footer';
import { EndOfListCue } from './ui/EndOfListCue.jsx';

const FAQ_DATA = [
  {
    category: "General",
    icon: HelpCircle,
    questions: [
      {
        q: "What is the AIP-PIR Portal?",
        a: "The AIP-PIR Portal is the Schools Division of Guihulngan City's digital system for managing Annual Implementation Plans and Program Implementation Reviews in one role-aware workflow."
      },
      {
        q: "Who can use the portal?",
        a: "The Beta Build supports School Users, Division Personnel, CES reviewers, Admin users, and Pending OAuth accounts awaiting administrator assignment. Your role controls which schools, programs, and review queues you can access."
      },
      {
        q: "What does Apir mean in this system?",
        a: "Apir is Filipino for high five. The name AIP-PIR links planning and review as the two hands that meet to complete the program implementation cycle."
      }
    ]
  },
  {
    category: "AIP & PIR Submissions",
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
        q: "Can I save my progress and continue later?",
        a: "Yes. Save Draft stores your form state server-side so you can continue later from another device. PIR drafts are tied to the selected program, year, and quarter."
      },
      {
        q: "Can I submit multiple PIRs for one AIP?",
        a: "Yes. You can submit one PIR per quarter for each AIP in a fiscal year."
      }
    ]
  },
  {
    category: "Review & Routing",
    icon: AlertCircle,
    questions: [
      {
        q: "What does For CES Review mean?",
        a: "A PIR with this status is in the CES queue for the program's functional division."
      },
      {
        q: "What happens when a PIR is returned?",
        a: "You receive an in-app notification with the reviewer remarks. Open the same program and quarter, make the correction, then submit again. Returned PIRs go back to the appropriate recommendation or CES review queue."
      },
      {
        q: "Can I edit a PIR while it is being reviewed?",
        a: "No. PIRs in active review statuses are locked until a reviewer returns them. Draft and Returned PIRs can be edited; approved or terminal submissions stay locked."
      }
    ]
  },
  {
    category: "Accounts & Access",
    icon: HelpCircle,
    questions: [
      {
        q: "Can I sign in with Google?",
        a: "Yes, when OAuth is configured for the deployment. Use the Google DepEd sign-in button on the login page; the backend verifies the DepEd account before starting a portal session."
      },
      {
        q: "Why does the portal mention cookies after login?",
        a: "The portal stores the session in an HttpOnly cookie. If login succeeds but you return to the login page, check whether your browser blocks cookies for the portal domain or whether the HTTPS or tunnel origin is misconfigured."
      },
      {
        q: "Can multiple people share one school account?",
        a: "The Beta Build enforces one active School-role account per school so AIP and PIR ownership stays clear. Contact the SDO administrator if the assigned account needs to be changed."
      },
      {
        q: "Why can't I see certain programs?",
        a: "Programs are filtered by school level, explicit restrictions, and Division Personnel program assignments. Restricted programs such as ALS school-based options only appear for authorized schools."
      }
    ]
  },
  {
    category: "Admin & Notifications",
    icon: BookOpen,
    questions: [
      {
        q: "What can Admin manage?",
        a: "Admin users can manage overview metrics, users, schools, clusters, programs, deadlines, submissions, PIR review, reports, backups, settings, announcements, audit logs, school logos, and cluster logos."
      },
      {
        q: "How do notification links work?",
        a: "In-app notifications include entity metadata when available. Clicking supported notifications opens the related AIP, PIR, or announcement instead of leaving you to search for it manually."
      },
      {
        q: "Where do school and cluster logos come from?",
        a: "The portal uses an uploaded school logo first, then the uploaded cluster logo, then the bundled default cluster logo when no upload exists."
      }
    ]
  },
  {
    category: "Technical Support",
    icon: AlertCircle,
    questions: [
      {
        q: "I forgot my password. How do I reset it?",
        a: "Contact the SDO IT department or your administrator. Self-service password reset is not currently available."
      },
      {
        q: "What should I do if real-time notifications stop updating?",
        a: "Refresh the page first. If a tunnel proxy or CORS issue blocks the live event stream, the portal still loads existing notifications from the normal notifications API."
      },
      {
        q: "My draft did not restore. What should I check?",
        a: "Make sure you selected the same program, fiscal year, and quarter you were using when you saved the draft. If it still does not appear, contact the SDO IT department."
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

  // Flatten and filter questions based on search
  const filteredData = FAQ_DATA.map(category => ({
    ...category,
    questions: category.questions.filter(q => 
      q.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
      q.a.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);
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
