import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../shared/Badge';
import TechnicianStats from './TechnicianStats';
import ScanOrderTable from './ScanOrderTable';
import { 
  Microscope, 
  FileUp, 
  Search, 
  Bell, 
  Settings, 
  ChevronRight,
  ClipboardCheck,
  Zap,
  Activity
} from 'lucide-react';

const TechnicianDashboard = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  // Mock data for demonstration
  const [stats, setStats] = useState({
    pending: 5,
    inProgress: 3,
    completed: 12,
    total: 20
  });

  const [orders, setOrders] = useState([
    { id: 'SCN-2041', patientName: 'Amit Verma', scanType: 'Chest X-Ray', doctorName: 'Dr. Sarah Johnson', priority: 'Urgent' },
    { id: 'SCN-2042', patientName: 'Suman Lata', scanType: 'Abdominal Ultrasound', doctorName: 'Dr. Robert Chen', priority: 'Routine' },
    { id: 'SCN-2043', patientName: 'Rajesh Kumar', scanType: 'MRI Brain', doctorName: 'Dr. Sarah Johnson', priority: 'Routine' },
  ]);

  return (
    <div className="max-w-7xl mx-auto w-full p-4 md:p-8 space-y-8 animate-fade-in">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-navy mb-2">Technician Dashboard</h1>
          <div className="flex items-center gap-3">
            <Badge colorClass="bg-amber-100 text-amber-800">Scanning Technician</Badge>
            <span className="text-slate-300">•</span>
            <span className="text-sm font-medium text-slate-500">Scanning Center B</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search orders or patients..." 
              className="bg-white border border-slate-200 pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all w-64 shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Statistics */}
      <TechnicianStats stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Content (Left 2/3) */}
        <div className="lg:col-span-2 space-y-8">
          <ScanOrderTable orders={orders} />
          
          {/* Equipment Status */}
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-navy flex items-center gap-2">
                <Settings className="text-slate-500" size={22} />
                Equipment Status
              </h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { name: 'X-Ray Machine (XR-01)', status: 'Operational', health: 98 },
                { name: 'Ultrasound Scanner (US-04)', status: 'Operational', health: 92 },
                { name: 'MRI System (MR-01)', status: 'Maintenance', health: 45 },
                { name: 'CT Scanner (CT-02)', status: 'Operational', health: 85 },
              ].map((item, i) => (
                <div key={i} className="p-4 rounded-xl border border-slate-50 bg-slate-50/50">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-sm font-bold text-navy">{item.name}</p>
                      <p className={`text-[10px] font-bold uppercase ${item.status === 'Operational' ? 'text-emerald-500' : 'text-amber-500'}`}>
                        {item.status}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-400">Health</p>
                      <p className={`text-sm font-bold ${item.health > 90 ? 'text-emerald-500' : item.health > 50 ? 'text-amber-500' : 'text-rose-500'}`}>
                        {item.health}%
                      </p>
                    </div>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${item.health > 90 ? 'bg-emerald-500' : item.health > 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                      style={{ width: `${item.health}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar (Right 1/3) */}
        <div className="space-y-8">
          
          {/* Recent Uploads Sidebar */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-6">
            <h3 className="font-bold text-navy text-lg mb-6 flex items-center gap-2">
              <ClipboardCheck size={20} className="text-emerald-500" />
              Recent Uploads
            </h3>
            <div className="space-y-4">
              {[
                { name: 'Chest X-Ray', patient: 'Rahul Verma', time: '10 mins ago' },
                { name: 'USG Pelvis', patient: 'Anjali S.', time: '45 mins ago' },
                { name: 'CT Head', patient: 'Karan Johar', time: '2 hours ago' },
              ].map((item, i) => (
                <div key={i} className="flex gap-4 items-center">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500">
                    <FileUp size={18} />
                  </div>
                  <div>
                    <p className="text-sm text-navy font-bold leading-tight">{item.name}</p>
                    <p className="text-[11px] text-slate-400 mt-1">{item.patient} • {item.time}</p>
                  </div>
                </div>
              ))}
              <button className="w-full mt-4 bg-slate-50 hover:bg-slate-100 py-3 rounded-xl font-bold text-xs text-slate-600 transition-colors">
                View All Upload History
              </button>
            </div>
          </div>

          {/* Urgent Alerts Banner */}
          <div className="bg-rose-600 rounded-3xl p-8 text-white shadow-xl overflow-hidden relative">
            <div className="absolute -right-8 -bottom-8 opacity-10">
              <Zap size={160} />
            </div>
            <div className="relative z-10">
              <h3 className="font-bold text-2xl mb-2 leading-tight">Emergency Queue</h3>
              <p className="text-rose-100 text-sm mb-6 opacity-90">There are 2 urgent scan requests pending in Scanning Center A.</p>
              <button className="w-full bg-white text-rose-600 hover:bg-rose-50 py-3 rounded-xl font-bold text-sm transition-all shadow-lg">
                View Urgent Orders
              </button>
            </div>
          </div>

          {/* System Status */}
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Diagnostics Console</h4>
            <ul className="space-y-4">
              <li className="flex items-center justify-between text-sm font-medium text-slate-600">
                <span className="flex items-center gap-3"><Activity size={16} /> PACS Server</span>
                <span className="flex items-center gap-1.5"><div className="w-2 h-2 bg-emerald-500 rounded-full"></div> Online</span>
              </li>
              <li className="flex items-center justify-between text-sm font-medium text-slate-600">
                <span className="flex items-center gap-3"><Bell size={16} /> Notification Link</span>
                <span className="flex items-center gap-1.5"><div className="w-2 h-2 bg-emerald-500 rounded-full"></div> Active</span>
              </li>
              <li className="flex items-center justify-between text-sm font-medium text-slate-600 cursor-pointer hover:text-blue-600 transition-colors">
                <span className="flex items-center gap-3"><Settings size={16} /> System Settings</span>
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
