import React from 'react';
import { Users, TrendingUp, DollarSign, Activity } from 'lucide-react';

const StatCard = ({ icon, label, value, color, trend }) => {
  const colors = {
    purple: 'bg-purple-50 text-purple-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600'
  };
  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className={`p-3 rounded-xl ${colors[color]}`}>
        {React.cloneElement(icon, { size: 24 })}
      </div>
      <div className="flex-1">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
        <div className="flex items-baseline gap-2">
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {trend && (
            <span className={`text-[10px] font-bold ${trend.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}`}>
              {trend}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

const AdminStats = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard 
        icon={<Users />} 
        label="Total Staff" 
        value={stats.staffCount || 0} 
        color="purple" 
      />
      <StatCard 
        icon={<TrendingUp />} 
        label="Patient Growth" 
        value={`${stats.growth || 0}%`} 
        color="blue" 
        trend="+12%"
      />
      <StatCard 
        icon={<DollarSign />} 
        label="Monthly Revenue" 
        value={`₹${stats.revenue || 0}`} 
        color="emerald" 
        trend="+5.4%"
      />
      <StatCard 
        icon={<Activity />} 
        label="System Uptime" 
        value="99.9%" 
        color="amber" 
      />
    </div>
  );
};

export default AdminStats;
