import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import RescheduleModal from '../shared/appointments/RescheduleModal';
import PatientStats from './PatientStats';
import Toast from '../shared/Toast';
import EditableProfileModal from './EditableProfileModal';
import { 
  User, 
  Calendar, 
  Clipboard, 
  FileText, 
  Activity, 
  Clock, 
  Plus, 
  ChevronRight,
  Bell,
  Settings,
  Heart,
  CheckCircle,
  X
} from 'lucide-react';

const PatientDashboard = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [patientProfile, setPatientProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rescheduleData, setRescheduleData] = useState({ isOpen: false, appointment: null });
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [toast, setToast] = useState(null);


  useEffect(() => {
    const fetchData = async () => {
      try {
        const [apptRes, patientRes] = await Promise.all([
          api.get('/api/appointments/appointments/'),
          api.get('/api/users/patients/')
        ]);
        
        const apptsData = Array.isArray(apptRes?.data) ? apptRes.data : (apptRes?.data?.results ?? []);
        setAppointments(apptsData);
        
        const patientData = Array.isArray(patientRes?.data) ? patientRes.data : (patientRes?.data?.results ?? []);
        if (patientData.length > 0) {
          setPatientProfile(patientData[0]);
        }
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    
    // Set up polling to check for updates (reschedules/confirmations) every 15 seconds
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);
  
  const handleAction = async (id, status, data = null) => {
    try {
      if (status === 'reschedule') {
        const appt = appointments.find(a => a.id === id);
        setRescheduleData({ isOpen: true, appointment: appt });
        return;
      }
      
      if (status === 'submit_reschedule') {
        await api.post(`/api/appointments/appointments/${rescheduleData.appointment.id}/reschedule/`, data);
        setRescheduleData({ isOpen: false, appointment: null });
        setToast({ message: "Reschedule request sent successfully!", type: 'success' });
      } else {
        await api.patch(`/api/appointments/appointments/${id}/`, { status });
        if (status === 'confirmed') {
          setToast({ message: "Appointment confirmed and added to your schedule!", type: 'success' });
        } else if (status === 'cancelled') {
          setToast({ message: "Appointment cancelled successfully.", type: 'info' });
        }
      }

      const res = await api.get('/api/appointments/appointments/');
      const apptsData = Array.isArray(res?.data) ? res.data : (res?.data?.results ?? []);
      setAppointments(apptsData);
    } catch (err) {
      console.error("Action failed", err);
    }
  };

  const now = new Date();
  const upcomingAppointments = appointments.filter(a => {
    if (!a.date || !a.time) return false;
    return new Date(`${a.date}T${a.time}`) >= now && a.status !== 'completed' && a.status !== 'cancelled';
  });
  const previousVisits = appointments.filter(a => {
    if (a.status === 'completed') return true;
    if (!a.date || !a.time) return false;
    return new Date(`${a.date}T${a.time}`) < now;
  });
  
  const statsData = {
    upcoming: upcomingAppointments.length,
    pending: appointments.filter(a => a.status === 'pending').length,
    revisit: previousVisits.length + 1,
    history: previousVisits.length
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto w-full p-4 md:p-8 space-y-8 animate-fade-in">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-navy mb-2">Health Dashboard</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-500">
              Welcome back, <span className="text-blue-600 font-bold cursor-pointer hover:underline" onClick={() => setIsProfileOpen(true)}>{patientProfile?.full_name || user?.full_name}</span>
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-medium text-slate-400">Patient ID: #PAT-{user?.id || '000'}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/appointments')}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-md shadow-blue-100 transition-all text-sm"
          >
            <Plus size={16} /> Book Appointment
          </button>
        </div>
      </div>

      {/* Statistics */}
      <PatientStats stats={statsData} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Content (Left 2/3) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Upcoming Appointments */}
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-navy flex items-center gap-2">
                <Calendar className="text-blue-500" size={22} />
                Upcoming Appointments
              </h2>
              <button 
                onClick={() => navigate('/my-appointments')}
                className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                View all <ChevronRight size={14} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {upcomingAppointments.length > 0 ? (
                upcomingAppointments.map(appt => (
                  <AppointmentItem key={appt.id} appt={appt} onAction={handleAction} />
                ))
              ) : (
                <EmptyState message="No upcoming appointments found. Start your health journey by booking one!" />
              )}
            </div>
          </section>


        </div>

        {/* Sidebar (Right 1/3) */}
        <div className="space-y-8">
          


          {/* Quick Support / Health Tips */}
          <div className="bg-indigo-900 rounded-3xl p-8 text-white shadow-xl overflow-hidden relative">
            <div className="absolute -right-8 -bottom-8 opacity-10">
              <Heart size={160} />
            </div>
            <div className="relative z-10">
              <h3 className="font-bold text-2xl mb-4 leading-tight">Health Support 24/7</h3>
              <p className="text-indigo-100 text-sm mb-6 opacity-80">Need assistance? Our team is here to help you with your appointments and health records.</p>
              <button 
                onClick={() => navigate('/chat')}
                className="w-full bg-white text-indigo-900 hover:bg-indigo-50 py-3 rounded-xl font-bold text-sm transition-all shadow-lg"
              >
                Chat with Assistant
              </button>
            </div>
          </div>

          {/* Settings / Account */}
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Account Settings</h4>
            <ul className="space-y-4">
              <li 
                onClick={() => setIsProfileOpen(true)}
                className="flex items-center justify-between text-sm font-medium text-slate-600 cursor-pointer hover:text-blue-600 transition-colors"
              >
                <span className="flex items-center gap-3"><User size={16} /> My Profile</span>
                <ChevronRight size={14} />
              </li>
              <li 
                onClick={() => navigate('/appointments')}
                className="flex items-center justify-between text-sm font-medium text-slate-600 cursor-pointer hover:text-blue-600 transition-colors"
              >
                <span className="flex items-center gap-3"><Calendar size={16} /> Book Appointment</span>
                <ChevronRight size={14} />
              </li>
              <li 
                onClick={() => navigate('/queue')}
                className="flex items-center justify-between text-sm font-medium text-slate-600 cursor-pointer hover:text-blue-600 transition-colors"
              >
                <span className="flex items-center gap-3"><Bell size={16} /> My Queue Status</span>
                <ChevronRight size={14} />
              </li>
              <li 
                onClick={() => navigate('/change-password')}
                className="flex items-center justify-between text-sm font-medium text-slate-600 cursor-pointer hover:text-blue-600 transition-colors"
              >
                <span className="flex items-center gap-3"><Settings size={16} /> Change Password</span>
                <ChevronRight size={14} />
              </li>
            </ul>
          </div>

        </div>
      </div>

      <RescheduleModal 
        isOpen={rescheduleData.isOpen}
        onClose={() => setRescheduleData({ isOpen: false, appointment: null })}
        onConfirm={(data) => handleAction(null, 'submit_reschedule', data)}
        appointment={rescheduleData.appointment}
      />

      <EditableProfileModal 
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        initialProfile={patientProfile}
        onUpdate={(updated) => setPatientProfile(updated)}
      />

      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </div>
  );
};

const AppointmentItem = ({ appt, onAction }) => (
  <div className="p-5 rounded-2xl border border-slate-100 bg-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-md transition-all group border-l-4 border-l-blue-500">
    <div className="flex items-center gap-4">
      <div className="w-14 h-14 rounded-2xl bg-slate-50 flex flex-col items-center justify-center border border-slate-100 text-slate-600 group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors">
        <span className="text-[10px] font-bold uppercase text-slate-400 group-hover:text-blue-400">{new Date(appt.date).toLocaleString('default', { month: 'short' })}</span>
        <span className="text-xl font-bold leading-none text-navy">{new Date(appt.date).getDate()}</span>
      </div>
      <div>
        <h4 className="font-bold text-navy text-lg">{appt.doctor_name}</h4>
        <p className="text-xs text-slate-500 flex items-center gap-2 mt-1">
          <Clock size={14} className="text-blue-500" /> {appt.time?.substring(0, 5) || 'N/A'} • <span className="capitalize">{appt.appointment_type}</span>
        </p>
      </div>
    </div>
    <div className="flex items-center gap-2 w-full sm:w-auto">
      <button 
        onClick={() => onAction(appt.id, 'reschedule')}
        className="flex-1 sm:flex-none px-5 py-2.5 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-xl transition-colors border border-blue-50"
      >
        Reschedule
      </button>
      <button 
        onClick={() => onAction(appt.id, 'cancelled')}
        className="flex-1 sm:flex-none px-5 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors border border-rose-50"
      >
        Cancel
      </button>
    </div>
  </div>
);

const EmptyState = ({ message }) => (
  <div className="py-12 px-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
      <Calendar size={28} className="text-slate-300" />
    </div>
    <p className="text-slate-500 text-sm font-medium max-w-xs mx-auto leading-relaxed">{message}</p>
  </div>
);

export default PatientDashboard;
