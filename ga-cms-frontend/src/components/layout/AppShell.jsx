import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import TopNav from './TopNav';
import Sidebar from './Sidebar';
import { useAuthStore } from '../../store/authStore';

const AppShell = () => {
  const location = useLocation();
  const { user } = useAuthStore();
  const isChatPage = location.pathname === '/chat' || location.pathname === '/staff-chat';
  const isAdmin = user?.role === 'senior_doctor';

  return (
    <div className={`flex min-h-screen bg-offwhite ${isAdmin ? 'flex-row' : 'flex-col'}`}>
      {isAdmin && <Sidebar />}
      <div className="flex-1 flex flex-col min-w-0">
        <TopNav />
        <main className={`flex-1 ${isChatPage ? '' : 'p-4 md:p-8'}`}>
          <div className={isChatPage ? 'h-[calc(100vh-70px)]' : 'max-w-7xl mx-auto'}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppShell;
