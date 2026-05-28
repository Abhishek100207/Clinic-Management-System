import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import {
  User,
  MapPin,
  Stethoscope,
  Star,
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
  Ticket,
  DollarSign,
  FileText,
  Download,
  Eye,
  X
} from 'lucide-react';

import { useAuthStore } from '../../store/authStore';
import SearchableSelect from '../common/SearchableSelect';
import { billingStorage } from '../../utils/billingStorage';
import { toast } from 'react-toastify';
import { queueStorage } from '../../utils/queueStorage';
import { calendarStorage } from '../../utils/calendarStorage';
import AvailabilityCalendar from '../doctor/AvailabilityCalendar';

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

const BookAppointment = ({ onBack }) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  // Core States
  const [step, setStep] = useState('booking'); // 'booking', 'payment', 'processing', 'success'
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [notification, setNotification] = useState(null);
  const [createdInvoice, setCreatedInvoice] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);

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
  const [paymentMethod, setPaymentMethod] = useState(
    (user?.role === 'receptionist' || user?.role === 'senior_doctor') ? 'cash' : 'upi'
  ); // 'upi', 'card', 'netbanking', 'cash', 'pay_later'
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
        const patientData = Array.isArray(pRes?.data) ? pRes.data : (pRes?.data?.results ?? []);
        const doctorData = Array.isArray(dRes?.data) ? dRes.data : (dRes?.data?.results ?? []);
        setPatients(patientData);
        setDoctors(doctorData);

        if (patientData.length > 0) {
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
          const area = data.address?.neighbourhood || data.address?.suburb || data.address?.residential || '';
          const city = data.address?.city || data.address?.town || data.address?.state || '';
          const address = [area, city].filter(Boolean).join(', ') || 'Unknown Location';
          setFormData(prev => ({ ...prev, patient_location: address }));
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

    // Verify that doctor is not on leave or hold on selected date
    const selectedDoctor = doctors.find(d => d.id === parseInt(formData.doctor_id));
    const statusInfo = calendarStorage.getDayStatus(formData.doctor_id, formData.date, selectedDoctor?.availabilities || []);
    if (statusInfo.status === 'leave') {
      setNotification({ type: 'error', message: `Doctor is on leave on this date (${statusInfo.reason || 'No reason specified'}). Please choose another date.` });
      return;
    }
    if (statusInfo.status === 'hold') {
      setNotification({ type: 'error', message: `Doctor's schedule is on hold on this date (${statusInfo.reason || 'No reason specified'}). Please choose another date.` });
      return;
    }
    if (statusInfo.status === 'unavailable') {
      setNotification({ type: 'error', message: 'Doctor is not available or clinic is closed on this date. Please choose another date.' });
      return;
    }

    setNotification(null);
    setStep('payment');
  };

  // Perform secure transaction and complete booking
  const handlePayAndBook = async () => {
    // Basic Payment Validations
    if (paymentMethod === 'upi' && !upiId.trim() && !upiId.includes('@')) {
      toast.error('Please enter a valid UPI ID (e.g. name@bank)');
      return;
    }
    if (paymentMethod === 'card' && (cardData.number.replace(/\s/g, '').length !== 16 || cardData.expiry.length < 5 || cardData.cvv.length < 3 || !cardData.name.trim())) {
      toast.error('Please fill in correct Card details.');
      return;
    }
    if (paymentMethod === 'netbanking' && !selectedBank) {
      toast.error('Please select your bank.');
      return;
    }

    setLoading(true);
    setNotification(null);

    // If payment method is an online method (upi, card, netbanking), use Razorpay
    if (['upi', 'card', 'netbanking'].includes(paymentMethod)) {
      try {
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          toast.error('Razorpay SDK failed to load. Please check your internet connection.');
          setLoading(false);
          return;
        }

        // 1. Create dynamic Razorpay order in backend
        const orderPayload = {
          patient: formData.patient_id,
          doctor: formData.doctor_id,
          date: formData.date,
          time: formData.time,
          appointment_type: formData.appointment_type,
          patient_location: formData.patient_location,
          reason: formData.reason
        };

        const orderRes = await api.post('/api/appointments/appointments/create-razorpay-order/', orderPayload);
        const { razorpay_order_id, amount, razorpay_key_id, appointment_id } = orderRes.data;

        // Find patient & doctor objects for prefilling
        const patientObj = patients.find(p => p.id === parseInt(formData.patient_id));
        const doctorObj = doctors.find(d => d.id === parseInt(formData.doctor_id));

        // 2. Open Razorpay unified checkout
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
            method: paymentMethod // prefill payment mode matching tab choice
          },
          theme: {
            color: "#1e3a8a" // Sleek Navy Brand Theme color
          },
          modal: {
            ondismiss: function() {
              setLoading(false);
              setStep('payment');
            }
          },
          handler: async function (response) {
            setStep('processing');
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
              await new Promise(resolve => setTimeout(resolve, 800));

              const verifiedAppt = verifyRes.data.appointment;
              const txnId = response.razorpay_payment_id;
              setTransactionId(txnId);

              let token = verifiedAppt.token_number || `T-${Math.floor(Math.random() * 900) + 100}`;

              const todayStr = (() => {
                const d = new Date();
                const yyyy = d.getFullYear();
                const mm = String(d.getMonth() + 1).padStart(2, '0');
                const dd = String(d.getDate()).padStart(2, '0');
                return `${yyyy}-${mm}-${dd}`;
              })();

              if (formData.date === todayStr && formData.appointment_type !== 'virtual') {
                try {
                  const patchRes = await api.patch(`/api/appointments/appointments/${verifiedAppt.id}/`, {
                    status: 'checked_in',
                    queue_type: 'scheduled'
                  });
                  token = patchRes.data.queue_token || token;
                } catch (e) {
                  console.error("Failed to auto check-in:", e);
                }
              }
              setBookedToken(token);

              const inv = await billingStorage.addInvoice({
                appointmentId: verifiedAppt.id,
                patientId: formData.patient_id,
                patientName: patientObj?.full_name || 'Walk-in Patient',
                doctorId: formData.doctor_id,
                doctorName: doctorObj ? `Dr. ${doctorObj.user?.full_name || doctorObj.user?.first_name}` : 'Clinic Doctor',
                doctorSpecialty: doctorObj?.specialty || 'General Physician',
                appointmentDate: formData.date,
                appointmentTime: formData.time,
                appointmentType: formData.appointment_type,
                consultationFee: fees.consultation,
                tax: fees.gst,
                totalAmount: fees.total,
                paymentStatus: 'PAID',
                paymentMode: paymentMethod.toUpperCase(),
                transactionId: txnId,
                tokenNumber: token
              });
              setCreatedInvoice(inv);
              setStep('success');

            } catch (verifyErr) {
              console.error("Signature verification failed:", verifyErr);
              const errMsg = verifyErr.response?.data?.error || verifyErr.response?.data?.detail || 'Signature verification failed. Please try again.';
              setNotification({ type: 'error', message: errMsg });
              setStep('payment');
            } finally {
              setLoading(false);
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();

      } catch (err) {
        console.error("Order creation failed:", err);
        const errMsg = err.response?.data?.error || err.response?.data?.detail || 'Failed to start payment transaction. Please try again.';
        setNotification({ type: 'error', message: errMsg });
        setStep('payment');
        setLoading(false);
      }

    } else {
      // CASH / PAY LATER Flow (Bypasses Razorpay checkout modal)
      setStep('processing');
      const isPendingPayment = paymentMethod === 'pay_later' || (paymentMethod === 'cash' && user?.role !== 'receptionist' && user?.role !== 'senior_doctor');
      
      const messages = isPendingPayment
        ? [
            "Creating appointment record...",
            "Generating clinic queue token...",
            "Creating billing invoice (PENDING status)...",
            "Appointment registered successfully!"
          ]
        : [
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
        const generatedTxn = isPendingPayment ? '' : 'TXN' + Math.floor(100000000 + Math.random() * 900000000);
        setTransactionId(generatedTxn);

        const patientObj = patients.find(p => p.id === parseInt(formData.patient_id));
        const doctorObj = doctors.find(d => d.id === parseInt(formData.doctor_id));
        const status = isPendingPayment ? 'PENDING' : 'PAID';

        let token = response.data.token_number || `T-${Math.floor(Math.random() * 900) + 100}`;

        const todayStr = (() => {
          const d = new Date();
          const yyyy = d.getFullYear();
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const dd = String(d.getDate()).padStart(2, '0');
          return `${yyyy}-${mm}-${dd}`;
        })();

        if (formData.date === todayStr && formData.appointment_type !== 'virtual' && (status === 'PAID' || paymentMethod === 'cash')) {
          try {
            const patchRes = await api.patch(`/api/appointments/appointments/${response.data.id}/`, {
              status: 'checked_in',
              queue_type: 'scheduled'
            });
            token = patchRes.data.queue_token || token;
          } catch (e) {
            console.error("Failed to auto check-in:", e);
          }
        }
        setBookedToken(token);

        const inv = await billingStorage.addInvoice({
          appointmentId: response.data.id || `APP-${Math.floor(100000 + Math.random() * 900000)}`,
          patientId: formData.patient_id,
          patientName: patientObj?.full_name || 'Walk-in Patient',
          doctorId: formData.doctor_id,
          doctorName: doctorObj ? `Dr. ${doctorObj.user?.full_name || doctorObj.user?.first_name}` : 'Clinic Doctor',
          doctorSpecialty: doctorObj?.specialty || 'General Physician',
          appointmentDate: formData.date,
          appointmentTime: formData.time,
          appointmentType: formData.appointment_type,
          consultationFee: fees.consultation,
          tax: fees.gst,
          totalAmount: fees.total,
          paymentStatus: status,
          paymentMode: isPendingPayment ? '' : paymentMethod.toUpperCase(),
          transactionId: generatedTxn,
          tokenNumber: token
        });
        setCreatedInvoice(inv);
        setStep('success');

      } catch (err) {
        console.error("Booking error:", err);
        const errMsg = err.response?.data?.error || err.response?.data?.detail || 'Failed to book appointment. Please try again.';
        setNotification({ type: 'error', message: errMsg });
        setStep('payment');
      } finally {
        setLoading(false);
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadInvoice = (invoice) => {
    if (!invoice) return;
    const txtContent = `
==================================================
              GA MEDICAL CLINIC RECEIPT
==================================================
Invoice ID      : ${invoice.invoiceId}
Generated Date  : ${new Date(invoice.dateGenerated).toLocaleString('en-IN')}
Token Number    : ${invoice.tokenNumber || 'N/A'}
Appointment Date: ${invoice.appointmentDate} at ${invoice.appointmentTime}
--------------------------------------------------
PATIENT DETAILS
Name            : ${invoice.patientName}
Patient ID      : PAT-${invoice.patientId}

DOCTOR DETAILS
Name            : ${invoice.doctorName}
Department      : ${invoice.doctorSpecialty}
Visit Type      : ${invoice.appointmentType === 'virtual' ? 'Virtual (Video)' : 'In-Person (Clinic)'}
--------------------------------------------------
BILLING BREAKDOWN
Consultation Fee: INR ${invoice.consultationFee.toFixed(2)}
Tax (GST 18%)   : INR ${invoice.tax.toFixed(2)}
--------------------------------------------------
GRAND TOTAL     : INR ${invoice.totalAmount.toFixed(2)}
--------------------------------------------------
PAYMENT INFORMATION
Status          : ${invoice.paymentStatus}
Payment Mode    : ${invoice.paymentMode || 'N/A'}
Transaction ID  : ${invoice.transactionId || 'N/A'}
==================================================
Thank you for choosing GA Medical Clinic.
For support, email: support@gacms.com
==================================================
`;

    const blob = new Blob([txtContent.trim()], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Receipt_${invoice.invoiceId}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
                <SearchableSelect
                  options={patients.map(p => ({ value: p.id, label: p.full_name }))}
                  value={formData.patient_id}
                  onChange={(val) => setFormData({ ...formData, patient_id: val })}
                  placeholder="Choose a patient"
                  icon={User}
                  className="w-full"
                />
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
                <SearchableSelect
                  options={doctors.map(d => ({ 
                    value: d.id, 
                    label: `Dr. ${d.user?.full_name || d.user?.first_name || 'Unknown'} (${d.specialty || 'General'})`
                  }))}
                  value={formData.doctor_id}
                  onChange={(val) => setFormData({ ...formData, doctor_id: val, time: '' })}
                  placeholder="Choose a doctor"
                  icon={Stethoscope}
                  className="w-full"
                />
                
                {/* Doctor Profile Card (Shows Ratings) */}
                {selectedDoctor && (
                  <div className="mt-4 p-4 rounded-xl border border-blue-100 bg-blue-50/50 flex items-center justify-between animate-in fade-in duration-300">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                        {selectedDoctor.user?.first_name?.[0] || 'D'}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">Dr. {selectedDoctor.user?.full_name || selectedDoctor.user?.first_name}</p>
                        <p className="text-xs text-gray-500">{selectedDoctor.specialty}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-md shadow-sm border border-gray-100">
                        <Star size={14} className="text-yellow-500 fill-yellow-500" />
                        <span className="text-sm font-bold text-gray-800">{selectedDoctor.average_rating || 'NEW'}</span>
                      </div>
                      <span className="text-[10px] text-gray-400 mt-1">{selectedDoctor.total_reviews || 0} reviews</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Consultation Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Consultation Type</label>
                <div className={`grid ${user?.role === 'receptionist' ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
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
                  {user?.role !== 'receptionist' && (
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
                  )}
                </div>
              </div>              {/* Date & Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Select Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input
                      type="date"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      value={formData.date}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value, time: '' })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Doctor Availability & Slot Selection</label>
                  {fetchingSlots ? (
                    <div className="flex items-center gap-2 text-blue-600 text-sm font-medium p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      Checking availability...
                    </div>
                  ) : formData.doctor_id && formData.date ? (
                    (() => {
                      const dayStatus = calendarStorage.getDayStatus(formData.doctor_id, formData.date, selectedDoctor?.availabilities || []);
                      
                      if (dayStatus.status === 'available') {
                        // Get today's date string in YYYY-MM-DD (local time)
                        const todayStr = (() => {
                          const d = new Date();
                          const yyyy = d.getFullYear();
                          const mm = String(d.getMonth() + 1).padStart(2, '0');
                          const dd = String(d.getDate()).padStart(2, '0');
                          return `${yyyy}-${mm}-${dd}`;
                        })();
                        const isToday = formData.date === todayStr;
                        const nowMinutes = isToday
                          ? new Date().getHours() * 60 + new Date().getMinutes()
                          : 0;

                        const filteredSlots = availableSlots.filter(s => {
                          const hour = parseInt((s.time || '').substring(0, 2) || '0');
                          const minute = parseInt((s.time || '00:00').substring(3, 5) || '0');
                          // Filter by appointment type hour window
                          const inWindow = formData.appointment_type === 'in_person'
                            ? hour >= 9 && hour < 13
                            : hour >= 14 && hour < 18;
                          if (!inWindow) return false;
                          // For today: hide slots that are already past
                          if (isToday && (hour * 60 + minute) <= nowMinutes) return false;
                          return true;
                        });

                        return (
                          <div className="space-y-4 animate-in fade-in duration-200">
                            {/* Available Status Alert */}
                            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-center gap-2 text-xs font-bold shadow-sm">
                              <span className="flex h-2.5 w-2.5 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                              </span>
                              <span>Doctor is Available</span>
                            </div>

                            {/* Time Slots Grid */}
                            {filteredSlots.length > 0 ? (
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
                            ) : (
                              <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-amber-700 text-xs font-semibold">
                                No {formData.appointment_type === 'in_person' ? 'visiting' : 'consulting'} slots on this date.
                              </div>
                            )}
                          </div>
                        );
                      }
                      
                      if (dayStatus.status === 'leave') {
                        return (
                          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-bold flex flex-col gap-1.5 animate-in fade-in duration-200 shadow-sm">
                            <div className="flex items-center gap-1.5 text-rose-900 text-sm">
                              <span>🌴</span>
                              <span>Doctor is On Leave</span>
                            </div>
                            <p className="opacity-90 leading-relaxed font-medium">Reason: {dayStatus.reason || 'Annual Leave / Personal Leave'}</p>
                            <p className="text-[10px] text-rose-550 italic mt-1 font-semibold">* No slots are available. Please select another date.</p>
                          </div>
                        );
                      }
                      
                      if (dayStatus.status === 'hold') {
                        return (
                          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-bold flex flex-col gap-1.5 animate-in fade-in duration-200 shadow-sm">
                            <div className="flex items-center gap-1.5 text-amber-900 text-sm">
                              <span>⏳</span>
                              <span>Doctor Schedule is On Hold</span>
                            </div>
                            <p className="opacity-90 leading-relaxed font-medium">Reason: {dayStatus.reason || 'Schedule Temporarily Suspended'}</p>
                            <p className="text-[10px] text-amber-650 italic mt-1 font-semibold">* No slots are available. Please select another date.</p>
                          </div>
                        );
                      }
                      
                      if (dayStatus.status === 'unavailable') {
                        return (
                          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs font-bold flex flex-col gap-1 animate-in fade-in duration-200 shadow-sm">
                            <div className="flex items-center gap-1.5 text-slate-800 text-sm">
                              <span>🚫</span>
                              <span>Doctor Unavailable / Clinic Closed</span>
                            </div>
                            <p className="text-[10px] text-slate-500 italic mt-1 font-medium pl-4">* Doctor does not consult on this day of the week.</p>
                          </div>
                        );
                      }

                      return null;
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
                <div className={`grid ${user?.role === 'receptionist' || user?.role === 'senior_doctor' ? 'grid-cols-5' : 'grid-cols-4'} gap-3`}>
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
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                      paymentMethod === 'cash' ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm' : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'
                    }`}
                  >
                    <DollarSign size={24} className="mb-2" />
                    <span className="text-xs font-bold">Cash at Desk</span>
                  </button>
                  {(user?.role === 'receptionist' || user?.role === 'senior_doctor') && (
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('pay_later')}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                        paymentMethod === 'pay_later' ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm' : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'
                      }`}
                    >
                      <FileText size={24} className="mb-2" />
                      <span className="text-xs font-bold">Pay Later</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Payment Form Fields based on selection */}
              <div className="p-6 bg-slate-50 rounded-xl border border-slate-100 min-h-[200px]">
                
                {/* Cash Flow */}
                {paymentMethod === 'cash' && (
                  <div className="space-y-4 animate-fade-in py-6 text-center">
                    <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-500 border border-emerald-100 shadow-sm">
                      <DollarSign size={32} />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-lg">
                        {(user?.role === 'receptionist' || user?.role === 'senior_doctor') ? 'Receive Cash Payment' : 'Pay at Clinic'}
                      </h4>
                      <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
                        {(user?.role === 'receptionist' || user?.role === 'senior_doctor') ? (
                          <>Please collect <span className="font-black text-slate-900">₹{fees.total}</span> in cash from the patient. Once received, click the button below to finalize booking and mark the invoice as PAID.</>
                        ) : (
                          <>Please pay <span className="font-black text-slate-900">₹{fees.total}</span> in cash at the Reception Desk upon arrival. Click the button below to confirm your booking.</>
                        )}
                      </p>
                    </div>
                  </div>
                )}

                {/* Pay Later Flow */}
                {paymentMethod === 'pay_later' && (
                  <div className="space-y-4 animate-fade-in py-6 text-center">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto text-blue-500 border border-blue-100 shadow-sm">
                      <FileText size={32} />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-lg">Generate Pending Invoice</h4>
                      <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
                        This appointment will be booked immediately, and an invoice of <span className="font-black text-slate-900">₹{fees.total}</span> will be generated in <span className="text-amber-600 font-bold">PENDING</span> status.
                      </p>
                    </div>
                  </div>
                )}

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
            <div className={`p-8 text-center space-y-3 text-white ${createdInvoice?.paymentStatus === 'PENDING' ? 'bg-blue-600' : 'bg-emerald-600'}`}>
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                {createdInvoice?.paymentStatus === 'PENDING' ? <FileText size={36} className="text-white" /> : <Check size={36} className="text-white" />}
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight">
                {createdInvoice?.paymentStatus === 'PENDING' ? 'Appointment Booked!' : 'Payment Successful!'}
              </h2>
              <p className={`${createdInvoice?.paymentStatus === 'PENDING' ? 'text-blue-100' : 'text-emerald-100'} text-sm`}>
                {createdInvoice?.paymentStatus === 'PENDING' ? 'Your appointment is booked. Payment invoice generated.' : 'Your appointment is booked and confirmed.'}
              </p>
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
                  <InvoiceRow label="Transaction ID" value={transactionId || 'N/A (Pending Payment)'} />
                  <InvoiceRow 
                    label="Payment Status" 
                    value={createdInvoice?.paymentStatus === 'PENDING' ? 'PENDING' : 'SUCCESS'} 
                    valueClass={createdInvoice?.paymentStatus === 'PENDING' ? 'text-amber-600 font-extrabold' : 'text-emerald-600 font-extrabold'} 
                  />
                  <InvoiceRow label="Payment Mode" value={createdInvoice?.paymentStatus === 'PENDING' && paymentMethod === 'pay_later' ? 'PAY LATER' : paymentMethod.toUpperCase()} />
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
          <div className="space-y-4 w-full">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => {
                  if (!createdInvoice) {
                    alert('Invoice not available yet. Please try again.');
                    return;
                  }
                  setShowViewModal(true);
                }}
                disabled={!createdInvoice}
                title={!createdInvoice ? 'Invoice not available' : 'View full invoice details'}
                className="py-3 bg-white border border-gray-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl font-bold text-slate-700 transition-all flex items-center justify-center gap-2 text-sm shadow-sm"
              >
                <Eye size={18} />
                View Invoice
              </button>
              <button
                onClick={() => {
                  if (!createdInvoice) {
                    alert('Receipt not available yet. Please try again.');
                    return;
                  }
                  handleDownloadInvoice(createdInvoice);
                }}
                disabled={!createdInvoice}
                title={!createdInvoice ? 'Receipt not available' : 'Download receipt as text file'}
                className="py-3 bg-white border border-gray-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl font-bold text-slate-700 transition-all flex items-center justify-center gap-2 text-sm shadow-sm"
              >
                <Download size={18} />
                Download Receipt
              </button>
              <button
                onClick={handlePrint}
                title="Print or save this receipt as PDF"
                className="py-3 bg-white border border-gray-200 hover:bg-slate-50 rounded-xl font-bold text-slate-700 transition-all flex items-center justify-center gap-2 text-sm shadow-sm"
              >
                <Printer size={18} />
                Print Receipt
              </button>
            </div>

            <button
              onClick={() => {
                // Always call onBack first to reset the parent booking panel if embedded
                if (onBack) onBack();
                // Then navigate to the My Appointments page
                navigate('/my-appointments');
              }}
              className="w-full py-3.5 bg-navy hover:bg-slate-800 active:scale-95 text-white rounded-xl font-bold shadow-lg transition-all text-center text-sm flex items-center justify-center gap-2"
            >
              <Calendar size={16} />
              Go to My Appointments
            </button>
          </div>
        </div>
      )}

      {/* --- DETAILED VIEW INVOICE MODAL --- */}
      {showViewModal && createdInvoice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col text-slate-700">
            
            {/* Modal Head */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <span className="text-sm font-bold text-slate-500 uppercase tracking-widest font-bold">Patient Invoice Details</span>
              <button 
                onClick={() => setShowViewModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Printable Invoice Container */}
            <div className="flex-1 overflow-y-auto p-8" id="printable-invoice">
              <div className="flex flex-col md:flex-row justify-between items-start border-b border-slate-200 pb-6 mb-6 gap-4">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">GA MEDICAL CLINIC</h2>
                  <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-wider">Comprehensive Clinic Management</p>
                  <p className="text-xs text-slate-500 mt-2">12, Green Avenue, Sector 5, Mumbai</p>
                  <p className="text-xs text-slate-500">Support: support@gacms.com | Tel: +91 22 928374</p>
                </div>
                <div className="text-left md:text-right">
                  <div className="bg-slate-100 px-3 py-1.5 rounded-lg inline-block mb-3">
                    <span className="font-mono text-xs font-extrabold text-slate-900">INV ID: {createdInvoice.invoiceId}</span>
                  </div>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Date Generated</p>
                  <p className="text-xs text-slate-600 font-bold mt-0.5">{new Date(createdInvoice.dateGenerated).toLocaleString('en-IN')}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black block mb-1">Billing To:</span>
                  <p className="text-sm font-bold text-slate-900">{createdInvoice.patientName}</p>
                  <p className="text-xs text-slate-500 mt-1">Patient ID: #PAT-{createdInvoice.patientId}</p>
                  <p className="text-xs text-slate-500">Token Number: <span className="font-bold text-blue-600">{createdInvoice.tokenNumber || 'N/A'}</span></p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black block mb-1">Consultation With:</span>
                  <p className="text-sm font-bold text-slate-900">{createdInvoice.doctorName}</p>
                  <p className="text-xs text-slate-500 mt-1">Department: {createdInvoice.doctorSpecialty}</p>
                  <p className="text-xs text-slate-500">Visit Type: <span className="capitalize">{createdInvoice.appointmentType === 'virtual' ? 'Virtual (Video)' : 'In-Person (Clinic)'}</span></p>
                </div>
              </div>

              {/* Fee Breakdown */}
              <div className="mb-8 font-medium">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-bold text-xs uppercase tracking-wider">
                      <th className="py-2">Item Description</th>
                      <th className="py-2 text-right">Fee Rate</th>
                      <th className="py-2 text-right">CGST (9%)</th>
                      <th className="py-2 text-right">SGST (9%)</th>
                      <th className="py-2 text-right">Total Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-100 text-slate-900">
                      <td className="py-4">
                        <span className="font-bold">Consultation Service</span>
                        <p className="text-[10px] text-slate-400 font-medium">Scheduled on {createdInvoice.appointmentDate} at {createdInvoice.appointmentTime}</p>
                      </td>
                      <td className="py-4 text-right">₹{createdInvoice.consultationFee.toFixed(2)}</td>
                      <td className="py-4 text-right">₹{(createdInvoice.tax / 2).toFixed(2)}</td>
                      <td className="py-4 text-right">₹{(createdInvoice.tax / 2).toFixed(2)}</td>
                      <td className="py-4 text-right font-black">₹{createdInvoice.totalAmount.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Total Summary */}
              <div className="flex flex-col items-end border-t border-slate-200 pt-6 gap-2">
                <div className="w-64 space-y-2 text-sm text-slate-600 font-medium">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>₹{createdInvoice.consultationFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax (GST 18%)</span>
                    <span>₹{createdInvoice.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-3 border-t border-slate-100 text-base font-extrabold text-slate-900">
                    <span>Grand Total</span>
                    <span className="text-lg font-black text-emerald-600">₹{createdInvoice.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Status Section */}
              <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="text-center md:text-left">
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black block mb-1">Receipt Status</span>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      createdInvoice.paymentStatus === 'PAID'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}>
                      {createdInvoice.paymentStatus}
                    </span>
                    {createdInvoice.paymentStatus === 'PAID' && (
                      <span className="text-xs text-slate-500 font-medium">via {createdInvoice.paymentMode}</span>
                    )}
                  </div>
                </div>
                {createdInvoice.paymentStatus === 'PAID' && createdInvoice.transactionId && (
                  <div className="text-center md:text-right">
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black block mb-1">Transaction Ref ID</span>
                    <span className="font-mono text-xs font-extrabold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg inline-block">
                      {createdInvoice.transactionId}
                    </span>
                  </div>
                )}
              </div>

              <p className="text-[10px] text-slate-400 italic mt-12 text-center border-t border-dashed border-slate-200 pt-6">
                This is a system generated print invoice. No physical signature is required.
              </p>
            </div>

            {/* Modal Buttons */}
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 print:hidden">
              <button 
                onClick={() => setShowViewModal(false)}
                className="px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-600 rounded-xl font-bold text-sm border border-slate-200 transition-colors"
              >
                Close View
              </button>
              <button 
                onClick={() => handleDownloadInvoice(createdInvoice)}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all active:scale-95"
              >
                <Download size={16} />
                Download Receipt
              </button>
              <button 
                onClick={handlePrint}
                className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all active:scale-95"
              >
                <Printer size={16} />
                Print Invoice
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Styled block to handle hiding other items during receipt print */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          ${showViewModal ? '#printable-invoice, #printable-invoice *' : '#printable-receipt, #printable-receipt *'} {
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
          #printable-invoice {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
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
