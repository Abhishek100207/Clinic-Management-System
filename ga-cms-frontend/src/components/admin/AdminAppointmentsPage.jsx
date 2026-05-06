import React from 'react';
import { Calendar, Search, Filter, MoreHorizontal, User } from 'lucide-react';

const AdminAppointmentsPage = () => {
  return (
    <div className="max-w-7xl mx-auto w-full p-4 md:p-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-navy mb-2">Global Appointment Schedule</h1>
          <p className="text-slate-500">Overview of all appointments across all doctors and departments.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search appointments..." 
              className="bg-white border border-slate-200 pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all w-64 shadow-sm"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-12 text-center">
          <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar size={28} className="text-purple-500" />
          </div>
          <h3 className="text-lg font-bold text-navy mb-2">Global Master Calendar</h3>
          <p className="text-slate-500 text-sm max-w-sm mx-auto">
            This administrative view provides a master list of all clinic activities. You can filter by doctor, department, or status.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminAppointmentsPage;
