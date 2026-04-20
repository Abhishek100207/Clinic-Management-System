import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../api/auth';
import { ROLE_CONFIG } from '../../utils/roleConfig';
import OtpInput from './OtpInput';

// step: 'form' | 'otp'
const SignUpPage = () => {
  const [step, setStep]         = useState('form');
  const [userId, setUserId]     = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [role, setRole]         = useState('');
  const [otp, setOtp]           = useState('');
  const [error, setError]       = useState(null);
  const [loading, setLoading]   = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const { setAuth }             = useAuthStore();
  const navigate                = useNavigate();

  const startResendTimer = () => {
    setResendTimer(30);
    const t = setInterval(() => {
      setResendTimer(prev => { if (prev <= 1) { clearInterval(t); return 0; } return prev - 1; });
    }, 1000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!userId || !email || !password || !role) { setError('All fields are required.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      const data = await authApi.registerRequestOtp(userId, email, password, role);
      if (data.debug_otp) setError(`[DEV] OTP: ${data.debug_otp}`);
      setStep('otp');
      startResendTimer();
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Try again.');
    } finally { setLoading(false); }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError(null);
    if (otp.length < 6) { setError('Enter the complete 6-digit OTP.'); return; }
    setLoading(true);
    try {
      const res = await authApi.registerVerifyOtp(email, otp);
      setAuth(res.user, res.access);
      const cfg = ROLE_CONFIG[res.user.role];
      navigate(cfg ? cfg.dashboardRoute : '/login', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid or expired OTP.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10"
      style={{ background: 'linear-gradient(160deg,#020b18 0%,#041530 50%,#071e45 100%)' }}>

      <button onClick={() => step === 'otp' ? setStep('form') : navigate('/')}
        className="absolute top-6 left-6 flex items-center gap-2 text-white/40 hover:text-white text-sm transition-colors">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
          <path d="M19 12H5M12 5l-7 7 7 7"/>
        </svg>
        {step === 'otp' ? 'Back' : 'Home'}
      </button>

      <div className="w-full max-w-[440px]">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-900/50 mb-4"
            style={{ background: 'linear-gradient(135deg,#1d4ed8,#0ea5e9)' }}>
            <svg viewBox="0 0 24 24" fill="white" className="w-8 h-8">
              <path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zm-6 14h-2v-4H7v-2h4V7h2v4h4v2h-4v4z"/>
            </svg>
          </div>
          <p className="text-white font-black text-xl">GA Clinic</p>
          <p className="text-white/40 text-sm mt-1">
            {step === 'form' ? 'Create your staff account' : 'Verify your identity'}
          </p>
        </div>

        <div className="rounded-3xl overflow-hidden border border-white/10"
          style={{ background: 'rgba(8,22,52,0.95)', boxShadow: '0 40px 100px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.07)' }}>
          <div className="h-[2px]" style={{ background: 'linear-gradient(90deg,#1d4ed8,#0ea5e9,#a78bfa)' }} />

          {/* Step indicator */}
          <div className="flex px-8 pt-6 gap-2">
            {['Account Details', 'OTP Verify'].map((label, i) => (
              <div key={label} className="flex-1 flex flex-col gap-1">
                <div className="h-1 rounded-full transition-all duration-300"
                  style={{ background: i === 0 ? '#3b82f6' : step === 'otp' ? '#3b82f6' : 'rgba(255,255,255,0.1)' }} />
                <p className="text-white/30 text-[10px]">{label}</p>
              </div>
            ))}
          </div>

          <div className="px-8 py-6">
            {step === 'form' ? (
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                {/* User ID */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-white/50 text-xs font-semibold uppercase tracking-wider">User ID</label>
                  <input type="text" value={userId} onChange={e => setUserId(e.target.value)}
                    placeholder="e.g. dr.aryan or EMP001" autoFocus
                    className="w-full rounded-xl px-4 py-3.5 text-sm text-white outline-none border border-white/10 focus:border-blue-500/60 transition-colors placeholder-white/20"
                    style={{ background: 'rgba(255,255,255,0.05)' }} />
                </div>

                {/* Email */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-white/50 text-xs font-semibold uppercase tracking-wider">Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="you@gaclinic.com"
                    className="w-full rounded-xl px-4 py-3.5 text-sm text-white outline-none border border-white/10 focus:border-blue-500/60 transition-colors placeholder-white/20"
                    style={{ background: 'rgba(255,255,255,0.05)' }} />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-white/50 text-xs font-semibold uppercase tracking-wider">Role</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'senior_doctor', label: 'Senior Doctor', icon: '👨‍⚕️' },
                      { value: 'doctor',        label: 'Doctor',        icon: '🩺' },
                      { value: 'receptionist',  label: 'Receptionist',  icon: '🗂️' },
                      { value: 'technician',    label: 'Technician',    icon: '🔬' },
                    ].map(({ value, label, icon }) => (
                      <button key={value} type="button" onClick={() => setRole(value)}
                        className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${
                          role === value ? 'border-blue-500 text-white' : 'border-white/10 text-white/40 hover:border-white/25 hover:text-white/70'
                        }`}
                        style={{ background: role === value ? 'rgba(29,78,216,0.25)' : 'rgba(255,255,255,0.03)' }}>
                        <span>{icon}</span><span>{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Password */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-white/50 text-xs font-semibold uppercase tracking-wider">Password</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    className="w-full rounded-xl px-4 py-3.5 text-sm text-white outline-none border border-white/10 focus:border-blue-500/60 transition-colors placeholder-white/20"
                    style={{ background: 'rgba(255,255,255,0.05)' }} />
                </div>

                {/* Confirm */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-white/50 text-xs font-semibold uppercase tracking-wider">Confirm Password</label>
                  <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full rounded-xl px-4 py-3.5 text-sm text-white outline-none border border-white/10 focus:border-blue-500/60 transition-colors placeholder-white/20"
                    style={{ background: 'rgba(255,255,255,0.05)' }} />
                </div>

                {error && <ErrorBox msg={error} />}

                <button type="submit" disabled={loading}
                  className="w-full py-4 rounded-xl text-white font-bold text-sm tracking-wide hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-blue-900/40 disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg,#1d4ed8,#0ea5e9)' }}>
                  {loading ? 'Sending OTP…' : 'Continue — Get OTP →'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="flex flex-col gap-5">
                <div className="rounded-2xl px-4 py-3 text-center border border-blue-400/20"
                  style={{ background: 'rgba(29,78,216,0.1)' }}>
                  <p className="text-blue-300 text-xs">OTP sent to the email linked with <span className="font-bold text-white">{userId}</span></p>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-white/40 text-xs font-semibold uppercase tracking-wider text-center">Enter 6-digit OTP</label>
                  <OtpInput value={otp} onChange={setOtp} />
                </div>

                {error && <ErrorBox msg={error} />}

                <button type="submit" disabled={loading}
                  className="w-full py-3.5 rounded-xl text-white font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-blue-900/40 disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg,#1d4ed8,#0ea5e9)' }}>
                  {loading ? 'Verifying…' : 'Verify & Create Account →'}
                </button>

                <div className="text-center">
                  {resendTimer > 0
                    ? <p className="text-white/25 text-xs">Resend OTP in <span className="text-white/50 font-semibold">{resendTimer}s</span></p>
                    : <button type="button" onClick={async () => {
                        setOtp('');
                        try { await authApi.registerRequestOtp(userId, email, password, role); } catch {}
                        startResendTimer();
                      }} className="text-blue-400 hover:text-blue-300 text-xs font-semibold transition-colors">
                        Resend OTP
                      </button>
                  }
                </div>
              </form>
            )}

            <p className="text-center text-white/25 text-xs mt-5">
              Already have an account?{' '}
              <button onClick={() => navigate('/login')} className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">Sign In</button>
            </p>
          </div>
        </div>

        <p className="text-center text-white/15 text-xs mt-5">🔒 256-bit encrypted · HIPAA-aligned</p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

const ErrorBox = ({ msg }) => (
  <div className="flex items-start gap-2 rounded-xl px-3 py-2.5 border border-red-400/20" style={{ background: 'rgba(239,68,68,0.08)' }}>
    <svg className="w-4 h-4 text-red-400 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
    </svg>
    <p className="text-red-400 text-xs leading-relaxed">{msg}</p>
  </div>
);

export default SignUpPage;
