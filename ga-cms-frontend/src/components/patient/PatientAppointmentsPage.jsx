import React, { useEffect, useState } from 'react';

import { useAppointmentStore } from '../../store/appointmentStore';
import PatientAppointmentTable from './PatientAppointmentTable';
import { Calendar, RefreshCw, Plus, X } from 'lucide-react';
import RescheduleModal from '../shared/appointments/RescheduleModal';
import BookAppointment from './BookAppointment';
import api from '../../api/axios';

const PatientAppointmentsPage = () => {

  const { appointments, loading, fetchDoctorDashboardData, updateAppointmentStatus } = useAppointmentStore();
  const [rescheduleData, setRescheduleData] = useState({ isOpen: false, appointment: null });
  const [isBooking, setIsBooking] = useState(false);

  useEffect(() => {
    // We use the same fetch function but it's filtered by user role on backend
    fetchDoctorDashboardData();
  }, [fetchDoctorDashboardData]);


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
            {isBooking ? 'Book New Appointment' : 'My Appointments'}
          </h1>
          <p className="text-slate-500 text-sm">
            {isBooking 
              ? 'Fill in the details below to schedule your visit.' 
              : 'View and manage your clinical consultations.'}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsBooking(!isBooking)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm shadow-lg transition-all active:scale-95 ${
              isBooking 
                ? 'bg-slate-100 text-slate-600 hover:bg-slate-200 shadow-slate-100' 
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200'
            }`}
          >
            {isBooking ? <X size={18} /> : <Plus size={18} />}
            {isBooking ? 'Cancel Booking' : 'Book New Appointment'}
          </button>
          {!isBooking && (
            <button 
              onClick={fetchDoctorDashboardData}
              className="p-2.5 rounded-xl border border-gray-200 text-slate-500 hover:bg-slate-50 transition-colors"
              title="Refresh"
            >
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            </button>
          )}
        </div>
      </div>

      {isBooking ? (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden p-8 animate-in zoom-in-95 duration-300">
          <BookAppointment onBack={() => {
            setIsBooking(false);
            fetchDoctorDashboardData();
          }} />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Quick Filter Bar */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {['All My Bookings', 'Upcoming', 'Pending Confirmation', 'Past Visits'].map((filter, i) => (
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
              <PatientAppointmentTable 
                appointments={appointments} 
                onAction={handleAction} 
              />
            )}
          </div>
        </div>
      )}

      <RescheduleModal 
        isOpen={rescheduleData.isOpen}
        onClose={() => setRescheduleData({ isOpen: false, appointment: null })}
        onConfirm={handleRescheduleSubmit}
        appointment={rescheduleData.appointment}
      />
    </div>
  );
};

export default PatientAppointmentsPage;
