import React from 'react';
import { LogOut, KeyRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../api/auth';
import { Badge } from '../shared/Badge';
import { ROLE_CONFIG } from '../../utils/roleConfig';

const TopNav = () => {
  const { user, logout } = useAuthStore();
  const roleConfig = user?.role ? ROLE_CONFIG[user.role] : null;
  const navigate   = useNavigate();

  const handleLogout = async () => {
    try { await authApi.logout(); } catch (e) { console.error(e); }
    finally { logout(); window.location.href = '/login'; }
  };

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

      <header className="h-[60px] bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0 z-10">
        <div className="flex items-center">
          <h1 className="text-navy font-bold text-base hidden sm:block tracking-tight">GA Clinic-Management-System</h1>
        </div>
        <div className="flex items-center space-x-4">
          {roleConfig && (
            <Badge colorClass={roleConfig.badgeColor}>
              {roleConfig.displayName}
            </Badge>
          )}
          <div className="flex items-center space-x-3 border-l border-gray-200 pl-4 ml-2">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="Profile" className="h-8 w-8 rounded-full border border-gray-200 object-cover shadow-sm" />
            ) : (
              <div className="h-8 w-8 rounded-full bg-navy text-white flex items-center justify-center font-bold text-sm shadow-sm">
                {user?.full_name?.charAt(0) || 'U'}
              </div>
            )}
            <span className="text-sm font-medium text-slate-700 hidden md:block">{user?.full_name}</span>
            <button title="Change Password" onClick={() => navigate('/change-password')}
              className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-md transition-all">
              <KeyRound size={18} />
            </button>
            <button title="Logout" onClick={handleLogout}
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all ml-1">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>
    </>
  );
};

export default TopNav;
