import React, { useState } from 'react';
import { LogOut, KeyRound, User, ChevronDown, Menu, X } from 'lucide-react';
import { useNavigate, NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../api/auth';
import { Badge } from '../shared/Badge';
import { ROLE_CONFIG } from '../../utils/roleConfig';

const TopNav = () => {
  const { user, logout } = useAuthStore();
  const roleConfig = user?.role ? ROLE_CONFIG[user.role] : null;
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
                  `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                {link.name}
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
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-20 overflow-hidden transform origin-top-right transition-all">
                  <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/50">
                    <p className="text-sm font-medium text-gray-900">{user?.full_name}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  </div>
                  
                  <div className="p-1">
                    <button 
                      onClick={() => { navigate('/profile'); setIsProfileOpen(false); }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
                    >
                      <User size={18} />
                      My Profile
                    </button>
                    <button 
                      onClick={() => { navigate('/change-password'); setIsProfileOpen(false); }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
                    >
                      <KeyRound size={18} />
                      Change Password
                    </button>
                  </div>
                  
                  <div className="p-1 border-t border-gray-50">
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
