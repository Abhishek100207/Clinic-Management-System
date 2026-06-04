import React, { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import {
  MapPin,
  Ticket,
  CheckCircle,
  ArrowLeft,
  CreditCard,
  QrCode,
  ShieldCheck,
  Building2,
  Printer,
  Check,
  Loader2
} from 'lucide-react';
import SearchableSelect from '../common/SearchableSelect';

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

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

  // Payment states
  const [paymentMethod, setPaymentMethod] = useState('upi'); // 'upi', 'card', 'netbanking'
  const [upiId, setUpiId] = useState('');
  const [cardData, setCardData] = useState({ number: '', expiry: '', cvv: '', name: '' });
  const [selectedBank, setSelectedBank] = useState('');
  const [processingMessage, setProcessingMessage] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [fees, setFees] = useState({ consultation: 500, gst: 90, total: 590 });

  const locations = [
    { id: 'main_clinic', name: 'Main City Clinic', distance: '2.5 km' },
    { id: 'suburb_branch', name: 'Suburb Branch', distance: '8.1 km' },
    { id: 'west_wing', name: 'West Wing Center', distance: '4.3 km' },
  ];

  // Auto-calculate fees
  useEffect(() => {
    const consultation = appointmentType === 'virtual' ? 300 : 500;
    const gst = Math.round(consultation * 0.18);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFees({ consultation, gst, total: consultation + gst });
  }, [appointmentType]);

  const fetchDoctors = useCallback(async () => {
    try {
      const res = await api.get('/api/users/doctors/');
      setDoctors(Array.isArray(res?.data) ? res.data : (res?.data?.results ?? []));
    } catch (err) {
      console.error("Failed to fetch doctors", err);
    }
  }, []);

  const fetchPatients = useCallback(async () => {
    try {
      const res = await api.get('/api/users/patients/');
      const patientList = Array.isArray(res?.data) ? res.data : (res?.data?.results ?? []);
      setPatients(patientList);
      
      if (patientList.length > 0) {
        setPatientId(patientList[0].id.toString());
        if (user && user.role === 'patient') {
          setStep(2);
        }
      }
    } catch (err) {
      console.error("Failed to fetch patients", err);
    }
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDoctors();
      fetchPatients();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchDoctors, fetchPatients]);



  // Fetch slots
  useEffect(() => {
    const fetchSlots = async () => {
      if (doctorId && date && appointmentType) {
        setLoading(true);
        try {
          const res = await api.get(`/api/appointments/slots/?doctor_id=${doctorId}&date=${date}&appointment_type=${appointmentType}`);
          setAvailableSlots(res.data.available_slots || []);
        } catch (err) {
          console.error("Failed to fetch slots", err);
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

  const [patientAppointments, setPatientAppointments] = useState([]);

  // Fetch patient appointments to detect conflicts
  useEffect(() => {
    const fetchPatientAppointments = async () => {
      if (patientId) {
        try {
          const res = await api.get('/api/appointments/appointments/');
          const apptsData = Array.isArray(res?.data) ? res.data : (res?.data?.results ?? []);
          const filtered = apptsData.filter(appt => 
            appt.patient?.toString() === patientId.toString() &&
            appt.status !== 'cancelled'
          );
          setPatientAppointments(filtered);
        } catch (err) {
          console.error("Failed to fetch patient appointments", err);
          setPatientAppointments([]);
        }
      } else {
        setPatientAppointments([]);
      }
    };
    fetchPatientAppointments();
  }, [patientId]);

  const normalizeTime = (timeStr) => {
    if (!timeStr) return '';
    const match = timeStr.match(/^(\d{2}):(\d{2})/);
    return match ? `${match[1]}:${match[2]}` : timeStr;
  };

  const conflictingTimes = patientAppointments
    .filter(appt => appt.date === date)
    .map(appt => normalizeTime(appt.time));

  const handleExpiryChange = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 2) {
      val = val.substring(0, 2) + '/' + val.substring(2, 4);
    }
    setCardData(prev => ({ ...prev, expiry: val }));
  };

  const handleCardNumberChange = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    let formatted = val.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardData(prev => ({ ...prev, number: formatted.substring(0, 19) }));
  };

  const handleProceedToPayment = () => {
    if (!patientId || !doctorId || !date || !time) {
      alert("Please select all required details.");
      return;
    }
    setStep(4);
  };

  const handleBook = async () => {
    // Payment Form Validations
    if (paymentMethod === 'upi' && !upiId.trim() && !upiId.includes('@')) {
      alert("Please enter a valid UPI ID");
      return;
    }
    if (paymentMethod === 'card' && (cardData.number.replace(/\s/g, '').length !== 16 || cardData.expiry.length < 5 || cardData.cvv.length < 3 || !cardData.name.trim())) {
      alert("Please fill correct Card Details.");
      return;
    }
    if (paymentMethod === 'netbanking' && !selectedBank) {
      alert("Please select your bank.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        alert("Razorpay SDK failed to load. Please check your internet connection.");
        setLoading(false);
        return;
      }

      // 1. Create a dynamic Razorpay order in backend
      const orderPayload = {
        patient: patientId,
        doctor: doctorId,
        date: date,
        time: time,
        appointment_type: appointmentType,
        patient_location: '',
        reason: ''
      };

      const orderRes = await api.post('/api/appointments/appointments/create-razorpay-order/', orderPayload);
      const { razorpay_order_id, amount, razorpay_key_id, appointment_id } = orderRes.data;

      // Find patient & doctor objects for prefilling
      const patientObj = patients.find(p => p.id === parseInt(patientId));
      const doctorObj = doctors.find(d => d.id === parseInt(doctorId));

      // 2. Open Razorpay unified checkout widget
      const options = {
        key: razorpay_key_id,
        amount: amount,
        currency: "INR",
        name: "GA Medical Clinic",
        description: `Appointment with Dr. ${doctorObj?.user?.full_name || 'Clinic Doctor'}`,
        order_id: razorpay_order_id,
        prefill: {
          name: patientObj?.full_name || "",
          email: patientObj?.user?.email || "",
          contact: patientObj?.user?.phone || "",
          method: paymentMethod // prefill matching the tab selection
        },
        theme: {
          color: "#1e3a8a" // navy theme color
        },
        modal: {
          ondismiss: function() {
            setLoading(false);
            setStep(4);
          }
        },
        handler: async function (response) {
          setLoading(true);
          setProcessingMessage("Verifying payment transaction details...");

          try {
            // 3. Verify signature on the backend
            const verifyRes = await api.post('/api/appointments/appointments/verify-razorpay-payment/', {
              appointment_id: appointment_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature
            });

            setProcessingMessage("Payment approved! Booking your appointment slot...");
            await new Promise(resolve => setTimeout(resolve, 850));

            const verifiedAppt = verifyRes.data.appointment;
            const txnId = response.razorpay_payment_id;
            setTransactionId(txnId);

            const token = verifiedAppt.token_number || `T-${Math.floor(Math.random() * 900) + 100}`;
            setBookedToken(token);
            setStep(5); // Success step

          } catch (verifyErr) {
            console.error("Signature verification failed:", verifyErr);
            setError(verifyErr.response?.data?.error || verifyErr.response?.data?.detail || 'Signature verification failed. Please try again.');
            setStep(4);
          } finally {
            setLoading(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (err) {
      console.error("Order creation failed:", err);
      setError(err.response?.data?.error || err.response?.data?.detail || 'Failed to initiate secure payment checkout. Please try again.');
      setStep(4);
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const selectedPatient = patients.find(p => p.id === parseInt(patientId));
  const selectedDoctor = doctors.find(d => d.id === parseInt(doctorId));
  const selectedLocation = locations.find(l => l.id === location);

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
        {step < 5 && (
          <div className="flex items-center justify-between mb-10">
            {[
              { s: 1, l: 'Patient' },
              { s: 2, l: 'Details' },
              { s: 3, l: 'Schedule' },
              { s: 4, l: 'Payment' }
            ].map((item, idx) => (
              <React.Fragment key={item.s}>
                <div className={`flex flex-col items-center ${step >= item.s ? 'text-blue-600' : 'text-slate-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 font-bold transition-all ${step >= item.s ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-50 border-2 border-slate-200'}`}>{item.s}</div>
                  <span className="text-xs font-bold uppercase tracking-tighter">{item.l}</span>
                </div>
                {idx < 3 && <div className={`flex-1 h-0.5 mx-4 rounded-full transition-all ${step > item.s ? 'bg-blue-600' : 'bg-slate-100'}`}></div>}
              </React.Fragment>
            ))}
          </div>
        )}

        {/* STEP 1: SELECT PATIENT */}
        {step === 1 && (
          <div className="animate-in slide-in-from-right-4 duration-300 space-y-6">
            <h2 className="text-xl font-bold text-navy">Select Patient</h2>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Patient Search</label>
              <SearchableSelect 
                className="w-full"
                value={patientId}
                onChange={(val) => setPatientId(val)}
                options={patients.map(p => ({ value: p.id, label: `${p.full_name} (${p.patient_id})` }))}
                placeholder="-- Select a Patient --"
              />
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

        {/* STEP 2: DOCTOR & LOCATION */}
        {step === 2 && (
          <div className="animate-in slide-in-from-right-4 duration-300 space-y-8">
            <h2 className="text-xl font-bold text-navy">Doctor & Location</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Select Doctor</label>
                <SearchableSelect 
                  className="w-full"
                  value={doctorId}
                  onChange={(val) => setDoctorId(val)}
                  options={doctors.map(d => ({ value: d.id, label: `Dr. ${d.user?.full_name || d.user?.first_name} (${d.specialty})` }))}
                  placeholder="-- Choose a Doctor --"
                />
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
              <button onClick={() => setStep(user?.role === 'patient' ? 2 : 1)} className="text-slate-600 hover:bg-slate-100 px-6 py-2.5 rounded-xl font-bold transition-all">Back</button>
              <button onClick={() => setStep(3)} disabled={!doctorId} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-10 py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95">Continue</button>
            </div>
          </div>
        )}

        {/* STEP 3: DATE & TIME */}
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
                    {availableSlots.length > 0 ? availableSlots.map(slot => {
                      const slotTime = typeof slot === 'object' ? slot.time : slot;
                      const slotAvailable = typeof slot === 'object' ? slot.available : true;
                      const isConflicting = conflictingTimes.includes(normalizeTime(slotTime));
                      return (
                        <button
                          key={slotTime}
                          type="button"
                          disabled={!slotAvailable || isConflicting}
                          onClick={() => setTime(slotTime)}
                          title={isConflicting ? "Unavailable: You have another appointment at this time" : undefined}
                          className={`py-3 px-2 rounded-xl text-sm font-bold transition-all border relative ${
                            time === slotTime
                              ? 'bg-blue-600 border-blue-600 text-white shadow-lg scale-105'
                              : isConflicting
                                ? 'bg-red-50 border-red-200 text-red-500 cursor-not-allowed opacity-50 blur-[0.5px]'
                                : slotAvailable
                                  ? 'border border-gray-200 text-slate-600 hover:bg-blue-50 hover:border-blue-200 bg-white'
                                  : 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed opacity-50'
                          }`}
                        >
                          {slotTime?.substring(0, 5) || slotTime}
                          {isConflicting && (
                            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                            </span>
                          )}
                        </button>
                      );
                    }) : !loading && <p className="text-sm text-slate-400 italic py-4">No slots available for this date.</p>}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between pt-8 border-t border-gray-100">
              <button onClick={() => setStep(2)} className="text-slate-600 hover:bg-slate-100 px-6 py-2.5 rounded-xl font-bold transition-all">Back</button>
              <button onClick={handleProceedToPayment} disabled={!date || !time || loading} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-10 py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95">
                Proceed to Payment (₹{fees.total})
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: SECURE PAYMENT OR PROCESSING */}
        {step === 4 && (
          loading ? (
            <div className="text-center py-10 space-y-6 animate-fade-in">
              <div className="relative w-20 h-20 mx-auto">
                <div className="absolute inset-0 rounded-full border-4 border-slate-100 border-t-blue-600 animate-spin"></div>
                <div className="absolute inset-2 bg-blue-50 rounded-full flex items-center justify-center">
                  <ShieldCheck size={28} className="text-blue-600 animate-pulse" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-navy">Processing Secure Payment</h3>
                <p className="text-slate-500 text-sm">{processingMessage}</p>
              </div>
            </div>
          ) : (
            <div className="animate-in slide-in-from-right-4 duration-300 space-y-6">
              <h2 className="text-xl font-bold text-navy">Consultation Secure Payment</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Left col: payment inputs */}
                <div className="md:col-span-2 space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    {['upi', 'card', 'netbanking'].map(method => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentMethod(method)}
                        className={`py-2 px-3 rounded-xl border font-bold text-xs capitalize transition-all ${
                          paymentMethod === method ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        {method === 'upi' ? 'UPI / QR' : method === 'card' ? 'Debit/Credit' : 'Net Banking'}
                      </button>
                    ))}
                  </div>

                  {/* Form Container */}
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl min-h-[160px]">
                    {paymentMethod === 'upi' && (
                      <div className="space-y-3 animate-fade-in">
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                          <div className="bg-white p-2 rounded-lg border border-gray-200 flex flex-col items-center">
                            <QrCode size={96} className="text-slate-800" />
                            <span className="text-[9px] text-gray-400 mt-1 font-bold">Scan to Pay</span>
                          </div>
                          <div className="flex-1 w-full space-y-2">
                            <p className="text-xs text-slate-500">Scan QR code using GPay, Paytm, PhonePe or enter UPI ID below:</p>
                            <div>
                              <input
                                type="text"
                                placeholder="username@bank"
                                value={upiId}
                                onChange={(e) => setUpiId(e.target.value)}
                                className="w-full px-3 py-2 bg-white rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {paymentMethod === 'card' && (
                      <div className="space-y-3 animate-fade-in">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 uppercase mb-0.5">Cardholder Name</label>
                          <input
                            type="text"
                            placeholder="John Doe"
                            value={cardData.name}
                            onChange={(e) => setCardData(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full px-3 py-1.5 bg-white rounded-lg border border-gray-200 text-sm font-medium outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 uppercase mb-0.5">Card Number</label>
                          <input
                            type="text"
                            placeholder="4111 2222 3333 4444"
                            value={cardData.number}
                            onChange={handleCardNumberChange}
                            className="w-full px-3 py-1.5 bg-white rounded-lg border border-gray-200 text-sm font-mono outline-none"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-0.5">Expiry</label>
                            <input
                              type="text"
                              placeholder="MM/YY"
                              value={cardData.expiry}
                              onChange={handleExpiryChange}
                              maxLength={5}
                              className="w-full px-3 py-1.5 bg-white rounded-lg border border-gray-200 text-sm font-mono text-center outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-0.5">CVV</label>
                            <input
                              type="password"
                              placeholder="•••"
                              value={cardData.cvv}
                              onChange={(e) => setCardData(prev => ({ ...prev, cvv: e.target.value.replace(/\D/g, '').substring(0, 3) }))}
                              className="w-full px-3 py-1.5 bg-white rounded-lg border border-gray-200 text-sm font-mono text-center outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {paymentMethod === 'netbanking' && (
                      <div className="space-y-3 animate-fade-in">
                        <label className="block text-xs font-bold text-gray-600 mb-1">Select Bank</label>
                        <select
                          value={selectedBank}
                          onChange={(e) => setSelectedBank(e.target.value)}
                          className="w-full px-3 py-2 bg-white rounded-lg border border-gray-200 text-sm outline-none"
                        >
                          <option value="">-- Select Bank --</option>
                          <option value="SBI">State Bank of India</option>
                          <option value="HDFC">HDFC Bank</option>
                          <option value="ICICI">ICICI Bank</option>
                          <option value="AXIS">Axis Bank</option>
                          <option value="PNB">Punjab National Bank</option>
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 p-2.5 bg-emerald-50 rounded-lg text-emerald-800 text-[10px]">
                    <ShieldCheck size={16} className="text-emerald-600 flex-shrink-0" />
                    <span>Your session is protected with secure 256-bit bank-grade encryption.</span>
                  </div>
                </div>

                {/* Right col: fee break down */}
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-4 h-fit">
                  <h3 className="text-sm font-bold text-slate-800">Fees Summary</h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-slate-500">
                      <span>Consultation</span>
                      <span>₹{fees.consultation.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>GST (18%)</span>
                      <span>₹{fees.gst.toFixed(2)}</span>
                    </div>
                    <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm font-bold text-slate-800">
                      <span>Total Amount</span>
                      <span className="text-emerald-600">₹{fees.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

              </div>

              {error && <p className="text-xs font-bold text-rose-600">{error}</p>}

              <div className="flex justify-between pt-6 border-t border-gray-100">
                <button onClick={() => setStep(3)} className="text-slate-600 hover:bg-slate-100 px-6 py-2.5 rounded-xl font-bold transition-all">Back</button>
                <button onClick={handleBook} className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95">
                  Pay & Confirm Booking
                </button>
              </div>
            </div>
          )
        )}

        {/* STEP 5: SUCCESS CONFIRMATION RECEIPT */}
        {step === 5 && (
          <div className="animate-in zoom-in-95 duration-500 text-center py-6 space-y-6">
            
            <div id="printable-booking-receipt" className="max-w-md mx-auto bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="bg-emerald-600 text-white p-6 space-y-2">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto">
                  <Check className="text-white" size={24} />
                </div>
                <h3 className="text-xl font-black">Booking Confirmed!</h3>
                <p className="text-emerald-100 text-xs">Payment received successfully.</p>
              </div>

              {/* Token Number */}
              <div className="p-6 bg-slate-50 border-b border-gray-100 flex flex-col items-center">
                <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                  <Ticket size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Queue Token</span>
                </div>
                <div className="text-4xl font-black text-blue-600 tracking-tighter">
                  {bookedToken}
                </div>
                <p className="text-[10px] text-slate-500 mt-1 font-medium">Please check in with this token at the clinic.</p>
              </div>

              {/* Receipt details */}
              <div className="p-6 text-left space-y-3 text-xs border-b border-gray-100">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Patient</span>
                  <span className="font-bold text-slate-800">{selectedPatient?.full_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Doctor</span>
                  <span className="font-bold text-slate-800">{selectedDoctor ? `Dr. ${selectedDoctor.user?.full_name || selectedDoctor.user?.first_name}` : ''}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Date & Time</span>
                  <span className="font-bold text-slate-800">{date} at {time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Location</span>
                  <span className="font-bold text-slate-800">{selectedLocation?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Transaction ID</span>
                  <span className="font-mono font-bold text-slate-800">{transactionId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Paid Amount</span>
                  <span className="font-extrabold text-emerald-600">₹{fees.total.toFixed(2)}</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 text-[9px] text-slate-400">
                Please present this card or receipt upon arrival.
              </div>
            </div>

            <div className="max-w-md mx-auto flex gap-3">
              <button
                onClick={handlePrint}
                className="flex-1 py-2.5 bg-white border border-gray-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5"
              >
                <Printer size={16} />
                Print Receipt
              </button>
              <button 
                onClick={() => navigate(user?.role === 'doctor' ? '/dashboard/doctor' : '/dashboard/patient')}
                className="flex-1 bg-navy text-white py-2.5 rounded-xl font-bold hover:bg-slate-800 text-xs transition-all shadow-lg"
              >
                Go to Dashboard
              </button>
            </div>

            {/* Print style block specific to this page */}
            <style>{`
              @media print {
                body * {
                  visibility: hidden !important;
                }
                #printable-booking-receipt, #printable-booking-receipt * {
                  visibility: visible !important;
                }
                #printable-booking-receipt {
                  position: absolute !important;
                  left: 50% !important;
                  top: 50% !important;
                  transform: translate(-50%, -50%) !important;
                  width: 100% !important;
                  max-width: 450px !important;
                  box-shadow: none !important;
                  border: none !important;
                }
              }
            `}</style>
          </div>
        )}

      </div>
    </div>
  );
};

export default AppointmentBookingPage;
