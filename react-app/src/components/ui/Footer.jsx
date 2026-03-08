import React from 'react';
import { Mail, Facebook, MapPin, Phone } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-transparent mt-auto px-4 pb-8 md:pb-0">
      <div className="max-w-6xl mx-auto bg-white border border-slate-200 rounded-[3rem] p-8 md:p-12 md:rounded-none md:border-0 md:border-t md:bg-white shadow-xl shadow-slate-200/50 md:shadow-none">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          {/* Column 1: Branding & Logos */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <div className="flex items-center gap-3 mb-6">
              <a href="https://www.deped.gov.ph/transparency/" target="_blank" rel="noopener noreferrer" className="transition-all hover:scale-105">
                <img src="/transparency-seal.webp" alt="Transparency Seal" className="h-10 w-auto opacity-80 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-300" />
              </a>
              <div className="h-8 w-px bg-slate-200"></div>
              <a href="https://www.deped.gov.ph/" target="_blank" rel="noopener noreferrer" className="transition-all hover:scale-105">
                <img src="/DepEd_Seal.webp" alt="DepEd Seal" className="h-10 w-auto drop-shadow-sm grayscale hover:grayscale-0 transition-all duration-300" />
              </a>
              <a href="https://depednir.net/" target="_blank" rel="noopener noreferrer" className="transition-all hover:scale-105">
                <img src="/DepEd NIR Logo.webp" alt="DepEd NIR Logo" className="h-10 w-auto drop-shadow-sm grayscale hover:grayscale-0 transition-all duration-300" />
              </a>
              <a href="https://depedguihulngan.ph/" target="_blank" rel="noopener noreferrer" className="transition-all hover:scale-105">
                <img src="/Division_Logo.webp" alt="Division Logo" className="h-10 w-auto drop-shadow-sm grayscale hover:grayscale-0 transition-all duration-300" />
              </a>
            </div>
            <h3 className="font-black text-slate-900 tracking-tighter uppercase text-sm mb-2">
              DepEd Division of <br/> Guihulngan City
            </h3>
            <p className="text-xs font-bold text-blue-600 tracking-widest uppercase mb-4">QPIR-AIP Portal</p>
            <p className="text-slate-400 text-xs font-medium max-w-xs leading-relaxed">
              Standardizing the Quality Program Implementation and Review process for all schools in the Division of Guihulngan City.
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <h4 className="font-black text-slate-900 text-xs uppercase tracking-widest mb-6">Quick Links</h4>
            <ul className="space-y-3">
              <li><a href="/" className="text-slate-500 hover:text-pink-600 text-sm font-bold transition-colors">Dashboard Home</a></li>
              <li><a href="/aip" className="text-slate-500 hover:text-pink-600 text-sm font-bold transition-colors">AIP Submission</a></li>
              <li><a href="/pir" className="text-slate-500 hover:text-pink-600 text-sm font-bold transition-colors">Quarterly Review</a></li>
              <li><a href="#" className="text-slate-500 hover:text-pink-600 text-sm font-bold transition-colors">Privacy Policy</a></li>
            </ul>
          </div>

          {/* Column 3: Contact */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <h4 className="font-black text-slate-900 text-xs uppercase tracking-widest mb-6">Connect with us</h4>
            <div className="space-y-5">
              <div className="flex flex-col gap-1.5 items-center md:items-start">
                <span className="text-[10px] uppercase font-black text-slate-400 tracking-tighter flex items-center gap-1.5">
                  <MapPin size={12} className="text-slate-300" /> Office Address
                </span>
                <span className="text-slate-600 text-xs font-bold leading-relaxed max-w-[200px]">Osmeña Avenue, City of Guihulngan, Negros Oriental</span>
              </div>
              <div className="flex flex-col gap-1.5 items-center md:items-start">
                <span className="text-[10px] uppercase font-black text-slate-400 tracking-tighter flex items-center gap-1.5">
                  <Phone size={12} className="text-slate-300" /> Contact Numbers
                </span>
                <span className="text-slate-600 text-xs font-bold">(035) 410-4069 • (035) 410-4066<br/>0956-964-7346</span>
              </div>
              
              <div className="flex items-center gap-3 pt-2">
                <a href="mailto:guihulngan.city@deped.gov.ph" className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-[10px] font-bold text-slate-600 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm">
                  <Mail size={14} />
                  <span>Email Us</span>
                </a>
                <a href="https://www.facebook.com/DepedGuihulnganCity" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-[10px] font-bold text-slate-600 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm">
                  <Facebook size={14} />
                  <span>Facebook</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Banner */}
        <div className="border-t border-slate-100 pt-8 flex flex-col items-center md:flex-row md:justify-between gap-4 text-center">
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
            © {new Date().getFullYear()} DepEd Division of Guihulngan City. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">v1.2.0 Stable Build</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;