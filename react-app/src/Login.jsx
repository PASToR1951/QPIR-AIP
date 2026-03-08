import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import anime from 'animejs';
import { AlertCircle, Loader2, ArrowRight, Eye, EyeOff, MapPin, Mail, Facebook, Phone } from 'lucide-react';
import { Input } from './components/ui/Input';

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

    // Auto-append domain if not present
    const finalEmail = email.includes('@') ? email : `${email}@deped.gov.ph`;

    try {
      const apiHost = window.location.hostname;
      const response = await axios.post(`http://${apiHost}:3001/api/auth/login`, {
        email: finalEmail,
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
    <div className="bg-slate-50 min-h-[100svh] flex flex-col items-center justify-center relative font-sans overflow-x-hidden">
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

      {/* Main Content Area */}
      <div className="relative z-30 container mx-auto px-6 flex flex-col items-center justify-center flex-1 w-full py-8 md:py-12 md:pb-32">
        <div ref={cardRef} className="bg-[#fafafa]/90 border border-slate-200 rounded-[2rem] p-8 md:p-12 shadow-2xl text-center max-w-md w-full mx-auto ring-1 ring-slate-900/5 backdrop-blur-md opacity-0">

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
                theme="indigo"
                label="Email Address"
                id="email-address"
                name="email"
                type="text"
                autoComplete="email"
                required
                placeholder="email@deped.gov.ph"
                className="lowercase"
                value={email}
                onChange={(e) => setEmail(e.target.value.toLowerCase())}
              />

              <Input
                theme="indigo"
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

      {/* Optimized Pilled Mobile Footer */}
      <footer className="md:absolute md:bottom-0 w-full z-40 p-4 md:p-0">
        <div className="container mx-auto max-w-6xl md:bg-[#fafafa]/90 md:backdrop-blur-md md:border-t md:border-slate-200 py-8 md:py-8 bg-white/90 backdrop-blur-xl border border-slate-200 rounded-[2.5rem] md:rounded-none shadow-xl shadow-slate-200/50 md:shadow-none">
          <div className="grid grid-cols-1 md:grid-cols-2 items-center md:items-start gap-8 md:gap-y-6 text-slate-500 text-xs px-6">
            
            {/* 1. Logos - Mobile: 1st, Desktop: Col 1 Top */}
            <div className="flex items-center justify-center md:justify-start gap-3 md:gap-4 order-1">
              <a href="https://www.deped.gov.ph/transparency/" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
                <img src="/transparency-seal.webp" alt="Transparency Seal" className="h-8 md:h-10 w-auto opacity-90" />
              </a>
              <div className="h-6 md:h-8 w-px bg-slate-300"></div>
              <div className="flex items-center gap-2 md:gap-3">
                <a href="https://www.deped.gov.ph/" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
                  <img src="/DepEd_Seal.webp" alt="DepEd Seal" className="h-8 md:h-10 w-auto drop-shadow-sm" />
                </a>
                <a href="https://depednir.net/" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
                  <img src="/DepEd NIR Logo.webp" alt="DepEd NIR Logo" className="h-8 md:h-10 w-auto drop-shadow-sm" />
                </a>
                <a href="https://depedguihulngan.ph/" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
                  <img src="/Division_Logo.webp" alt="Division Logo" className="h-8 md:h-10 w-auto drop-shadow-sm" />
                </a>
              </div>
            </div>

            {/* 2. Social Media Pilled Buttons - Mobile: 2nd, Desktop: Col 2 Top */}
            <div className="flex items-center justify-center md:justify-end gap-3 order-2">
              <a href="mailto:guihulngan.city@deped.gov.ph" className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-[10px] font-bold text-slate-600 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm">
                <Mail size={14} />
                <span>Email Us</span>
              </a>
              <a href="https://www.facebook.com/DepedGuihulnganCity" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-[10px] font-bold text-slate-600 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm">
                <Facebook size={14} />
                <span>Facebook</span>
              </a>
            </div>

            {/* 3. Address & Contact Numbers - Mobile: 3rd, Desktop: Col 2 Bottom */}
            <div className="flex flex-col items-center md:items-end gap-1 order-3 md:order-4 text-[10px] text-slate-400 font-medium">
              <div className="flex items-center gap-1.5 text-center md:text-right">
                <MapPin size={12} className="shrink-0 text-slate-300" />
                <span>Osmeña Avenue, City of Guihulngan, Negros Oriental</span>
              </div>
              <div className="flex items-center gap-1.5 text-center md:text-right">
                <Phone size={12} className="shrink-0 text-slate-300" />
                <span>(035) 410-4069 • 0956-964-7346</span>
              </div>
            </div>

            {/* 4. Copyright - Mobile: 4th, Desktop: Col 1 Bottom */}
            <div className="text-slate-400 font-normal text-center md:text-left tracking-tight order-4 md:order-3 text-[9px]">
              © {new Date().getFullYear()} DepEd Division of Guihulngan City. <br className="md:hidden"/> All rights reserved.
            </div>

          </div>
        </div>
      </footer>
    </div>
  );
}