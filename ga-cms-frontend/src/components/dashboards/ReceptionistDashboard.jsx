import React from 'react';
import { useAuthStore } from '../../store/authStore';
import { Badge } from '../shared/Badge';

const ReceptionistDashboard = () => {
  const { user } = useAuthStore();
  return (
    <div className="max-w-4xl mx-auto w-full">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-navy mb-3">Welcome back, {user?.full_name}</h1>
        <div className="mb-6"><Badge colorClass="bg-emerald-100 text-emerald-800">Receptionist</Badge></div>
        
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 px-4 py-3 rounded-md mb-8 flex items-center">
          <span className="font-bold mr-2">Week 1 Complete:</span> Authentication & Role System is functioning.
        </div>
        
        <h2 className="text-xl font-bold text-navy mb-4">Coming Soon</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 bg-offwhite rounded-[8px] border border-gray-200">
            <h3 className="font-semibold text-navy mb-1">Clinic Queue</h3>
            <p className="text-sm text-slate-500">Manage patient walk-ins and appointments.</p>
          </div>
          <div className="p-5 bg-offwhite rounded-[8px] border border-gray-200">
            <h3 className="font-semibold text-navy mb-1">Billing System</h3>
            <p className="text-sm text-slate-500">Process invoices and payment receipts.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceptionistDashboard;
