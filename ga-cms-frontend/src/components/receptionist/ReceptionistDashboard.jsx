import React, { useState, useEffect, useMemo } from 'react';
import api from '../../api/axios';
import { useDebounce } from '../../hooks/useDebounce';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../shared/Badge';
import ReceptionistStats from './ReceptionistStats';
import QueueTable from './QueueTable';
import { 
  UserPlus, 
  CreditCard, 
  Calendar, 
  Search, 
  Bell, 
  Settings, 
  Plus, 
  ChevronRight,
  ClipboardList,
  History
} from 'lucide-react';
import ErrorBoundary from '../shared/ErrorBoundary';

const ReceptionistDashboard = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({
    totalPatients: 0,
    inQueue: 0,
    appointmentsToday: 0,
    revenue: 12500
  });

  const [queueData, setQueueData] = useState([]);

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300); // PERF: Debounce search input
  
  const filteredQueue = useMemo(() => {
    return queueData.filter(q => 
      q.patientName?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      q.token?.includes(debouncedSearchTerm)
    );
  }, [queueData, debouncedSearchTerm]); // PERF: Memoize filtered list

  useEffect(() => {
    const fetchData = async () => {
      try {

        const [pRes, aRes] = await Promise.all([
          api.get('/api/users/patients/'),
          api.get('/api/appointments/appointments/')
        ]);
        
        const patients = Array.isArray(pRes.data) ? pRes.data : (pRes.data.results || []);
        const appointments = Array.isArray(aRes.data) ? aRes.data : (aRes.data.results || []);
        
        const todayStr = new Date().toISOString().split('T')[0];
        const todayAppts = appointments.filter(a => a.date === todayStr);
        const inQueueAppts = todayAppts.filter(a => a.status === 'checked_in' || a.status === 'pending' || a.status === 'confirmed');
        
        setStats({
          totalPatients: patients.length,
          inQueue: inQueueAppts.length,
          appointmentsToday: todayAppts.length,
          revenue: 12500
        });
        
        const mappedQueue = inQueueAppts.map((a, index) => ({
          token: a.id?.toString() || String(index + 1),
          patientName: a.patient_name || `Patient ${a.patient}`,
          doctorName: a.doctor_name || `Doctor ${a.doctor}`,
          waitTime: (index + 1) * 5
        }));
        
        setQueueData(mappedQueue);
      } catch (err) {
        console.error("Failed to fetch data for receptionist dashboard:", err);
      }
    };

    fetchData();
  }, []);

  return (
    <ErrorBoundary>
      <div className="max-w-7xl mx-auto w-full p-4 md:p-8 space-y-8 animate-fade-in">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-navy mb-2">Reception Dashboard</h1>
          <div className="flex items-center gap-3">
            <Badge colorClass="bg-emerald-100 text-emerald-800">Receptionist</Badge>
            <span className="text-slate-300">•</span>
            <span className="text-sm font-medium text-slate-500">Welcome back, {user?.full_name}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search patient or token..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white border border-slate-200 pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all w-64 shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Statistics */}
      <ReceptionistStats stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Content (Left 2/3) */}
        <div className="lg:col-span-2 space-y-8">
          <QueueTable queue={filteredQueue} /> {/* PERF: Use memoized filtered list */}
          
          {/* Quick Tasks / Pending Actions */}
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-navy flex items-center gap-2">
                <ClipboardList className="text-blue-500" size={22} />
                Daily Checklist
              </h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { task: 'Process morning billing', status: 'Pending', time: 'Before 12 PM' },
                { task: 'Confirm tomorrow appointments', status: 'In Progress', time: 'By 5 PM' },
                { task: 'Update doctor availability', status: 'Completed', time: '09:00 AM' },
                { task: 'Verify scan reports delivery', status: 'Pending', time: 'Ongoing' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-slate-50 bg-slate-50/50">
                  <div className={`w-2 h-10 rounded-full ${item.status === 'Completed' ? 'bg-emerald-500' : item.status === 'In Progress' ? 'bg-blue-500' : 'bg-slate-300'}`}></div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-navy">{item.task}</p>
                    <p className="text-[11px] text-slate-500 font-medium">{item.time}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded ${item.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-white text-slate-500 shadow-sm'}`}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar (Right 1/3) */}
        <div className="space-y-8">
          
          {/* Quick Actions Sidebar */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-6">
            <h3 className="font-bold text-navy text-lg mb-6 flex items-center gap-2">
              <Plus size={20} className="text-blue-500" />
              Quick Actions
            </h3>
            <div className="space-y-3">
              <button 
                onClick={() => navigate('/register-patient')}
                className="w-full flex items-center justify-between p-4 bg-blue-50 text-blue-700 rounded-2xl font-bold hover:bg-blue-100 transition-colors group"
              >
                <span className="flex items-center gap-3"><UserPlus size={20} /> New Registration</span>
                <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                className="w-full flex items-center justify-between p-4 bg-emerald-50 text-emerald-700 rounded-2xl font-bold hover:bg-emerald-100 transition-colors group"
              >
                <span className="flex items-center gap-3"><CreditCard size={20} /> Collect Payment</span>
                <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                className="w-full flex items-center justify-between p-4 bg-purple-50 text-purple-700 rounded-2xl font-bold hover:bg-purple-100 transition-colors group"
              >
                <span className="flex items-center gap-3"><Calendar size={20} /> Bulk Booking</span>
                <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Today's Stats Banner */}
          <div className="bg-gradient-to-br from-navy to-slate-800 rounded-3xl p-8 text-white shadow-xl overflow-hidden relative">
            <div className="absolute -right-8 -bottom-8 opacity-10">
              <History size={160} />
            </div>
            <div className="relative z-10">
              <h3 className="font-bold text-2xl mb-2 leading-tight">Shift Overview</h3>
              <p className="text-slate-300 text-sm mb-6 opacity-80">You've registered 12 new patients today. Great job!</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 rounded-2xl p-4">
                  <p className="text-[10px] text-slate-300 font-bold uppercase mb-1">Morning</p>
                  <p className="text-xl font-bold">18 Appts</p>
                </div>
                <div className="bg-white/10 rounded-2xl p-4">
                  <p className="text-[10px] text-slate-300 font-bold uppercase mb-1">Afternoon</p>
                  <p className="text-xl font-bold">6 Appts</p>
                </div>
              </div>
            </div>
          </div>

          {/* Settings / Account */}
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">System Console</h4>
            <ul className="space-y-4">
              <li className="flex items-center justify-between text-sm font-medium text-slate-600 cursor-pointer hover:text-blue-600 transition-colors">
                <span className="flex items-center gap-3"><Bell size={16} /> Notification Center</span>
                <ChevronRight size={14} />
              </li>
              <li className="flex items-center justify-between text-sm font-medium text-slate-600 cursor-pointer hover:text-blue-600 transition-colors">
                <span className="flex items-center gap-3"><Settings size={16} /> Terminal Settings</span>
                <ChevronRight size={14} />
              </li>
            </ul>
          </div>

        </div>
      </div>
      </div>
    </ErrorBoundary>
  );
};

export default ReceptionistDashboard;
