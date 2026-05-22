import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import RescheduleModal from '../shared/appointments/RescheduleModal';
import PatientStats from './PatientStats';
import Toast from '../shared/Toast';
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
  const [toast, setToast] = useState(null);
  const [dismissedConfirmations, setDismissedConfirmations] = useState(() => {
    return JSON.parse(localStorage.getItem('dismissedConfirmations') || '[]');
  });

  const handleDismissConfirmation = (id) => {
    const newDismissed = [...dismissedConfirmations, id];
    setDismissedConfirmations(newDismissed);
    localStorage.setItem('dismissedConfirmations', JSON.stringify(newDismissed));
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [apptRes, patientRes] = await Promise.all([
          api.get('/api/appointments/appointments/'),
          api.get('/api/users/patients/')
        ]);
        
        setAppointments(apptRes.data || []);
        
        if (patientRes.data && patientRes.data.length > 0) {
          setPatientProfile(patientRes.data[0]);
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
      setAppointments(res.data || []);
    } catch (err) {
      console.error("Action failed", err);
    }
  };

  const now = new Date();
  const upcomingAppointments = appointments.filter(a => new Date(`${a.date}T${a.time}`) >= now && a.status !== 'completed' && a.status !== 'cancelled');
  const previousVisits = appointments.filter(a => new Date(`${a.date}T${a.time}`) < now || a.status === 'completed');
  
  const statsData = {
    upcoming: upcomingAppointments.length,
    pending: appointments.filter(a => a.status === 'pending').length,
    revisit: previousVisits.length + 1,
    history: previousVisits.length
  };

  const rescheduledAppointments = appointments.filter(a => a.status === 'rescheduled');
  const newlyConfirmed = appointments.filter(a => a.status === 'confirmed' && !dismissedConfirmations.includes(a.id));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto w-full p-4 md:p-8 space-y-8 animate-fade-in">
      
      {/* Reschedule Notifications */}
      {(rescheduledAppointments.length > 0 || newlyConfirmed.length > 0) && (
        <div className="space-y-3">
          {rescheduledAppointments.map(appt => (
            <div key={appt.id} className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 animate-in slide-in-from-top duration-500">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 shadow-inner">
                  <Bell className="animate-bounce" size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-amber-900 text-sm">Action Required: Rescheduled</h4>
                  <p className="text-amber-700 text-xs mt-1">
                    Dr. {appt.doctor_name} moved your appointment to <span className="font-bold">{appt.date}</span> at <span className="font-bold">{appt.time.substring(0, 5)}</span>.
                  </p>
                </div>
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <button 
                  onClick={() => handleAction(appt.id, 'confirmed')}
                  className="flex-1 md:flex-none px-6 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold hover:bg-amber-700 shadow-sm transition-all"
                >
                  Accept New Time
                </button>
              </div>
            </div>
          ))}

          {newlyConfirmed.map(appt => (
            <div key={appt.id} className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 animate-in slide-in-from-top duration-500 relative">
              <button 
                onClick={() => handleDismissConfirmation(appt.id)}
                className="absolute top-2 right-3 text-emerald-400 hover:text-emerald-700 transition-colors"
                title="Dismiss"
              >
                <X size={16} />
              </button>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 shadow-inner">
                  <CheckCircle className="text-emerald-500" size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-emerald-900 text-sm">Appointment Confirmed!</h4>
                  <p className="text-emerald-700 text-xs mt-1">
                    Your visit with Dr. {appt.doctor_name} on {appt.date} is now officially confirmed.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => navigate('/my-appointments')}
                className="w-full md:w-auto px-6 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 shadow-sm transition-all"
              >
                View Details
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-navy mb-2">Health Dashboard</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-500">
              Welcome back, <span className="text-blue-600 font-bold">{patientProfile?.full_name || user?.full_name}</span>
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-medium text-slate-400">Patient ID: #PAT-{user?.id || '000'}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Action buttons could go here */}
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
              <button className="w-full bg-white text-indigo-900 hover:bg-indigo-50 py-3 rounded-xl font-bold text-sm transition-all shadow-lg">
                Chat with Assistant
              </button>
            </div>
          </div>

          {/* Settings / Account */}
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Account Settings</h4>
            <ul className="space-y-4">
              <li className="flex items-center justify-between text-sm font-medium text-slate-600 cursor-pointer hover:text-blue-600 transition-colors">
                <span className="flex items-center gap-3"><User size={16} /> Profile Information</span>
                <ChevronRight size={14} />
              </li>
              <li className="flex items-center justify-between text-sm font-medium text-slate-600 cursor-pointer hover:text-blue-600 transition-colors">
                <span className="flex items-center gap-3"><Bell size={16} /> Notification Settings</span>
                <ChevronRight size={14} />
              </li>
              <li className="flex items-center justify-between text-sm font-medium text-slate-600 cursor-pointer hover:text-blue-600 transition-colors">
                <span className="flex items-center gap-3"><Settings size={16} /> Privacy & Security</span>
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
          <Clock size={14} className="text-blue-500" /> {appt.time.substring(0, 5)} • <span className="capitalize">{appt.appointment_type}</span>
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
