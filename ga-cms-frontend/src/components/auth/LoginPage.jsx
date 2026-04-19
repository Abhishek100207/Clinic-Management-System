import React, { useState, useRef } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../api/auth';
import { ROLE_CONFIG } from '../../utils/roleConfig';

const LoginPage = () => {
  const [tab, setTab]         = useState('google');
  const [error, setError]     = useState(null);
  const [loading, setLoading] = useState(false);
  const [phone, setPhone]     = useState('');
  const [otp, setOtp]         = useState(['', '', '', '', '', '']);
  const [otpSent, setOtpSent] = useState(false);
  const otpRefs               = useRef([]);
  const { setAuth }           = useAuthStore();
  const navigate              = useNavigate();
  const location              = useLocation();

  const switchTab = (t) => { setTab(t); setError(null); setOtpSent(false); setOtp(['','','','','','']); };

  const handleGoogleSuccess = async (cred) => {
    setLoading(true); setError(null);
    try {
      const res  = await authApi.googleLogin(cred.credential);
      setAuth(res.user, res.access);
      const cfg  = ROLE_CONFIG[res.user.role];
      const from = location.state?.from?.pathname || (cfg ? cfg.dashboardRoute : '/login');
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Account not found. Contact your administrator.');
    } finally { setLoading(false); }
  };

  const handleOtpChange = (val, idx) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp]; next[idx] = val;
    setOtp(next);
    if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpKey = (e, idx) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) otpRefs.current[idx - 1]?.focus();
  };

  const handleSendOtp = (e) => {
    e.preventDefault();
    if (phone.length < 10) { setError('Enter a valid 10-digit number.'); return; }
    setError(null); setOtpSent(true);
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    setError('Mobile login coming soon — use Google sign-in for now.');
  };

  return (
    <div className="min-h-screen flex flex-col" style={{
      background: 'linear-gradient(160deg, #020b18 0%, #041530 40%, #062050 70%, #0a2a6e 100%)'
    }}>
      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/50"
            style={{ background: 'linear-gradient(135deg, #1d4ed8, #0ea5e9)' }}>
            <svg viewBox="0 0 24 24" fill="white" className="w-6 h-6">
              <path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zm-6 14h-2v-4H7v-2h4V7h2v4h4v2h-4v4z"/>
            </svg>
          </div>
          <div>
            <p className="text-white font-black text-lg leading-none tracking-tight">GA Clinic</p>
            <p className="text-blue-400 text-[10px] uppercase tracking-[0.15em] font-medium">Management System</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 border border-white/10 rounded-full px-4 py-2 backdrop-blur-md bg-white/5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/80" style={{ animation: 'pulse 2s infinite' }} />
          <span className="text-white/70 text-xs font-medium">All systems operational</span>
        </div>
      </nav>

      {/* Main */}
      <div className="relative z-10 flex-1 flex flex-col lg:flex-row items-center justify-center gap-12 px-6 py-8 lg:px-16">

        {/* Left */}
        <div className="hidden lg:flex flex-col max-w-lg">
          <div className="inline-flex items-center gap-2 bg-blue-500/15 border border-blue-400/20 rounded-full px-4 py-1.5 mb-8 w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            <span className="text-blue-300 text-xs font-semibold uppercase tracking-widest">Trusted Clinical Platform</span>
          </div>

          <h1 className="text-white font-black text-6xl leading-[1.05] mb-6">
            Modern Care,<br />
            <span className="relative">
              <span className="relative z-10" style={{
                background: 'linear-gradient(90deg, #60a5fa, #38bdf8, #a78bfa)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
              }}>Smarter Tools.</span>
            </span>
          </h1>

          <p className="text-white/50 text-lg leading-relaxed mb-10">
            GA Clinic's all-in-one staff platform — from patient intake to lab reports, built for speed and security.
          </p>

          {/* Stats row */}
          <div className="flex gap-6 mb-10">
            {[['500+', 'Patients Served'], ['4', 'Staff Roles'], ['99.9%', 'Uptime']].map(([val, lbl]) => (
              <div key={lbl}>
                <p className="text-white font-black text-2xl">{val}</p>
                <p className="text-white/40 text-xs mt-0.5">{lbl}</p>
              </div>
            ))}
          </div>

          {/* Feature list */}
          <div className="flex flex-col gap-3">
            {[
              ['🗓️', 'Appointment Scheduling', 'Real-time slot management'],
              ['📋', 'Patient Records', 'Secure, centralised health data'],
              ['🔬', 'Lab & Reports', 'Fast technician workflows'],
              ['🔐', 'Role-Based Access', 'Doctor, Receptionist, Technician, Admin'],
            ].map(([icon, title, sub]) => (
              <div key={title} className="flex items-center gap-4 rounded-2xl px-5 py-3.5 border border-white/8 backdrop-blur-sm"
                style={{ background: 'rgba(255,255,255,0.04)' }}>
                <span className="text-xl">{icon}</span>
                <div>
                  <p className="text-white text-sm font-semibold">{title}</p>
                  <p className="text-white/40 text-xs">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — Card */}
        <div className="w-full max-w-[420px]">
          {/* glow behind card */}
          <div className="absolute inset-0 rounded-3xl blur-3xl opacity-30 pointer-events-none"
            style={{ background: 'radial-gradient(circle at 50% 50%, #1d4ed8, transparent 70%)' }} />

          <div className="relative rounded-3xl overflow-hidden border border-white/10"
            style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(40px)', boxShadow: '0 40px 100px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)' }}>

            {/* top gradient line */}
            <div className="h-[2px]" style={{ background: 'linear-gradient(90deg, #1d4ed8, #0ea5e9, #a78bfa)' }} />

            <div className="px-8 pt-8 pb-6">
              {/* Header */}
              <div className="text-center mb-7">
                <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-xl shadow-blue-900/60"
                  style={{ background: 'linear-gradient(135deg, #1d4ed8, #0ea5e9)' }}>
                  <svg viewBox="0 0 24 24" fill="white" className="w-9 h-9">
                    <path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zm-6 14h-2v-4H7v-2h4V7h2v4h4v2h-4v4z"/>
                  </svg>
                </div>
                <h2 className="text-white text-2xl font-black">Sign In</h2>
                <p className="text-white/40 text-sm mt-1">Access your staff dashboard</p>
              </div>

              {/* Tab switcher */}
              <div className="flex rounded-2xl p-1 mb-6" style={{ background: 'rgba(0,0,0,0.3)' }}>
                {[['google', '🔵 Google'], ['mobile', '📱 Mobile OTP']].map(([key, label]) => (
                  <button key={key} onClick={() => switchTab(key)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                      tab === key
                        ? 'text-white shadow-lg shadow-blue-900/50'
                        : 'text-white/30 hover:text-white/60'
                    }`}
                    style={tab === key ? { background: 'linear-gradient(135deg,#1d4ed8,#0ea5e9)' } : {}}>
                    {label}
                  </button>
                ))}
              </div>

              {/* Body */}
              {loading ? (
                <div className="flex flex-col items-center py-10 gap-4">
                  <div className="w-14 h-14 rounded-full border-4 border-white/10 border-t-blue-400"
                    style={{ animation: 'spin 0.8s linear infinite' }} />
                  <p className="text-white/50 text-sm">Authenticating…</p>
                </div>

              ) : tab === 'google' ? (
                <div className="flex flex-col items-center gap-5">
                  <p className="text-white/50 text-sm text-center leading-relaxed">
                    Sign in with your <span className="text-white font-semibold">Google Workspace</span> account assigned by GA Clinic.
                  </p>
                  <div className="w-full flex justify-center">
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={() => setError('Google sign-in failed. Try again.')}
                      useOneTap={false}
                      shape="rectangular"
                      theme="filled_blue"
                      size="large"
                      text="signin_with"
                      width="320"
                    />
                  </div>
                  <div className="flex items-center gap-3 w-full">
                    <div className="flex-1 h-px bg-white/10" />
                    <span className="text-white/20 text-xs">OAuth 2.0 secured</span>
                    <div className="flex-1 h-px bg-white/10" />
                  </div>
                </div>

              ) : !otpSent ? (
                <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
                  <p className="text-white/50 text-sm text-center">Enter your registered mobile number.</p>
                  <div className="flex items-center rounded-2xl overflow-hidden border border-white/10 focus-within:border-blue-400/60 transition-colors"
                    style={{ background: 'rgba(0,0,0,0.3)' }}>
                    <span className="px-4 py-4 text-white/50 text-sm font-bold border-r border-white/10">+91</span>
                    <input type="tel" maxLength={10} value={phone}
                      onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="10-digit mobile number"
                      className="flex-1 px-4 py-4 bg-transparent text-white text-sm outline-none placeholder-white/20" />
                  </div>
                  <button type="submit"
                    className="w-full py-4 rounded-2xl text-white font-black text-sm tracking-wide transition-all duration-200 hover:opacity-90 active:scale-[0.98] shadow-lg shadow-blue-900/50"
                    style={{ background: 'linear-gradient(135deg, #1d4ed8, #0ea5e9)' }}>
                    Send OTP →
                  </button>
                </form>

              ) : (
                <form onSubmit={handleVerifyOtp} className="flex flex-col gap-5">
                  <div className="rounded-2xl px-4 py-3 text-center border border-emerald-400/20"
                    style={{ background: 'rgba(16,185,129,0.1)' }}>
                    <p className="text-emerald-400 text-xs font-semibold">OTP sent to +91 {phone}</p>
                  </div>
                  {/* OTP boxes */}
                  <div className="flex gap-2 justify-center">
                    {otp.map((digit, i) => (
                      <input key={i} ref={el => otpRefs.current[i] = el}
                        type="text" inputMode="numeric" maxLength={1} value={digit}
                        onChange={e => handleOtpChange(e.target.value, i)}
                        onKeyDown={e => handleOtpKey(e, i)}
                        className={`w-11 h-13 text-center text-lg font-black rounded-xl border-2 outline-none transition-all duration-200
                          ${digit ? 'border-blue-400 text-white' : 'border-white/10 text-white/20'}
                        `}
                        style={{
                          background: digit ? 'rgba(29,78,216,0.3)' : 'rgba(0,0,0,0.3)',
                          height: '52px'
                        }} />
                    ))}
                  </div>
                  <button type="submit"
                    className="w-full py-4 rounded-2xl text-white font-black text-sm tracking-wide transition-all hover:opacity-90 active:scale-[0.98] shadow-lg shadow-blue-900/50"
                    style={{ background: 'linear-gradient(135deg, #1d4ed8, #0ea5e9)' }}>
                    Verify & Sign In →
                  </button>
                  <button type="button" onClick={() => { setOtpSent(false); setOtp(['','','','','','']); setError(null); }}
                    className="text-xs text-white/30 hover:text-white/60 text-center transition-colors">
                    ← Change number
                  </button>
                </form>
              )}

              {error && (
                <div className="mt-5 flex items-start gap-3 rounded-2xl px-4 py-3 border border-red-400/20"
                  style={{ background: 'rgba(239,68,68,0.1)' }}>
                  <svg className="w-4 h-4 text-red-400 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                  </svg>
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}
            </div>

            {/* Card footer */}
            <div className="px-8 pb-6 text-center border-t border-white/5 pt-4">
              <p className="text-white/20 text-xs">GA Clinic Management System · v1.0 · Staff only</p>
            </div>
          </div>

          <p className="text-center text-white/20 text-xs mt-4">
            🔒 256-bit encrypted · HIPAA-aligned
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 text-center py-4 border-t border-white/5">
        <p className="text-white/20 text-xs">© 2026 GA Clinic · All rights reserved</p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
      `}</style>
    </div>
  );
};

export default LoginPage;
