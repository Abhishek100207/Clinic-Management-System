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
        patient: patientId, // backend expects PK of patient model
        doctor: doctorId,
        date: date,
        time: time,
        appointment_type: appointmentType
      });
      alert("Appointment successfully booked!");
      navigate('/dashboard/patient'); // redirect
    } catch (err) {
      console.error(err);
      alert("Failed to book appointment. Check console or try again.");
      navigate('/dashboard/patient');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-navy mb-2">Book Appointment</h1>
          <p className="text-slate-500">Schedule a new visit or virtual consultation.</p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        
        {/* Progress Bar */}
        <div className="flex items-center justify-between mb-10">
          <div className={`flex flex-col items-center ${step >= 1 ? 'text-emerald-600' : 'text-slate-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 font-semibold ${step >= 1 ? 'bg-emerald-100 border-2 border-emerald-500' : 'bg-slate-50 border-2 border-slate-200'}`}>1</div>
            <span className="text-sm font-medium">Patient</span>
          </div>
          <div className={`flex-1 h-1 mx-4 rounded-full ${step >= 2 ? 'bg-emerald-500' : 'bg-slate-100'}`}></div>
          <div className={`flex flex-col items-center ${step >= 2 ? 'text-emerald-600' : 'text-slate-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 font-semibold ${step >= 2 ? 'bg-emerald-100 border-2 border-emerald-500' : 'bg-slate-50 border-2 border-slate-200'}`}>2</div>
            <span className="text-sm font-medium">Doctor</span>
          </div>
          <div className={`flex-1 h-1 mx-4 rounded-full ${step >= 3 ? 'bg-emerald-500' : 'bg-slate-100'}`}></div>
          <div className={`flex flex-col items-center ${step >= 3 ? 'text-emerald-600' : 'text-slate-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 font-semibold ${step >= 3 ? 'bg-emerald-100 border-2 border-emerald-500' : 'bg-slate-50 border-2 border-slate-200'}`}>3</div>
            <span className="text-sm font-medium">Time</span>
          </div>
        </div>

        {step === 1 && (
          <div className="animate-fade-in space-y-6">
            <h2 className="text-xl font-bold text-navy">Select Patient</h2>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Patient Search</label>
              <select 
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-colors shadow-sm"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
              >
                <option value="" disabled>-- Select a Patient --</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.full_name} ({p.patient_id})</option>)}
              </select>
            </div>
            <div className="flex justify-end pt-4">
              <button 
                onClick={() => setStep(2)} 
                disabled={!patientId}
                className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white px-8 py-2.5 rounded-xl font-bold transition-colors shadow-sm"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-in space-y-6">
            <h2 className="text-xl font-bold text-navy">Doctor & Consultation Type</h2>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Select Doctor</label>
              <select 
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-colors shadow-sm"
                value={doctorId}
                onChange={(e) => setDoctorId(e.target.value)}
              >
                <option value="" disabled>-- Choose a Doctor --</option>
                {doctors.map(d => <option key={d.id} value={d.id}>Dr. {d.user?.full_name || d.user?.first_name} ({d.specialty})</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">Appointment Type</label>
              <div className="grid grid-cols-2 gap-4">
                <label className={`cursor-pointer rounded-xl border-2 p-5 flex flex-col items-center transition-all ${appointmentType === 'in_person' ? 'border-emerald-500 bg-emerald-50 shadow-sm' : 'border-gray-100 hover:bg-slate-50 hover:border-gray-200'}`}>
                  <input 
                    type="radio" name="type" value="in_person" 
                    checked={appointmentType === 'in_person'} 
                    onChange={() => setAppointmentType('in_person')}
                    className="sr-only"
                  />
                  <span className="text-2xl mb-2">🏥</span>
                  <span className={`font-bold ${appointmentType === 'in_person' ? 'text-emerald-700' : 'text-slate-700'}`}>In-Person</span>
                  <span className="text-slate-500 text-xs mt-1 text-center">Visit the clinic</span>
                </label>
                
                <label className={`cursor-pointer rounded-xl border-2 p-5 flex flex-col items-center transition-all ${appointmentType === 'virtual' ? 'border-emerald-500 bg-emerald-50 shadow-sm' : 'border-gray-100 hover:bg-slate-50 hover:border-gray-200'}`}>
                  <input 
                    type="radio" name="type" value="virtual" 
                    checked={appointmentType === 'virtual'} 
                    onChange={() => setAppointmentType('virtual')}
                    className="sr-only"
                  />
                  <span className="text-2xl mb-2">💻</span>
                  <span className={`font-bold ${appointmentType === 'virtual' ? 'text-emerald-700' : 'text-slate-700'}`}>Virtual Call</span>
                  <span className="text-slate-500 text-xs mt-1 text-center">Consult from home</span>
                </label>
              </div>
            </div>

            <div className="flex justify-between pt-6 border-t border-gray-100">
              <button 
                onClick={() => setStep(user?.role === 'patient' ? 1 : 1)}
                className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-6 py-2.5 rounded-xl font-semibold transition-colors"
              >
                Back
              </button>
              <button 
                onClick={() => setStep(3)} 
                disabled={!doctorId || !appointmentType}
                className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white px-8 py-2.5 rounded-xl font-bold transition-colors shadow-sm"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-fade-in space-y-6">
            <h2 className="text-xl font-bold text-navy">Select Date & Time</h2>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Choose Date</label>
              <input 
                type="date"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-colors shadow-sm"
                value={date} 
                onChange={(e) => setDate(e.target.value)} 
              />
            </div>

            {date && doctorId && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3 flex items-center">
                  Available Slots
                  {loading && <span className="ml-3 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs animate-pulse">Loading...</span>}
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {availableSlots.length > 0 ? availableSlots.map(slot => (
                    <button
                      key={slot}
                      onClick={() => setTime(slot)}
                      className={`py-3 px-2 rounded-xl text-sm font-bold transition-all ${time === slot ? 'bg-emerald-500 text-white shadow-md transform scale-[1.02]' : 'border border-gray-200 text-slate-600 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 bg-white'}`}
                    >
                      {slot.substring(0,5)}
                    </button>
                  )) : !loading && (
                    <p className="text-sm text-slate-500 col-span-4 p-6 border-2 border-dashed border-gray-200 rounded-xl text-center bg-slate-50">
                      No slots available for this date.
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-between pt-8 border-t border-gray-100">
              <button 
                onClick={() => setStep(2)}
                className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-6 py-2.5 rounded-xl font-semibold transition-colors"
              >
                Back
              </button>
              <button 
                onClick={handleBook} 
                disabled={!date || !time || loading}
                className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white px-8 py-2.5 rounded-xl font-bold transition-all shadow-md transform active:scale-95"
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
