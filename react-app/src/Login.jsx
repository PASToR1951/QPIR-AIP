import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import anime from 'animejs';
import { AlertCircle, Loader2, ArrowRight, Eye, EyeOff, MapPin, Mail, Facebook, Phone } from 'lucide-react';

// Reusable Aceternity-style Input Component
const Input = ({ label, className = "", endIcon, ...props }) => (
    <div className="flex flex-col gap-1.5 w-full group text-left">
        {label && <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest select-none group-focus-within:text-indigo-600 transition-colors">{label}</label>}
        <div className="relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-200 to-purple-200 rounded-xl blur opacity-0 group-focus-within:opacity-50 transition duration-500"></div>
            <input 
                className={`relative w-full bg-[#fafafa] border border-slate-200 focus:border-transparent focus:ring-2 focus:ring-indigo-500/20 transition-all rounded-xl px-4 py-3 ${endIcon ? 'pr-11' : ''} text-sm text-slate-800 outline-none placeholder:text-slate-400 shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.05)] ${className}`}
                {...props}
            />
            {endIcon && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center text-slate-400 transition-colors z-10">
                    {endIcon}
                </div>
            )}
        </div>
    </div>
);

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Animation Refs
  const cardRef = useRef(null);
  const orb1Ref = useRef(null);
  const orb2Ref = useRef(null);

  useEffect(() => {
    // 1. Entrance Animation for the Main Card (Slides up and fades in)
    anime({
      targets: cardRef.current,
      translateY: [40, 0],
      opacity: [0, 1],
      duration: 1000,
      easing: 'easeOutElastic(1, .8)'
    });

    // 2. Continuous Floating Animation for the Orbs
    anime({
      targets: orb1Ref.current,
      translateY: [0, -30, 0],
      translateX: [0, 20, 0],
      scale: [1, 1.1, 1],
      duration: 6000,
      easing: 'easeInOutSine',
      loop: true
    });

    anime({
      targets: orb2Ref.current,
      translateY: [0, 40, 0],
      translateX: [0, -20, 0],
      scale: [1, 1.2, 1],
      duration: 7000,
      easing: 'easeInOutSine',
      loop: true,
      delay: 1000
    });

  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await axios.post('http://localhost:3001/api/auth/login', {
        email,
        password,
      });

      const { token, user } = response.data;
      
      // Store token and user data
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      // Redirect to dashboard/home based on role
      navigate('/');
    } catch (err) {
      // Shake animation on error
      anime({
        targets: cardRef.current,
        translateX: [
          { value: -10, duration: 50 },
          { value: 10, duration: 50 },
          { value: -10, duration: 50 },
          { value: 10, duration: 50 },
          { value: 0, duration: 50 }
        ],
        easing: 'easeInOutQuad'
      });
      setError(err.response?.data?.error || 'Failed to login. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen flex items-center justify-center relative overflow-hidden font-sans">
      {/* Background Image */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-20"
        style={{ backgroundImage: `url('/SDO_Facade.webp')` }}
      ></div>

      {/* Aceternity Grid Background overlay */}
      <div className="absolute inset-0 bg-slate-900/10 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_50%,#000_70%,transparent_110%)] pointer-events-none z-10"></div>
      
      {/* Glowing Orbs (Animated with Anime.js) */}
      <div ref={orb1Ref} className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-400/30 rounded-full blur-[100px] pointer-events-none z-0"></div>
      <div ref={orb2Ref} className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-400/30 rounded-full blur-[100px] pointer-events-none z-0"></div>

      <div className="relative z-30 container mx-auto px-6 flex flex-col items-center justify-center min-h-screen py-12 pb-32">
        <div ref={cardRef} className="bg-[#fafafa]/90 border border-slate-200 rounded-[2rem] p-8 md:p-12 shadow-2xl text-center max-w-md w-full mx-auto ring-1 ring-slate-900/5 backdrop-blur-md mb-8 opacity-0">
          
          <div className="mb-8 flex justify-center items-center gap-6">
            <img src="/Division_Logo.webp" alt="Division Logo" className="h-20 w-auto drop-shadow-sm" />
          </div>
          
          <h2 className="text-3xl font-extrabold tracking-tighter text-slate-900 pb-2">
            QPIR-AIP System
          </h2>
          <p className="text-slate-500 font-medium mb-8 text-sm px-4">
            Sign in to access your dashboard
          </p>

          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="text-red-600 text-sm font-semibold text-center bg-red-50 border border-red-100 p-3 rounded-xl flex items-center justify-center gap-2">
                <AlertCircle size={16} strokeWidth={2.5} />
                {error}
              </div>
            )}
            
            <div className="space-y-5">
              <Input
                label="Email Address"
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="e.g. 120233@deped.gov.ph"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              
              <Input
                label="Password"
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                endIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="focus:outline-none hover:text-indigo-600 focus:text-indigo-600 flex items-center justify-center p-1"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-8 group relative w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={16} strokeWidth={2.5} />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight size={16} strokeWidth={2.5} className="transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Full-width Footer Bar */}
      <footer className="absolute bottom-0 w-full bg-[#fafafa]/90 backdrop-blur-md border-t border-slate-200 py-4 sm:py-5 z-40">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center md:items-start justify-between text-slate-500 text-xs gap-4">
          <div className="flex flex-col items-center md:items-start gap-2.5">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <a href="https://www.deped.gov.ph/transparency/" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity" title="Transparency Seal">
                <img src="/transparency-seal.webp" alt="Transparency Seal" className="h-10 w-auto opacity-90" />
              </a>
              <div className="hidden sm:block h-8 w-px bg-slate-300 mx-1"></div>
              <div className="flex items-center gap-3">
                <a href="https://www.deped.gov.ph/" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity" title="Department of Education">
                  <img src="/DepEd_Seal.webp" alt="DepEd Seal" className="h-10 w-auto drop-shadow-sm" />
                </a>
                <a href="https://depednir.net/" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity" title="DepEd Negros Island Region">
                  <img src="/DepEd NIR Logo.webp" alt="DepEd NIR Logo" className="h-10 w-auto drop-shadow-sm" />
                </a>
                <a href="https://depedguihulngan.ph/" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity" title="Division of Guihulngan City">
                  <img src="/Division_Logo.webp" alt="Division Logo" className="h-10 w-auto drop-shadow-sm" />
                </a>
              </div>
            </div>
            <div className="text-slate-400 font-medium mt-1 md:mt-0">
              © {new Date().getFullYear()} All rights reserved. DepEd Guihulngan City Division.
            </div>
          </div>
          
          <div className="flex flex-col items-center md:items-end gap-2.5 text-slate-400 font-medium">
            <div className="flex items-center gap-8 mt-2 md:mt-0">
               <span className="font-semibold text-slate-600">Contact Us:</span>
               <div className="flex items-center gap-4">
                 <a href="mailto:guihulngan.city@deped.gov.ph" className="hover:text-indigo-600 transition-colors" title="guihulngan.city@deped.gov.ph">
                   <Mail size={16} />
                 </a>
                 <a href="https://www.facebook.com/DepedGuihulnganCity" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 transition-colors" title="Facebook Page">
                   <Facebook size={16} />
                 </a>
               </div>
            </div>
            <div className="flex flex-col items-center md:items-end gap-1.5">
              <div className="flex items-center gap-1.5">
                <MapPin size={12} className="shrink-0" />
                <span className="text-center md:text-right">Osmeña Avenue, Poblacion, City of Guihulngan, Negros Oriental, 6214</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-500">
                <Phone size={12} className="shrink-0" />
                <span className="text-center md:text-right">(035) 410-4069, (035) 410-4066, 0956-964-7346 (calls only)</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}