import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { billingStorage } from '../../utils/billingStorage';
import api from '../../api/axios';
import {
  FileText,
  Search,
  Filter,
  Eye,
  Download,
  Printer,
  X,
  CreditCard,
  Building2,
  QrCode,
  ShieldCheck,
  Check,
  TrendingUp,
  IndianRupee,
  AlertCircle,
  DollarSign,
  Receipt,
  Plus,
  CheckCircle,
  Clock,
  User
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

const getInvoiceDate = (inv) => {
  if (inv.dateGenerated) return new Date(inv.dateGenerated);
  if (inv.appointmentDate) {
    const [year, month, day] = inv.appointmentDate.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  return new Date();
};

const isToday = (inv) => {
  const d = getInvoiceDate(inv);
  const today = new Date();
  return d.getDate() === today.getDate() &&
         d.getMonth() === today.getMonth() &&
         d.getFullYear() === today.getFullYear();
};

const isThisWeek = (inv) => {
  const d = getInvoiceDate(inv);
  const today = new Date();
  const currentDay = today.getDay();
  const diffToMonday = currentDay === 0 ? 6 : currentDay - 1;
  const startOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - diffToMonday, 0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek.getTime());
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  return d >= startOfWeek && d <= endOfWeek;
};

const isThisMonth = (inv) => {
  const d = getInvoiceDate(inv);
  const today = new Date();
  return d.getMonth() === today.getMonth() &&
         d.getFullYear() === today.getFullYear();
};

const calculateStats = (filteredInvoices) => {
  let totalInvoiced = 0;
  let totalCollected = 0;
  let totalPending = 0;
  const modeBreakdown = { UPI: 0, CARD: 0, NET_BANKING: 0, CASH: 0 };
  const statusBreakdown = { PAID: 0, PENDING: 0, FAILED: 0 };

  filteredInvoices.forEach(inv => {
    totalInvoiced += inv.totalAmount;
    if (inv.paymentStatus === 'PAID') {
      totalCollected += inv.totalAmount;
      const mode = inv.paymentMode?.toUpperCase().replace(/\s+/g, '_');
      if (mode && modeBreakdown[mode] !== undefined) {
        modeBreakdown[mode] += inv.totalAmount;
      } else if (mode === 'UPI' || mode === 'CARD' || mode === 'CASH' || mode === 'NET_BANKING') {
        modeBreakdown[mode] += inv.totalAmount;
      } else {
        modeBreakdown.NET_BANKING += inv.totalAmount;
      }
    } else if (inv.paymentStatus === 'PENDING') {
      totalPending += inv.totalAmount;
    }
    
    if (statusBreakdown[inv.paymentStatus] !== undefined) {
      statusBreakdown[inv.paymentStatus]++;
    }
  });

  return {
    totalInvoiced,
    totalCollected,
    totalPending,
    modeBreakdown,
    statusBreakdown,
    invoiceCount: filteredInvoices.length
  };
};

const BillingPage = () => {
  const { user } = useAuthStore();
  const [adminTimeframe, setAdminTimeframe] = useState('month'); // 'today', 'week', 'month'
  const [invoices, setInvoices] = useState([]);
  const [stats, setStats] = useState({
    totalInvoiced: 0,
    totalCollected: 0,
    totalPending: 0,
    modeBreakdown: { UPI: 0, CARD: 0, NET_BANKING: 0, CASH: 0 },
    statusBreakdown: { PAID: 0, PENDING: 0, FAILED: 0 },
    invoiceCount: 0
  });

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL', 'PAID', 'PENDING'

  // Modals state
  const [activeModal, setActiveModal] = useState(null); // 'view_invoice', 'collect_payment', 'create_manual', 'pay_online_patient'
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  
  // Lists for manual invoicing
  const [patientsList, setPatientsList] = useState([]);
  const [doctorsList, setDoctorsList] = useState([]);

  // Form states
  const [manualBill, setManualBill] = useState({
    patientId: '',
    doctorId: '',
    consultationFee: 500,
    tax: 90,
    totalAmount: 590,
    paymentStatus: 'PAID',
    paymentMode: 'CASH',
    appointmentType: 'in_person',
    reason: 'General Consultation'
  });

  // Settle invoice receptionist state
  const [collectMode, setCollectMode] = useState('CASH');
  const [collectTxnId, setCollectTxnId] = useState('');

  // Patient Online Payment state
  const [patientPayMethod, setPatientPayMethod] = useState('upi'); // 'upi', 'card', 'netbanking'
  const [upiId, setUpiId] = useState('');
  const [cardData, setCardData] = useState({ number: '', expiry: '', cvv: '', name: '' });
  const [selectedBank, setSelectedBank] = useState('');
  const [payProcessing, setPayProcessing] = useState(false);
  const [paySuccess, setPaySuccess] = useState(false);
  const [processingMsg, setProcessingMsg] = useState('');

  // Helper for dynamic label
  const getTimeframeLabel = () => {
    if (user?.role === 'receptionist') return "Today's";
    if (user?.role === 'senior_doctor') {
      if (adminTimeframe === 'today') return "Today's";
      if (adminTimeframe === 'week') return "Weekly";
      if (adminTimeframe === 'month') return "Monthly";
    }
    return "Total";
  };

  // Load Invoices and Statistics
  const loadBillingData = async () => {
    let allInvoices = [];
    try {
      allInvoices = await billingStorage.getInvoices();
      
      if (user?.role === 'receptionist') {
        allInvoices = allInvoices.filter(isToday);
      } else if (user?.role === 'senior_doctor') {
        if (adminTimeframe === 'today') {
          allInvoices = allInvoices.filter(isToday);
        } else if (adminTimeframe === 'week') {
          allInvoices = allInvoices.filter(isThisWeek);
        } else if (adminTimeframe === 'month') {
          allInvoices = allInvoices.filter(isThisMonth);
        }
      }
      
      setInvoices(allInvoices);
      
      // Always compute statistics based on filtered invoices
      if (user?.role === 'patient') {
        // Re-calculate stats filtered just for this patient
        let totalInvoiced = 0;
        let totalCollected = 0;
        let totalPending = 0;
        allInvoices.forEach(inv => {
          totalInvoiced += inv.totalAmount;
          if (inv.paymentStatus === 'PAID') totalCollected += inv.totalAmount;
          else if (inv.paymentStatus === 'PENDING') totalPending += inv.totalAmount;
        });
        setStats({
          totalInvoiced,
          totalCollected,
          totalPending,
          modeBreakdown: { UPI: 0, CARD: 0, NET_BANKING: 0, CASH: 0 },
          statusBreakdown: { PAID: 0, PENDING: 0, FAILED: 0 },
          invoiceCount: allInvoices.length
        });
      } else {
        const calculated = calculateStats(allInvoices);
        setStats(calculated);
      }
    } catch (err) {
      console.error("Failed to load billing data:", err);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadBillingData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, adminTimeframe]);

  // Fetch doctors and patients for manual billing
  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const [pRes, dRes] = await Promise.all([
          api.get('/api/users/patients/'),
          api.get('/api/users/doctors/')
        ]);
        setPatientsList(Array.isArray(pRes?.data) ? pRes.data : (pRes?.data?.results ?? []));
        setDoctorsList(Array.isArray(dRes?.data) ? dRes.data : (dRes?.data?.results ?? []));
      } catch (err) {
        console.error("Error fetching dropdowns for billing", err);
      }
    };

    if (user && user.role !== 'patient') {
      fetchDropdowns();
    }
  }, [user]);

  // Handle fee calculation in manual invoice creator
  useEffect(() => {
    const consultation = Number(manualBill.consultationFee) || 0;
    const tax = Math.round(consultation * 0.18);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setManualBill(prev => ({
      ...prev,
      tax,
      totalAmount: consultation + tax
    }));
  }, [manualBill.consultationFee]);

  // Submit manual invoice creation
  const handleCreateManualInvoice = async (e) => {
    e.preventDefault();
    if (!manualBill.patientId || !manualBill.doctorId) {
      alert("Please select a patient and a doctor.");
      return;
    }

    const patientObj = patientsList.find(p => p.id.toString() === manualBill.patientId.toString());
    const doctorObj = doctorsList.find(d => d.id.toString() === manualBill.doctorId.toString());

    const generatedTxn = manualBill.paymentStatus === 'PAID' 
      ? (manualBill.paymentMode === 'CASH' ? 'CASH-COUNTER-' + Math.floor(100 + Math.random() * 900) : 'TXN' + Math.floor(100000000 + Math.random() * 900000000))
      : '';

    await billingStorage.addInvoice({
      patientId: manualBill.patientId,
      patientName: patientObj?.full_name || 'Manual Patient',
      doctorId: manualBill.doctorId,
      doctorName: doctorObj ? `Dr. ${doctorObj.user?.full_name || doctorObj.user?.first_name}` : 'Manual Doctor',
      doctorSpecialty: doctorObj?.specialty || 'General Practitioner',
      appointmentDate: new Date().toISOString().split('T')[0],
      appointmentTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      appointmentType: manualBill.appointmentType,
      consultationFee: Number(manualBill.consultationFee),
      tax: Number(manualBill.tax),
      totalAmount: Number(manualBill.totalAmount),
      paymentStatus: manualBill.paymentStatus,
      paymentMode: manualBill.paymentStatus === 'PAID' ? manualBill.paymentMode : '',
      transactionId: generatedTxn,
      tokenNumber: `T-${Math.floor(100 + Math.random() * 900)}`
    });

    setActiveModal(null);
    loadBillingData();
    // Reset form
    setManualBill({
      patientId: '',
      doctorId: '',
      consultationFee: 500,
      tax: 90,
      totalAmount: 590,
      paymentStatus: 'PAID',
      paymentMode: 'CASH',
      appointmentType: 'in_person',
      reason: 'General Consultation'
    });
  };

  // Submit payment settlement receptionist
  const handleCollectPayment = async (e) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    const txnId = collectMode === 'CASH' 
      ? 'CASH-SETTLE-' + Math.floor(100000 + Math.random() * 900000) 
      : collectTxnId || 'TXN' + Math.floor(100000000 + Math.random() * 900000000);

    await billingStorage.updateInvoiceStatus(
      selectedInvoice.invoiceId,
      'PAID',
      collectMode,
      txnId
    );

    setActiveModal(null);
    setSelectedInvoice(null);
    setCollectTxnId('');
    loadBillingData();
  };

  // Patient paying online simulation
  const handlePatientPayOnline = async () => {
    if (patientPayMethod === 'upi' && (!upiId.trim() || !upiId.includes('@'))) {
      alert("Please enter a valid UPI ID");
      return;
    }
    if (patientPayMethod === 'card' && (cardData.number.replace(/\s/g, '').length !== 16 || cardData.expiry.length < 5 || cardData.cvv.length < 3 || !cardData.name.trim())) {
      alert("Please check your Card details.");
      return;
    }
    if (patientPayMethod === 'netbanking' && !selectedBank) {
      alert("Please select a bank.");
      return;
    }

    setPayProcessing(true);
    setPaySuccess(false);
    setProcessingMsg("Contacting secure payment server...");

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        alert('Razorpay SDK failed to load. Please check your internet connection.');
        setPayProcessing(false);
        return;
      }

      // 1. Create Razorpay order for this invoice
      const orderRes = await api.post(`/api/appointments/invoices/${selectedInvoice.id}/create-razorpay-order/`);
      const { razorpay_order_id, amount, razorpay_key_id } = orderRes.data;

      // 2. Open Razorpay unified checkout
      const options = {
        key: razorpay_key_id,
        amount: amount,
        currency: "INR",
        name: "GA Medical Clinic",
        description: `Settlement for Invoice ${selectedInvoice.invoiceId}`,
        order_id: razorpay_order_id,
        prefill: {
          name: selectedInvoice.patientName || "",
          email: "",
          contact: "",
          method: patientPayMethod
        },
        theme: {
          color: "#1e3a8a"
        },
        modal: {
          ondismiss: function() {
            setPayProcessing(false);
          }
        },
        handler: async function (response) {
          setProcessingMsg("Verifying payment transaction details...");
          try {
            // 3. Verify signature
            await api.post(`/api/appointments/invoices/${selectedInvoice.id}/verify-razorpay-payment/`, {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              payment_method: patientPayMethod
            });

            setProcessingMsg("Payment processed successfully!");
            await new Promise(resolve => setTimeout(resolve, 800));
            setPayProcessing(false);
            setPaySuccess(true);
            loadBillingData();
          } catch (verifyErr) {
            console.error("Signature verification failed:", verifyErr);
            alert(verifyErr.response?.data?.error || 'Signature verification failed. Please try again.');
            setPayProcessing(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (err) {
      console.error("Order creation failed:", err);
      alert(err.response?.data?.error || 'Failed to start payment transaction. Please try again.');
      setPayProcessing(false);
    }
  };

  // Filter invoices based on status and search query
  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = 
      inv.invoiceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.doctorName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = 
      statusFilter === 'ALL' || 
      inv.paymentStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handlePrint = () => {
    window.print();
  };

  const handleDirectPrint = (invoice) => {
    setSelectedInvoice(invoice);
    setActiveModal('view_invoice');
    setTimeout(() => {
      window.print();
    }, 150);
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

  return (
    <div className="max-w-7xl mx-auto w-full p-4 md:p-8 animate-fade-in">
      
      {/* Title Header */}
      {user?.role !== 'patient' && (
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-navy mb-2 flex items-center gap-2">
              <Receipt className="text-blue-600" size={32} />
              Billing & Invoices
            </h1>
            <p className="text-slate-500 text-sm">
              {user?.role === 'senior_doctor'
                ? "Oversee billing, dynamic time-frame collections, and outstanding dues."
                : "Track daily revenue, settle patient payments, and generate invoices."
              }
            </p>
          </div>

          {/* Action Button for Receptionist / Admin */}
          <button
            onClick={() => setActiveModal('create_manual')}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-bold text-sm shadow-md shadow-blue-200 transition-all active:scale-95"
          >
            <Plus size={18} />
            Generate Bill
          </button>
        </div>
      )}

      {/* Timeframe Selector for Admin */}
      {user?.role === 'senior_doctor' && (
        <div className="flex justify-start mb-6">
          <div className="flex bg-slate-100 p-1 rounded-xl shadow-sm border border-slate-200/50">
            {[
              { id: 'today', label: 'Today' },
              { id: 'week', label: 'This Week' },
              { id: 'month', label: 'This Month' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setAdminTimeframe(tab.id)}
                className={`px-5 py-2 rounded-lg text-xs font-extrabold transition-all uppercase tracking-wider ${
                  adminTimeframe === tab.id
                    ? 'bg-white text-navy shadow-sm'
                    : 'text-slate-500 hover:text-navy'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Analytics Dashboard Grid */}
      {user?.role !== 'patient' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          
          {/* Total Billed Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden flex flex-col justify-between h-36">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">{getTimeframeLabel()} Billed</span>
                <span className="text-3xl font-black text-navy mt-1 block">₹{stats.totalInvoiced.toLocaleString('en-IN')}</span>
              </div>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <FileText size={20} />
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-blue-500 font-bold">
              <TrendingUp size={14} />
              <span>
                {stats.invoiceCount} invoices generated {
                  user?.role === 'receptionist' || adminTimeframe === 'today'
                    ? 'today'
                    : adminTimeframe === 'week'
                      ? 'this week'
                      : 'this month'
                }
              </span>
            </div>
          </div>

          {/* Paid / Collected Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden flex flex-col justify-between h-36">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">{getTimeframeLabel()} Collected</span>
                <span className="text-3xl font-black text-emerald-600 mt-1 block">₹{stats.totalCollected.toLocaleString('en-IN')}</span>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <IndianRupee size={20} />
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold bg-emerald-50/50 px-2.5 py-0.5 rounded-lg w-max">
              <CheckCircle size={12} />
              <span>
                {
                  user?.role === 'receptionist' || adminTimeframe === 'today'
                    ? "Today's receipts cleared"
                    : adminTimeframe === 'week'
                      ? "Weekly collections cleared"
                      : "Monthly collections cleared"
                }
              </span>
            </div>
          </div>

          {/* Outstanding Pending Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden flex flex-col justify-between h-36">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">{getTimeframeLabel()} Outstanding</span>
                <span className="text-3xl font-black text-amber-500 mt-1 block">₹{stats.totalPending.toLocaleString('en-IN')}</span>
              </div>
              <div className="p-3 bg-amber-50 text-amber-500 rounded-xl">
                <Clock size={20} />
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-amber-600 font-bold">
              <AlertCircle size={14} />
              <span>Requires settlement ({stats.statusBreakdown?.PENDING || 0} pending)</span>
            </div>
          </div>

        </div>
      )}

      {/* Main Billing Table & Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        
        {/* Filter Toolbar */}
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/40">
          
          {/* Status Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
            {['ALL', 'PAID', 'PENDING'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`flex-1 sm:flex-none px-5 py-2 rounded-lg text-xs font-extrabold transition-all uppercase tracking-wider ${
                  statusFilter === status 
                    ? 'bg-white text-navy shadow-sm' 
                    : 'text-slate-500 hover:text-navy'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-80 group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
            <input
              type="text"
              placeholder="Search by Patient, Doctor or Inv ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 pl-11 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all shadow-sm font-medium"
            />
          </div>

        </div>

        {/* Invoice Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-100">
                <th className="px-6 py-4">Invoice ID</th>
                <th className="px-6 py-4">Patient</th>
                <th className="px-6 py-4">Consultant Doctor</th>
                <th className="px-6 py-4">Date / Time</th>
                <th className="px-6 py-4">Total Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.length > 0 ? (
                filteredInvoices.map((inv) => (
                  <tr key={inv.invoiceId} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <FileText className="text-slate-300 group-hover:text-blue-500 transition-colors" size={16} />
                        <span className="font-mono text-sm font-bold text-navy">{inv.invoiceId}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-navy text-sm">{inv.patientName}</p>
                        <p className="text-[10px] text-slate-400 font-bold">ID: PAT-{inv.patientId || '0'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-navy text-sm">{inv.doctorName}</p>
                        <p className="text-xs text-slate-500 font-medium">{inv.doctorSpecialty}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">
                      <div className="text-sm">{inv.appointmentDate}</div>
                      <div className="text-xs text-slate-400">{inv.appointmentTime}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-black text-navy text-sm">₹{inv.totalAmount}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        inv.paymentStatus === 'PAID'
                          ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
                          : 'bg-amber-50 border-amber-100 text-amber-800'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${inv.paymentStatus === 'PAID' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                        {inv.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end items-center gap-2">
                        
                        {/* Settle Pending Bill for Receptionist */}
                        {inv.paymentStatus === 'PENDING' && user?.role !== 'patient' && (
                          <button
                            onClick={() => {
                              setSelectedInvoice(inv);
                              setCollectMode('CASH');
                              setActiveModal('collect_payment');
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm"
                          >
                            Collect Payment
                          </button>
                        )}

                        {/* Pay Pending Bill for Patient */}
                        {inv.paymentStatus === 'PENDING' && user?.role === 'patient' && (
                          <button
                            onClick={() => {
                              setSelectedInvoice(inv);
                              setPatientPayMethod('upi');
                              setUpiId('');
                              setPaySuccess(false);
                              setPayProcessing(false);
                              setActiveModal('pay_online_patient');
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm"
                          >
                            Pay Now
                          </button>
                        )}

                        {/* View Invoice detail */}
                        <button
                          onClick={() => {
                            setSelectedInvoice(inv);
                            setActiveModal('view_invoice');
                          }}
                          className="p-2 border border-slate-200 text-slate-400 hover:text-blue-500 hover:border-blue-200 bg-white rounded-lg transition-all"
                          title="View Invoice"
                        >
                          <Eye size={16} />
                        </button>

                        {/* Download invoice */}
                        <button
                          onClick={() => handleDownloadInvoice(inv)}
                          className="p-2 border border-slate-200 text-slate-400 hover:text-emerald-500 hover:border-emerald-200 bg-white rounded-lg transition-all"
                          title="Download Receipt"
                        >
                          <Download size={16} />
                        </button>

                        {/* Print Invoice */}
                        <button
                          onClick={() => handleDirectPrint(inv)}
                          className="p-2 border border-slate-200 text-slate-400 hover:text-indigo-500 hover:border-indigo-200 bg-white rounded-lg transition-all"
                          title="Print Invoice"
                        >
                          <Printer size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-400 italic font-medium">
                    No invoices match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* --- MODAL 1: VIEW & PRINT INVOICE --- */}
      {activeModal === 'view_invoice' && selectedInvoice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            
            {/* Modal Head */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Patient Invoice Details</span>
              <button 
                onClick={() => { setActiveModal(null); setSelectedInvoice(null); }}
                className="text-slate-400 hover:text-slate-700 p-1.5 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Printable Invoice Container */}
            <div className="flex-1 overflow-y-auto p-8" id="printable-invoice">
              <div className="flex flex-col md:flex-row justify-between items-start border-b border-slate-200 pb-6 mb-6 gap-4">
                <div>
                  <h2 className="text-2xl font-black text-navy tracking-tight">GA MEDICAL CLINIC</h2>
                  <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-wider">Comprehensive Clinic Management</p>
                  <p className="text-xs text-slate-500 mt-2">12, Green Avenue, Sector 5, Mumbai</p>
                  <p className="text-xs text-slate-500">Support: support@gacms.com | Tel: +91 22 928374</p>
                </div>
                <div className="text-left md:text-right">
                  <div className="bg-slate-100 px-3 py-1.5 rounded-lg inline-block mb-3">
                    <span className="font-mono text-xs font-extrabold text-navy">INV ID: {selectedInvoice.invoiceId}</span>
                  </div>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Date Generated</p>
                  <p className="text-xs text-slate-600 font-bold mt-0.5">{new Date(selectedInvoice.dateGenerated).toLocaleString('en-IN')}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black block mb-1">Billing To:</span>
                  <p className="text-sm font-bold text-navy">{selectedInvoice.patientName}</p>
                  <p className="text-xs text-slate-500 mt-1">Patient ID: #PAT-{selectedInvoice.patientId}</p>
                  <p className="text-xs text-slate-500">Token Number: <span className="font-bold text-blue-600">{selectedInvoice.tokenNumber || 'N/A'}</span></p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black block mb-1">Consultation With:</span>
                  <p className="text-sm font-bold text-navy">{selectedInvoice.doctorName}</p>
                  <p className="text-xs text-slate-500 mt-1">Department: {selectedInvoice.doctorSpecialty}</p>
                  <p className="text-xs text-slate-500">Visit Type: <span className="capitalize">{selectedInvoice.appointmentType === 'virtual' ? 'Virtual (Video)' : 'In-Person (Clinic)'}</span></p>
                </div>
              </div>

              {/* Fee Breakdown */}
              <div className="mb-8">
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
                    <tr className="border-b border-slate-100 text-navy font-medium">
                      <td className="py-4">
                        <span className="font-bold">Consultation Service</span>
                        <p className="text-[10px] text-slate-400 font-medium">Scheduled on {selectedInvoice.appointmentDate} at {selectedInvoice.appointmentTime}</p>
                      </td>
                      <td className="py-4 text-right">₹{selectedInvoice.consultationFee.toFixed(2)}</td>
                      <td className="py-4 text-right">₹{(selectedInvoice.tax / 2).toFixed(2)}</td>
                      <td className="py-4 text-right">₹{(selectedInvoice.tax / 2).toFixed(2)}</td>
                      <td className="py-4 text-right font-black text-slate-900">₹{selectedInvoice.totalAmount.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Total Summary */}
              <div className="flex flex-col items-end border-t border-slate-200 pt-6 gap-2">
                <div className="w-64 space-y-2 text-sm text-slate-600 font-medium">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>₹{selectedInvoice.consultationFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax (GST 18%)</span>
                    <span>₹{selectedInvoice.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-3 border-t border-slate-100 text-base font-extrabold text-navy">
                    <span>Grand Total</span>
                    <span className="text-lg font-black text-emerald-600">₹{selectedInvoice.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Status Tracking Timeline */}
              <div className="mt-8 pt-6 border-t border-slate-200 print:hidden">
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black block mb-4 text-center md:text-left">Payment Status Tracking</span>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 relative">
                  
                  {/* Step 1: Generated */}
                  <div className="flex items-center gap-2.5 sm:flex-col sm:text-center sm:gap-1.5 z-10 bg-white pr-4">
                    <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shadow-md shadow-emerald-100">
                      1
                    </div>
                    <div>
                      <span className="text-xs font-extrabold text-navy block">Bill Generated</span>
                      <span className="text-[9px] text-slate-400 font-bold block">{new Date(selectedInvoice.dateGenerated).toLocaleDateString('en-IN')}</span>
                    </div>
                  </div>

                  {/* Divider line between 1 and 2 */}
                  <div className="hidden sm:block flex-1 h-0.5 bg-slate-100">
                    <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: '100%' }}></div>
                  </div>

                  {/* Step 2: Payment Action */}
                  <div className="flex items-center gap-2.5 sm:flex-col sm:text-center sm:gap-1.5 z-10 bg-white px-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                      selectedInvoice.paymentStatus === 'PAID'
                        ? 'bg-emerald-500 text-white shadow-md shadow-emerald-100'
                        : 'bg-amber-400 text-white shadow-md shadow-amber-100'
                    }`}>
                      2
                    </div>
                    <div>
                      <span className="text-xs font-extrabold text-navy block">
                        {selectedInvoice.paymentStatus === 'PAID' ? 'Payment Succeeded' : 'Payment Awaiting'}
                      </span>
                      <span className="text-[9px] text-slate-400 font-bold block">
                        {selectedInvoice.paymentStatus === 'PAID' 
                          ? `via ${selectedInvoice.paymentMode}` 
                          : 'Action Required'}
                      </span>
                    </div>
                  </div>

                  {/* Divider line between 2 and 3 */}
                  <div className="hidden sm:block flex-1 h-0.5 bg-slate-100">
                    <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: selectedInvoice.paymentStatus === 'PAID' ? '100%' : '0%' }}></div>
                  </div>

                  {/* Step 3: Settle Complete */}
                  <div className="flex items-center gap-2.5 sm:flex-col sm:text-center sm:gap-1.5 z-10 bg-white pl-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                      selectedInvoice.paymentStatus === 'PAID'
                        ? 'bg-emerald-500 text-white shadow-md shadow-emerald-100'
                        : 'bg-slate-200 text-slate-400'
                    }`}>
                      {selectedInvoice.paymentStatus === 'PAID' ? <Check size={14} /> : '3'}
                    </div>
                    <div>
                      <span className="text-xs font-extrabold text-navy block">Settle Complete</span>
                      <span className="text-[9px] text-slate-400 font-bold block">
                        {selectedInvoice.paymentStatus === 'PAID' ? 'Invoice Locked' : 'Pending Payment'}
                      </span>
                    </div>
                  </div>

                </div>
              </div>

              {/* Status Section */}
              <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="text-center md:text-left">
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black block mb-1">Receipt Status</span>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      selectedInvoice.paymentStatus === 'PAID'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}>
                      {selectedInvoice.paymentStatus}
                    </span>
                    {selectedInvoice.paymentStatus === 'PAID' && (
                      <span className="text-xs text-slate-500 font-medium">via {selectedInvoice.paymentMode}</span>
                    )}
                  </div>
                </div>
                {selectedInvoice.paymentStatus === 'PAID' && selectedInvoice.transactionId && (
                  <div className="text-center md:text-right">
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black block mb-1">Transaction Ref ID</span>
                    <span className="font-mono text-xs font-extrabold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg inline-block">
                      {selectedInvoice.transactionId}
                    </span>
                  </div>
                )}
              </div>

              <p className="text-[10px] text-slate-400 italic mt-12 text-center border-t border-dashed border-slate-200 pt-6">
                This is a system generated print invoice. No physical signature is required.
              </p>
            </div>

            {/* Modal Buttons */}
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <button 
                onClick={() => { setActiveModal(null); setSelectedInvoice(null); }}
                className="px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-600 rounded-xl font-bold text-sm border border-slate-200 transition-colors"
              >
                Close View
              </button>
              <button 
                onClick={() => handleDownloadInvoice(selectedInvoice)}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all active:scale-95"
              >
                <Download size={16} />
                Download Receipt
              </button>
              <button 
                onClick={handlePrint}
                className="flex items-center gap-2 bg-navy hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all active:scale-95"
              >
                <Printer size={16} />
                Print Invoice
              </button>
            </div>

          </div>
        </div>
      )}

      {/* --- MODAL 2: COLLECT PAYMENT (RECEPTIONIST) --- */}
      {activeModal === 'collect_payment' && selectedInvoice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Collect Payment</span>
              <button 
                onClick={() => { setActiveModal(null); setSelectedInvoice(null); }}
                className="text-slate-400 hover:text-slate-700 p-1.5 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCollectPayment} className="p-6 space-y-5">
              
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Patient</span>
                  <span className="font-bold text-slate-800">{selectedInvoice.patientName}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Doctor</span>
                  <span className="font-bold text-slate-800">{selectedInvoice.doctorName}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Invoice ID</span>
                  <span className="font-mono font-bold text-slate-800">{selectedInvoice.invoiceId}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-bold">
                  <span className="text-slate-700">Amount to Collect</span>
                  <span className="text-emerald-600 font-black">₹{selectedInvoice.totalAmount}</span>
                </div>
              </div>

              {/* Payment Mode Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Select Settle Mode</label>
                <div className="grid grid-cols-3 gap-2">
                  {['CASH', 'UPI', 'CARD'].map(mode => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setCollectMode(mode)}
                      className={`py-3 rounded-xl border text-xs font-bold transition-all ${
                        collectMode === mode 
                          ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm' 
                          : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* Transaction ID if card/upi */}
              {collectMode !== 'CASH' && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Transaction Ref / Reference ID</label>
                  <input
                    type="text"
                    placeholder="Enter bank transaction ref"
                    value={collectTxnId}
                    onChange={(e) => setCollectTxnId(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 outline-none text-sm font-medium"
                    required
                  />
                </div>
              )}

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => { setActiveModal(null); setSelectedInvoice(null); }}
                  className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl font-bold text-sm transition-colors text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-100 transition-all text-center active:scale-95"
                >
                  Settle Sessional Bill
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* --- MODAL 3: GENERATE MANUAL BILL (RECEPTIONIST) --- */}
      {activeModal === 'create_manual' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Generate New Invoice</span>
              <button 
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateManualInvoice} className="p-6 space-y-4">
              
              {/* Select Patient */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Select Patient</label>
                <SearchableSelect
                  className="w-full"
                  value={manualBill.patientId}
                  onChange={(val) => setManualBill({ ...manualBill, patientId: val })}
                  options={patientsList.map(p => ({ value: p.id, label: `${p.full_name} (#PAT-${p.id})` }))}
                  placeholder="-- Select Patient --"
                />
              </div>

              {/* Select Doctor */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Consultant Doctor</label>
                <SearchableSelect
                  className="w-full"
                  value={manualBill.doctorId}
                  onChange={(val) => setManualBill({ ...manualBill, doctorId: val })}
                  options={doctorsList.map(d => ({ value: d.id, label: `Dr. ${d.user?.full_name || d.user?.first_name} (${d.specialty})` }))}
                  placeholder="-- Select Doctor --"
                />
              </div>

              {/* Visit details & fee */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Visit Type</label>
                  <select
                    value={manualBill.appointmentType}
                    onChange={(e) => setManualBill({ ...manualBill, appointmentType: e.target.value })}
                    className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-700 bg-white"
                  >
                    <option value="in_person">In-Person</option>
                    <option value="virtual">Virtual</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Consultation Fee (₹)</label>
                  <input
                    type="number"
                    value={manualBill.consultationFee}
                    onChange={(e) => setManualBill({ ...manualBill, consultationFee: e.target.value })}
                    className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 font-medium"
                    min="0"
                    required
                  />
                </div>
              </div>

              {/* GST display and Total Amount */}
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex justify-between items-center text-xs text-slate-600">
                <div>
                  <span>GST Tax Breakdown (18%):</span>
                  <span className="font-bold text-slate-800 ml-1.5">₹{manualBill.tax}</span>
                </div>
                <div className="text-sm font-bold">
                  <span>Grand Total:</span>
                  <span className="text-emerald-600 font-black ml-1.5">₹{manualBill.totalAmount}</span>
                </div>
              </div>

              {/* Payment Settlement at generation */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Invoice Status</label>
                  <select
                    value={manualBill.paymentStatus}
                    onChange={(e) => setManualBill({ ...manualBill, paymentStatus: e.target.value })}
                    className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 font-medium bg-white"
                  >
                    <option value="PAID">PAID</option>
                    <option value="PENDING">PENDING</option>
                  </select>
                </div>
                {manualBill.paymentStatus === 'PAID' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Payment Mode</label>
                    <select
                      value={manualBill.paymentMode}
                      onChange={(e) => setManualBill({ ...manualBill, paymentMode: e.target.value })}
                      className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 font-medium bg-white"
                    >
                      <option value="CASH">CASH</option>
                      <option value="UPI">UPI</option>
                      <option value="CARD">CARD</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl font-bold text-sm transition-colors text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-100 transition-all text-center active:scale-95"
                >
                  Generate Invoice
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* --- MODAL 4: PAY ONLINE GATEWAY (PATIENT VIEW) --- */}
      {activeModal === 'pay_online_patient' && selectedInvoice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Settle Invoice Online</span>
              <button 
                onClick={() => { setActiveModal(null); setSelectedInvoice(null); }}
                className="text-slate-400 hover:text-slate-700 p-1.5 hover:bg-slate-200 rounded-full transition-colors"
                disabled={payProcessing}
              >
                <X size={18} />
              </button>
            </div>

            {/* If Processing */}
            {payProcessing ? (
              <div className="p-12 text-center space-y-6">
                <div className="relative w-20 h-20 mx-auto">
                  <div className="absolute inset-0 rounded-full border-4 border-slate-100 border-t-blue-600 animate-spin"></div>
                  <div className="absolute inset-2 bg-blue-50 rounded-full flex items-center justify-center">
                    <ShieldCheck size={28} className="text-blue-600 animate-pulse" />
                  </div>
                </div>
                <div>
                  <h4 className="font-extrabold text-navy text-xl">Processing Secure Payment</h4>
                  <p className="text-slate-500 text-sm mt-2">{processingMsg}</p>
                </div>
                <p className="text-[10px] text-slate-400 italic">Do not close this modal or reload your browser.</p>
              </div>
            ) : paySuccess ? (
              /* If Success */
              <div className="p-10 text-center space-y-6 animate-in fade-in duration-300">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-500 border border-emerald-100 shadow-inner">
                  <Check size={32} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-navy">Payment Succeeded!</h3>
                  <p className="text-sm text-slate-500 mt-2">
                    Invoice <span className="font-mono font-bold text-slate-800">{selectedInvoice.invoiceId}</span> has been settled. You can download the receipt now.
                  </p>
                </div>
                <div className="flex gap-3 max-w-xs mx-auto">
                  <button
                    onClick={() => {
                      setActiveModal('view_invoice');
                    }}
                    className="flex-1 py-3 bg-navy hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2"
                  >
                    <Printer size={14} /> View Receipt
                  </button>
                  <button
                    onClick={() => {
                      setActiveModal(null);
                      setSelectedInvoice(null);
                    }}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-all"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              /* Select Method & Input */
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
                
                {/* Billing Summary Column */}
                <div className="md:col-span-1 border-r border-slate-100 pr-0 md:pr-6 space-y-4">
                  <h4 className="font-bold text-navy text-sm uppercase tracking-wider">Bill Summary</h4>
                  <div className="space-y-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-100 font-medium text-slate-500">
                    <div>
                      <span className="block text-[10px] text-slate-400 uppercase font-black">Doctor</span>
                      <span className="font-bold text-navy">{selectedInvoice.doctorName}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 uppercase font-black">Visit Type</span>
                      <span className="font-bold text-navy capitalize">{selectedInvoice.appointmentType === 'virtual' ? 'Virtual' : 'In-Person'}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 uppercase font-black">Fees</span>
                      <span className="font-bold text-navy">₹{selectedInvoice.consultationFee}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 uppercase font-black">Tax (GST)</span>
                      <span className="font-bold text-navy">₹{selectedInvoice.tax}</span>
                    </div>
                    <div className="pt-2 border-t border-slate-200 text-sm font-black flex justify-between items-center text-slate-900">
                      <span>Total Amount</span>
                      <span className="text-emerald-600">₹{selectedInvoice.totalAmount}</span>
                    </div>
                  </div>
                </div>

                {/* Gateway Form Column */}
                <div className="md:col-span-2 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Payment Option</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setPatientPayMethod('upi')}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                          patientPayMethod === 'upi' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'
                        }`}
                      >
                        <QrCode size={18} className="mb-1" />
                        <span className="text-[10px] font-bold">UPI / QR</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPatientPayMethod('card')}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                          patientPayMethod === 'card' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'
                        }`}
                      >
                        <CreditCard size={18} className="mb-1" />
                        <span className="text-[10px] font-bold">Card</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPatientPayMethod('netbanking')}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                          patientPayMethod === 'netbanking' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'
                        }`}
                      >
                        <Building2 size={18} className="mb-1" />
                        <span className="text-[10px] font-bold">NetBank</span>
                      </button>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 min-h-[140px] flex flex-col justify-center">
                    {/* UPI */}
                    {patientPayMethod === 'upi' && (
                      <div className="space-y-3">
                        <p className="text-[11px] text-slate-500 font-medium">Enter your virtual payment address (VPA) / UPI ID below to receive a collect request.</p>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Enter UPI ID</label>
                          <input
                            type="text"
                            placeholder="username@upi"
                            value={upiId}
                            onChange={(e) => setUpiId(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none text-xs font-semibold"
                          />
                        </div>
                      </div>
                    )}

                    {/* Card */}
                    {patientPayMethod === 'card' && (
                      <div className="space-y-2">
                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Cardholder Name</label>
                          <input
                            type="text"
                            placeholder="Cardholder Name"
                            value={cardData.name}
                            onChange={(e) => setCardData({ ...cardData, name: e.target.value })}
                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg outline-none text-xs font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Card Number</label>
                          <input
                            type="text"
                            placeholder="4111 2222 3333 4444"
                            value={cardData.number}
                            onChange={(e) => setCardData({ ...cardData, number: e.target.value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ').substring(0, 19) })}
                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg outline-none text-xs font-mono"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Expiry</label>
                            <input
                              type="text"
                              placeholder="MM/YY"
                              value={cardData.expiry}
                              onChange={(e) => setCardData({ ...cardData, expiry: e.target.value })}
                              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg outline-none text-xs font-mono text-center"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">CVV</label>
                            <input
                              type="password"
                              placeholder="•••"
                              value={cardData.cvv}
                              onChange={(e) => setCardData({ ...cardData, cvv: e.target.value.replace(/\D/g, '').substring(0, 3) })}
                              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg outline-none text-xs font-mono text-center"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Netbanking */}
                    {patientPayMethod === 'netbanking' && (
                      <div className="space-y-3">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Choose Bank</label>
                        <select
                          value={selectedBank}
                          onChange={(e) => setSelectedBank(e.target.value)}
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none"
                        >
                          <option value="">-- Choose Bank --</option>
                          <option value="SBI">State Bank of India</option>
                          <option value="HDFC">HDFC Bank</option>
                          <option value="ICICI">ICICI Bank</option>
                          <option value="AXIS">Axis Bank</option>
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => { setActiveModal(null); setSelectedInvoice(null); }}
                      className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl font-bold text-xs transition-all text-center"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handlePatientPayOnline}
                      className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md transition-all text-center active:scale-95"
                    >
                      Authorize Payment
                    </button>
                  </div>

                </div>

              </div>
            )}

          </div>
        </div>
      )}

      {/* Styled block to handle hiding other items during receipt print */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-invoice, #printable-invoice * {
            visibility: visible !important;
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

export default BillingPage;
