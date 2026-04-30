import React from 'react';
import { Check, X, Calendar, User, MoreVertical, Clock } from 'lucide-react';
import { Badge } from '../../shared/Badge';

const AppointmentTable = ({ appointments, onAction }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center">
        <h3 className="font-bold text-navy text-lg">Upcoming Appointments</h3>
        <div className="flex gap-2">
          <select className="text-sm border border-gray-200 rounded-lg px-3 py-1 bg-slate-50">
            <option>Today</option>
            <option>Tomorrow</option>
            <option>This Week</option>
          </select>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
              <th className="px-6 py-4">Patient & Token</th>
              <th className="px-6 py-4">Time</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Visits</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {appointments.length > 0 ? appointments.map((appt) => (
              <tr key={appt.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold mr-3">
                      {appt.token_number || `#${appt.id.toString().slice(-2)}`}
                    </div>
                    <div>
                      <p className="font-bold text-navy">{appt.patient_name || 'Anonymous'}</p>
                      <p className="text-xs text-slate-500">ID: {appt.patient_id || 'N/A'}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center text-slate-700 font-medium">
                    <Calendar size={14} className="mr-2 text-slate-400" />
                    {appt.time.substring(0,5)}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <Badge colorClass={appt.appointment_type === 'virtual' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'}>
                    {appt.appointment_type === 'virtual' ? 'Virtual' : 'In-Person'}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600 font-semibold">
                  {appt.revisit_count || 1} visits
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    appt.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' :
                    appt.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                    'bg-slate-100 text-slate-800'
                  }`}>
                    {appt.status.charAt(0).toUpperCase() + appt.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    {appt.status === 'pending' && (
                      <>
                        <button 
                          onClick={() => onAction(appt.id, 'confirmed')}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Accept"
                        >
                          <Check size={18} />
                        </button>
                        <button 
                          onClick={() => onAction(appt.id, 'cancelled')}
                          className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Reject"
                        >
                          <X size={18} />
                        </button>
                      </>
                    )}
                    {(appt.status === 'confirmed' || appt.status === 'pending') && (
                      <button 
                        onClick={() => onAction(appt.id, 'reschedule')}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Reschedule"
                      >
                        <Clock size={18} />
                      </button>
                    )}
                    <button className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors">
                      <MoreVertical size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center text-slate-400 italic">
                  No appointments scheduled for today.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AppointmentTable;
