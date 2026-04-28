import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

const PatientDashboard = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const res = await api.get('/api/appointments/appointments/');
        setAppointments(res.data);
      } catch (err) {
        console.error("Failed to fetch appointments", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto rounded-3xl mt-4" style={{ background: 'linear-gradient(160deg,#020b18 0%,#041530 50%,#071e45 100%)', minHeight: 'calc(100vh - 120px)' }}>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Patient Dashboard</h1>
          <p className="text-white/60">Welcome back, {user?.first_name || user?.username || 'Patient'}!</p>
        </div>
        <button
          onClick={() => navigate('/appointments')}
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg transition-all flex items-center gap-2"
        >
          <span>➕</span> Book New Appointment
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Appointments Section */}
        <div className="lg:col-span-2">
          <div className="p-6 rounded-2xl border border-white/10" style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)' }}>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center justify-between">
              Upcoming Appointments
              <span className="text-sm font-normal bg-white/10 px-3 py-1 rounded-full">{appointments.length} scheduled</span>
            </h2>

            {loading ? (
              <p className="text-white/50 py-4">Loading appointments...</p>
            ) : appointments.length > 0 ? (
              <div className="space-y-4">
                {appointments.map((appt) => (
                  <div key={appt.id} className="p-4 rounded-xl border border-white/10 bg-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-white/10 transition-colors">
                    <div>
                      <h3 className="text-white font-semibold text-lg">{appt.doctor_name || 'Doctor'}</h3>
                      <p className="text-emerald-400 text-sm mb-1">{appt.doctor_specialty || 'General'}</p>
                      <div className="flex items-center gap-4 text-sm text-white/60 mt-2">
                        <span className="flex items-center gap-1">📅 {appt.date}</span>
                        <span className="flex items-center gap-1">⏰ {appt.time.substring(0, 5)}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 w-full sm:w-auto">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium uppercase ${appt.appointment_type === 'virtual' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'}`}>
                        {appt.appointment_type === 'virtual' ? '💻 Virtual' : '🏥 In-Person'}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium uppercase ${appt.status === 'confirmed' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'}`}>
                        {appt.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 px-4 border border-dashed border-white/20 rounded-xl">
                <div className="text-4xl mb-4">🏥</div>
                <h3 className="text-lg font-medium text-white mb-2">No Upcoming Appointments</h3>
                <p className="text-white/50 mb-6 max-w-sm mx-auto">You don't have any appointments scheduled at the moment.</p>
                <button
                  onClick={() => navigate('/appointments')}
                  className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  Book your first visit
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Quick Links / Info */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl border border-white/10" style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)' }}>
            <h2 className="text-lg font-bold text-white mb-4">Health Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 rounded-xl bg-white/5">
                <span className="text-white/70">Blood Group</span>
                <span className="text-white font-medium text-emerald-400">O+</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-white/5">
                <span className="text-white/70">Allergies</span>
                <span className="text-white font-medium">None</span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-white/10" style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)' }}>
            <h2 className="text-lg font-bold text-white mb-4">Quick Links</h2>
            <div className="space-y-2">
              <button onClick={() => navigate('/prescriptions')} className="w-full text-left p-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 transition-colors flex items-center justify-between">
                <span>💊 My Prescriptions</span>
                <span className="text-white/30">→</span>
              </button>
              <button onClick={() => navigate('/test-results')} className="w-full text-left p-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 transition-colors flex items-center justify-between">
                <span>🔬 Lab Results</span>
                <span className="text-white/30">→</span>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PatientDashboard;
