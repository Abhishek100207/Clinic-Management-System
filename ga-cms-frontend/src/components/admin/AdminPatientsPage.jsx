import React from 'react';
import { Users, Search, Download, UserPlus, Filter } from 'lucide-react';

const AdminPatientsPage = () => {
  return (
    <div className="max-w-7xl mx-auto w-full p-4 md:p-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-navy mb-2">Patient Records Master</h1>
          <p className="text-slate-500">Comprehensive database of all registered patients in the clinic system.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 font-bold px-4 py-2.5 rounded-xl hover:bg-slate-50 transition-all shadow-sm">
            <Download size={18} />
            Export Data
          </button>
          <button className="flex items-center gap-2 bg-indigo-600 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">
            <UserPlus size={18} />
            Add Patient
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-12 text-center">
          <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users size={28} className="text-indigo-500" />
          </div>
          <h3 className="text-lg font-bold text-navy mb-2">Master Patient List</h3>
          <p className="text-slate-500 text-sm max-w-sm mx-auto">
            View and manage all patient profiles, medical histories, and associated records from this central location.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminPatientsPage;
