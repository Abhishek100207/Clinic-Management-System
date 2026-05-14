import React, { useState, useEffect, lazy, Suspense } from 'react';

const ClinicAnalytics = lazy(() => import('./ClinicAnalytics')); // PERF: Lazy load heavy chart
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../api/auth';

import { useNavigate } from 'react-router-dom';
import { Badge } from '../shared/Badge';
import AdminStats from './AdminStats';
import StaffTable from './StaffTable';
import { 
  ShieldCheck, 
  UserPlus, 
  Settings, 
  BarChart3, 
  Activity, 
  Bell, 
  Database,
  ChevronRight,
  LayoutGrid
} from 'lucide-react';

const AdminDashboard = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    staffCount: 0,
    growth: 15,
    revenue: 450000
  });

  const [staffData, setStaffData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        setLoading(true);
        const data = await authApi.listStaff();
        
        setStaffData(data.map(member => ({
          name: member.full_name || member.username,
          role: member.role || 'Staff',
          email: member.email,
          status: 'Online',
          lastActive: 'Now'
        })));
        
        setStats(prev => ({
          ...prev,
          staffCount: data.length
        }));
      } catch (err) {
        console.error("Failed to fetch staff for admin dashboard:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStaff();
  }, []);

  return (
    <div className="max-w-7xl mx-auto w-full p-4 md:p-8 space-y-8 animate-fade-in">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-navy mb-2">Admin Control Center</h1>
          <div className="flex items-center gap-3">
            <Badge colorClass="bg-purple-100 text-purple-800">Senior Doctor (Admin)</Badge>
            <span className="text-slate-300">•</span>
            <span className="text-sm font-medium text-slate-500">System Administrator: {user?.full_name}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/staff/add')}
            className="flex items-center gap-2 bg-indigo-600 text-white hover:bg-indigo-700 font-bold px-6 py-3 rounded-xl shadow-lg shadow-indigo-100 transition-all active:scale-95"
          >
            <UserPlus size={18} />
            Add New Staff
          </button>
        </div>
      </div>

      {/* Statistics */}
      <AdminStats stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Content (Left 2/3) */}
        <div className="lg:col-span-2 space-y-8">
          <StaffTable staff={staffData} />
          
          {/* System Performance Chart */}
          <Suspense fallback={<div className="h-64 flex items-center justify-center bg-white rounded-2xl border border-gray-100 shadow-sm"><div className="w-8 h-8 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin"></div></div>}>
            <ClinicAnalytics />
          </Suspense> {/* PERF: Suspense for lazy loaded component */}
        </div>

        {/* Sidebar (Right 1/3) */}
        <div className="space-y-8">
          
          {/* Quick Config Sidebar */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-6">
            <h3 className="font-bold text-navy text-lg mb-6 flex items-center gap-2">
              <LayoutGrid size={20} className="text-indigo-500" />
              System Modules
            </h3>
            <div className="space-y-3">
              {[
                { name: 'Patient Database', icon: <Database size={18} />, color: 'text-blue-500', bg: 'bg-blue-50' },
                { name: 'Audit Logs', icon: <ShieldCheck size={18} />, color: 'text-purple-500', bg: 'bg-purple-50' },
                { name: 'System Settings', icon: <Settings size={18} />, color: 'text-slate-500', bg: 'bg-slate-50' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-indigo-200 hover:shadow-sm transition-all cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-xl ${item.bg} ${item.color}`}>
                      {item.icon}
                    </div>
                    <span className="text-sm font-bold text-navy">{item.name}</span>
                  </div>
                  <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                </div>
              ))}
            </div>
          </div>

          {/* Security Alert Banner */}
          <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-xl overflow-hidden relative">
            <div className="absolute -right-8 -bottom-8 opacity-10">
              <ShieldCheck size={160} />
            </div>
            <div className="relative z-10">
              <h3 className="font-bold text-2xl mb-2 leading-tight">System Security</h3>
              <p className="text-slate-400 text-sm mb-6">Last backup performed 4 hours ago. Everything is secure.</p>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Backup Size</p>
                  <p className="text-xl font-bold">1.2 GB</p>
                </div>
                <button className="bg-white/10 hover:bg-white/20 p-3 rounded-xl transition-colors">
                  <Activity size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* Admin Notifications */}
          <div className="bg-indigo-50/50 rounded-2xl p-6 border border-indigo-100">
            <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-4 flex items-center justify-between">
              Critical Alerts
              <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse"></span>
            </h4>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="mt-1 w-2 h-2 bg-rose-500 rounded-full shrink-0"></div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  <span className="font-bold">Database Warning:</span> High concurrent connections detected at 10:45 AM.
                </p>
              </div>
              <div className="flex gap-3">
                <div className="mt-1 w-2 h-2 bg-amber-500 rounded-full shrink-0"></div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  <span className="font-bold">Staff Alert:</span> Dr. Sarah's shift has exceeded 12 hours.
                </p>
              </div>
            </div>
            <button className="w-full mt-6 py-2 text-[11px] font-extrabold text-indigo-600 uppercase tracking-tighter hover:bg-indigo-100 rounded-lg transition-colors">
              Clear All Alerts
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
