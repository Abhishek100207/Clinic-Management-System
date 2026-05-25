import React, { useState, useEffect } from 'react';
import { Calendar, Search, Filter, MoreHorizontal, User, Clock } from 'lucide-react';
import api from '../../api/axios';
import { Spinner } from '../shared/Spinner';

const AdminAppointmentsPage = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const res = await api.get('/api/appointments/appointments/');
        setAppointments(res.data.results || res.data);
      } catch (err) {
        console.error("Failed to fetch appointments:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, []);

  const filteredAppointments = appointments.filter(a => 
    a.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    a.doctor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.id?.toString().includes(searchTerm)
  );

  const getStatusColor = (status) => {
    switch(status) {
      case 'completed': return 'bg-emerald-100 text-emerald-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-amber-100 text-amber-800';
      case 'cancelled': return 'bg-rose-100 text-rose-800';
      case 'in_progress': return 'bg-purple-100 text-purple-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="max-w-7xl mx-auto w-full p-4 md:p-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-navy mb-2">Global Appointment Schedule</h1>
          <p className="text-slate-500">Overview of all appointments across all doctors and departments.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search by ID, patient, doctor..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-white border border-slate-200 pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all w-64 shadow-sm"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center"><Spinner /></div>
        ) : filteredAppointments.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar size={28} className="text-purple-500" />
            </div>
            <h3 className="text-lg font-bold text-navy mb-2">No Appointments Found</h3>
            <p className="text-slate-500 text-sm max-w-sm mx-auto">
              There are no appointments matching your search.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="p-4 font-bold">Appt ID</th>
                  <th className="p-4 font-bold">Patient</th>
                  <th className="p-4 font-bold">Doctor</th>
                  <th className="p-4 font-bold">Date & Time</th>
                  <th className="p-4 font-bold">Type</th>
                  <th className="p-4 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAppointments.map(appt => (
                  <tr key={appt.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 text-sm font-mono text-indigo-600 font-bold">APT-{appt.id}</td>
                    <td className="p-4 text-sm font-bold text-slate-800">{appt.patient_name}</td>
                    <td className="p-4 text-sm text-slate-600 font-medium">Dr. {appt.doctor_name}</td>
                    <td className="p-4 text-sm text-slate-500">
                      <div className="flex items-center gap-1"><Calendar size={14}/> {appt.date}</div>
                      <div className="flex items-center gap-1 mt-1"><Clock size={14}/> {appt.time}</div>
                    </td>
                    <td className="p-4 text-sm text-slate-500 capitalize">{appt.appointment_type.replace('_', ' ')}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusColor(appt.status)}`}>
                        {appt.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAppointmentsPage;
