import React, { useEffect } from 'react';
import { useAppointmentStore } from '../../store/appointmentStore';
import AppointmentTable from '../dashboards/doctor/AppointmentTable';
import { Calendar, Filter, RefreshCw } from 'lucide-react';
import RescheduleModal from './RescheduleModal';
import api from '../../api/axios';
import { useState } from 'react';

const DoctorAppointmentsPage = () => {
  const { appointments, loading, fetchDoctorDashboardData, updateAppointmentStatus } = useAppointmentStore();
  const [rescheduleData, setRescheduleData] = useState({ isOpen: false, appointment: null });

  useEffect(() => {
    fetchDoctorDashboardData();
  }, []);

  const handleAction = (id, action) => {
    if (action === 'reschedule') {
      const appt = appointments.find(a => a.id === id);
      setRescheduleData({ isOpen: true, appointment: appt });
    } else {
      updateAppointmentStatus(id, action);
    }
  };

  const handleRescheduleSubmit = async (data) => {
    try {
      await api.post(`/api/appointments/appointments/${rescheduleData.appointment.id}/reschedule/`, data);
      setRescheduleData({ isOpen: false, appointment: null });
      fetchDoctorDashboardData();
      alert("Appointment rescheduled successfully.");
    } catch (err) {
      alert("Failed to reschedule: " + (err.response?.data?.error || ""));
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto w-full animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-navy mb-2 flex items-center gap-3">
            <Calendar className="text-blue-600" />
            My Appointments
          </h1>
          <p className="text-slate-500 text-sm">Manage your daily consultation schedule and patient queue.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchDoctorDashboardData}
            className="p-2.5 rounded-xl border border-gray-200 text-slate-500 hover:bg-slate-50 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm">
            <Filter size={16} />
            Filter
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Quick Filter Bar */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {['All Appointments', 'Today', 'Upcoming', 'Pending Approval', 'Completed'].map((filter, i) => (
            <button 
              key={i}
              className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                i === 0 ? 'bg-blue-600 text-white shadow-md' : 'bg-white border border-gray-200 text-slate-500 hover:border-blue-300 hover:text-blue-600'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Appointment Table */}
        <div className="min-h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-12 h-12 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin"></div>
            </div>
          ) : (
            <AppointmentTable 
              appointments={appointments} 
              onAction={handleAction} 
            />
          )}
        </div>
      </div>

      <RescheduleModal 
        isOpen={rescheduleData.isOpen}
        onClose={() => setRescheduleData({ isOpen: false, appointment: null })}
        onConfirm={handleRescheduleSubmit}
        appointment={rescheduleData.appointment}
      />
    </div>
  );
};

export default DoctorAppointmentsPage;
