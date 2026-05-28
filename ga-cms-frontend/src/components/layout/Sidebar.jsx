import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { ROLE_CONFIG } from '../../utils/roleConfig';
import * as Icons from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();
  const user = useAuthStore(state => state.user);
  const roleConfig = user?.role ? ROLE_CONFIG[user.role] : null;

  if (!roleConfig) return null;

  return (
    <div className="hidden md:flex w-[240px] bg-navy text-white flex-col h-screen sticky top-0 shrink-0 shadow-lg z-20">
      <div className="h-[70px] flex items-center justify-center border-b border-white/10 shrink-0">
        <span className="text-xl font-bold tracking-tight">GA CMS</span>
      </div>
      <nav className="flex-1 py-4 overflow-y-auto custom-scrollbar">
        <ul className="space-y-1">
          {roleConfig.navLinks.map((link) => {
            const Icon = Icons[link.icon];
            return (
              <li key={link.path}>
                <NavLink
                  to={link.path}
                  className={({ isActive }) =>
                    `flex items-center px-6 py-3 text-sm font-medium transition-all ${
                      isActive
                        ? 'border-l-4 border-blue-600 bg-blue-600/10 text-white shadow-inner'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white border-l-4 border-transparent'
                    }`
                  }
                >
                  {Icon && <Icon className={`mr-3 h-5 w-5 ${location.pathname === link.path ? 'opacity-100 text-blue-400' : 'opacity-75'}`} />}
                  {link.name}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="p-4 border-t border-white/10 text-xs text-slate-400 text-center">
        GA CMS v1.0
      </div>
    </div>
  );
};

export default Sidebar;
