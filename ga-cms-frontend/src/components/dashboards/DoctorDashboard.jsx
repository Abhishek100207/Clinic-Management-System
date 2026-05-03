import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import { useAppointmentStore } from '../../store/appointmentStore';
import DoctorStats from './doctor/DoctorStats';
import AppointmentTable from './doctor/AppointmentTable';
import AvailabilityCalendar from './doctor/AvailabilityCalendar';
import EmergencyRescheduler from './doctor/EmergencyRescheduler';
import RescheduleModal from '../appointments/RescheduleModal';
import { Badge } from '../shared/Badge';
import { Bell, Settings, AlertTriangle, CheckCircle, FileText, ToggleLeft, ToggleRight, Plus } from 'lucide-react';

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { 
    appointments, 
    stats, 
    fetchDoctorDashboardData, 
    updateAppointmentStatus,
    notificationsEnabled,
    toggleNotifications,
    emergencyReschedule
  } = useAppointmentStore();

  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [showMorningConfirmation, setShowMorningConfirmation] = useState(false);
  const [isConfirmedForToday, setIsConfirmedForToday] = useState(false);
  const [rescheduleData, setRescheduleData] = useState({ isOpen: false, appointment: null });

  useEffect(() => {
    fetchDoctorDashboardData();
    
    // Logic for morning confirmation: Show if it's before 11 AM and not yet confirmed
    const hour = new Date().getHours();
    if (hour < 11) {
      setShowMorningConfirmation(true);
    }
  }, []);

  const handleConfirmSchedule = () => {
    setIsConfirmedForToday(true);
    setShowMorningConfirmation(false);
    // In a real app, this might send an API call to "activate" the day's schedule
  };

  const handleEmergencyConfirm = async (data) => {
    try {
      await emergencyReschedule(data);
      setIsEmergencyModalOpen(false);
      alert("Patients have been notified and appointments rescheduled.");
    } catch (err) {
      alert("Failed to reschedule. Please try again.");
    }
  };

  const handleRescheduleSubmit = async (data) => {
    try {
      await api.post(`/api/appointments/appointments/${rescheduleData.appointment.id}/reschedule/`, data);
      setRescheduleData({ isOpen: false, appointment: null });
      fetchDoctorDashboardData();
      alert("Appointment rescheduled successfully.");
    } catch (err) {
      alert("Failed to reschedule. " + (err.response?.data?.error || ""));
    }
  };

  const handleAction = (id, action) => {
    if (action === 'reschedule') {
      const appt = appointments.find(a => a.id === id);
      setRescheduleData({ isOpen: true, appointment: appt });
    } else {
      updateAppointmentStatus(id, action);
    }
  };

  return (
    <div className="max-w-7xl mx-auto w-full p-4 md:p-8 space-y-8 animate-fade-in">
      
      {/* Morning Confirmation Banner */}
      {showMorningConfirmation && !isConfirmedForToday && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-xl">
              <CheckCircle size={28} />
            </div>
            <div>
              <h2 className="text-xl font-bold">Good Morning, Dr. {user?.full_name}!</h2>
              <p className="text-blue-100 opacity-90">Ready to start your day? Please confirm your availability for today's sessions.</p>
            </div>
          </div>
          <button 
            onClick={handleConfirmSchedule}
            className="bg-white text-blue-600 font-bold px-8 py-3 rounded-xl hover:bg-blue-50 transition-colors shadow-md whitespace-nowrap"
          >
            Confirm Daily Schedule
          </button>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-navy mb-2">Doctor Dashboard</h1>
          <div className="flex items-center gap-3">
            <Badge colorClass="bg-blue-100 text-blue-800">Senior Doctor</Badge>
            <span className="text-slate-400">•</span>
            <span className="text-sm font-medium text-slate-500">Last login: Today, 08:30 AM</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-gray-100 px-4 py-2 rounded-xl shadow-sm">
            <span className="text-sm font-bold text-slate-600">Auto-Notifications</span>
            <button onClick={toggleNotifications} className="text-blue-600 transition-colors">
              {notificationsEnabled ? <ToggleRight size={32} /> : <ToggleLeft size={32} className="text-slate-300" />}
            </button>
          </div>
          <button 
            onClick={() => navigate('/appointments')}
            className="flex items-center gap-2 bg-blue-600 text-white font-bold px-4 py-2 rounded-xl shadow-md hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} />
            Book New
          </button>
          <button 
            onClick={() => setIsEmergencyModalOpen(true)}
            className="flex items-center gap-2 bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold px-4 py-2 rounded-xl border border-rose-100 transition-colors"
          >
            <AlertTriangle size={18} />
            Emergency
          </button>
        </div>
      </div>

      {/* Statistics */}
      <DoctorStats stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Content: Appointments */}
        <div className="lg:col-span-2 space-y-8">
          <AppointmentTable 
            appointments={appointments} 
            onAction={handleAction} 
          />
          
          <AvailabilityCalendar availabilities={user?.doctor_profile?.availabilities || []} />
        </div>

        {/* Sidebar: Activity Log & Notifications */}
        <div className="space-y-8">
          
          {/* Activity Log (Prescriptions & Notifications) */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-navy flex items-center gap-2">
                <FileText size={18} className="text-blue-500" />
                Activity Log
              </h3>
              <button className="text-xs text-slate-400 hover:text-blue-600">View All</button>
            </div>
            <div className="p-5 space-y-4">
              {[
                { type: 'prescription', text: 'Prescription generated for Rahul Verma', time: '10 mins ago', icon: <FileText size={14} /> },
                { type: 'appointment', text: 'New appointment request: Anjali Sharma', time: '45 mins ago', icon: <Bell size={14} /> },
                { type: 'system', text: 'Daily schedule confirmed successfully', time: '2 hours ago', icon: <CheckCircle size={14} /> },
              ].map((log, i) => (
                <div key={i} className="flex gap-3">
                  <div className="mt-1 w-7 h-7 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                    {log.icon}
                  </div>
                  <div>
                    <p className="text-sm text-navy font-medium leading-tight">{log.text}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{log.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Settings/Actions */}
          <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-lg overflow-hidden relative">
            <div className="absolute -right-4 -bottom-4 opacity-10">
              <Settings size={120} />
            </div>
            <h3 className="font-bold text-lg mb-4">Quick Settings</h3>
            <ul className="space-y-3">
              <li className="flex items-center justify-between text-sm opacity-90">
                <span>OP Availability</span>
                <span className="px-2 py-0.5 bg-emerald-500 rounded text-[10px] font-bold">ACTIVE</span>
              </li>
              <li className="flex items-center justify-between text-sm opacity-90">
                <span>Consultation Fee</span>
                <span className="font-bold">₹500</span>
              </li>
              <li className="flex items-center justify-between text-sm opacity-90">
                <span>Total Revenue (Today)</span>
                <span className="font-bold text-emerald-400">₹4,500</span>
              </li>
            </ul>
            <button className="w-full mt-6 bg-white/10 hover:bg-white/20 py-2 rounded-lg font-bold text-sm transition-colors border border-white/10">
              Update Profile
            </button>
          </div>

        </div>
      </div>

      <EmergencyRescheduler 
        isOpen={isEmergencyModalOpen} 
        onClose={() => setIsEmergencyModalOpen(false)}
        onConfirm={handleEmergencyConfirm}
      />

      <RescheduleModal 
        isOpen={rescheduleData.isOpen}
        onClose={() => setRescheduleData({ isOpen: false, appointment: null })}
        onConfirm={handleRescheduleSubmit}
        appointment={rescheduleData.appointment}
      />

    </div>
  );
};

export default DoctorDashboard;
