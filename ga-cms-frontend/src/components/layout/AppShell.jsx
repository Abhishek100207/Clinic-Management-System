import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import TopNav from './TopNav';

const AppShell = () => {
  const location = useLocation();
  const isChatPage = location.pathname === '/chat' || location.pathname === '/staff-chat';

  return (
    <div className="flex flex-col min-h-screen bg-offwhite">
      <TopNav />
      <main className={`flex-1 ${isChatPage ? '' : 'p-4 md:p-8'}`}>
        <div className={isChatPage ? 'h-[calc(100vh-70px)]' : 'max-w-7xl mx-auto'}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AppShell;
