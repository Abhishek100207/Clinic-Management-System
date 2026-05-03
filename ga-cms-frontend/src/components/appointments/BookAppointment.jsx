import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { 
  User, 
  MapPin, 
  Stethoscope, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';

const BookAppointment = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [fetchingSlots, setFetchingSlots] = useState(false);
  const fixedLocation = 'Main City Clinic';

  const [formData, setFormData] = useState({
    patient_id: '',
    doctor_id: '',
    date: '',
    time: '',
    appointment_type: 'in_person',
    reason: ''
  });

  useEffect(() => {
    const fetchSlots = async () => {
      if (formData.doctor_id && formData.date) {
        setFetchingSlots(true);
        try {
          const res = await api.get(`/api/appointments/slots/?doctor_id=${formData.doctor_id}&date=${formData.date}&appointment_type=${formData.appointment_type}`);
          setAvailableSlots(res.data.available_slots || []);
        } catch (err) {
          console.error("Failed to fetch slots", err);
          setAvailableSlots([]);
        } finally {
          setFetchingSlots(false);
        }
      } else {
        setAvailableSlots([]);
      }
    };
    fetchSlots();
  }, [formData.doctor_id, formData.date, formData.appointment_type]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pRes, dRes] = await Promise.all([
          api.get('/api/users/patients/'),
          api.get('/api/users/doctors/')
        ]);
        const patientData = pRes.data || [];
        setPatients(patientData);
        setDoctors(dRes.data || []);

        // Auto-select patient if there's only one (for patient role)
        if (patientData.length === 1) {
          setFormData(prev => ({ ...prev, patient_id: patientData[0].id.toString() }));
        }
      } catch (err) {
        console.error("Failed to fetch data", err);
      }
    };
    fetchData();
  }, []);

  const navigate = useNavigate();

  const handleBook = async () => {
    if (!formData.patient_id || !formData.doctor_id || !formData.date || !formData.time) {
      setNotification({ type: 'error', message: 'Please fill all required fields.' });
      return;
    }

    setLoading(true);
    setNotification(null);
    try {
      const payload = {
        patient: formData.patient_id,
        doctor: formData.doctor_id,
        date: formData.date,
        time: formData.time,
        appointment_type: formData.appointment_type,
        location: fixedLocation,
        reason: formData.reason
      };
      
      const response = await api.post('/api/appointments/appointments/', payload);
      
      setNotification({
        type: 'success',
        message: `Appointment booked successfully! Your token is ${response.data.token_number || 'confirmed'}.`
      });
      
      // Navigate to appointments list after a short delay
      setTimeout(() => navigate('/my-appointments'), 2500);
    } catch (err) {
      console.error("Booking error:", err);
      setNotification({
        type: 'error',
        message: err.response?.data?.error || err.response?.data?.detail || 'Failed to book appointment. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedPatient = patients.find(p => p.id === parseInt(formData.patient_id));
  const selectedDoctor = doctors.find(d => d.id === parseInt(formData.doctor_id));

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors mb-4"
        >
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Book New Appointment</h1>
        <p className="text-gray-500">Fill in the details below to schedule your visit.</p>
      </div>

      {notification && (
        <div className={`mb-6 p-4 rounded-xl border flex items-center gap-3 animate-in slide-in-from-top duration-300 ${
          notification.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {notification.type === 'success' ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
          <p className="font-medium">{notification.message}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
            
            {/* Patient Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Select Patient</label>
              <div className="relative">
                <User className="absolute left-3 top-3 text-gray-400" size={18} />
                <select 
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none appearance-none"
                  value={formData.patient_id}
                  onChange={(e) => setFormData({...formData, patient_id: e.target.value})}
                >
                  <option value="">Choose a patient</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.full_name}</option>
                  ))}
                </select>
              </div>
            </div>



            {/* Doctor Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Select Doctor</label>
              <div className="relative">
                <Stethoscope className="absolute left-3 top-3 text-gray-400" size={18} />
                <select 
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none appearance-none"
                  value={formData.doctor_id}
                  onChange={(e) => setFormData({...formData, doctor_id: e.target.value})}
                >
                  <option value="">Choose a doctor</option>
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>
                      Dr. {d.user?.full_name || d.user?.first_name || 'Unknown'} ({d.specialty || 'General'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 text-gray-400" size={18} />
                  <input 
                    type="date"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Select Time Slot</label>
                {fetchingSlots ? (
                  <div className="flex items-center gap-2 text-blue-600 text-sm font-medium p-4 bg-blue-50 rounded-xl">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    Checking availability...
                  </div>
                ) : formData.doctor_id && formData.date ? (
                  availableSlots.length > 0 ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {availableSlots.map(slot => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setFormData({ ...formData, time: slot })}
                          className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all border ${
                            formData.time === slot 
                              ? 'bg-blue-600 border-blue-600 text-white shadow-md' 
                              : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300 hover:bg-blue-50'
                          }`}
                        >
                          {slot.substring(0, 5)}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl text-amber-700 text-sm">
                      No slots available for this date.
                    </div>
                  )
                ) : (
                  <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl text-gray-400 text-sm italic">
                    Please select a doctor and date first.
                  </div>
                )}
              </div>
            </div>

            <button 
              onClick={handleBook}
              disabled={loading || !formData.patient_id || !formData.doctor_id || !formData.date || !formData.time}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-xl font-bold shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Confirm Appointment'
              )}
            </button>
          </div>
        </div>

        {/* Summary Card */}
        <div className="lg:col-span-1">
          <div className="bg-gray-900 text-white rounded-2xl p-6 sticky top-24">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              Appointment Summary
            </h3>
            
            <div className="space-y-6">
              <SummaryItem label="Patient" value={selectedPatient?.full_name || 'Not selected'} />
              <SummaryItem 
                label="Doctor" 
                value={selectedDoctor ? `Dr. ${selectedDoctor.user?.full_name || selectedDoctor.user?.first_name} (${selectedDoctor.specialty})` : 'Not selected'} 
              />
              <SummaryItem label="Location" value={fixedLocation} />
              <SummaryItem label="Date & Time" value={formData.date && formData.time ? `${formData.date} at ${formData.time}` : 'Not selected'} />
            </div>

            <div className="mt-8 pt-6 border-t border-gray-800">
              <p className="text-xs text-gray-400">
                Please arrive 15 minutes before your scheduled time. You can manage your appointments from your dashboard.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SummaryItem = ({ label, value }) => (
  <div>
    <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">{label}</p>
    <p className="text-sm font-medium">{value}</p>
  </div>
);

export default BookAppointment;
