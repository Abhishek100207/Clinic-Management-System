import React from 'react';
import { Users, Clock, CreditCard, CalendarCheck } from 'lucide-react';

const StatCard = ({ icon, label, value, color }) => {
  const colors = {
    emerald: 'bg-emerald-50 text-emerald-600',
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
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

const ReceptionistStats = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard 
        icon={<Users />} 
        label="Total Patients" 
        value={stats.totalPatients || 0} 
        color="emerald" 
      />
      <StatCard 
        icon={<Clock />} 
        label="In Queue" 
        value={stats.inQueue || 0} 
        color="amber" 
      />
      <StatCard 
        icon={<CalendarCheck />} 
        label="Appointments" 
        value={stats.appointmentsToday || 0} 
        color="blue" 
      />
      <StatCard 
        icon={<CreditCard />} 
        label="Today's Revenue" 
        value={`₹${stats.revenue || 0}`} 
        color="purple" 
      />
    </div>
  );
};

export default ReceptionistStats;
