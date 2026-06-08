import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authApi } from '../../api/auth';


const ROLES = [
  { value: 'receptionist', label: 'Receptionist',       icon: '🗂️', desc: 'Manages appointments & billing' },
  { value: 'technician',   label: 'X-ray Technician',   icon: '🔬', desc: 'Handles scans & lab reports' },
  { value: 'doctor',       label: 'Junior Doctor',       icon: '🩺', desc: 'Assists with consultations' },
];

const AddStaffPage = () => {
  const navigate              = useNavigate();
  const location              = useLocation();
  const [form, setForm]       = useState({ username: '', email: '', first_name: '', last_name: '', password: '', role: '' });
  const [confirm, setConfirm] = useState('');
  const [error, setError]     = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [staffList, setStaffList] = useState([]);

  useEffect(() => {
    if (location.state && location.state.role) {
      setForm(f => ({ ...f, role: location.state.role }));
    }
  }, [location.state]);

  useEffect(() => {
    authApi.listStaff().then(setStaffList).catch(() => {});
  }, [success]);


  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null); setSuccess(null);
    if (!form.username || !form.email || !form.password || !form.role) { setError('All fields are required.'); return; }
    if (form.password !== confirm) { setError('Passwords do not match.'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      const res = await authApi.addStaff(form);
      setSuccess(`✓ ${res.detail}`);
      setForm({ username: '', email: '', first_name: '', last_name: '', password: '', role: '' });
      setConfirm('');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong.');
    } finally { setLoading(false); }
  };

  const roleColors = { receptionist: '#10b981', technician: '#f59e0b', doctor: '#3b82f6' };

  return (
    <div className="max-w-5xl mx-auto w-full px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-xl flex items-center justify-center border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-all">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
        <div>
          <h1 className="text-white font-black text-2xl">Add Staff Member</h1>
          <p className="text-white/40 text-sm mt-0.5">Create accounts for Receptionists, Technicians, and Junior Doctors</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="rounded-3xl overflow-hidden border border-white/10"
          style={{ background: 'rgba(8,22,52,0.95)', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
          <div className="h-[2px]" style={{ background: 'linear-gradient(90deg,#1d4ed8,#0ea5e9,#a78bfa)' }} />
          <div className="px-7 py-7">
            <h2 className="text-white font-bold text-lg mb-6">New Staff Account</h2>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Role picker */}
              <div className="flex flex-col gap-2">
                <label className="text-white/40 text-xs font-semibold uppercase tracking-wider">Role</label>
                <div className="flex flex-col gap-2">
                  {ROLES.map(({ value, label, icon, desc }) => (
                    <button key={value} type="button" onClick={() => set('role', value)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                        form.role === value ? 'border-blue-500 text-white' : 'border-white/10 text-white/40 hover:border-white/25 hover:text-white/70'
                      }`}
                      style={{ background: form.role === value ? `rgba(${value === 'doctor' ? '59,130,246' : value === 'receptionist' ? '16,185,129' : '245,158,11'},0.15)` : 'rgba(255,255,255,0.03)' }}>
                      <span className="text-xl">{icon}</span>
                      <div>
                        <p className="text-sm font-bold">{label}</p>
                        <p className="text-xs opacity-60">{desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Name row */}
              <div className="grid grid-cols-2 gap-3">
                {[['first_name','First Name','John'],['last_name','Last Name','Smith']].map(([k,lbl,ph]) => (
                  <div key={k} className="flex flex-col gap-1.5">
                    <label className="text-white/40 text-xs font-semibold uppercase tracking-wider">{lbl}</label>
                    <input type="text" value={form[k]} onChange={e => set(k, e.target.value)} placeholder={ph}
                      className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none border border-white/10 focus:border-blue-500/60 transition-colors placeholder-white/20"
                      style={{ background: 'rgba(255,255,255,0.05)' }} />
                  </div>
                ))}
              </div>

              {/* Username & Email */}
              {[['username','User ID','e.g. dr.john'],['email','Email','john@gaclinic.com']].map(([k,lbl,ph]) => (
                <div key={k} className="flex flex-col gap-1.5">
                  <label className="text-white/40 text-xs font-semibold uppercase tracking-wider">{lbl}</label>
                  <input type={k === 'email' ? 'email' : 'text'} value={form[k]} onChange={e => set(k, e.target.value)} placeholder={ph}
                    className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none border border-white/10 focus:border-blue-500/60 transition-colors placeholder-white/20"
                    style={{ background: 'rgba(255,255,255,0.05)' }} />
                </div>
              ))}

              {/* Password */}
              <div className="grid grid-cols-2 gap-3">
                {[['password','Password'],['confirm','Confirm']].map(([k,lbl]) => (
                  <div key={k} className="flex flex-col gap-1.5">
                    <label className="text-white/40 text-xs font-semibold uppercase tracking-wider">{lbl}</label>
                    <input type="password"
                      value={k === 'confirm' ? confirm : form.password}
                      onChange={e => k === 'confirm' ? setConfirm(e.target.value) : set('password', e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none border border-white/10 focus:border-blue-500/60 transition-colors placeholder-white/20"
                      style={{ background: 'rgba(255,255,255,0.05)' }} />
                  </div>
                ))}
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-xl px-3 py-2.5 border border-red-400/20" style={{ background: 'rgba(239,68,68,0.08)' }}>
                  <svg className="w-4 h-4 text-red-400 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                  </svg>
                  <p className="text-red-400 text-xs">{error}</p>
                </div>
              )}

              {success && (
                <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 border border-emerald-400/20" style={{ background: 'rgba(16,185,129,0.08)' }}>
                  <p className="text-emerald-400 text-xs font-semibold">{success}</p>
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full py-3.5 rounded-xl text-white font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-blue-900/40 disabled:opacity-60 mt-1"
                style={{ background: 'linear-gradient(135deg,#1d4ed8,#0ea5e9)' }}>
                {loading ? 'Creating Account…' : 'Create Staff Account →'}
              </button>
            </form>
          </div>
        </div>

        {/* Staff list */}
        <div className="rounded-3xl overflow-hidden border border-white/10"
          style={{ background: 'rgba(8,22,52,0.95)', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
          <div className="h-[2px]" style={{ background: 'linear-gradient(90deg,#1d4ed8,#0ea5e9,#a78bfa)' }} />
          <div className="px-7 py-7">
            <h2 className="text-white font-bold text-lg mb-6">Current Staff</h2>
            {staffList.length === 0 ? (
              <p className="text-white/30 text-sm text-center py-8">No staff members yet.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {staffList.map(s => (
                  <div key={s.id} className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-white/8"
                    style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm text-white shrink-0"
                      style={{ background: `${roleColors[s.role] || '#6366f1'}33`, border: `1px solid ${roleColors[s.role] || '#6366f1'}55` }}>
                      {(s.full_name || s.email)?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-semibold truncate">{s.full_name || s.email}</p>
                      <p className="text-white/35 text-xs truncate">{s.email}</p>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full shrink-0"
                      style={{ background: `${roleColors[s.role] || '#6366f1'}22`, color: roleColors[s.role] || '#a78bfa', border: `1px solid ${roleColors[s.role] || '#6366f1'}44` }}>
                      {s.role.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddStaffPage;
