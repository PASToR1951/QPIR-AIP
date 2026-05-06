import { Link } from 'react-router-dom';
import { useAppLogo } from '../../context/BrandingContext.jsx';
import { EnvelopeIcon as Mail, FacebookLogoIcon as Facebook, MapPinIcon as MapPin, PhoneIcon as Phone, ArrowUpRight } from '@phosphor-icons/react';
import { CURRENT_VERSION } from '../../version';

const Footer = () => {
  const appLogo = useAppLogo();
  return (
    <footer className="mt-auto relative overflow-hidden bg-slate-50 dark:bg-dark-base border-t border-slate-200/60 dark:border-dark-border/40">
      {/* Dynamic Background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-[0.15] dark:opacity-20 mix-blend-luminosity"
        style={{ backgroundImage: `url('/SDO_Facade.webp')`, backgroundPosition: 'center 30%' }}
      />
      {/* Gradients & Glows */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-slate-50/95 to-slate-100 dark:from-dark-base dark:via-dark-base/95 dark:to-dark-surface/90" />
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/5 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-amber-500/10 dark:bg-amber-500/5 blur-3xl rounded-full pointer-events-none" />
      
      {/* Noise Texture */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: 0.03,
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23g)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '180px 180px',
        }}
      />

      <div className="max-w-7xl mx-auto px-6 py-16 md:py-20 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 mb-16">
          {/* Column 1: Branding & Logos (Spans 5 cols) */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left lg:col-span-5">
            <div className="flex items-center gap-3 mb-8 p-3 bg-white/40 dark:bg-white/5 rounded-2xl ring-1 ring-slate-200/50 dark:ring-white/10 backdrop-blur-md shadow-sm">
              <a href="#" onClick={(e) => e.preventDefault()} className="group relative">
                <div className="absolute inset-0 bg-indigo-500/20 dark:bg-indigo-400/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <img src={appLogo} alt="AIP-PIR Logo" className="h-14 w-auto relative z-10 transition-transform duration-500 group-hover:scale-105" />
              </a>
              <div className="h-10 w-px bg-gradient-to-b from-transparent via-slate-300 dark:via-slate-700 to-transparent mx-2 hidden sm:block"></div>
              <a href="https://www.deped.gov.ph/" target="_blank" rel="noopener noreferrer" className="group relative hidden sm:block">
                <img src="/DepEd_Seal.webp" alt="DepEd Seal" className="h-12 w-auto transition-all duration-500 group-hover:scale-110 group-hover:-rotate-6 drop-shadow-sm group-hover:drop-shadow-md" />
              </a>
              <a href="https://depednir.net/" target="_blank" rel="noopener noreferrer" className="group relative hidden sm:block">
                <img src="/DepEd NIR Logo.webp" alt="DepEd NIR Logo" className="h-12 w-auto transition-all duration-500 group-hover:scale-110 drop-shadow-sm group-hover:drop-shadow-md" />
              </a>
              <a href="https://depedguihulngan.ph/" target="_blank" rel="noopener noreferrer" className="group relative hidden sm:block">
                <img src="/Division_Logo.webp" alt="Division Logo" className="h-12 w-auto transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 drop-shadow-sm group-hover:drop-shadow-md" />
              </a>
            </div>
            
            <div className="space-y-3">
              <h3 className="font-black text-slate-900 dark:text-white tracking-tight text-xl md:text-2xl bg-clip-text text-transparent bg-gradient-to-br from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
                Schools Division of Guihulngan City
              </h3>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </span>
                <p className="text-xs font-bold text-indigo-700 dark:text-indigo-300 tracking-widest uppercase">AIP-PIR Portal</p>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed max-w-md mt-2 font-medium">
                Standardizing the Quality Program Implementation and Review process. Empowering education through data-driven decisions and transparent tracking.
              </p>
            </div>
          </div>

          {/* Spacer column */}
          <div className="hidden lg:block lg:col-span-2"></div>

          {/* Column 2: Contact (Spans 5 cols) */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left lg:col-span-5">
            <h4 className="font-extrabold text-slate-900 dark:text-white text-sm uppercase tracking-widest mb-6 flex items-center gap-2">
              <span className="w-8 h-px bg-indigo-500/50"></span>
              Get in Touch
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
              {/* Address */}
              <a
                href="https://www.google.com/maps/search/?api=1&query=Osme%C3%B1a+Avenue+City+of+Guihulngan+Negros+Oriental"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col items-center md:items-start gap-2 p-4 rounded-2xl bg-white/50 dark:bg-dark-surface/50 border border-slate-200/60 dark:border-dark-border/60 hover:bg-white dark:hover:bg-dark-surface hover:border-indigo-200 dark:hover:border-indigo-900/50 hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-300"
              >
                <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/20 transition-all duration-300">
                  <MapPin size={20} weight="duotone" />
                </div>
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 tracking-widest uppercase mt-1">Location</span>
                <span className="text-slate-700 dark:text-slate-300 text-sm font-semibold group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  Osmeña Avenue, City of Guihulngan, Negros Oriental
                </span>
              </a>

              {/* Contact Links */}
              <div className="flex flex-col gap-3">
                <div className="group flex flex-col items-center md:items-start gap-1 p-4 rounded-2xl bg-white/50 dark:bg-dark-surface/50 border border-slate-200/60 dark:border-dark-border/60 hover:bg-white dark:hover:bg-dark-surface hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all duration-300">
                  <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/20 transition-all duration-300 mb-1">
                    <Phone size={20} weight="duotone" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 tracking-widest uppercase">Phone</span>
                  <span className="text-slate-700 dark:text-slate-300 text-sm font-semibold">(035) 410-4069</span>
                  <span className="text-slate-700 dark:text-slate-300 text-sm font-semibold">0956-964-7346</span>
                </div>
              </div>
            </div>

            {/* Social / Email Actions */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-6 w-full md:justify-start">
              <a href="mailto:guihulngan.city@deped.gov.ph" className="group flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-sm font-bold hover:bg-indigo-600 dark:hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-500/25 transition-all duration-300">
                <Mail size={18} weight="duotone" className="group-hover:animate-bounce" />
                <span>Email SDO</span>
              </a>
              <a href="https://www.facebook.com/DepedGuihulnganCity" target="_blank" rel="noopener noreferrer" className="group flex items-center justify-center gap-2 px-5 py-2.5 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border text-slate-700 dark:text-slate-200 rounded-xl text-sm font-bold hover:bg-[#1877F2]/10 hover:border-[#1877F2]/30 hover:text-[#1877F2] dark:hover:bg-[#1877F2]/20 dark:hover:border-[#1877F2]/50 dark:hover:text-[#4294ff] transition-all duration-300">
                <Facebook size={18} weight="fill" className="text-[#1877F2] dark:text-[#4294ff] group-hover:scale-110 transition-transform" />
                <span>Facebook</span>
                <ArrowUpRight size={14} className="opacity-50 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="relative pt-8 flex flex-col items-center md:flex-row md:justify-between gap-6 text-center">
          {/* Subtle separator line */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-dark-border to-transparent" />
          
          <p className="text-slate-500 dark:text-slate-500 text-sm font-medium">
            © {new Date().getFullYear()} <span className="font-semibold text-slate-700 dark:text-slate-400">DepEd Division of Guihulngan City</span>. All rights reserved.
          </p>
          
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 bg-white/40 dark:bg-dark-surface/40 p-1.5 rounded-full ring-1 ring-slate-200/50 dark:ring-dark-border/50 backdrop-blur-sm">
            <Link to="/docs" className="px-4 py-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-full transition-all duration-300">Docs</Link>
            <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></div>
            <Link to="/privacy" className="px-4 py-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-full transition-all duration-300">Privacy</Link>
            <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></div>
            <Link to="/changelog" className="px-4 py-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all duration-300 shadow-sm">v{CURRENT_VERSION}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
