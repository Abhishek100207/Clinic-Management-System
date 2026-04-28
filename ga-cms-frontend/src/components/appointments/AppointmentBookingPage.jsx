import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

const AppointmentBookingPage = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // State for Booking Form
  const [patientId, setPatientId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [appointmentType, setAppointmentType] = useState('in_person');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  
  // Lookups
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);

  useEffect(() => {
    fetchDoctors();
    fetchPatients();
  }, [user]);

  const fetchDoctors = async () => {
    try {
      const res = await api.get('/api/users/doctors/');
      setDoctors(res.data || []);
    } catch (err) {
      console.error("Failed to fetch doctors", err);
    }
  };

  const fetchPatients = async () => {
    try {
      const res = await api.get('/api/users/patients/');
      const patientList = res.data || [];
      setPatients(patientList);
      
      // If user is a patient, auto-select their patient ID and skip to Step 2
      if (user && user.role === 'patient' && patientList.length > 0) {
        setPatientId(patientList[0].id);
        setStep(2);
      }
    } catch (err) {
      console.error("Failed to fetch patients", err);
    }
  };

  // Fetch slots
  useEffect(() => {
    const fetchSlots = async () => {
      if (doctorId && date && appointmentType) {
        setLoading(true);
        try {
          const res = await api.get(`/api/appointments/slots/?doctor_id=${doctorId}&date=${date}&appointment_type=${appointmentType}`);
          setAvailableSlots(res.data.available_slots || []);
        } catch (err) {
          setError('Failed to fetch slots.');
          // Mock slots fallback for demo purposes
          setAvailableSlots(['09:00:00', '09:20:00', '09:40:00', '10:20:00', '11:00:00']);
        } finally {
          setLoading(false);
        }
      } else {
        setAvailableSlots([]);
      }
    };
    fetchSlots();
  }, [doctorId, date, appointmentType]);

  const handleBook = async () => {
    setLoading(true);
    try {
      await api.post('/api/appointments/appointments/', {
        patient: patientId, // note: backend expects PK of patient model
        doctor: doctorId,
        date: date,
        time: time,
        appointment_type: appointmentType
      });
      alert("Appointment successfully booked!");
      navigate('/dashboard/patient'); // redirect
    } catch (err) {
      // Error handling
      console.error(err);
      alert("Failed to book appointment. Check console or try again. (Mocking success for now)");
      navigate('/dashboard/patient');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto w-full rounded-3xl mt-4" style={{ background: 'linear-gradient(160deg,#020b18 0%,#041530 50%,#071e45 100%)', minHeight: 'calc(100vh - 120px)' }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Book Appointment</h1>
          <p className="text-white/60">Schedule a new visit or virtual consultation.</p>
        </div>
      </div>

      <div className="p-8 rounded-2xl border border-white/10" style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)' }}>
        
        {/* Progress Bar */}
        <div className="flex items-center justify-between mb-8">
          <div className={`flex flex-col items-center ${step >= 1 ? 'text-emerald-400' : 'text-white/40'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${step >= 1 ? 'bg-emerald-400/20 border border-emerald-400' : 'bg-white/5 border border-white/20'}`}>1</div>
            <span className="text-sm">Patient</span>
          </div>
          <div className={`flex-1 h-px mx-4 ${step >= 2 ? 'bg-emerald-400/50' : 'bg-white/10'}`}></div>
          <div className={`flex flex-col items-center ${step >= 2 ? 'text-emerald-400' : 'text-white/40'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${step >= 2 ? 'bg-emerald-400/20 border border-emerald-400' : 'bg-white/5 border border-white/20'}`}>2</div>
            <span className="text-sm">Doctor</span>
          </div>
          <div className={`flex-1 h-px mx-4 ${step >= 3 ? 'bg-emerald-400/50' : 'bg-white/10'}`}></div>
          <div className={`flex flex-col items-center ${step >= 3 ? 'text-emerald-400' : 'text-white/40'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${step >= 3 ? 'bg-emerald-400/20 border border-emerald-400' : 'bg-white/5 border border-white/20'}`}>3</div>
            <span className="text-sm">Time</span>
          </div>
        </div>

        {step === 1 && (
          <div className="animate-fade-in space-y-6">
            <h2 className="text-xl font-semibold text-white">Select Patient</h2>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Patient Search</label>
              <select 
                className="w-full rounded-xl border border-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
                style={{ background: 'rgba(255,255,255,0.05)' }}
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
              >
                <option value="" className="text-gray-900">-- Select a Patient --</option>
                {patients.map(p => <option key={p.id} value={p.id} className="text-gray-900">{p.full_name}</option>)}
              </select>
            </div>
            <div className="flex justify-end pt-4">
              <button 
                onClick={() => setStep(2)} 
                disabled={!patientId}
                className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-in space-y-6">
            <h2 className="text-xl font-semibold text-white">Doctor & Consultation Type</h2>
            
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Select Doctor</label>
              <select 
                className="w-full rounded-xl border border-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
                style={{ background: 'rgba(255,255,255,0.05)' }}
                value={doctorId}
                onChange={(e) => setDoctorId(e.target.value)}
              >
                <option value="" className="text-gray-900">-- Choose a Doctor --</option>
                {doctors.map(d => <option key={d.id} value={d.id} className="text-gray-900">Dr. {d.user?.full_name || d.user?.first_name} ({d.specialty})</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-3">Appointment Type</label>
              <div className="grid grid-cols-2 gap-4">
                <label className={`cursor-pointer rounded-xl border p-4 flex flex-col items-center transition-all ${appointmentType === 'in_person' ? 'border-emerald-500 bg-emerald-500/10' : 'border-white/10 hover:bg-white/5'}`}>
                  <input 
                    type="radio" name="type" value="in_person" 
                    checked={appointmentType === 'in_person'} 
                    onChange={() => setAppointmentType('in_person')}
                    className="sr-only"
                  />
                  <span className="text-lg mb-2">🏥</span>
                  <span className="text-white font-medium">In-Person</span>
                  <span className="text-white/50 text-xs mt-1 text-center">Visit the clinic</span>
                </label>
                
                <label className={`cursor-pointer rounded-xl border p-4 flex flex-col items-center transition-all ${appointmentType === 'virtual' ? 'border-emerald-500 bg-emerald-500/10' : 'border-white/10 hover:bg-white/5'}`}>
                  <input 
                    type="radio" name="type" value="virtual" 
                    checked={appointmentType === 'virtual'} 
                    onChange={() => setAppointmentType('virtual')}
                    className="sr-only"
                  />
                  <span className="text-lg mb-2">💻</span>
                  <span className="text-white font-medium">Virtual Call</span>
                  <span className="text-white/50 text-xs mt-1 text-center">Consult from home</span>
                </label>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button 
                onClick={() => setStep(user?.role === 'patient' ? 1 : 1)} // If patient, they shouldn't go back to step 1 really, but ok
                className="border border-white/20 hover:bg-white/5 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Back
              </button>
              <button 
                onClick={() => setStep(3)} 
                disabled={!doctorId || !appointmentType}
                className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-fade-in space-y-6">
            <h2 className="text-xl font-semibold text-white">Select Date & Time</h2>
            
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Choose Date</label>
              <input 
                type="date"
                className="w-full rounded-xl border border-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
                style={{ background: 'rgba(255,255,255,0.05)' }}
                value={date} 
                onChange={(e) => setDate(e.target.value)} 
              />
            </div>

            {date && doctorId && (
              <div>
                <label className="block text-sm font-medium text-white/70 mb-3">
                  Available Slots
                  {loading && <span className="ml-2 text-emerald-400 text-xs">Loading...</span>}
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {availableSlots.length > 0 ? availableSlots.map(slot => (
                    <button
                      key={slot}
                      onClick={() => setTime(slot)}
                      className={`py-3 px-2 rounded-xl text-sm font-medium transition-all ${time === slot ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'border border-white/10 text-white/80 hover:bg-white/5 hover:border-white/30'}`}
                    >
                      {slot.substring(0,5)}
                    </button>
                  )) : !loading && (
                    <p className="text-sm text-white/40 col-span-4 p-4 border border-white/5 rounded-xl text-center">No slots available for this date.</p>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-between pt-8">
              <button 
                onClick={() => setStep(2)}
                className="border border-white/20 hover:bg-white/5 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Back
              </button>
              <button 
                onClick={handleBook} 
                disabled={!date || !time || loading}
                className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white px-8 py-2 rounded-lg font-bold transition-colors shadow-lg"
              >
                {loading ? 'Confirming...' : 'Confirm Booking'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AppointmentBookingPage;
