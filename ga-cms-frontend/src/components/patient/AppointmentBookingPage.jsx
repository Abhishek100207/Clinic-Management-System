import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { MapPin, Ticket, CheckCircle } from 'lucide-react';

const AppointmentBookingPage = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [bookedToken, setBookedToken] = useState(null);
  
  // State for Booking Form
  const [patientId, setPatientId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [appointmentType, setAppointmentType] = useState('in_person');
  const [location, setLocation] = useState('main_clinic');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  
  // Lookups
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);

  const locations = [
    { id: 'main_clinic', name: 'Main City Clinic', distance: '2.5 km' },
    { id: 'suburb_branch', name: 'Suburb Branch', distance: '8.1 km' },
    { id: 'west_wing', name: 'West Wing Center', distance: '4.3 km' },
  ];

  useEffect(() => {
    fetchDoctors();
    fetchPatients();
  }, [user]);

  const fetchDoctors = async () => {
    try {
      const res = await api.get('/api/users/doctors/');
      setDoctors(Array.isArray(res.data) ? res.data : (res.data.results ?? []));
    } catch (err) {
      console.error("Failed to fetch doctors", err);
    }
  };

  const fetchPatients = async () => {
    try {
      const res = await api.get('/api/users/patients/');
      const patientList = Array.isArray(res.data) ? res.data : (res.data.results ?? []);
      setPatients(patientList);
      
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
      const res = await api.post('/api/appointments/appointments/', {
        patient: patientId,
        doctor: doctorId,
        date: date,
        time: time,
        appointment_type: appointmentType,
        location: location
      });
      
      // Mocking token generation for demo if not in response
      const token = res.data.token_number || `T-${Math.floor(Math.random() * 900) + 100}`;
      setBookedToken(token);
      setStep(4); // Success step
    } catch (err) {
      console.error(err);
      alert("Failed to book appointment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto w-full animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-navy mb-2">Book Appointment</h1>
          <p className="text-slate-500">Schedule your visit with precision and ease.</p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        
        {/* Progress Bar */}
        {step < 4 && (
          <div className="flex items-center justify-between mb-10">
            {[
              { s: 1, l: 'Patient' },
              { s: 2, l: 'Details' },
              { s: 3, l: 'Schedule' }
            ].map((item, idx) => (
              <React.Fragment key={item.s}>
                <div className={`flex flex-col items-center ${step >= item.s ? 'text-blue-600' : 'text-slate-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 font-bold transition-all ${step >= item.s ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-50 border-2 border-slate-200'}`}>{item.s}</div>
                  <span className="text-xs font-bold uppercase tracking-tighter">{item.l}</span>
                </div>
                {idx < 2 && <div className={`flex-1 h-0.5 mx-4 rounded-full transition-all ${step > item.s ? 'bg-blue-600' : 'bg-slate-100'}`}></div>}
              </React.Fragment>
            ))}
          </div>
        )}

        {step === 1 && (
          <div className="animate-in slide-in-from-right-4 duration-300 space-y-6">
            <h2 className="text-xl font-bold text-navy">Select Patient</h2>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Patient Search</label>
              <select 
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
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
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-10 py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-in slide-in-from-right-4 duration-300 space-y-8">
            <h2 className="text-xl font-bold text-navy">Doctor & Location</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Select Doctor</label>
                <select 
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
                  value={doctorId}
                  onChange={(e) => setDoctorId(e.target.value)}
                >
                  <option value="" disabled>-- Choose a Doctor --</option>
                  {doctors.map(d => <option key={d.id} value={d.id}>Dr. {d.user?.full_name || d.user?.first_name} ({d.specialty})</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-4">Clinic Location</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {locations.map(loc => (
                    <label 
                      key={loc.id}
                      className={`cursor-pointer rounded-xl border-2 p-4 flex flex-col items-center text-center transition-all ${location === loc.id ? 'border-blue-600 bg-blue-50 shadow-md' : 'border-gray-100 hover:bg-slate-50 hover:border-gray-200'}`}
                    >
                      <input type="radio" name="loc" value={loc.id} checked={location === loc.id} onChange={() => setLocation(loc.id)} className="sr-only" />
                      <MapPin size={24} className={location === loc.id ? 'text-blue-600' : 'text-slate-400'} />
                      <span className={`font-bold mt-2 text-sm ${location === loc.id ? 'text-blue-900' : 'text-slate-700'}`}>{loc.name}</span>
                      <span className="text-slate-500 text-[10px] mt-1">{loc.distance} away</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-4">Appointment Type</label>
                <div className="grid grid-cols-2 gap-4">
                  {['in_person', 'virtual'].map(type => (
                    <label key={type} className={`cursor-pointer rounded-xl border-2 p-5 flex flex-col items-center transition-all ${appointmentType === type ? 'border-blue-600 bg-blue-50 shadow-md' : 'border-gray-100 hover:bg-slate-50 hover:border-gray-200'}`}>
                      <input type="radio" name="type" value={type} checked={appointmentType === type} onChange={() => setAppointmentType(type)} className="sr-only" />
                      <span className="text-2xl mb-2">{type === 'in_person' ? '🏥' : '💻'}</span>
                      <span className={`font-bold ${appointmentType === type ? 'text-blue-900' : 'text-slate-700'}`}>{type === 'in_person' ? 'In-Person' : 'Virtual Call'}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-6 border-t border-gray-100">
              <button onClick={() => setStep(1)} className="text-slate-600 hover:bg-slate-100 px-6 py-2.5 rounded-xl font-bold transition-all">Back</button>
              <button onClick={() => setStep(3)} disabled={!doctorId} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-10 py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95">Continue</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-in slide-in-from-right-4 duration-300 space-y-6">
            <h2 className="text-xl font-bold text-navy">Select Date & Time</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Choose Date</label>
                <input 
                  type="date"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
                  value={date} 
                  onChange={(e) => setDate(e.target.value)} 
                />
              </div>

              {date && doctorId && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                    Available Slots
                    {loading && <span className="w-2 h-2 bg-blue-600 rounded-full animate-ping"></span>}
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {availableSlots.length > 0 ? availableSlots.map(slot => (
                      <button
                        key={slot}
                        onClick={() => setTime(slot)}
                        className={`py-3 px-2 rounded-xl text-sm font-bold transition-all ${time === slot ? 'bg-blue-600 text-white shadow-lg scale-105' : 'border border-gray-200 text-slate-600 hover:bg-blue-50 hover:border-blue-200 bg-white'}`}
                      >
                        {slot.substring(0,5)}
                      </button>
                    )) : !loading && <p className="text-sm text-slate-400 italic py-4">No slots available for this date.</p>}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between pt-8 border-t border-gray-100">
              <button onClick={() => setStep(2)} className="text-slate-600 hover:bg-slate-100 px-6 py-2.5 rounded-xl font-bold transition-all">Back</button>
              <button onClick={handleBook} disabled={!date || !time || loading} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-10 py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95">
                {loading ? 'Processing...' : 'Confirm Booking'}
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="animate-in zoom-in-95 duration-500 text-center py-10 space-y-6">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={48} />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-navy">Booking Confirmed!</h2>
              <p className="text-slate-500 mt-2">Your appointment has been successfully scheduled.</p>
            </div>
            
            <div className="max-w-sm mx-auto bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full"></div>
              <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full"></div>
              
              <div className="flex items-center justify-center gap-2 mb-2 text-slate-400">
                <Ticket size={16} />
                <span className="text-xs font-bold uppercase tracking-widest">Queue Token</span>
              </div>
              <div className="text-5xl font-black text-blue-600 tracking-tighter">
                {bookedToken}
              </div>
              <div className="mt-4 pt-4 border-t border-slate-200 text-xs text-slate-400 font-medium">
                Please present this token at the reception desk.
              </div>
            </div>

            <button 
              onClick={() => navigate(user?.role === 'doctor' ? '/dashboard/doctor' : '/dashboard/patient')}
              className="bg-navy text-white px-10 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg mt-8"
            >
              Go to Dashboard
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default AppointmentBookingPage;
