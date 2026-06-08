import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Stethoscope, Clock } from 'lucide-react';
import { Badge } from '../shared/Badge';

const PatientAppointmentTable = ({ appointments, onAction }) => {
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  useEffect(() => {
    // Re-evaluate statuses every 60 seconds
    const intervalId = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000);
    return () => clearInterval(intervalId);
  }, []);

  // Compute the real display status based on current time.
  // If DB says confirmed/pending/rescheduled but the slot is >30 min past → show 'missed'.
  const getEffectiveStatus = (appt) => {
    const terminalStatuses = ['completed', 'cancelled', 'missed', 'checked_in', 'in_progress'];
    if (terminalStatuses.includes(appt.status)) return appt.status;
    const slotTime = new Date(`${appt.date}T${appt.time || '00:00:00'}`);
    const gracePeriodMs = 30 * 60 * 1000; // 30 minutes
    if (currentTime - slotTime.getTime() > gracePeriodMs) return 'missed';
    return appt.status;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center">
        <h3 className="font-bold text-navy text-lg">My Appointments</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
              <th className="px-6 py-4">Doctor & Specialization</th>
              <th className="px-6 py-4">Date & Time</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Location</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {[...appointments]
              .sort((a, b) => {
                const da = new Date(`${a.date}T${a.time || '00:00:00'}`);
                const db = new Date(`${b.date}T${b.time || '00:00:00'}`);
                return db - da;
              })
              .map((appt) => (
              <tr key={appt.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold mr-3">
                      <Stethoscope size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-navy">Dr. {appt.doctor_name || 'N/A'}</p>
                      <p className="text-xs text-slate-500">{appt.doctor_specialization || 'General Physician'}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col text-slate-700 font-medium">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-slate-400" />
                      {appt.date}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                      <Clock size={12} />
                      {appt.time?.substring(0, 5) || 'N/A'}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <Badge colorClass={appt.appointment_type === 'virtual' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'}>
                    {appt.appointment_type === 'virtual' ? 'Virtual' : 'In-Person'}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600 font-semibold">
                  {(() => {
                    const effectiveStatus = getEffectiveStatus(appt);
                    const cfg = {
                      confirmed:   { label: 'Confirmed',   cls: 'bg-emerald-500/15 text-emerald-700 border border-emerald-400/30 backdrop-blur-sm' },
                      pending:     { label: 'Pending',     cls: 'bg-amber-500/15 text-amber-700 border border-amber-400/30 backdrop-blur-sm'       },
                      checked_in:  { label: 'Checked In',  cls: 'bg-blue-500/15 text-blue-700 border border-blue-400/30 backdrop-blur-sm'          },
                      in_progress: { label: 'In Progress', cls: 'bg-indigo-500/15 text-indigo-700 border border-indigo-400/30 backdrop-blur-sm'    },
                      completed:   { label: 'Completed',   cls: 'bg-teal-500/15 text-teal-700 border border-teal-400/30 backdrop-blur-sm'          },
                      cancelled:   { label: 'Cancelled',   cls: 'bg-slate-500/15 text-slate-500 border border-slate-400/30 backdrop-blur-sm'       },
                      rescheduled: { label: 'Rescheduled', cls: 'bg-purple-500/15 text-purple-700 border border-purple-400/30 backdrop-blur-sm'    },
                      missed:      { label: 'Missed',      cls: 'bg-red-500/15 text-red-600 border border-red-400/30 backdrop-blur-sm'             },
                    };
                    const s = cfg[effectiveStatus] || { label: effectiveStatus, cls: 'bg-slate-500/15 text-slate-600 border border-slate-400/30 backdrop-blur-sm' };
                    return (
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${s.cls}`}>
                        {s.label}
                      </span>
                    );
                  })()}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-slate-700">
                    <MapPin size={14} className="text-slate-400" />
                    <span className="text-sm font-medium">{appt.clinic_location || appt.patient_location || 'Main Clinic'}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    {appt.status === 'pending' && getEffectiveStatus(appt) !== 'missed' && (
                      <button
                        onClick={() => onAction(appt.id, 'cancelled')}
                        className="bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border border-rose-100 shadow-sm"
                      >
                        Cancel
                      </button>
                    )}
                    {getEffectiveStatus(appt) !== 'completed' && getEffectiveStatus(appt) !== 'cancelled' && (
                      <button
                        onClick={() => onAction(appt.id, 'reschedule')}
                        className="bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border border-blue-100 shadow-sm"
                      >
                        Reschedule
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )) }
            {appointments.length === 0 && (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center text-slate-400 italic">
                  No appointments found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PatientAppointmentTable;
