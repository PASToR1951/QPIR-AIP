import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAppLogo } from '../../context/BrandingContext.jsx';
import { EnvelopeIcon as Mail, FacebookLogoIcon as Facebook, MapPinIcon as MapPin, PhoneIcon as Phone } from '@phosphor-icons/react';
import { CURRENT_VERSION } from '../../version';

const Footer = () => {
  const appLogo = useAppLogo();
  const footerRef = useRef(null);

  useEffect(() => {
    const el = footerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(([entry]) => {
      const event = new CustomEvent('footer-visibility-change', { detail: entry.isIntersecting });
      window.dispatchEvent(event);
    }, { root: null, threshold: 0 });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <footer ref={footerRef} className="mt-auto relative overflow-hidden">
      {/* Facade Background */}
      <div
        className="absolute inset-0 bg-cover bg-no-repeat"
        style={{ backgroundImage: `url('/SDO_Facade.webp')`, backgroundPosition: 'center 35%' }}
      />
      {/* Dark overlay for legibility */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/90 via-slate-950/92 to-slate-950/96" />
      {/* Top accent line */}
      <div className="absolute top-0 inset-x-0 h-px bg-white/10" />

      <div className="max-w-7xl mx-auto px-6 py-14 md:py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-12 mb-12">
          {/* Branding */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left lg:col-span-6">
            <div className="flex items-center gap-4 mb-6">
              <img src={appLogo} alt="AIP-PIR Logo" className="h-12 w-auto" />
              <div className="h-8 w-px bg-white/15 hidden sm:block" />
              <a href="https://www.deped.gov.ph/" target="_blank" rel="noopener noreferrer" className="hidden sm:block opacity-90 hover:opacity-100 transition-opacity">
                <img src="/DepEd_Seal.webp" alt="DepEd Seal" className="h-10 w-auto" />
              </a>
              <a href="https://depednir.net/" target="_blank" rel="noopener noreferrer" className="hidden sm:block opacity-90 hover:opacity-100 transition-opacity">
                <img src="/DepEd NIR Logo.webp" alt="DepEd NIR Logo" className="h-10 w-auto" />
              </a>
              <a href="https://depedguihulngan.ph/" target="_blank" rel="noopener noreferrer" className="hidden sm:block opacity-90 hover:opacity-100 transition-opacity">
                <img src="/Division_Logo.webp" alt="Division Logo" className="h-10 w-auto" />
              </a>
            </div>

            <h3 className="font-bold text-white tracking-tight text-lg md:text-xl mb-2">
              Schools Division of Guihulngan City
            </h3>
            <p className="text-slate-400 text-[11px] uppercase tracking-[0.18em] font-semibold mb-4">
              AIP-PIR Portal
            </p>
            <p className="text-slate-300 text-sm leading-relaxed max-w-md">
              Standardizing the Quality Program Implementation and Review process. Empowering education through data-driven decisions and transparent tracking.
            </p>
          </div>

          {/* Contact */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left lg:col-span-6">
            <h4 className="font-semibold text-white text-[11px] uppercase tracking-[0.18em] mb-5">
              Get in Touch
            </h4>

            <ul className="space-y-3 w-full text-left">
              <li>
                <a
                  href="https://www.google.com/maps/search/?api=1&query=Osme%C3%B1a+Avenue+City+of+Guihulngan+Negros+Oriental"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-slate-300 hover:text-white transition-colors group"
                >
                  <MapPin size={16} weight="regular" className="text-slate-500 group-hover:text-slate-300 transition-colors flex-shrink-0" />
                  <span className="text-sm">Osmeña Avenue, City of Guihulngan, Negros Oriental</span>
                </a>
              </li>
              <li className="flex items-center gap-3 text-slate-300">
                <Phone size={16} weight="regular" className="text-slate-500 flex-shrink-0" />
                <span className="text-sm">(035) 410-4069 · 0956-964-7346</span>
              </li>
              <li>
                <a
                  href="mailto:guihulngan.city@deped.gov.ph"
                  className="flex items-center gap-3 text-slate-300 hover:text-white transition-colors group"
                >
                  <Mail size={16} weight="regular" className="text-slate-500 group-hover:text-slate-300 transition-colors flex-shrink-0" />
                  <span className="text-sm">guihulngan.city@deped.gov.ph</span>
                </a>
              </li>
              <li>
                <a
                  href="https://www.facebook.com/DepedGuihulnganCity"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-slate-300 hover:text-white transition-colors group"
                >
                  <Facebook size={16} weight="regular" className="text-slate-500 group-hover:text-slate-300 transition-colors flex-shrink-0" />
                  <span className="text-sm">facebook.com/DepedGuihulnganCity</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-white/10 flex flex-col items-center md:flex-row md:justify-between gap-4 text-center">
          <p className="text-slate-400 text-xs">
            © {new Date().getFullYear()} DepEd Division of Guihulngan City. All rights reserved.
          </p>

          <div className="flex items-center gap-5 text-xs">
            <Link to="/docs" className="text-slate-400 hover:text-white transition-colors font-medium">Docs</Link>
            <Link to="/privacy" className="text-slate-400 hover:text-white transition-colors font-medium">Privacy</Link>
            <Link to="/changelog" className="text-slate-400 hover:text-white transition-colors font-medium">v{CURRENT_VERSION}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
