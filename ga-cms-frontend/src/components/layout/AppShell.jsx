import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopNav from './TopNav';

const AppShell = () => {
  return (
    <div className="flex h-screen bg-offwhite overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopNav />
        <main className="flex-1 overflow-y-auto p-8 border-t border-gray-100 relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppShell;
