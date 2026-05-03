import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import RescheduleModal from '../appointments/RescheduleModal';
import { User, Calendar, Clipboard, FileText, Activity, Clock, Plus } from 'lucide-react';

const PatientDashboard = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [patientProfile, setPatientProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rescheduleData, setRescheduleData] = useState({ isOpen: false, appointment: null });

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
      } else {
        await api.patch(`/api/appointments/appointments/${id}/`, { status });
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
  
  // Calculate stats
  const pendingVisits = appointments.filter(a => a.status === 'pending').length;
  const revisitNumber = previousVisits.length + 1;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Health Dashboard</h1>
          <p className="text-gray-500">Welcome back, <span className="text-blue-600 font-semibold">{patientProfile?.full_name || user?.full_name}</span></p>
        </div>
        <div className="flex items-center gap-3">
            <button 
                onClick={() => navigate('/appointments')}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-blue-200 transition-all transform active:scale-95"
            >
                <Plus size={20} />
                New Appointment
            </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Calendar className="text-blue-600" />} label="Upcoming" value={upcomingAppointments.length} color="blue" />
        <StatCard icon={<Clock className="text-amber-600" />} label="Pending" value={pendingVisits} color="amber" />
        <StatCard icon={<Activity className="text-emerald-600" />} label="Revisit #" value={revisitNumber} color="emerald" />
        <StatCard icon={<Clipboard className="text-purple-600" />} label="History" value={previousVisits.length} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Upcoming */}
          <section>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Upcoming Appointments</h2>
                <button onClick={() => navigate('/my-appointments')} className="text-sm text-blue-600 font-semibold hover:underline">View all</button>
            </div>
            <div className="space-y-4">
              {upcomingAppointments.length > 0 ? (
                upcomingAppointments.map(appt => (
                  <AppointmentItem key={appt.id} appt={appt} onAction={handleAction} />
                ))
              ) : (
                <EmptyState message="No upcoming appointments" />
              )}
            </div>
          </section>

          {/* Medical History & Records */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="text-blue-500" size={20} />
                Recent Prescriptions
              </h3>
              <div className="space-y-3">
                {/* Mock prescriptions for UI display */}
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <p className="font-semibold text-gray-800 text-sm">Amoxicillin 500mg</p>
                  <p className="text-xs text-gray-500">Dr. Sarah Johnson • 2 days ago</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <p className="font-semibold text-gray-800 text-sm">Paracetamol 650mg</p>
                  <p className="text-xs text-gray-500">Dr. Robert Chen • 1 week ago</p>
                </div>
                <button onClick={() => navigate('/prescriptions')} className="w-full py-2 text-sm text-blue-600 font-medium hover:bg-blue-50 rounded-lg transition-colors">See all prescriptions</button>
              </div>
            </section>

            <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Activity className="text-emerald-500" size={20} />
                Latest Test Results
              </h3>
              <div className="space-y-3">
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <p className="font-semibold text-gray-800 text-sm">Blood Work (CBC)</p>
                  <p className="text-xs text-emerald-600 font-medium">Completed • Yesterday</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <p className="font-semibold text-gray-800 text-sm">X-Ray Chest</p>
                  <p className="text-xs text-emerald-600 font-medium">Completed • 3 days ago</p>
                </div>
                <button onClick={() => navigate('/test-results')} className="w-full py-2 text-sm text-blue-600 font-medium hover:bg-blue-50 rounded-lg transition-colors">View all reports</button>
              </div>
            </section>
          </div>
        </div>

        {/* Sidebar info */}
        <div className="space-y-6">
           {/* Profile Card */}
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full -mr-8 -mt-8 z-0"></div>
            <div className="relative z-10">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Profile Overview</h2>
                {patientProfile ? (
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-2xl shadow-lg ring-4 ring-blue-50">
                            {patientProfile.full_name?.charAt(0) || 'P'}
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">{patientProfile.full_name}</h3>
                            <p className="text-xs text-gray-500 font-medium">Patient ID: {patientProfile.patient_id}</p>
                        </div>
                    </div>
                    
                    <div className="space-y-3 pt-2">
                        <InfoRow label="Blood Group" value={patientProfile.blood_group || 'N/A'} />
                        <InfoRow label="Contact" value={patientProfile.mobile_number || 'N/A'} />
                        <InfoRow label="Email" value={patientProfile.email || 'N/A'} />
                        <InfoRow label="Address" value={patientProfile.address || 'N/A'} />
                    </div>
                </div>
                ) : (
                <div className="animate-pulse space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gray-200 rounded-full"></div>
                        <div className="space-y-2">
                            <div className="h-4 w-24 bg-gray-200 rounded"></div>
                            <div className="h-3 w-16 bg-gray-200 rounded"></div>
                        </div>
                    </div>
                </div>
                )}
            </div>
          </div>

          {/* Quick Stats / Alerts */}
          <div className="bg-gray-900 text-white p-6 rounded-2xl shadow-xl">
            <h3 className="font-bold mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
                Health Alerts
            </h3>
            <div className="space-y-4">
                <div className="text-sm border-l-2 border-blue-400 pl-3">
                    <p className="font-semibold">Next Vaccination</p>
                    <p className="text-gray-400 text-xs">Flu shot due in 2 weeks</p>
                </div>
                <div className="text-sm border-l-2 border-amber-400 pl-3">
                    <p className="font-semibold">Allergies</p>
                    <p className="text-gray-400 text-xs">{patientProfile?.known_allergies || 'None reported'}</p>
                </div>
            </div>
          </div>
        </div>
      </div>

      <RescheduleModal 
        isOpen={rescheduleData.isOpen}
        onClose={() => setRescheduleData({ isOpen: false, appointment: null })}
        onConfirm={(data) => handleAction(null, 'submit_reschedule', data)}
        appointment={rescheduleData.appointment}
      />
    </div>
  );
};

const StatCard = ({ icon, label, value, color }) => {
    const colors = {
        blue: 'bg-blue-50 text-blue-600',
        amber: 'bg-amber-50 text-amber-600',
        emerald: 'bg-emerald-50 text-emerald-600',
        purple: 'bg-purple-50 text-purple-600'
    };
    return (
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className={`p-3 rounded-xl ${colors[color]}`}>
                {React.cloneElement(icon, { size: 24 })}
            </div>
            <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
            </div>
        </div>
    );
};

const InfoRow = ({ label, value }) => (
    <div className="flex justify-between text-sm">
        <span className="text-gray-500">{label}</span>
        <span className="font-medium text-gray-900">{value}</span>
    </div>
);

const AppointmentItem = ({ appt, onAction }) => (
    <div className="p-4 rounded-xl border border-gray-100 bg-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-md transition-all">
        <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gray-50 flex flex-col items-center justify-center border border-gray-100 text-gray-600">
                <span className="text-[10px] font-bold uppercase">{new Date(appt.date).toLocaleString('default', { month: 'short' })}</span>
                <span className="text-lg font-bold leading-none">{new Date(appt.date).getDate()}</span>
            </div>
            <div>
                <h4 className="font-bold text-gray-900">{appt.doctor_name}</h4>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock size={12} /> {appt.time.substring(0, 5)} • {appt.appointment_type}
                </p>
            </div>
        </div>
        <div className="flex items-center gap-2">
            <button 
                onClick={() => onAction(appt.id, 'reschedule')}
                className="px-4 py-2 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
                Reschedule
            </button>
            <button 
                onClick={() => onAction(appt.id, 'cancelled')}
                className="px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
                Cancel
            </button>
        </div>
    </div>
);

const EmptyState = ({ message }) => (
    <div className="py-12 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
        <p className="text-gray-500 text-sm font-medium">{message}</p>
    </div>
);

export default PatientDashboard;
