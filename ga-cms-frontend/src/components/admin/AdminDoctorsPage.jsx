import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, Search, Calendar, ChevronRight, UserPlus } from 'lucide-react';

const AdminDoctorsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto w-full p-4 md:p-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-navy mb-2">Doctor Directory & Scheduling</h1>
          <p className="text-slate-500">Manage doctor profiles, specializations, and their available shift timings.</p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search doctors..." 
              className="bg-white border border-slate-200 pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all w-64 shadow-sm"
            />
          </div>
          <button 
            onClick={() => navigate('/staff/add')}
            className="px-5 py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-100 flex items-center gap-1.5 active:scale-95"
          >
            <UserPlus size={14} /> Add Doctor
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { name: 'Dr. Sarah Johnson', spec: 'Cardiology', status: 'On Duty' },
          { name: 'Dr. Robert Chen', spec: 'Orthopedics', status: 'On Duty' },
          { name: 'Dr. Anjali Sharma', spec: 'Pediatrics', status: 'Off Duty' },
        ].map((doctor, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-blue-200 transition-all cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500 font-bold group-hover:bg-blue-600 group-hover:text-white transition-all">
                <Stethoscope size={24} />
              </div>
              <div>
                <h3 className="font-bold text-navy text-sm">{doctor.name}</h3>
                <p className="text-xs text-slate-400 font-medium">{doctor.spec}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${doctor.status === 'On Duty' ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">{doctor.status}</span>
                </div>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
          </div>
        ))}
      </div>

      <div className="mt-12 bg-white rounded-3xl border border-gray-100 shadow-sm p-12 text-center">
        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Calendar size={28} className="text-blue-500" />
        </div>
        <h3 className="text-lg font-bold text-navy mb-2">Duty Roster Management</h3>
        <p className="text-slate-500 text-sm max-w-sm mx-auto">
          Synchronize shift timings across all departments to ensure optimal patient coverage.
        </p>
      </div>
    </div>
  );
};

export default AdminDoctorsPage;
