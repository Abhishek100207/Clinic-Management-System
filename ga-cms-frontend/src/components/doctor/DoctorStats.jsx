import React from 'react';
import { Users, Calendar, Clock, AlertCircle } from 'lucide-react';

const DoctorStats = ({ stats }) => {
  const cards = [
    { title: 'Total Patients', value: stats.totalPatients, icon: <Users size={20} />, color: 'bg-blue-500' },
    { title: "Today's Appts", value: stats.todayAppointments, icon: <Calendar size={20} />, color: 'bg-emerald-500' },
    { title: 'Pending', value: stats.pendingApprovals, icon: <Clock size={20} />, color: 'bg-amber-500' },
    { title: 'Emergency Alerts', value: 0, icon: <AlertCircle size={20} />, color: 'bg-rose-500' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {cards.map((card, i) => (
        <div key={i} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center">
          <div className={`${card.color} text-white p-3 rounded-xl mr-4`}>
            {card.icon}
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">{card.title}</p>
            <p className="text-2xl font-bold text-navy">{card.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DoctorStats;
