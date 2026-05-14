import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { 
  User, 
  Calendar, 
  Clock, 
  ChevronRight,
  ClipboardList,
  UserCheck
} from 'lucide-react';
import { Badge } from '../shared/Badge';
import TechnicianStats from './TechnicianStats';
import { useNavigate } from 'react-router-dom';

const TechnicianDashboard = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  // Mock stats for the dashboard
  const statsData = {
    pending: 5,
    inProgress: 2,
    completed: 14,
    total: 21
  };

  // Mock list of patient names needing tests
  const [pendingPatients] = useState([
    { id: 'LAB-001', name: 'Amit Sharma', time: '10:30 AM', test: 'Blood Test' },
    { id: 'LAB-002', name: 'Priya Patel', time: '11:15 AM', test: 'Chest X-Ray' },
    { id: 'LAB-004', name: 'Suresh Raina', time: '12:00 PM', test: 'Lipid Profile' },
    { id: 'LAB-005', name: 'Anjali Gupta', time: '12:45 PM', test: 'ECG' },
  ]);

  return (
    <div className="max-w-7xl mx-auto w-full p-4 md:p-8 space-y-8 animate-fade-in">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-navy mb-2 uppercase">
            Welcome {(user?.full_name || 'Rahul Verma')}
          </h1>
          <div className="flex items-center gap-3">
            <Badge colorClass="bg-amber-100 text-amber-800">
              {user?.qualification || 'Senior Lab Technician (B.Sc MLT)'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Statistics Component */}
      <TechnicianStats stats={statsData} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Content: Pending Patient List (Left 2/3) */}
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-navy flex items-center gap-2">
                <ClipboardList className="text-amber-500" size={22} />
                Pending Patient Queue
              </h2>
              <span className="text-xs font-bold bg-amber-100 text-amber-700 px-3 py-1 rounded-full">
                {pendingPatients.length} Waiting
              </span>
            </div>
            
            <div className="p-6 space-y-4">
              {pendingPatients.map((patient) => (
                <div key={patient.id} className="p-4 rounded-xl border border-slate-50 bg-slate-50/50 flex items-center justify-between group hover:bg-amber-50/30 hover:border-amber-100 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-400 border border-slate-100 group-hover:text-amber-500 group-hover:border-amber-200 transition-colors">
                      <User size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{patient.name}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{patient.id} • {patient.test}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Scheduled Time</p>
                      <p className="text-xs font-bold text-slate-600 flex items-center justify-end gap-1">
                        <Clock size={12} /> {patient.time}
                      </p>
                    </div>
                    <button className="p-2 text-slate-300 hover:text-amber-600 transition-colors">
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
              <button 
                onClick={() => navigate('/scan-orders')} // Assuming this route exists or we can use it
                className="text-xs font-bold text-slate-500 hover:text-amber-600 transition-colors"
              >
                View Full Laboratory Queue
              </button>
            </div>
          </section>
        </div>

        {/* Sidebar: Personal Info / Quick Actions (Right 1/3) */}
        <div className="space-y-8">
          <div className="bg-amber-600 rounded-3xl p-8 text-white shadow-xl overflow-hidden relative">
            <div className="absolute -right-8 -bottom-8 opacity-10">
              <UserCheck size={160} />
            </div>
            <div className="relative z-10">
              <h3 className="font-bold text-2xl mb-2 leading-tight">Session Info</h3>
              <div className="space-y-4 mt-6">
                <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/10">
                  <p className="text-[10px] font-bold text-amber-200 uppercase tracking-widest mb-1">Assigned Station</p>
                  <p className="text-sm font-bold">Main Pathology Lab - Station 4</p>
                </div>
                <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/10">
                  <p className="text-[10px] font-bold text-amber-200 uppercase tracking-widest mb-1">Shift Timing</p>
                  <p className="text-sm font-bold">Morning Shift (08:00 AM - 04:00 PM)</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Quick Links</h4>
            <ul className="space-y-4">
              <li className="flex items-center justify-between text-sm font-medium text-slate-600 cursor-pointer hover:text-amber-600 transition-colors">
                <span className="flex items-center gap-3"><ClipboardList size={16} /> My Reports History</span>
                <ChevronRight size={14} />
              </li>
              <li className="flex items-center justify-between text-sm font-medium text-slate-600 cursor-pointer hover:text-amber-600 transition-colors">
                <span className="flex items-center gap-3"><Calendar size={16} /> Duty Roster</span>
                <ChevronRight size={14} />
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TechnicianDashboard;

