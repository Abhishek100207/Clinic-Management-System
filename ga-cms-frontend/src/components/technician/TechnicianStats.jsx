import React from 'react';
import { Microscope, Clipboard, CheckCircle, Clock } from 'lucide-react';

const StatCard = ({ icon, label, value, color }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    purple: 'bg-purple-50 text-purple-600'
  };
  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className={`p-3 rounded-xl ${colors[color]}`}>
        {React.cloneElement(icon, { size: 24 })}
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
};

const TechnicianStats = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard 
        icon={<Microscope />} 
        label="Pending Scans" 
        value={stats.pending || 0} 
        color="amber" 
      />
      <StatCard 
        icon={<Clock />} 
        label="In Progress" 
        value={stats.inProgress || 0} 
        color="blue" 
      />
      <StatCard 
        icon={<CheckCircle />} 
        label="Completed Today" 
        value={stats.completed || 0} 
        color="emerald" 
      />
      <StatCard 
        icon={<Clipboard />} 
        label="Total Orders" 
        value={stats.total || 0} 
        color="purple" 
      />
    </div>
  );
};

export default TechnicianStats;
