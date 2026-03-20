import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Facebook, MapPin, Phone } from 'lucide-react';
import { CURRENT_VERSION } from '../../version';
import { useAccessibility } from '../../context/AccessibilityContext';

const Footer = () => {
  const { settings } = useAccessibility();
  const isDark = settings.darkMode;
  return (
    <>
    <footer
      className="mt-auto relative"
      style={{
        '--s': '150px',
        '--c1': isDark ? '#16213E' : '#fdfdfd',
        '--c2': isDark ? '#1A1A2E' : '#fafafa',
        '--_g': 'var(--c1) 0% 5%, var(--c2) 6% 15%, var(--c1) 16% 25%, var(--c2) 26% 35%, var(--c1) 36% 45%, var(--c2) 46% 55%, var(--c1) 56% 65%, var(--c2) 66% 75%, var(--c1) 76% 85%, var(--c2) 86% 95%, #0000 96%',
        background: `
          radial-gradient(50% 50% at 100% 0, var(--_g)),
          radial-gradient(50% 50% at 0 100%, var(--_g)),
          radial-gradient(50% 50%, var(--_g)),
          radial-gradient(50% 50%, var(--_g)) calc(var(--s)/2) calc(var(--s)/2)
          var(--c1)
        `,
        backgroundSize: 'var(--s) var(--s)',
      }}
    >
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-slate-50 dark:from-slate-900 to-transparent pointer-events-none" />
      <div className="max-w-7xl mx-auto px-6 py-12 md:py-16 relative">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 mb-12">
          {/* Column 1: Branding & Logos */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left lg:col-span-2">
            <div className="flex items-center gap-4 mb-6">
              <a href="#" onClick={(e) => e.preventDefault()} className="transition-transform hover:scale-105">
                <img src="/AIP-PIR_logo.svg" alt="AIP-PIR Logo" className="h-12 w-auto drop-shadow-sm transition-all duration-300 hover:drop-shadow-md" />
              </a>
              <div className="h-10 w-px bg-slate-200 dark:bg-dark-border/60 mx-2 hidden sm:block"></div>
              <a href="https://www.deped.gov.ph/" target="_blank" rel="noopener noreferrer" className="transition-transform hover:scale-105 hidden sm:block">
                <img src="/DepEd_Seal.webp" alt="DepEd Seal" className="h-12 w-auto drop-shadow-sm transition-all duration-300 hover:drop-shadow-md" />
              </a>
              <a href="https://depednir.net/" target="_blank" rel="noopener noreferrer" className="transition-transform hover:scale-105 hidden sm:block">
                <img src="/DepEd NIR Logo.webp" alt="DepEd NIR Logo" className="h-12 w-auto drop-shadow-sm transition-all duration-300 hover:drop-shadow-md" />
              </a>
              <a href="https://depedguihulngan.ph/" target="_blank" rel="noopener noreferrer" className="transition-transform hover:scale-105 hidden sm:block">
                <img src="/Division_Logo.webp" alt="Division Logo" className="h-12 w-auto drop-shadow-sm transition-all duration-300 hover:drop-shadow-md" />
              </a>
            </div>
            <h3 className="font-extrabold text-slate-900 dark:text-slate-100 tracking-tight text-lg mb-1">
              DepEd Division of Guihulngan City
            </h3>
            <p className="text-sm font-bold text-indigo-600 tracking-wide uppercase mb-3">AIP-PIR Portal</p>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed max-w-lg">
              Tracking of Education Programs: Program Implementation Review System. Standardizing the Quality Program Implementation and Review process for all schools in the Division of Guihulngan City.
            </p>
          </div>

          {/* Column 2: Contact */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm uppercase tracking-wider mb-6">Contact Us</h4>
            <div className="space-y-4">
              <div className="flex flex-col gap-1 items-center md:items-start">
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 tracking-wider uppercase flex items-center gap-1.5">
                  <MapPin size={14} className="text-slate-400 dark:text-slate-500" /> Office Address
                </span>
                <span className="text-slate-600 dark:text-slate-300 text-sm font-medium">Osmeña Avenue, City of Guihulngan, <br className="hidden md:block"/>Negros Oriental</span>
              </div>
              <div className="flex flex-col gap-1 items-center md:items-start">
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 tracking-wider uppercase flex items-center gap-1.5">
                  <Phone size={14} className="text-slate-400 dark:text-slate-500" /> Phone Numbers
                </span>
                <span className="text-slate-600 dark:text-slate-300 text-sm font-medium">(035) 410-4069 • (035) 410-4066<br />0956-964-7346</span>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <a href="mailto:guihulngan.city@deped.gov.ph" className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-lg text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-all shadow-sm">
                  <Mail size={16} />
                  <span>Email</span>
                </a>
                <a href="https://www.facebook.com/DepedGuihulnganCity" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-lg text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-all shadow-sm">
                  <Facebook size={16} />
                  <span>Facebook</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Banner */}
        <div className="border-t border-slate-200 dark:border-dark-border pt-8 flex flex-col items-center md:flex-row md:justify-between gap-6 text-center">
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
            © {new Date().getFullYear()} DepEd Division of Guihulngan City. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link to="/docs" className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest hover:text-indigo-600 transition-colors cursor-pointer">Docs</Link>
            <Link to="/changelog" className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-slate-100 dark:bg-dark-border px-3 py-1 rounded-full hover:bg-indigo-100 hover:text-indigo-600 transition-colors cursor-pointer">v{CURRENT_VERSION}</Link>
            <a href="https://www.deped.gov.ph/transparency/" target="_blank" rel="noopener noreferrer" className="transition-transform hover:scale-105">
              <img src="/transparency-seal.webp" alt="Transparency Seal" className="h-12 w-auto drop-shadow-sm" />
            </a>
          </div>
        </div>
      </div>
    </footer>
    </>
  );
};

export default Footer;