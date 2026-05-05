import React from 'react';
import { FileText, Plus, Search, User } from 'lucide-react';

const DoctorPrescriptionsPage = () => {
  return (
    <div className="max-w-7xl mx-auto w-full p-4 md:p-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-navy mb-2">Prescription Management</h1>
          <p className="text-slate-500">Create, view, and manage prescriptions for your patients.</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all">
          <Plus size={18} />
          New Prescription
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-12 text-center">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText size={28} className="text-blue-500" />
          </div>
          <h3 className="text-lg font-bold text-navy mb-2">Prescription Records</h3>
          <p className="text-slate-500 text-sm max-w-xs mx-auto mb-6">
            Search for patients to view their previous prescriptions or generate a new digital RX.
          </p>
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search patient name..." 
              className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorPrescriptionsPage;
