import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppointmentStore } from '../../store/appointmentStore';
import { useAuthStore } from '../../store/authStore';
import AppointmentTable from './AppointmentTable';
import { Calendar, Filter, RefreshCw, Plus } from 'lucide-react';
import RescheduleModal from '../shared/appointments/RescheduleModal';
import api from '../../api/axios';

const DoctorAppointmentsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { appointments, loading, fetchDoctorDashboardData, updateAppointmentStatus } = useAppointmentStore();
  const [rescheduleData, setRescheduleData] = useState({ isOpen: false, appointment: null });
  const [activeFilter, setActiveFilter] = useState('All Appointments');

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

  // Apply filter logic
  const today = new Date();
  const filteredAppointments = appointments.filter(appt => {
    if (activeFilter === 'All Appointments') return true;
    
    const apptDate = appt.date ? (() => {
      const [y, m, d] = appt.date.split('-').map(Number);
      return new Date(y, m - 1, d);
    })() : null;

    if (activeFilter === 'Today') {
      return apptDate &&
        apptDate.getDate() === today.getDate() &&
        apptDate.getMonth() === today.getMonth() &&
        apptDate.getFullYear() === today.getFullYear();
    }
    if (activeFilter === 'Upcoming') {
      return apptDate && apptDate >= today && !['completed', 'cancelled'].includes(appt.status);
    }
    if (activeFilter === 'Pending Approval') {
      return appt.status === 'pending';
    }
    if (activeFilter === 'Completed') {
      return appt.status === 'completed';
    }
    return true;
  });

  const filters = ['All Appointments', 'Today', 'Upcoming', 'Pending Approval', 'Completed'];

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
        </div>
      </div>

      <div className="space-y-6">
        {/* Quick Filter Bar */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {filters.map((filter) => (
            <button 
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                activeFilter === filter
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white border border-gray-200 text-slate-500 hover:border-blue-300 hover:text-blue-600'
              }`}
            >
              {filter}
              {filter === 'Pending Approval' && appointments.filter(a => a.status === 'pending').length > 0 && (
                <span className="ml-1.5 bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                  {appointments.filter(a => a.status === 'pending').length}
                </span>
              )}
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
              appointments={filteredAppointments} 
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
