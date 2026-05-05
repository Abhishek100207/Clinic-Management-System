import React from 'react';
import { Outlet } from 'react-router-dom';
import TopNav from './TopNav';

const AppShell = () => {
  return (
    <div className="flex flex-col min-h-screen bg-offwhite">
      <TopNav />
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AppShell;
