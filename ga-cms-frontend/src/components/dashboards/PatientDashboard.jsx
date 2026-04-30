import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import RescheduleModal from '../appointments/RescheduleModal';

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
        
        // If logged in as patient, they should only receive their own profile in the array
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

      // Refresh list
      const res = await api.get('/api/appointments/appointments/');
      setAppointments(res.data || []);
    } catch (err) {
      console.error("Action failed", err);
      alert("Action failed: " + (err.response?.data?.error || "Unknown error"));
    }
  };

  // Split appointments into Upcoming/New and Previous Visits
  const now = new Date();
  const upcomingAppointments = appointments.filter(a => new Date(`${a.date}T${a.time}`) >= now && a.status !== 'completed' && a.status !== 'cancelled');
  const previousVisits = appointments.filter(a => new Date(`${a.date}T${a.time}`) < now || a.status === 'completed');

  return (
    <div className="p-6 max-w-7xl mx-auto w-full space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-navy">Patient Dashboard</h1>
          <p className="text-slate-500 mt-1">Welcome back, {patientProfile?.full_name || user?.first_name || 'Patient'}!</p>
        </div>
        <button
          onClick={() => navigate('/appointments')}
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-sm transition-all transform active:scale-95 flex items-center gap-2"
        >
          <span>➕</span> Book New Appointment
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Appointments & Visits */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Upcoming Appointments */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
              <h2 className="text-lg font-bold text-navy flex items-center gap-2">
                📅 Upcoming Appointments
              </h2>
              <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-xs font-bold border border-emerald-100">
                {upcomingAppointments.length} scheduled
              </span>
            </div>

            {loading ? (
              <p className="text-slate-400 py-4 text-center">Loading appointments...</p>
            ) : upcomingAppointments.length > 0 ? (
              <div className="space-y-4">
                {upcomingAppointments.map((appt) => (
                  <div key={appt.id} className="p-5 rounded-xl border border-gray-200 bg-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-blue-200 transition-all shadow-sm">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold border border-blue-100">
                          {appt.token_number || `#${appt.id.toString().slice(-2)}`}
                        </div>
                        <div>
                          <h3 className="text-navy font-bold text-lg leading-tight">{appt.doctor_name || 'Doctor'}</h3>
                          <p className="text-blue-600 text-xs font-semibold">{appt.doctor_specialty || 'Generalist'}</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 font-medium">
                        <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded border border-gray-100">
                          📅 {appt.date}
                        </span>
                        <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded border border-gray-100">
                          ⏰ {appt.time.substring(0, 5)}
                        </span>
                        <span className={`px-2 py-1 rounded border text-[10px] font-black uppercase ${appt.appointment_type === 'virtual' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-purple-50 text-purple-600 border-purple-100'}`}>
                          {appt.appointment_type}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:items-end gap-3 w-full sm:w-auto">
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                          appt.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' : 
                          appt.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {appt.status}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {/* Patient can cancel any upcoming appointment */}
                        <button 
                          onClick={() => handleAction(appt.id, 'cancelled')}
                          className="px-4 py-2 bg-rose-50 text-rose-600 rounded-lg text-xs font-bold hover:bg-rose-100 transition-colors border border-rose-100"
                        >
                          Cancel
                        </button>
                        
                        {/* Patient can reschedule */}
                        <button 
                          onClick={() => handleAction(appt.id, 'reschedule')}
                          className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors border border-blue-100"
                        >
                          Reschedule
                        </button>

                        {/* If it's a reschedule proposal from doctor, show Accept */}
                        {appt.status === 'rescheduled' && (
                          <button 
                            onClick={() => handleAction(appt.id, 'confirmed')}
                            className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-xs font-bold hover:bg-emerald-600 transition-colors shadow-sm"
                          >
                            Accept New Time
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 px-4 border-2 border-dashed border-gray-200 rounded-xl bg-slate-50">
                <div className="text-4xl mb-3 opacity-50">🏥</div>
                <h3 className="text-base font-bold text-slate-700 mb-1">No Upcoming Appointments</h3>
                <p className="text-slate-500 text-sm mb-4">You don't have any appointments scheduled.</p>
                <button
                  onClick={() => navigate('/appointments')}
                  className="bg-white border border-gray-200 hover:border-emerald-300 text-emerald-600 px-5 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm"
                >
                  Book your first visit
                </button>
              </div>
            )}
          </div>

          {/* Previous Visits */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
              <h2 className="text-lg font-bold text-navy flex items-center gap-2">
                🕒 Previous Visits
              </h2>
            </div>

            {loading ? (
              <p className="text-slate-400 py-4 text-center">Loading past visits...</p>
            ) : previousVisits.length > 0 ? (
              <div className="space-y-3">
                {previousVisits.map((appt) => (
                  <div key={appt.id} className="p-4 rounded-xl border border-gray-100 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div>
                      <h4 className="text-slate-800 font-bold">{appt.doctor_name || 'Doctor'}</h4>
                      <p className="text-slate-500 text-xs">{appt.date} • {appt.appointment_type === 'virtual' ? 'Virtual' : 'In-Person'}</p>
                    </div>
                    <span className="text-xs font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded">
                      {appt.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center py-6 bg-slate-50 rounded-xl border border-gray-100">No past visits recorded.</p>
            )}
          </div>

        </div>

        {/* Right Column: Profile & Medical Hub */}
        <div className="space-y-6">
          
          {/* Patient Details */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-navy mb-4 border-b border-gray-100 pb-3">Patient Details</h2>
            {patientProfile ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4 mb-2">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center font-bold text-xl border border-emerald-200">
                    {patientProfile.full_name?.charAt(0) || 'P'}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{patientProfile.full_name}</h3>
                    <p className="text-xs text-slate-500">ID: {patientProfile.patient_id}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 p-3 rounded-xl border border-gray-100">
                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Blood Group</p>
                    <p className="font-semibold text-emerald-600">{patientProfile.blood_group || 'N/A'}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-gray-100">
                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Contact</p>
                    <p className="font-semibold text-slate-700 text-xs">{patientProfile.mobile_number || 'N/A'}</p>
                  </div>
                </div>
                
                <div className="bg-slate-50 p-3 rounded-xl border border-gray-100">
                  <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Email</p>
                  <p className="font-semibold text-slate-700 text-xs">{patientProfile.email || 'N/A'}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400">Loading profile data...</p>
            )}
          </div>

          {/* Medical History */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-navy mb-4 border-b border-gray-100 pb-3">Medical History</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <span className="text-red-400">⚠️</span> Allergies
                </h3>
                {patientProfile?.known_allergies ? (
                  <p className="text-sm font-medium text-slate-700 bg-red-50 text-red-700 p-2.5 rounded-lg border border-red-100">
                    {patientProfile.known_allergies}
                  </p>
                ) : (
                  <p className="text-sm text-slate-400 italic pl-1">No known allergies</p>
                )}
              </div>
              
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <span className="text-amber-400">⚕️</span> Chronic Conditions
                </h3>
                {patientProfile?.chronic_conditions ? (
                  <p className="text-sm font-medium text-slate-700 bg-amber-50 text-amber-700 p-2.5 rounded-lg border border-amber-100">
                    {patientProfile.chronic_conditions}
                  </p>
                ) : (
                  <p className="text-sm text-slate-400 italic pl-1">No chronic conditions</p>
                )}
              </div>
            </div>
          </div>

          {/* Tests & Prescriptions Integration */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-navy mb-4 border-b border-gray-100 pb-3">Tests & Prescriptions</h2>
            <div className="space-y-3">
              <button onClick={() => navigate('/prescriptions')} className="w-full flex items-center justify-between p-4 rounded-xl border border-blue-100 bg-blue-50 hover:bg-blue-100 hover:border-blue-200 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-blue-500 shadow-sm">💊</div>
                  <div className="text-left">
                    <p className="font-bold text-blue-900 text-sm">Active Prescriptions</p>
                    <p className="text-xs text-blue-600/70 font-medium">View medications</p>
                  </div>
                </div>
                <span className="text-blue-400 group-hover:translate-x-1 transition-transform">→</span>
              </button>
              
              <button onClick={() => navigate('/test-results')} className="w-full flex items-center justify-between p-4 rounded-xl border border-purple-100 bg-purple-50 hover:bg-purple-100 hover:border-purple-200 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-purple-500 shadow-sm">🔬</div>
                  <div className="text-left">
                    <p className="font-bold text-purple-900 text-sm">Lab Results</p>
                    <p className="text-xs text-purple-600/70 font-medium">View reports & tests</p>
                  </div>
                </div>
                <span className="text-purple-400 group-hover:translate-x-1 transition-transform">→</span>
              </button>
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

export default PatientDashboard;
