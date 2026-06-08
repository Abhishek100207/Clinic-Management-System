import React from 'react';
import { useAuthStore } from '../../store/authStore';
import ScanQueue from './ScanQueue';

const ScanOrdersPage = () => {
  const { user } = useAuthStore();
  const isTechnician = user?.role === 'technician';

  return (
    <div className="max-w-6xl mx-auto w-full p-4 md:p-8 space-y-8 animate-fade-in">
      <header>
        <h1 className="text-4xl font-extrabold tracking-tight text-navy mb-2">Detailed Scan Queue</h1>
        <p className="text-sm font-medium text-slate-500">
          Manage detailed laboratory test requests and patient records.
        </p>
      </header>

      <ScanQueue isTechnician={isTechnician} />
    </div>
  );
};

export default ScanOrdersPage;
