import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Search, ChevronDown, ChevronUp, HelpCircle, BookOpen, AlertCircle } from 'lucide-react';
import Footer from './ui/Footer';

const FAQ_DATA = [
  {
    category: "General",
    icon: HelpCircle,
    questions: [
      {
        q: "What is the AIP-PIR Portal?",
        a: "The AIP-PIR Portal is a centralized system for the DepEd Division of Guihulngan City to manage, track, and evaluate the Annual Implementation Plan (AIP) and Program Implementation Review (PIR) of all schools."
      },
      {
        q: "Who has access to the portal?",
        a: "School Heads, designated School Coordinators, and Division Personnel have access to the portal. Your access level determines which programs and schools you can view or edit."
      }
    ]
  },
  {
    category: "AIP & PIR Submissions",
    icon: col => <BookOpen {...col} />,
    questions: [
      {
        q: "Can I submit a PIR without an approved AIP?",
        a: "No. The system strictly requires an approved Annual Implementation Plan (AIP) before unlocking the Program Implementation Review (PIR) module for a given fiscal year. This enforces structural dependency."
      },
      {
        q: "Can I save my progress and continue later?",
        a: "Yes! The portal features Draft Persistence. You can save your progress at any time and resume on a different device securely."
      }
    ]
  },
  {
    category: "Technical Support",
    icon: AlertCircle,
    questions: [
      {
        q: "I forgot my password. How do I reset it?",
        a: "Please contact the Division IT Helpdesk to request a password reset for your official DepEd email account."
      },
      {
        q: "I cannot see the Alternative Learning System (ALS) program.",
        a: "Specialized programs like ALS are heavily restricted to authorized Selected Schools. If your school is not tagged for ALS by the division, the option will remain hidden."
      }
    ]
  }
];

const FAQItem = ({ item }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`border-2 rounded-2xl transition-all duration-300 overflow-hidden ${isOpen ? 'border-pink-200 bg-white dark:bg-dark-surface shadow-md' : 'border-slate-100 dark:border-dark-border bg-slate-50 dark:bg-dark-base hover:border-slate-200 dark:hover:border-dark-border hover:bg-white dark:hover:bg-dark-surface'}`}>
      <button 
        className="w-full flex items-center justify-between p-5 md:p-6 text-left focus:outline-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="font-bold text-slate-800 dark:text-slate-100 pr-8">{item.q}</span>
        <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isOpen ? 'bg-pink-100 dark:bg-pink-950/30 text-pink-600' : 'bg-slate-200 dark:bg-dark-border text-slate-500 dark:text-slate-400'}`}>
          {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="p-5 md:p-6 pt-0 border-t border-slate-100 dark:border-dark-border mt-2 text-slate-600 dark:text-slate-300 leading-relaxed">
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-base flex flex-col font-sans">
      <div className="bg-white dark:bg-dark-surface border-b border-slate-200 dark:border-dark-border sticky top-0 z-50 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-dark-border text-slate-500 dark:text-slate-400 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-dark-border hover:text-slate-700 dark:hover:text-slate-200 transition-all">
              <ArrowLeft size={18} strokeWidth={2.5} />
            </Link>
            <div>
              <h1 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">Help Center / FAQ</h1>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Frequently Asked Questions</p>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-8 md:py-12 relative z-10">
        
        {/* Header Area */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-slate-100 tracking-tight mb-4">How can we help?</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium max-w-xl mx-auto mb-8">
            Search our knowledge base or browse categories below to find answers to the most common questions about the AIP-PIR Portal.
          </p>
          
          <div className="relative max-w-2xl mx-auto">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-6 w-6 text-slate-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-12 pr-4 py-4 md:py-5 border-2 border-slate-200 dark:border-dark-border rounded-3xl leading-5 bg-white dark:bg-dark-surface placeholder-slate-400 dark:placeholder-slate-500 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 sm:text-lg transition-all shadow-sm focus:shadow-md"
              placeholder="Search for answers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* FAQ List */}
        <div className="space-y-12 mb-16">
          {filteredData.length > 0 ? (
            filteredData.map((category, idx) => {
              const Icon = category.icon;
              return (
                <div key={idx} className="bg-white dark:bg-dark-surface p-6 md:p-8 rounded-[2.5rem] border border-slate-200 dark:border-dark-border shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 rounded-xl flex items-center justify-center border border-indigo-100 dark:border-indigo-900">
                      <Icon size={24} strokeWidth={2.5} />
                    </div>
                    <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">{category.category}</h2>
                  </div>
                  <div className="space-y-4">
                    {category.questions.map((item, qIdx) => (
                      <FAQItem key={qIdx} item={item} />
                    ))}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-16 bg-white dark:bg-dark-surface rounded-[2.5rem] border border-slate-200 dark:border-dark-border shadow-sm">
              <div className="w-16 h-16 bg-slate-100 dark:bg-dark-border rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Search size={28} className="text-slate-300 dark:text-slate-600" />
              </div>
              <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-2">No results found</h3>
              <p className="text-slate-500 dark:text-slate-400 font-medium max-w-sm mx-auto">
                We couldn't find any questions matching "{searchQuery}". Try using different keywords or contact the helpdesk.
              </p>
              <button 
                onClick={() => setSearchQuery('')}
                className="mt-6 px-6 py-2.5 bg-slate-800 text-white font-bold rounded-xl text-sm hover:bg-slate-700 transition-colors"
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
