import React from 'react';
import { Calendar, Clock, Activity, Clipboard } from 'lucide-react';

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

const PatientStats = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard 
        icon={<Calendar />} 
        label="Upcoming" 
        value={stats.upcoming} 
        color="blue" 
      />
      <StatCard 
        icon={<Clock />} 
        label="Pending" 
        value={stats.pending} 
        color="amber" 
      />
      <StatCard 
        icon={<Activity />} 
        label="Revisit #" 
        value={stats.revisit} 
        color="emerald" 
      />
      <StatCard 
        icon={<Clipboard />} 
        label="History" 
        value={stats.history} 
        color="purple" 
      />
    </div>
  );
};

export default PatientStats;
