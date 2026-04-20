import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../api/auth';
import { ROLE_CONFIG } from '../../utils/roleConfig';

/* ── Modal Shell ── */
const Modal = ({ onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
    style={{ background: 'rgba(2,11,24,0.90)', backdropFilter: 'blur(10px)' }}
    onClick={onClose}>
    <div className="w-full max-w-[420px] rounded-3xl overflow-hidden border border-white/10"
      style={{ background: 'rgba(8,22,52,0.98)', boxShadow: '0 40px 100px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.07)' }}
      onClick={e => e.stopPropagation()}>
      <div className="h-[2px]" style={{ background: 'linear-gradient(90deg,#1d4ed8,#0ea5e9,#a78bfa)' }} />
      {children}
    </div>
  </div>
);

/* ── Sign In Modal ── */
const SignInModal = ({ onClose, onGoogleSuccess }) => {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState(null);

  return (
    <Modal onClose={onClose}>
      <div className="px-8 pt-7 pb-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-white text-2xl font-black">Welcome back</h2>
            <p className="text-white/40 text-sm mt-1">Sign in to your account</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition-all">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <form onSubmit={e => { e.preventDefault(); setError('Email/password login coming soon. Use Google below.'); }} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-white/40 text-xs font-semibold uppercase tracking-wider">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@gaclinic.com"
              className="w-full rounded-xl px-4 py-3.5 text-sm text-white outline-none border border-white/10 focus:border-blue-500/60 transition-colors placeholder-white/20"
              style={{ background: 'rgba(255,255,255,0.05)' }} />
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <label className="text-white/40 text-xs font-semibold uppercase tracking-wider">Password</label>
              <button type="button" className="text-xs text-blue-400 hover:text-blue-300">Forgot?</button>
            </div>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
              className="w-full rounded-xl px-4 py-3.5 text-sm text-white outline-none border border-white/10 focus:border-blue-500/60 transition-colors placeholder-white/20"
              style={{ background: 'rgba(255,255,255,0.05)' }} />
          </div>
          {error && <p className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-xl px-3 py-2.5">{error}</p>}
          <button type="submit" className="w-full py-3.5 rounded-xl text-white font-bold text-sm mt-1 hover:opacity-90 active:scale-[0.98] transition-all"
            style={{ background: 'linear-gradient(135deg,#1d4ed8,#0ea5e9)' }}>Sign In →</button>
        </form>
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-white/25 text-xs">or</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>
        <div className="flex justify-center">
          <GoogleLogin onSuccess={onGoogleSuccess} onError={() => setError('Google sign-in failed.')}
            useOneTap={false} shape="rectangular" theme="filled_blue" size="large" text="signin_with" width="320" />
        </div>
        <p className="text-center text-white/20 text-xs mt-5">
          No account?{' '}
          <button onClick={onClose} className="text-blue-400 hover:text-blue-300 font-semibold">Sign Up</button>
        </p>
      </div>
    </Modal>
  );
};

/* ── Sign Up Modal ── */
const SignUpModal = ({ onClose, onGoogleSuccess }) => {
  const [error, setError] = useState(null);
  return (
    <Modal onClose={onClose}>
      <div className="px-8 pt-7 pb-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-white text-2xl font-black">Create account</h2>
            <p className="text-white/40 text-sm mt-1">Join GA Clinic portal</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition-all">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <form onSubmit={e => { e.preventDefault(); setError('Self-registration is disabled. Accounts are created by the admin. Use Google sign-in if you already have a clinic account.'); }} className="flex flex-col gap-4">
          {[['Full Name','text','Dr. John Smith'],['Work Email','email','you@gaclinic.com'],['Password','password','••••••••']].map(([lbl,type,ph]) => (
            <div key={lbl} className="flex flex-col gap-1.5">
              <label className="text-white/40 text-xs font-semibold uppercase tracking-wider">{lbl}</label>
              <input type={type} placeholder={ph}
                className="w-full rounded-xl px-4 py-3.5 text-sm text-white outline-none border border-white/10 focus:border-blue-500/60 transition-colors placeholder-white/20"
                style={{ background: 'rgba(255,255,255,0.05)' }} />
            </div>
          ))}
          <div className="flex flex-col gap-1.5">
            <label className="text-white/40 text-xs font-semibold uppercase tracking-wider">Role</label>
            <select className="w-full rounded-xl px-4 py-3.5 text-sm text-white/60 outline-none border border-white/10 focus:border-blue-500/60 transition-colors appearance-none"
              style={{ background: 'rgba(255,255,255,0.05)' }}>
              <option value="" style={{ background: '#081634' }}>Select role</option>
              {['Senior Doctor','Doctor','Receptionist','Technician'].map(r => <option key={r} style={{ background: '#081634' }}>{r}</option>)}
            </select>
          </div>
          {error && <p className="text-amber-300 text-xs bg-amber-400/10 border border-amber-400/20 rounded-xl px-3 py-2.5 leading-relaxed">{error}</p>}
          <button type="submit" className="w-full py-3.5 rounded-xl text-white font-bold text-sm mt-1 hover:opacity-90 active:scale-[0.98] transition-all"
            style={{ background: 'linear-gradient(135deg,#1d4ed8,#0ea5e9)' }}>Create Account →</button>
        </form>
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-white/25 text-xs">or sign up with</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>
        <div className="flex justify-center">
          <GoogleLogin onSuccess={onGoogleSuccess} onError={() => {}}
            useOneTap={false} shape="rectangular" theme="filled_blue" size="large" text="signup_with" width="320" />
        </div>
        <p className="text-center text-white/20 text-xs mt-5">
          Already have an account?{' '}
          <button onClick={onClose} className="text-blue-400 hover:text-blue-300 font-semibold">Sign In</button>
        </p>
      </div>
    </Modal>
  );
};

/* ── Main Landing Page ── */
const LoginPage = () => {
  const [modal, setModal]   = useState(null);
  const { setAuth }         = useAuthStore();
  const navigate            = useNavigate();
  const location            = useLocation();

  const handleGoogleSuccess = async (cred) => {
    try {
      const res  = await authApi.googleLogin(cred.credential);
      setAuth(res.user, res.access);
      const cfg  = ROLE_CONFIG[res.user.role];
      const from = location.state?.from?.pathname || (cfg ? cfg.dashboardRoute : '/login');
      navigate(from, { replace: true });
    } catch { /* error shown inside modal */ }
    finally { setModal(null); }
  };

  const services = [
    {
      icon: '🗓️',
      title: 'Book Appointments',
      desc: 'Schedule consultations with our doctors instantly. Choose your preferred time slot and specialist.',
      color: '#1d4ed8',
      light: 'rgba(29,78,216,0.12)',
      border: 'rgba(29,78,216,0.3)',
    },
    {
      icon: '💊',
      title: 'Prescriptions',
      desc: 'Access and manage your prescriptions digitally. Get refills and track your medication history.',
      color: '#7c3aed',
      light: 'rgba(124,58,237,0.12)',
      border: 'rgba(124,58,237,0.3)',
    },
    {
      icon: '🔬',
      title: 'Lab & Tests',
      desc: 'Book diagnostic tests, view reports online, and share results directly with your doctor.',
      color: '#0891b2',
      light: 'rgba(8,145,178,0.12)',
      border: 'rgba(8,145,178,0.3)',
    },
  ];

  const stats = [['2000+','Patients Treated'],['15+','Specialist Doctors'],['50+','Lab Tests'],['99%','Satisfaction Rate']];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(160deg,#020b18 0%,#041530 50%,#071e45 100%)' }}>

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-40 flex items-center justify-between px-6 lg:px-12 py-4 border-b border-white/8"
        style={{ background: 'rgba(4,21,48,0.92)', backdropFilter: 'blur(20px)' }}>
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
            style={{ background: 'linear-gradient(135deg,#1d4ed8,#0ea5e9)' }}>
            <svg viewBox="0 0 24 24" fill="white" className="w-6 h-6">
              <path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zm-6 14h-2v-4H7v-2h4V7h2v4h4v2h-4v4z"/>
            </svg>
          </div>
          <div>
            <p className="text-white font-black text-lg leading-none">GA Clinic</p>
            <p className="text-blue-400 text-[10px] uppercase tracking-widest font-medium">Healthcare</p>
          </div>
        </div>

        {/* Nav links — desktop */}
        <div className="hidden md:flex items-center gap-8">
          {['Services','Doctors','Lab & Tests','About'].map(l => (
            <a key={l} href="#" className="text-white/50 hover:text-white text-sm font-medium transition-colors">{l}</a>
          ))}
        </div>

        {/* Auth buttons */}
        <div className="flex items-center gap-3">
          <button onClick={() => setModal('signin')}
            className="px-5 py-2 rounded-full text-white/70 text-sm font-semibold border border-white/15 hover:border-white/35 hover:text-white transition-all bg-white/5">
            Sign In
          </button>
          <button onClick={() => setModal('signup')}
            className="px-5 py-2 rounded-full text-white text-sm font-semibold hover:opacity-90 transition-all shadow-lg shadow-blue-900/40"
            style={{ background: 'linear-gradient(135deg,#1d4ed8,#0ea5e9)' }}>
            Sign Up
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative flex flex-col items-center justify-center text-center px-6 py-24 lg:py-32 overflow-hidden">
        {/* subtle grid bg */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.5) 1px,transparent 1px)', backgroundSize: '60px 60px' }} />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-blue-500/15 border border-blue-400/20 rounded-full px-4 py-1.5 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            <span className="text-blue-300 text-xs font-semibold uppercase tracking-widest">Your Health, Our Priority</span>
          </div>

          <h1 className="text-white font-black text-5xl lg:text-7xl leading-[1.05] mb-6">
            Quality Healthcare<br />
            <span style={{ background: 'linear-gradient(90deg,#60a5fa,#38bdf8,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              At Your Fingertips.
            </span>
          </h1>

          <p className="text-white/50 text-lg lg:text-xl leading-relaxed mb-10 max-w-xl mx-auto">
            Book appointments, access prescriptions, and get lab results — all in one secure platform built for GA Clinic patients and staff.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => setModal('signup')}
              className="px-8 py-4 rounded-2xl text-white font-bold text-base hover:opacity-90 active:scale-[0.98] transition-all shadow-xl shadow-blue-900/50"
              style={{ background: 'linear-gradient(135deg,#1d4ed8,#0ea5e9)' }}>
              Get Started — It's Free
            </button>
            <button onClick={() => setModal('signin')}
              className="px-8 py-4 rounded-2xl text-white/70 font-bold text-base border border-white/15 hover:border-white/30 hover:text-white transition-all bg-white/5">
              Sign In to Dashboard
            </button>
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <div className="border-y border-white/8 px-6 py-6" style={{ background: 'rgba(255,255,255,0.02)' }}>
        <div className="max-w-4xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
          {stats.map(([val, lbl]) => (
            <div key={lbl}>
              <p className="text-white font-black text-3xl">{val}</p>
              <p className="text-white/35 text-sm mt-1">{lbl}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Services ── */}
      <section className="px-6 lg:px-12 py-20 max-w-6xl mx-auto w-full">
        <div className="text-center mb-14">
          <p className="text-blue-400 text-xs font-semibold uppercase tracking-widest mb-3">What We Offer</p>
          <h2 className="text-white font-black text-4xl lg:text-5xl">Our Services</h2>
          <p className="text-white/40 text-lg mt-4 max-w-xl mx-auto">Everything you need for your healthcare journey, in one place.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {services.map(({ icon, title, desc, color, light, border }) => (
            <div key={title} className="rounded-3xl p-8 border transition-all duration-300 hover:-translate-y-1 cursor-pointer group"
              style={{ background: light, borderColor: border }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-6"
                style={{ background: `rgba(${color === '#1d4ed8' ? '29,78,216' : color === '#7c3aed' ? '124,58,237' : '8,145,178'},0.2)`, border: `1px solid ${border}` }}>
                {icon}
              </div>
              <h3 className="text-white font-black text-xl mb-3">{title}</h3>
              <p className="text-white/45 text-sm leading-relaxed mb-6">{desc}</p>
              <button onClick={() => setModal('signin')}
                className="text-sm font-bold transition-colors flex items-center gap-1 group-hover:gap-2"
                style={{ color }}>
                Get Started <span>→</span>
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="px-6 lg:px-12 py-20 border-t border-white/8" style={{ background: 'rgba(255,255,255,0.02)' }}>
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-blue-400 text-xs font-semibold uppercase tracking-widest mb-3">Simple Process</p>
          <h2 className="text-white font-black text-4xl mb-14">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              ['01', 'Create Account', 'Sign up with your email or Google account in under a minute.'],
              ['02', 'Book a Service', 'Choose from appointments, prescriptions, or lab tests.'],
              ['03', 'Get Care', 'Visit the clinic or access your results online — it\'s that simple.'],
            ].map(([num, title, desc]) => (
              <div key={num} className="flex flex-col items-center">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl text-white mb-5"
                  style={{ background: 'linear-gradient(135deg,#1d4ed8,#0ea5e9)' }}>{num}</div>
                <h3 className="text-white font-bold text-lg mb-2">{title}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="px-6 lg:px-12 py-16">
        <div className="max-w-4xl mx-auto rounded-3xl p-10 lg:p-14 text-center border border-blue-500/20"
          style={{ background: 'linear-gradient(135deg,rgba(29,78,216,0.2),rgba(8,145,178,0.15))' }}>
          <h2 className="text-white font-black text-3xl lg:text-4xl mb-4">Ready to get started?</h2>
          <p className="text-white/50 text-lg mb-8">Join thousands of patients who trust GA Clinic for their healthcare needs.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => setModal('signup')}
              className="px-8 py-4 rounded-2xl text-white font-bold hover:opacity-90 active:scale-[0.98] transition-all shadow-xl shadow-blue-900/50"
              style={{ background: 'linear-gradient(135deg,#1d4ed8,#0ea5e9)' }}>
              Create Free Account
            </button>
            <button onClick={() => setModal('signin')}
              className="px-8 py-4 rounded-2xl text-white/70 font-bold border border-white/15 hover:border-white/30 hover:text-white transition-all bg-white/5">
              Sign In
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/8 px-6 lg:px-12 py-8 mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#1d4ed8,#0ea5e9)' }}>
              <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4">
                <path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zm-6 14h-2v-4H7v-2h4V7h2v4h4v2h-4v4z"/>
              </svg>
            </div>
            <span className="text-white/60 text-sm font-semibold">GA Clinic</span>
          </div>
          <p className="text-white/25 text-xs">© 2026 GA Clinic · All rights reserved · 🔒 HIPAA-aligned</p>
          <div className="flex gap-6">
            {['Privacy','Terms','Contact'].map(l => (
              <a key={l} href="#" className="text-white/30 hover:text-white/60 text-xs transition-colors">{l}</a>
            ))}
          </div>
        </div>
      </footer>

      {/* Modals */}
      {modal === 'signin' && <SignInModal onClose={() => setModal(null)} onGoogleSuccess={handleGoogleSuccess} />}
      {modal === 'signup' && <SignUpModal onClose={() => setModal(null)} onGoogleSuccess={handleGoogleSuccess} />}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default LoginPage;
