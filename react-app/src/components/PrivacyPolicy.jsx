import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion } from 'framer-motion';

gsap.registerPlugin(ScrollTrigger);
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
  ShieldCheck,
  InfoIcon as Info,
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
      <div className="space-y-4 text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
        <p>The AIP-PIR Portal collects and processes the following personal information:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
          {[
            { label: 'Identity data', desc: 'Full name, official DepEd email address' },
            { label: 'Affiliation data', desc: 'School name, position/designation, division assignment' },
            { label: 'Account data', desc: 'Hashed password, assigned role' },
            { label: 'Activity data', desc: 'Login timestamps, administrative action logs' },
          ].map((item, i) => (
            <div key={i} className="flex flex-col p-3 rounded-xl bg-slate-50 dark:bg-dark-surface border border-slate-100 dark:border-dark-border">
              <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs mb-1">{item.label}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">{item.desc}</span>
            </div>
          ))}
        </div>
        <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30">
          <span className="font-semibold text-indigo-800 dark:text-indigo-300">Submission data: </span>
          <span className="text-indigo-700/80 dark:text-indigo-400/80">AIP and PIR form contents, program targets, accomplishment rates, and timestamps are heavily monitored.</span>
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500 pt-2 flex items-start gap-2">
          <ShieldCheck size={16} className="text-indigo-500 flex-shrink-0" />
          <span>We do not collect sensitive personal information as defined under RA 10173 §3(l) (e.g., health, religious belief, or government-issued IDs) unless specifically required and explicitly consented to.</span>
        </p>
      </div>
    ),
  },
  {
    id: 'purpose',
    icon: Eye,
    title: 'Why We Collect It',
    content: (
      <div className="space-y-4 text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
        <p>Your personal information is collected for the following specific, legitimate purposes:</p>
        <ul className="space-y-3">
          {[
            'To authenticate and authorize your access to the portal based on your assigned role.',
            'To associate your AIP and PIR submissions with the correct school and division program.',
            'To enable division-level monitoring, review, and approval of program implementation plans.',
            'To generate statistical reports for the DepEd Division of Guihulngan City.',
            'To maintain an audit trail for accountability and compliance purposes.'
          ].map((text, i) => (
            <li key={i} className="flex items-start gap-3 bg-white dark:bg-dark-base p-3 rounded-lg border border-slate-100 dark:border-dark-border shadow-sm">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold">
                {i + 1}
              </div>
              <span className="mt-0.5">{text}</span>
            </li>
          ))}
        </ul>
        <p className="p-3 bg-slate-50 dark:bg-dark-surface rounded-lg text-xs border border-slate-100 dark:border-dark-border mt-4">
          The legal basis for processing is <span className="font-semibold text-slate-800 dark:text-slate-200">performance of a function vested by law</span> under RA 10173 §12(e), in relation to DepEd Order No. 8, s. 2015 (Policy Guidelines on Classroom Assessment).
        </p>
      </div>
    ),
  },
  {
    id: 'access',
    icon: UserCircle,
    title: 'Who Has Access',
    content: (
      <div className="space-y-4 text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
        <p>Access to your data is strictly role-based to ensure the highest level of privacy and security.</p>
        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-dark-border shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-dark-surface text-slate-800 dark:text-slate-200">
                <th className="text-left p-4 font-semibold w-1/3">Role</th>
                <th className="text-left p-4 font-semibold">What They Can See</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-dark-border bg-white dark:bg-dark-base">
              {[
                ['Division Personnel', 'Own submissions only'],
                ['CES Personnel', 'All submissions within their strand (SGOD / ASDS / CID)'],
                ['Admin', 'All data, audit logs, and user management'],
                ['External / Unauthorized', 'No access — system is strictly internal'],
              ].map(([role, access]) => (
                <tr key={role} className="hover:bg-slate-50/50 dark:hover:bg-dark-surface/50 transition-colors">
                  <td className="p-4 font-medium text-slate-700 dark:text-slate-300">{role}</td>
                  <td className="p-4 text-slate-500 dark:text-slate-400">{access}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30 rounded-xl text-green-800 dark:text-green-400 text-xs mt-2">
          <Shield size={20} weight="duotone" />
          <p>
            Data is <span className="font-bold">never sold, rented, or disclosed</span> to third parties outside of DepEd without explicit consent, except when required by law.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 'retention',
    icon: Clock,
    title: 'How Long We Keep It',
    content: (
      <div className="space-y-4 text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
        <p>We retain personal data only as long as logically and legally necessary:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-slate-100 dark:border-dark-border bg-white dark:bg-dark-surface shadow-sm hover:shadow-md transition-shadow">
            <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500"></span> Active accounts
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">Retained for as long as your account is active in the system.</p>
          </div>
          <div className="p-4 rounded-xl border border-slate-100 dark:border-dark-border bg-white dark:bg-dark-surface shadow-sm hover:shadow-md transition-shadow">
            <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600"></span> Deactivated accounts
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">Soft-deleted per RA 10173 §19; underlying records kept for the minimum required period.</p>
          </div>
          <div className="p-4 rounded-xl border border-slate-100 dark:border-dark-border bg-white dark:bg-dark-surface shadow-sm hover:shadow-md transition-shadow">
            <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span> AIP / PIR Submissions
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">Retained indefinitely for historical reporting and audit purposes, following government rules.</p>
          </div>
          <div className="p-4 rounded-xl border border-slate-100 dark:border-dark-border bg-white dark:bg-dark-surface shadow-sm hover:shadow-md transition-shadow">
            <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span> Audit Logs
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">Retained for a minimum of three (3) years for accountability.</p>
          </div>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-dark-surface p-3 rounded-lg">
          After the retention period, data is anonymized or securely disposed of in accordance with NPC guidelines.
        </p>
      </div>
    ),
  },
  {
    id: 'security',
    icon: Lock,
    title: 'How We Protect It',
    content: (
      <div className="space-y-4 text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
        <p>We employ enterprise-grade technical and organizational safeguards:</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { title: 'Encryption in Transit', desc: 'All data is encrypted via HTTPS/TLS.' },
            { title: 'Secure Authentication', desc: 'Short-lived JWTs via HttpOnly, Secure cookies.' },
            { title: 'Password Hashing', desc: 'Passwords hashed with bcrypt; plaintext is never stored.' },
            { title: 'Access Controls', desc: 'Strict role-based restrictions on data visibility.' },
            { title: 'Audit Logging', desc: 'Comprehensive trails of all administrative actions.' },
            { title: 'Brute-force Protection', desc: 'Login attempts are rate-limited.' },
          ].map((item, i) => (
            <div key={i} className="flex gap-3 p-3 bg-white dark:bg-dark-base rounded-lg border border-slate-100 dark:border-dark-border">
              <ShieldCheck size={18} className="text-indigo-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200 text-xs">{item.title}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 'rights',
    icon: Shield,
    title: 'Your Rights Under RA 10173',
    content: (
      <div className="space-y-4 text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
        <p>As a data subject, you hold fundamental rights under the Data Privacy Act of 2012:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { icon: Eye, right: 'Right to be Informed', desc: 'Know what data is collected and how it is used.' },
            { icon: UserCircle, right: 'Right to Access', desc: 'Request a copy of your personal data.' },
            { icon: Pencil, right: 'Right to Rectification', desc: 'Have inaccurate or incomplete data corrected.' },
            { icon: Trash, right: 'Right to Erasure', desc: 'Request deletion of unnecessary data.' },
            { icon: Download, right: 'Right to Data Portability', desc: 'Receive your data in a machine-readable format.' },
            { icon: Lock, right: 'Right to Object', desc: 'Object to processing based on legitimate interest.' },
          ].map(({ icon: Icon, right, desc }) => (
            <div key={right} className="flex gap-3 p-3 rounded-xl bg-slate-50 dark:bg-dark-surface border border-slate-100 dark:border-dark-border hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                <Icon size={16} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200 text-xs">{right}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-indigo-50 dark:bg-indigo-950/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/30 mt-4">
          <p className="text-xs text-indigo-800 dark:text-indigo-300">
            To exercise any of these rights, contact our Data Privacy Officer. We will respond within fifteen (15) working days as required by the NPC.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 'contact',
    icon: Mail,
    title: 'Data Privacy Officer & Complaints',
    content: (
      <div className="space-y-5 text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
        <p>
          For privacy concerns, data access requests, or complaints, contact the <span className="font-semibold text-slate-800 dark:text-slate-200">Data Privacy Officer</span> of DepEd Division of Guihulngan City:
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 dark:bg-indigo-900/10 rounded-bl-full -mr-4 -mt-4 z-0"></div>
            <div className="relative z-10 space-y-2">
              <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center mb-3">
                <Mail size={20} className="text-indigo-600 dark:text-indigo-400" weight="duotone" />
              </div>
              <p className="font-bold text-slate-900 dark:text-slate-100">DepEd Division of Guihulngan City</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Osmeña Avenue, City of Guihulngan, Negros Oriental</p>
              <a href={`mailto:${DPO_EMAIL}`} className="inline-block mt-2 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-semibold transition-colors">
                {DPO_EMAIL}
              </a>
            </div>
          </div>
          
          <div className="flex-1 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
             <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 dark:bg-dark-border/20 rounded-bl-full -mr-4 -mt-4 z-0"></div>
             <div className="relative z-10 space-y-2">
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-dark-border flex items-center justify-center mb-3">
                <Shield size={20} className="text-slate-600 dark:text-slate-400" weight="duotone" />
              </div>
              <p className="font-bold text-slate-900 dark:text-slate-100">National Privacy Commission</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">5F Delegation Building, PICC Complex, Pasay City, Metro Manila</p>
              <div className="flex flex-col gap-1 mt-2">
                <a href={`mailto:${NPC_EMAIL}`} className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-semibold transition-colors">
                  {NPC_EMAIL}
                </a>
                <a href="https://privacy.gov.ph" target="_blank" rel="noreferrer" className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                  privacy.gov.ph
                </a>
              </div>
            </div>
          </div>
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          If your concern is not resolved within a reasonable time, you have the right to file a formal complaint with the NPC.
        </p>
      </div>
    ),
  },
];

export default function PrivacyPolicy() {
  const [activeSection, setActiveSection] = useState(sections[0].id);
  const containerRef = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // Hero Animation
      gsap.from('.hero-animate', {
        y: 30,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power3.out',
      });

      // Abstract Card Animation
      gsap.from('.hero-card-animate', {
        scale: 0.8,
        opacity: 0,
        rotation: 10,
        duration: 1,
        ease: 'back.out(1.7)',
        delay: 0.4,
      });

      // Section Cards Scroll Animation
      gsap.utils.toArray('.section-card').forEach((card) => {
        gsap.from(card, {
          scrollTrigger: {
            trigger: card,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
          y: 40,
          opacity: 0,
          duration: 0.6,
          ease: 'power2.out',
        });
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  // Scroll spy effect
  useEffect(() => {
    const handleScroll = () => {
      const sectionElements = sections.map(s => document.getElementById(s.id));
      const scrollPosition = window.scrollY + 200; // Offset for header

      for (let i = sectionElements.length - 1; i >= 0; i--) {
        const el = sectionElements[i];
        if (el && el.offsetTop <= scrollPosition) {
          setActiveSection(sections[i].id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      window.scrollTo({
        top: el.offsetTop - 100, // Offset for sticky header
        behavior: 'smooth'
      });
    }
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-slate-50 dark:bg-dark-base flex flex-col font-sans">
      {/* Sticky Header */}
      <div className="bg-white/80 dark:bg-dark-surface/80 backdrop-blur-md border-b border-slate-200 dark:border-dark-border sticky top-0 z-50 shadow-sm transition-all">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="w-10 h-10 rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-base text-slate-600 dark:text-slate-300 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-dark-surface hover:text-indigo-600 dark:hover:text-indigo-400 transition-all shadow-sm"
            >
              <ArrowLeft size={20} weight="bold" />
            </Link>
            <div>
              <h1 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">Privacy Notice</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">DepEd Division of Guihulngan City</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1">
        {/* Engaging Hero Section */}
        <div className="relative bg-white dark:bg-dark-surface border-b border-slate-200 dark:border-dark-border overflow-hidden">
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-bl from-indigo-50/80 to-transparent dark:from-indigo-900/10 pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-100/50 dark:bg-purple-900/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="max-w-6xl mx-auto px-6 py-16 md:py-20 relative z-10">
            <div className="flex flex-col md:flex-row gap-8 items-start justify-between">
              <div className="max-w-2xl">
                <div className="hero-animate inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-bold mb-6 tracking-wide uppercase">
                  <ShieldCheck size={16} weight="fill" />
                  Data Privacy Act of 2012
                </div>
                <h1 className="hero-animate text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-4 leading-tight">
                  Your Privacy is our <br className="hidden md:block"/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">Commitment.</span>
                </h1>
                <p className="hero-animate text-slate-600 dark:text-slate-300 text-base md:text-lg leading-relaxed mb-6">
                  This notice explains how the DepEd Division of Guihulngan City collects, uses, stores, and protects your personal information when you use the AIP-PIR Portal.
                </p>
                <div className="hero-animate flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-dark-base px-3 py-1.5 rounded-lg border border-slate-200 dark:border-dark-border">
                    <Clock size={16} />
                    Effective Date: {EFFECTIVE_DATE}
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-dark-base px-3 py-1.5 rounded-lg border border-slate-200 dark:border-dark-border">
                    <Database size={16} />
                    Compliant with RA 10173
                  </div>
                </div>
              </div>
              
              {/* Abstract decorative card */}
              <div className="hero-card-animate hidden lg:flex flex-shrink-0 w-72 h-72 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl rotate-3 opacity-10 dark:opacity-20 blur-sm"></div>
                <div className="absolute inset-0 bg-white dark:bg-dark-base border border-slate-200 dark:border-dark-border rounded-3xl -rotate-3 shadow-xl flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(#4f46e5 2px, transparent 2px)', backgroundSize: '24px 24px' }}></div>
                  <Shield size={100} weight="duotone" className="text-indigo-500/80 dark:text-indigo-400/80" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Three-column Layout for Centered Content */}
        <div className="max-w-[100rem] mx-auto px-6 py-12 lg:py-16 flex flex-col lg:flex-row gap-8 lg:gap-12 relative">
          
          {/* Left Sidebar - Navigation (Sticky) */}
          <div className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-28">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-6 px-4">Table of Contents</h3>
              <div className="relative pl-1">
                {/* Subtle vertical line for tracking */}
                <div className="absolute left-[19px] top-4 bottom-4 w-[2px] bg-slate-100 dark:bg-dark-border rounded-full" />
                
                <div className="space-y-1">
                  {sections.map((section) => {
                    const isActive = activeSection === section.id;
                    const Icon = section.icon;
                    return (
                      <button
                        key={section.id}
                        onClick={() => scrollToSection(section.id)}
                        className={`relative w-full flex items-center gap-4 px-3 py-3 rounded-xl text-left text-sm font-semibold transition-colors z-10 ${
                          isActive 
                            ? 'text-indigo-700 dark:text-indigo-300' 
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="activeTOCBg"
                            className="absolute inset-0 bg-white dark:bg-dark-surface border border-indigo-100 dark:border-indigo-900/40 shadow-sm rounded-xl -z-10"
                            initial={false}
                            transition={{ type: "spring", stiffness: 400, damping: 35 }}
                          />
                        )}
                        
                        {isActive && (
                          <motion.div
                            layoutId="activeTOCLine"
                            className="absolute left-0 top-1/4 bottom-1/4 w-[4px] bg-indigo-500 rounded-r-full shadow-[0_0_8px_rgba(99,102,241,0.5)]"
                            initial={false}
                            transition={{ type: "spring", stiffness: 400, damping: 35 }}
                          />
                        )}
                        
                        <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${isActive ? 'bg-indigo-50 dark:bg-indigo-900/30' : 'bg-slate-50 dark:bg-dark-base border border-slate-100 dark:border-dark-border'}`}>
                          <Icon 
                            size={16} 
                            weight={isActive ? "duotone" : "regular"} 
                            className={`transition-colors duration-300 ${isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-slate-500"}`} 
                          />
                        </div>
                        <span className="relative z-10">{section.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Center Content - Cards */}
          <div className="flex-1 min-w-0 max-w-5xl mx-auto space-y-12">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <div key={section.id} id={section.id} className="section-card scroll-mt-28">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/40 shadow-sm">
                      <Icon size={24} className="text-indigo-600 dark:text-indigo-400" weight="duotone" />
                    </div>
                    <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">{section.title}</h2>
                  </div>
                  <div className="bg-white dark:bg-dark-surface rounded-2xl border border-slate-200 dark:border-dark-border shadow-sm p-6 md:p-8">
                    {section.content}
                  </div>
                </div>
              );
            })}
            
            {/* Amendments notice */}
            <div className="section-card mt-16 p-6 rounded-2xl bg-slate-100/50 dark:bg-dark-surface border border-slate-200 dark:border-dark-border text-center">
              <Info size={24} className="mx-auto text-slate-400 mb-2" weight="duotone" />
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
                This privacy notice may be updated from time to time to reflect changes in our legal or regulatory obligations. Material changes will be communicated through the portal. Continued use of the system after updates constitutes acceptance of the revised notice.
              </p>
            </div>
          </div>
          
          {/* Right Spacer for Centering */}
          <div className="hidden lg:block w-64 shrink-0" />
        </div>
      </div>

      <Footer />
    </div>
  );
}
