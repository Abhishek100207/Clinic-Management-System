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
  ArrowLeft,
  Video,
  Monitor,
  Navigation,
  LocateFixed
} from 'lucide-react';

const BookAppointment = ({ onBack }) => {
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
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
    patient_location: '',
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
        const patientData = Array.isArray(pRes.data) ? pRes.data : (pRes.data.results ?? []);
        const doctorData = Array.isArray(dRes.data) ? dRes.data : (dRes.data.results ?? []);
        setPatients(patientData);
        setDoctors(doctorData);

        // Auto-select patient if there's only one (for patient role)
        if (patientData.length === 1) {
          setFormData(prev => ({
            ...prev,
            patient_id: patientData[0].id.toString(),
            patient_location: patientData[0].city || '' // Pre-fill with patient's city
          }));
        }
      } catch (err) {
        console.error("Failed to fetch data", err);
      }
    };
    fetchData();
  }, []);

  const handleAutoLocation = () => {
    if (!navigator.geolocation) {
      setNotification({ type: 'error', message: 'Geolocation is not supported by your browser.' });
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          // Reverse geocoding using a free API (e.g., Nominatim)
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await response.json();
          const address = data.address?.city || data.address?.town || data.address?.suburb || data.address?.state || 'Unknown Location';
          setFormData(prev => ({ ...prev, patient_location: address }));
          setNotification({ type: 'success', message: `Location detected: ${address}` });
        } catch (err) {
          console.error("Geocoding error:", err);
          setNotification({ type: 'error', message: 'Failed to detect address. Please enter it manually.' });
        } finally {
          setLocating(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        // Fallback to IP-based location if browser geolocation fails or is denied
        fetch('https://ipapi.co/json/')
          .then(res => res.json())
          .then(data => {
            if (data.city) {
              const locationStr = [data.city, data.region].filter(Boolean).join(', ');
              setFormData(prev => ({ ...prev, patient_location: locationStr }));
              setNotification({ type: 'success', message: `Location detected (via IP): ${locationStr}` });
            } else {
              setNotification({ type: 'error', message: 'Location access denied or unavailable.' });
            }
          })
          .catch(err => {
            console.error("IP Geolocation fallback error:", err);
            setNotification({ type: 'error', message: 'Location access denied or unavailable.' });
          })
          .finally(() => setLocating(false));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

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
        patient_location: formData.patient_location,
        reason: formData.reason
      };

      const response = await api.post('/api/appointments/appointments/', payload);

      setNotification({
        type: 'success',
        message: `Appointment booked successfully! Your token is ${response.data.token_number || 'confirmed'}.`
      });

      // Navigate to appointments list after a short delay
      // If embedded, call onBack/refresh after a delay
      if (onBack) {
        setTimeout(() => {
          onBack();
          // Optionally trigger a refresh of the appointments list if we can reach the store here
          // (The parent will handle it if we close and re-fetch)
        }, 2000);
      } else {
        setTimeout(() => navigate('/my-appointments'), 2500);
      }
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
    <div className={`w-full ${onBack ? 'p-0' : 'max-w-4xl mx-auto py-8 px-4'}`}>
      {!onBack && (
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
      )}

      {notification && (
        <div className={`mb-6 p-4 rounded-xl border flex items-center gap-3 animate-in slide-in-from-top duration-300 ${notification.type === 'success'
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
                  onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
                >
                  <option value="">Choose a patient</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.full_name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Patient Location */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Patient Address / Location</label>
              <div className="relative mb-3">
                <MapPin className="absolute left-3 top-3 text-gray-400" size={18} />
                <textarea
                  placeholder="Enter your city or area (e.g., Mumbai, Bandra)"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none min-h-[80px]"
                  value={formData.patient_location}
                  onChange={(e) => setFormData({ ...formData, patient_location: e.target.value })}
                />
              </div>
              <button
                type="button"
                onClick={handleAutoLocation}
                disabled={locating}
                className="w-full py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 disabled:opacity-50 rounded-xl font-bold border border-blue-200 transition-all flex items-center justify-center gap-2"
              >
                {locating ? (
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                ) : <LocateFixed size={18} />}
                Current location
              </button>
              <p className="text-[10px] text-gray-400 mt-2 ml-1 italic">
                * You can use current location to auto-fill or type your address manually.
              </p>
            </div>
            {/* Doctor Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Select Doctor</label>
              <div className="relative">
                <Stethoscope className="absolute left-3 top-3 text-gray-400" size={18} />
                <select
                  value={formData.doctor_id}
                  onChange={(e) => setFormData({ ...formData, doctor_id: e.target.value, time: '' })}
                  className="w-full bg-white border border-gray-200 p-4 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all font-medium text-gray-700"
                  required
                >
                  <option value="">{loading ? 'Loading doctors...' : 'Choose a doctor'}</option>
                  {doctors.length > 0 ? (
                    doctors.map(d => (
                      <option key={d.id} value={d.id}>
                        Dr. {d.user?.full_name || d.user?.first_name || 'Unknown'} ({d.specialty || 'General'})
                      </option>
                    ))
                  ) : !loading && (
                    <option disabled>No doctors available</option>
                  )}
                </select>
              </div>
            </div>

            {/* Consultation Type Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Consultation Type</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, appointment_type: 'in_person', time: '' });
                  }}
                  className={`flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all ${formData.appointment_type === 'in_person'
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'
                    }`}
                >
                  <MapPin size={20} />
                  <div className="text-left">
                    <p className="font-bold text-sm">In-Person</p>
                    <p className="text-[10px] opacity-70">9:00 AM - 1:00 PM</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, appointment_type: 'virtual', time: '' });
                  }}
                  className={`flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all ${formData.appointment_type === 'virtual'
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'
                    }`}
                >
                  <Video size={20} />
                  <div className="text-left">
                    <p className="font-bold text-sm">Virtual</p>
                    <p className="text-[10px] opacity-70">2:00 PM - 6:00 PM</p>
                  </div>
                </button>
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
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
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
                  (() => {
                    const filteredSlots = availableSlots.filter(s => {
                      const hour = parseInt(s.time.substring(0, 2));
                      if (formData.appointment_type === 'in_person') {
                        return hour >= 9 && hour < 13;
                      } else {
                        return hour >= 14 && hour < 18;
                      }
                    });

                    if (filteredSlots.length > 0) {
                      return (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {filteredSlots.map(s => (
                            <button
                              key={s.time}
                              type="button"
                              disabled={!s.available}
                              onClick={() => setFormData({ ...formData, time: s.time })}
                              className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all border ${
                                formData.time === s.time
                                  ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                                  : s.available
                                    ? 'bg-white border-gray-200 text-gray-600 hover:border-blue-300 hover:bg-blue-50'
                                    : 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed opacity-50 grayscale'
                                }`}
                            >
                              {s.time.substring(0, 5)}
                            </button>
                          ))}
                        </div>
                      );
                    } else {
                      return (
                        <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl text-amber-700 text-sm">
                          No {formData.appointment_type === 'in_person' ? 'visiting' : 'consulting'} hours available for this date.
                        </div>
                      );
                    }
                  })()
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
              <SummaryItem label="Clinic Location" value={fixedLocation} />
              <SummaryItem label="Consultation" value={formData.appointment_type === 'virtual' ? 'Virtual (Video)' : 'In-Person (Clinic)'} />
              <SummaryItem label="Patient Location" value={formData.patient_location || 'Not specified'} />
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
