import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../../api/auth';
import { useAuthStore } from '../../store/authStore';

const ChangePasswordPage = ({ forced = false }) => {
  const [current, setCurrent]   = useState('');
  const [newPass, setNewPass]   = useState('');
  const [confirm, setConfirm]   = useState('');
  const [error, setError]       = useState(null);
  const [success, setSuccess]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const { user, setAuth, accessToken } = useAuthStore();
  const navigate                = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!current || !newPass || !confirm) { setError('All fields are required.'); return; }
    if (newPass !== confirm) { setError('New passwords do not match.'); return; }
    if (newPass.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      await authApi.changePassword(current, newPass, confirm);
      // Update local user state — clear must_change_password flag
      setAuth({ ...user, must_change_password: false }, accessToken);
      setSuccess(true);
      setTimeout(() => navigate(-1), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong.');
    } finally { setLoading(false); }
  };

  const strength = newPass.length === 0 ? 0 : newPass.length < 6 ? 1 : newPass.length < 10 ? 2 : 3;
  const strengthLabel = ['', 'Weak', 'Good', 'Strong'];
  const strengthColor = ['', '#ef4444', '#f59e0b', '#10b981'];

  return (
    <div className="max-w-md mx-auto w-full px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        {!forced && (
          <button onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl flex items-center justify-center border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-all">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
          </button>
        )}
        <div>
          <h1 className="text-white font-black text-2xl">
            {forced ? '🔐 Set Your Password' : 'Change Password'}
          </h1>
          <p className="text-white/40 text-sm mt-0.5">
            {forced
              ? 'Your account was created by a doctor. Please set a new password before continuing.'
              : 'Update your account password'}
          </p>
        </div>
      </div>

      {/* Forced banner */}
      {forced && (
        <div className="mb-6 rounded-2xl px-4 py-3 border border-amber-400/20 flex items-start gap-3"
          style={{ background: 'rgba(245,158,11,0.08)' }}>
          <svg className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
          </svg>
          <p className="text-amber-300 text-sm leading-relaxed">
            You received login credentials from your doctor. For security, you must change your password now.
          </p>
        </div>
      )}

      <div className="rounded-3xl overflow-hidden border border-white/10"
        style={{ background: 'rgba(8,22,52,0.95)', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
        <div className="h-[2px]" style={{ background: 'linear-gradient(90deg,#1d4ed8,#0ea5e9,#a78bfa)' }} />

        <div className="px-7 py-7">
          {success ? (
            <div className="flex flex-col items-center py-8 gap-4 text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
                style={{ background: 'rgba(16,185,129,0.15)', border: '2px solid rgba(16,185,129,0.3)' }}>
                ✓
              </div>
              <p className="text-white font-bold text-lg">Password changed!</p>
              <p className="text-white/40 text-sm">Redirecting you back…</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {/* Current password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-white/40 text-xs font-semibold uppercase tracking-wider">
                  {forced ? 'Temporary Password (given by doctor)' : 'Current Password'}
                </label>
                <input type="password" value={current} onChange={e => setCurrent(e.target.value)}
                  placeholder="••••••••" autoFocus
                  className="w-full rounded-xl px-4 py-3.5 text-sm text-white outline-none border border-white/10 focus:border-blue-500/60 transition-colors placeholder-white/20"
                  style={{ background: 'rgba(255,255,255,0.05)' }} />
              </div>

              {/* New password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-white/40 text-xs font-semibold uppercase tracking-wider">New Password</label>
                <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="w-full rounded-xl px-4 py-3.5 text-sm text-white outline-none border border-white/10 focus:border-blue-500/60 transition-colors placeholder-white/20"
                  style={{ background: 'rgba(255,255,255,0.05)' }} />
                {/* Strength bar */}
                {newPass.length > 0 && (
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex gap-1 flex-1">
                      {[1,2,3].map(i => (
                        <div key={i} className="flex-1 h-1 rounded-full transition-all duration-300"
                          style={{ background: i <= strength ? strengthColor[strength] : 'rgba(255,255,255,0.1)' }} />
                      ))}
                    </div>
                    <span className="text-xs font-semibold" style={{ color: strengthColor[strength] }}>
                      {strengthLabel[strength]}
                    </span>
                  </div>
                )}
              </div>

              {/* Confirm */}
              <div className="flex flex-col gap-1.5">
                <label className="text-white/40 text-xs font-semibold uppercase tracking-wider">Confirm New Password</label>
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                  placeholder="Re-enter new password"
                  className={`w-full rounded-xl px-4 py-3.5 text-sm text-white outline-none border transition-colors placeholder-white/20 ${
                    confirm && newPass !== confirm ? 'border-red-500/60' : 'border-white/10 focus:border-blue-500/60'
                  }`}
                  style={{ background: 'rgba(255,255,255,0.05)' }} />
                {confirm && newPass !== confirm && (
                  <p className="text-red-400 text-xs mt-0.5">Passwords don't match</p>
                )}
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-xl px-3 py-2.5 border border-red-400/20"
                  style={{ background: 'rgba(239,68,68,0.08)' }}>
                  <svg className="w-4 h-4 text-red-400 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                  </svg>
                  <p className="text-red-400 text-xs">{error}</p>
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full py-3.5 rounded-xl text-white font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-blue-900/40 disabled:opacity-60 mt-1"
                style={{ background: 'linear-gradient(135deg,#1d4ed8,#0ea5e9)' }}>
                {loading ? 'Updating…' : 'Update Password →'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordPage;
