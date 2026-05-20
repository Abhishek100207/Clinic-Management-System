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
  LocateFixed,
  CreditCard,
  QrCode,
  ShieldCheck,
  Check,
  Loader2,
  Printer,
  Building2,
  Ticket
} from 'lucide-react';

const BookAppointment = ({ onBack }) => {
  const navigate = useNavigate();
  
  // Core States
  const [step, setStep] = useState('booking'); // 'booking', 'payment', 'processing', 'success'
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

  // Payment-specific States
  const [paymentMethod, setPaymentMethod] = useState('upi'); // 'upi', 'card', 'netbanking'
  const [upiId, setUpiId] = useState('');
  const [cardData, setCardData] = useState({ number: '', expiry: '', cvv: '', name: '' });
  const [selectedBank, setSelectedBank] = useState('');
  const [processingMessage, setProcessingMessage] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [bookedToken, setBookedToken] = useState('');
  const [fees, setFees] = useState({ consultation: 500, gst: 90, total: 590 });

  // Calculate fees based on appointment type
  useEffect(() => {
    const consultation = formData.appointment_type === 'virtual' ? 300 : 500;
    const gst = Math.round(consultation * 0.18);
    setFees({ consultation, gst, total: consultation + gst });
  }, [formData.appointment_type]);

  // Fetch Slots
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

  // Fetch Patients & Doctors
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

        if (patientData.length === 1) {
          setFormData(prev => ({
            ...prev,
            patient_id: patientData[0].id.toString(),
            patient_location: patientData[0].city || ''
          }));
        }
      } catch (err) {
        console.error("Failed to fetch data", err);
      }
    };
    fetchData();
  }, []);

  // Format Card Expiry
  const handleExpiryChange = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 2) {
      val = val.substring(0, 2) + '/' + val.substring(2, 4);
    }
    setCardData(prev => ({ ...prev, expiry: val }));
  };

  // Format Card Number (adds spaces)
  const handleCardNumberChange = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    let formatted = val.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardData(prev => ({ ...prev, number: formatted.substring(0, 19) }));
  };

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

  const handleProceedToPayment = () => {
    if (!formData.patient_id || !formData.doctor_id || !formData.date || !formData.time) {
      setNotification({ type: 'error', message: 'Please fill all required fields.' });
      return;
    }
    setNotification(null);
    setStep('payment');
  };

  // Perform secure transaction and complete booking
  const handlePayAndBook = async () => {
    // Basic Payment Validations
    if (paymentMethod === 'upi' && !upiId.trim() && !upiId.includes('@')) {
      alert("Please enter a valid UPI ID (e.g. name@bank)");
      return;
    }
    if (paymentMethod === 'card' && (cardData.number.replace(/\s/g, '').length !== 16 || cardData.expiry.length < 5 || cardData.cvv.length < 3 || !cardData.name.trim())) {
      alert("Please fill in correct Card details.");
      return;
    }
    if (paymentMethod === 'netbanking' && !selectedBank) {
      alert("Please select your bank.");
      return;
    }

    setStep('processing');
    setLoading(true);

    // Mock progress message sequence
    const messages = [
      "Initiating secure payment gateway...",
      "Verifying payment transaction details...",
      "Authorizing amount of ₹" + fees.total.toFixed(2) + " with your bank...",
      "Payment approved! Booking your appointment slot..."
    ];

    for (let i = 0; i < messages.length; i++) {
      setProcessingMessage(messages[i]);
      await new Promise(resolve => setTimeout(resolve, 800));
    }

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
      
      // Generate a mock Transaction ID
      const generatedTxn = 'TXN' + Math.floor(100000000 + Math.random() * 900000000);
      setTransactionId(generatedTxn);
      setBookedToken(response.data.token_number || `T-${Math.floor(Math.random() * 900) + 100}`);
      setStep('success');
    } catch (err) {
      console.error("Booking payment error:", err);
      const errMsg = err.response?.data?.error || err.response?.data?.detail || 'Failed to book appointment after authorization. Refund initiated.';
      setNotification({ type: 'error', message: errMsg });
      setStep('payment');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const selectedPatient = patients.find(p => p.id === parseInt(formData.patient_id));
  const selectedDoctor = doctors.find(d => d.id === parseInt(formData.doctor_id));

  return (
    <div className={`w-full ${onBack ? 'p-0' : 'max-w-4xl mx-auto py-8 px-4'}`}>
      
      {/* Dynamic Header */}
      {step === 'booking' && !onBack && (
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

      {step === 'payment' && (
        <div className="mb-6">
          <button
            onClick={() => setStep('booking')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold transition-colors mb-4"
          >
            <ArrowLeft size={20} />
            <span>Back to Booking Details</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Secure Payment</h1>
          <p className="text-gray-500">Pay consultation fees to complete your booking.</p>
        </div>
      )}

      {/* Global Notifications */}
      {notification && (step === 'booking' || step === 'payment') && (
        <div className={`mb-6 p-4 rounded-xl border flex items-center gap-3 animate-in slide-in-from-top duration-300 ${
          notification.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-red-50 border-red-200 text-red-800'
          }`}>
          {notification.type === 'success' ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
          <p className="font-medium">{notification.message}</p>
        </div>
      )}

      {/* STEP 1: BOOKING FORM */}
      {step === 'booking' && (
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
                    <option value="">Choose a doctor</option>
                    {doctors.map(d => (
                      <option key={d.id} value={d.id}>
                        Dr. {d.user?.full_name || d.user?.first_name || 'Unknown'} ({d.specialty || 'General'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Consultation Type */}
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

              {/* Date & Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Select Time Slot</label>
                  {fetchingSlots ? (
                    <div className="flex items-center gap-2 text-blue-600 text-sm font-medium p-4 bg-blue-50 rounded-xl">
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      Checking slots...
                    </div>
                  ) : formData.doctor_id && formData.date ? (
                    (() => {
                      const filteredSlots = availableSlots.filter(s => {
                        const hour = parseInt((s.time || '').substring(0, 2) || '0');
                        if (formData.appointment_type === 'in_person') {
                          return hour >= 9 && hour < 13;
                        } else {
                          return hour >= 14 && hour < 18;
                        }
                      });

                      if (filteredSlots.length > 0) {
                        return (
                          <div className="grid grid-cols-3 gap-2">
                            {filteredSlots.map(s => (
                              <button
                                key={s.time}
                                type="button"
                                disabled={!s.available}
                                onClick={() => setFormData({ ...formData, time: s.time })}
                                className={`py-2 px-2 rounded-xl text-xs font-bold transition-all border ${
                                  formData.time === s.time
                                    ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                                    : s.available
                                      ? 'bg-white border-gray-200 text-gray-600 hover:border-blue-300 hover:bg-blue-50'
                                      : 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed opacity-50'
                                  }`}
                              >
                                {s.time?.substring(0, 5) || s.time}
                              </button>
                            ))}
                          </div>
                        );
                      } else {
                        return (
                          <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-amber-700 text-xs">
                            No {formData.appointment_type === 'in_person' ? 'visiting' : 'consulting'} slots on this date.
                          </div>
                        );
                      }
                    })()
                  ) : (
                    <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl text-gray-400 text-xs italic">
                      Please select a doctor and date first.
                    </div>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={handleProceedToPayment}
                disabled={loading || !formData.patient_id || !formData.doctor_id || !formData.date || !formData.time}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-xl font-bold shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                Proceed to Payment (₹{fees.total})
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          {/* Right Summary Panel */}
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
      )}

      {/* STEP 2: SECURE PAYMENT PAGE */}
      {step === 'payment' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
              
              {/* Payment Methods tabs */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Choose Payment Method</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('upi')}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                      paymentMethod === 'upi' ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm' : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'
                    }`}
                  >
                    <QrCode size={24} className="mb-2" />
                    <span className="text-xs font-bold">UPI / QR</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                      paymentMethod === 'card' ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm' : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'
                    }`}
                  >
                    <CreditCard size={24} className="mb-2" />
                    <span className="text-xs font-bold">Debit / Credit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('netbanking')}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                      paymentMethod === 'netbanking' ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm' : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'
                    }`}
                  >
                    <Building2 size={24} className="mb-2" />
                    <span className="text-xs font-bold">Net Banking</span>
                  </button>
                </div>
              </div>

              {/* Payment Form Fields based on selection */}
              <div className="p-6 bg-slate-50 rounded-xl border border-slate-100 min-h-[200px]">
                
                {/* UPI Flow */}
                {paymentMethod === 'upi' && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                      <div className="bg-white p-3 rounded-xl border border-gray-200 flex flex-col items-center justify-center shadow-sm">
                        {/* Styled mock QR Code using CSS */}
                        <div className="w-32 h-32 bg-slate-100 rounded-lg flex items-center justify-center relative border border-slate-200 border-dashed overflow-hidden">
                          <QrCode size={64} className="text-slate-700" />
                          <div className="absolute inset-0 bg-blue-500/5 animate-pulse"></div>
                        </div>
                        <span className="text-[10px] text-gray-400 font-bold mt-2">Scan with any UPI app</span>
                      </div>
                      <div className="flex-1 w-full space-y-3">
                        <p className="text-xs text-slate-500 font-medium leading-relaxed">
                          Scan the QR Code on the left using your mobile app (GPay, PhonePe, Paytm, BHIM) OR enter your VPA / UPI ID to receive a payment request.
                        </p>
                        <div>
                          <label className="block text-xs font-bold text-gray-600 mb-1">Enter UPI ID</label>
                          <input
                            type="text"
                            placeholder="username@upi"
                            value={upiId}
                            onChange={(e) => setUpiId(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Card Flow */}
                {paymentMethod === 'card' && (
                  <div className="space-y-4 animate-fade-in">
                    
                    {/* Interactive Glassmorphism Card View */}
                    <div className="bg-gradient-to-tr from-slate-800 to-slate-950 text-white rounded-xl p-5 shadow-lg border border-slate-700 relative overflow-hidden h-40 max-w-sm mx-auto flex flex-col justify-between">
                      <div className="absolute right-0 bottom-0 w-32 h-32 bg-blue-600/10 rounded-full blur-2xl"></div>
                      <div className="flex justify-between items-start">
                        <span className="text-xs uppercase tracking-widest font-black text-slate-400">Secure Gateway</span>
                        <div className="w-10 h-7 bg-slate-700/60 rounded flex items-center justify-center font-bold italic text-[10px] text-slate-300">VISA</div>
                      </div>
                      <div>
                        <div className="text-lg font-mono tracking-widest text-slate-200">
                          {cardData.number || '•••• •••• •••• ••••'}
                        </div>
                      </div>
                      <div className="flex justify-between items-end">
                        <div>
                          <div className="text-[8px] text-slate-400 uppercase font-bold tracking-wider">Card Holder</div>
                          <div className="text-xs font-bold truncate max-w-[150px] uppercase">{cardData.name || 'FULL NAME'}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[8px] text-slate-400 uppercase font-bold tracking-wider">Expires</div>
                          <div className="text-xs font-mono font-bold">{cardData.expiry || 'MM/YY'}</div>
                        </div>
                      </div>
                    </div>

                    {/* Inputs */}
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">Cardholder Name</label>
                        <input
                          type="text"
                          placeholder="John Doe"
                          value={cardData.name}
                          onChange={(e) => setCardData(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-4 py-2 bg-white rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">Card Number</label>
                        <input
                          type="text"
                          placeholder="4111 2222 3333 4444"
                          value={cardData.number}
                          onChange={handleCardNumberChange}
                          className="w-full px-4 py-2 bg-white rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-gray-600 mb-1">Expiry Date</label>
                          <input
                            type="text"
                            placeholder="MM/YY"
                            value={cardData.expiry}
                            onChange={handleExpiryChange}
                            maxLength={5}
                            className="w-full px-4 py-2 bg-white rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono text-center"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-600 mb-1">CVV</label>
                          <input
                            type="password"
                            placeholder="•••"
                            value={cardData.cvv}
                            onChange={(e) => setCardData(prev => ({ ...prev, cvv: e.target.value.replace(/\D/g, '').substring(0, 3) }))}
                            className="w-full px-4 py-2 bg-white rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono text-center"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* NetBanking Flow */}
                {paymentMethod === 'netbanking' && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="grid grid-cols-2 gap-3">
                      {['SBI', 'HDFC', 'ICICI', 'Axis'].map(bank => (
                        <label
                          key={bank}
                          className={`cursor-pointer p-3 rounded-lg border flex items-center justify-between transition-all ${
                            selectedBank === bank ? 'border-blue-500 bg-blue-50/50' : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          <span className="text-sm font-bold text-slate-700">{bank}</span>
                          <input
                            type="radio"
                            name="bank"
                            value={bank}
                            checked={selectedBank === bank}
                            onChange={() => setSelectedBank(bank)}
                            className="w-4 h-4 text-blue-600"
                          />
                        </label>
                      ))}
                    </div>
                    <div className="pt-2">
                      <label className="block text-xs font-bold text-gray-600 mb-1">Or choose another bank</label>
                      <select
                        value={selectedBank}
                        onChange={(e) => setSelectedBank(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                      >
                        <option value="">-- Choose Bank --</option>
                        <option value="PNB">Punjab National Bank</option>
                        <option value="BOB">Bank of Baroda</option>
                        <option value="KOTAK">Kotak Mahindra Bank</option>
                        <option value="YES">Yes Bank</option>
                        <option value="INDUS">IndusInd Bank</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Secure Transaction Shield */}
              <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-800 text-xs">
                <ShieldCheck size={20} className="text-emerald-600 flex-shrink-0" />
                <span className="font-semibold">Your payment information is end-to-end encrypted and secured by 256-bit SSL encryption.</span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={() => setStep('booking')}
                  className="flex-1 py-3 border border-gray-200 hover:bg-slate-50 text-slate-600 rounded-xl font-bold transition-all text-center"
                >
                  Cancel & Edit
                </button>
                <button
                  onClick={handlePayAndBook}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-100 transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  Pay & Confirm Booking
                </button>
              </div>
            </div>
          </div>

          {/* Right Fees Billing Summary */}
          <div className="lg:col-span-1">
            <div className="bg-gray-900 text-white rounded-2xl p-6 sticky top-24 space-y-6">
              <div>
                <h3 className="text-lg font-bold mb-4">Billing Breakdown</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Consultation Fees</span>
                    <span className="font-semibold">₹{fees.consultation.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">CGST (9%)</span>
                    <span className="font-semibold">₹{(fees.gst / 2).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">SGST (9%)</span>
                    <span className="font-semibold">₹{(fees.gst / 2).toFixed(2)}</span>
                  </div>
                  <div className="pt-3 border-t border-gray-800 flex justify-between items-center">
                    <span className="text-slate-300 font-bold">Total Amount</span>
                    <span className="text-xl font-black text-emerald-400">₹{fees.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-800">
                <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-3">Booking Details</h4>
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-slate-500 block">Doctor</span>
                    <span className="font-semibold">{selectedDoctor ? `Dr. ${selectedDoctor.user?.full_name || selectedDoctor.user?.first_name}` : ''}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Date & Time</span>
                    <span className="font-semibold">{formData.date} at {formData.time}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Type</span>
                    <span className="font-semibold capitalize">{formData.appointment_type}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: TRANSACTION PROCESSING */}
      {step === 'processing' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center max-w-xl mx-auto space-y-6 animate-fade-in my-8">
          <div className="relative w-24 h-24 mx-auto">
            {/* Outer spinning ring */}
            <div className="absolute inset-0 rounded-full border-4 border-slate-100 border-t-blue-600 animate-spin"></div>
            {/* Inner pulsing lock icon */}
            <div className="absolute inset-2 bg-blue-50 rounded-full flex items-center justify-center">
              <ShieldCheck size={32} className="text-blue-600 animate-pulse" />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-black text-navy">Processing Secure Payment</h3>
            <p className="text-slate-500 text-sm">{processingMessage}</p>
          </div>
          <p className="text-xs text-slate-400 italic">Please do not refresh this page or close your browser tab.</p>
        </div>
      )}

      {/* STEP 4: SUCCESS RECEIPT */}
      {step === 'success' && (
        <div className="max-w-2xl mx-auto space-y-8 animate-in zoom-in-95 duration-500 my-4">
          
          {/* Printable Invoice Container */}
          <div id="printable-receipt" className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            
            {/* Success Header banner */}
            <div className="bg-emerald-600 text-white p-8 text-center space-y-3">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <Check size={36} className="text-white" />
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight">Payment Successful!</h2>
              <p className="text-emerald-100 text-sm">Your appointment is booked and confirmed.</p>
            </div>

            {/* Token Dashboard */}
            <div className="p-8 border-b border-gray-100 bg-slate-50/50 flex flex-col items-center justify-center text-center space-y-2">
              <div className="flex items-center gap-2 text-slate-400">
                <Ticket size={16} />
                <span className="text-xs font-bold uppercase tracking-widest">Queue Token</span>
              </div>
              <div className="text-5xl font-black text-blue-600 tracking-tighter">
                {bookedToken}
              </div>
              <p className="text-xs text-slate-500 mt-2 font-medium">Please display this token at the reception desk during check-in.</p>
            </div>

            {/* Receipt Details */}
            <div className="p-8 space-y-6">
              <div>
                <h3 className="text-sm font-black uppercase text-slate-400 tracking-wider mb-4">Transaction Details</h3>
                <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
                  <InvoiceRow label="Patient Name" value={selectedPatient?.full_name} />
                  <InvoiceRow label="Doctor Name" value={selectedDoctor ? `Dr. ${selectedDoctor.user?.full_name || selectedDoctor.user?.first_name}` : ''} />
                  <InvoiceRow label="Consultation" value={formData.appointment_type === 'virtual' ? 'Virtual (Video)' : 'In-Person (Clinic)'} />
                  <InvoiceRow label="Clinic Location" value={fixedLocation} />
                  <InvoiceRow label="Scheduled Time" value={`${formData.date} at ${formData.time}`} />
                  <InvoiceRow label="Transaction ID" value={transactionId} />
                  <InvoiceRow label="Payment Status" value="SUCCESS" valueClass="text-emerald-600 font-extrabold" />
                  <InvoiceRow label="Payment Mode" value={paymentMethod.toUpperCase()} />
                </div>
              </div>

              {/* Detailed Breakdown */}
              <div className="pt-6 border-t border-gray-100 space-y-3">
                <div className="flex justify-between text-xs text-slate-400 font-medium">
                  <span>Consultation Charge</span>
                  <span>₹{fees.consultation.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-400 font-medium">
                  <span>CGST (9%)</span>
                  <span>₹{(fees.gst / 2).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-400 font-medium">
                  <span>SGST (9%)</span>
                  <span>₹{(fees.gst / 2).toFixed(2)}</span>
                </div>
                <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-sm">
                  <span className="font-bold text-navy">Amount Paid</span>
                  <span className="text-lg font-black text-emerald-600">₹{fees.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Footer Disclaimer */}
            <div className="p-6 bg-slate-50 border-t border-gray-100 text-[10px] text-gray-400 text-center">
              This is a computer-generated transaction invoice. You can access it anytime in your billing panel.
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-4">
            <button
              onClick={handlePrint}
              className="flex-1 py-3 bg-white border border-gray-200 hover:bg-slate-50 rounded-xl font-bold text-slate-700 transition-all flex items-center justify-center gap-2"
            >
              <Printer size={18} />
              Print Receipt
            </button>
            <button
              onClick={() => {
                if (onBack) {
                  onBack();
                } else {
                  navigate('/my-appointments');
                }
              }}
              className="flex-1 py-3 bg-navy hover:bg-slate-800 text-white rounded-xl font-bold shadow-lg mt-0 transition-all text-center"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      )}

      {/* Styled block to handle hiding other items during receipt print */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-receipt, #printable-receipt * {
            visibility: visible !important;
          }
          #printable-receipt {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}</style>
    </div>
  );
};

const SummaryItem = ({ label, value }) => (
  <div>
    <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">{label}</p>
    <p className="text-sm font-medium">{value}</p>
  </div>
);

const InvoiceRow = ({ label, value, valueClass = "text-slate-900 font-medium" }) => (
  <div>
    <span className="text-xs text-slate-400 block font-bold uppercase tracking-wider mb-0.5">{label}</span>
    <span className={`${valueClass}`}>{value}</span>
  </div>
);

export default BookAppointment;
