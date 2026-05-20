import React, { useState, useEffect } from 'react';
import { LogOut, KeyRound, User, ChevronDown, Menu, X, Phone, MapPin, Droplets, ShieldAlert, Fingerprint } from 'lucide-react';
import { useNavigate, NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../api/auth';
import { Badge } from '../shared/Badge';
import { ROLE_CONFIG } from '../../utils/roleConfig';
import api from '../../api/axios';
import useUnreadCount from '../../hooks/useUnreadCount';

const TopNav = () => {
  const { user, logout } = useAuthStore();
  const roleConfig = user?.role ? ROLE_CONFIG[user.role] : null;
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [patientProfile, setPatientProfile] = useState(null);

  useEffect(() => {
    const fetchPatientProfile = async () => {
      if (user?.role === 'patient') {
        try {
          const res = await api.get('/api/users/patients/');
          const patientData = Array.isArray(res.data) ? res.data : (res.data.results ?? []);
          if (patientData.length > 0) {
            setPatientProfile(patientData[0]);
          }
        } catch (err) {
          console.error("Failed to fetch patient profile in nav", err);
        }
      }
    };
    fetchPatientProfile();
  }, [user]);

  const { totalUnread } = useUnreadCount();
  const unreadChatCount = totalUnread;

  const handleLogout = async () => {
    try { await authApi.logout(); } catch (e) { console.error(e); }
    finally { logout(); window.location.href = '/login'; }
  };

  const navLinks = roleConfig?.navLinks || [];

  return (
    <>
      {/* First-login password change banner */}
      {user?.must_change_password && (
        <div className="bg-amber-500 text-white px-6 py-2.5 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className="text-lg">🔐</span>
            <span className="font-semibold">Action required:</span>
            <span>You received this account from your doctor. Please change your password.</span>
          </div>
          <button onClick={() => navigate('/change-password')}
            className="ml-4 bg-white text-amber-600 font-bold text-xs px-4 py-1.5 rounded-full hover:bg-amber-50 transition-colors shrink-0">
            Change Now
          </button>
        </div>
      )}

      <header className="h-[70px] bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">GA</div>
            <h1 className="text-navy font-bold text-lg hidden lg:block tracking-tight">Clinic-Management</h1>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                {link.name}
                {link.name === 'Chat' && unreadChatCount > 0 && (
                  <span className="bg-emerald-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {unreadChatCount}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {/* Mobile Menu Toggle */}
          <button className="md:hidden p-2 text-gray-600" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {roleConfig && (
            <div className="hidden sm:block">
              <Badge colorClass={roleConfig.badgeColor}>
                {roleConfig.displayName}
              </Badge>
            </div>
          )}

          {/* User Profile Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-3 p-1 rounded-full hover:bg-gray-50 transition-colors focus:outline-none"
            >
              <div className="h-9 w-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-sm ring-2 ring-white overflow-hidden">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  user?.full_name?.charAt(0) || 'U'
                )}
              </div>
              <div className="hidden lg:block text-left mr-1">
                <p className="text-sm font-semibold text-gray-900 leading-none mb-1">{user?.full_name}</p>
                <p className="text-xs text-gray-500 leading-none capitalize">{user?.role?.replace('_', ' ')}</p>
              </div>
              <ChevronDown size={16} className={`text-gray-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
            </button>

            {isProfileOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsProfileOpen(false)}></div>
                <div className={`absolute right-0 mt-2 ${user?.role === 'patient' ? 'w-80' : 'w-56'} bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-20 overflow-hidden transform origin-top-right transition-all animate-in zoom-in-95 duration-200`}>
                  <div className="px-5 py-4 border-b border-gray-50 bg-gradient-to-br from-gray-50 to-white">
                    <div className="flex items-center gap-3 mb-1">
                      <div className="h-12 w-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-md ring-4 ring-blue-50">
                        {user?.full_name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <p className="text-base font-bold text-gray-900 leading-tight">{user?.full_name}</p>
                        <p className="text-xs text-gray-500 truncate font-medium">{user?.email}</p>
                      </div>
                    </div>
                  </div>
                  
                  {user?.role === 'patient' && patientProfile && (
                    <div className="p-4 space-y-3 bg-white border-b border-gray-50">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-blue-50/50 p-2.5 rounded-xl border border-blue-100/50">
                          <p className="text-[10px] uppercase tracking-wider font-bold text-blue-600 mb-0.5 flex items-center gap-1">
                            <Fingerprint size={10} /> ID
                          </p>
                          <p className="text-xs font-bold text-gray-900">{patientProfile.patient_id}</p>
                        </div>
                        <div className="bg-red-50/50 p-2.5 rounded-xl border border-red-100/50">
                          <p className="text-[10px] uppercase tracking-wider font-bold text-red-600 mb-0.5 flex items-center gap-1">
                            <Droplets size={10} /> Blood
                          </p>
                          <p className="text-xs font-bold text-gray-900">{patientProfile.blood_group || 'N/A'}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2.5 pt-1">
                        <div className="flex items-start gap-3">
                          <Phone size={14} className="text-gray-400 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-[10px] uppercase font-bold text-gray-400 leading-none mb-1">Contact</p>
                            <p className="text-xs text-gray-700 font-medium">{patientProfile.mobile_number || 'N/A'}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <MapPin size={14} className="text-gray-400 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-[10px] uppercase font-bold text-gray-400 leading-none mb-1">Address</p>
                            <p className="text-xs text-gray-700 font-medium line-clamp-2">{patientProfile.address || 'N/A'}</p>
                          </div>
                        </div>
                      </div>

                      {patientProfile.known_allergies && (
                        <div className="mt-3 bg-amber-50 p-2.5 rounded-xl border border-amber-100">
                          <p className="text-[10px] uppercase tracking-wider font-bold text-amber-600 mb-1 flex items-center gap-1">
                            <ShieldAlert size={12} /> Allergies
                          </p>
                          <p className="text-xs text-amber-900 font-medium">{patientProfile.known_allergies}</p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="p-1.5">
                    <button 
                      onClick={() => { navigate('/profile'); setIsProfileOpen(false); }}
                      className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-all"
                    >
                      <User size={18} />
                      My Profile
                    </button>
                    <button 
                      onClick={() => { navigate('/change-password'); setIsProfileOpen(false); }}
                      className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-all"
                    >
                      <KeyRound size={18} />
                      Change Password
                    </button>
                  </div>
                  
                  <div className="p-1.5 border-t border-gray-50">
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <LogOut size={18} />
                      Logout
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-200 py-4 px-6 animate-in slide-in-from-top duration-300">
          <nav className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                onClick={() => setIsMenuOpen(false)}
                className={({ isActive }) =>
                  `px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`
                }
              >
                {link.name}
              </NavLink>
            ))}
          </nav>
        </div>
      )}
    </>
  );
};

export default TopNav;
