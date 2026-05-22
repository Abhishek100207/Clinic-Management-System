// localStorage billing storage utility for GA Clinic Management System

const STORAGE_KEY = 'clinic_invoices';

const MOCK_INVOICES = [
  {
    invoiceId: 'INV-782103',
    patientId: '1',
    patientName: 'Arjun Mehra',
    doctorId: '1',
    doctorName: 'Dr. Sarah Johnson',
    doctorSpecialty: 'Cardiology',
    appointmentDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 days ago
    appointmentTime: '10:00 AM',
    appointmentType: 'in_person',
    consultationFee: 500,
    tax: 90,
    totalAmount: 590,
    paymentStatus: 'PAID',
    paymentMode: 'CARD',
    transactionId: 'TXN827364519',
    tokenNumber: 'T-101',
    dateGenerated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    invoiceId: 'INV-492817',
    patientId: '2',
    patientName: 'Priya Sharma',
    doctorId: '2',
    doctorName: 'Dr. Robert Chen',
    doctorSpecialty: 'Pediatrics',
    appointmentDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 day ago
    appointmentTime: '11:30 AM',
    appointmentType: 'virtual',
    consultationFee: 300,
    tax: 54,
    totalAmount: 354,
    paymentStatus: 'PAID',
    paymentMode: 'UPI',
    transactionId: 'TXN918273645',
    tokenNumber: 'T-102',
    dateGenerated: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    invoiceId: 'INV-582910',
    patientId: '3',
    patientName: 'Vikram Singh',
    doctorId: '1',
    doctorName: 'Dr. Sarah Johnson',
    doctorSpecialty: 'Cardiology',
    appointmentDate: new Date().toISOString().split('T')[0], // Today
    appointmentTime: '09:15 AM',
    appointmentType: 'in_person',
    consultationFee: 500,
    tax: 90,
    totalAmount: 590,
    paymentStatus: 'PAID',
    paymentMode: 'CASH',
    transactionId: 'CASH-COUNTER-091',
    tokenNumber: 'T-103',
    dateGenerated: new Date().toISOString(),
  },
  {
    invoiceId: 'INV-672948',
    patientId: '1', // Let Arjun Mehra have a pending invoice too
    patientName: 'Arjun Mehra',
    doctorId: '2',
    doctorName: 'Dr. Robert Chen',
    doctorSpecialty: 'Pediatrics',
    appointmentDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Tomorrow
    appointmentTime: '02:30 PM',
    appointmentType: 'virtual',
    consultationFee: 300,
    tax: 54,
    totalAmount: 354,
    paymentStatus: 'PENDING',
    paymentMode: '',
    transactionId: '',
    tokenNumber: 'T-104',
    dateGenerated: new Date().toISOString(),
  },
  {
    invoiceId: 'INV-381029',
    patientId: '4',
    patientName: 'Sneha Patel',
    doctorId: '1',
    doctorName: 'Dr. Sarah Johnson',
    doctorSpecialty: 'Cardiology',
    appointmentDate: new Date().toISOString().split('T')[0], // Today
    appointmentTime: '11:00 AM',
    appointmentType: 'in_person',
    consultationFee: 500,
    tax: 90,
    totalAmount: 590,
    paymentStatus: 'PENDING',
    paymentMode: '',
    transactionId: '',
    tokenNumber: 'T-105',
    dateGenerated: new Date().toISOString(),
  }
];

export const billingStorage = {
  getInvoices: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_INVOICES));
        return MOCK_INVOICES;
      }
      return JSON.parse(stored);
    } catch (e) {
      console.error("Error reading invoices from localStorage", e);
      return MOCK_INVOICES;
    }
  },

  getInvoicesForPatient: (patientId) => {
    const invoices = billingStorage.getInvoices();
    // Match either by string or integer patient ID
    return invoices.filter(inv => inv.patientId?.toString() === patientId?.toString());
  },

  addInvoice: (invoiceData) => {
    try {
      const invoices = billingStorage.getInvoices();
      const invoiceId = 'INV-' + Math.floor(100000 + Math.random() * 900000);
      
      const newInvoice = {
        invoiceId,
        dateGenerated: new Date().toISOString(),
        paymentStatus: invoiceData.paymentStatus || 'PENDING',
        paymentMode: invoiceData.paymentMode || '',
        transactionId: invoiceData.transactionId || '',
        consultationFee: Number(invoiceData.consultationFee) || 500,
        tax: Number(invoiceData.tax) || 90,
        totalAmount: Number(invoiceData.totalAmount) || 590,
        ...invoiceData
      };
      
      invoices.unshift(newInvoice); // Add to the top
      localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
      return newInvoice;
    } catch (e) {
      console.error("Error adding invoice to localStorage", e);
      return null;
    }
  },

  updateInvoiceStatus: (invoiceId, status, paymentMode = '', transactionId = '') => {
    try {
      const invoices = billingStorage.getInvoices();
      const updated = invoices.map(inv => {
        if (inv.invoiceId === invoiceId) {
          return {
            ...inv,
            paymentStatus: status,
            paymentMode: paymentMode || inv.paymentMode,
            transactionId: transactionId || (status === 'PAID' ? 'TXN' + Math.floor(100000000 + Math.random() * 900000000) : inv.transactionId)
          };
        }
        return inv;
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return true;
    } catch (e) {
      console.error("Error updating invoice in localStorage", e);
      return false;
    }
  },

  getBillingStats: () => {
    const invoices = billingStorage.getInvoices();
    let totalInvoiced = 0;
    let totalCollected = 0;
    let totalPending = 0;
    const modeBreakdown = { UPI: 0, CARD: 0, NET_BANKING: 0, CASH: 0 };
    const statusBreakdown = { PAID: 0, PENDING: 0, FAILED: 0 };

    invoices.forEach(inv => {
      totalInvoiced += inv.totalAmount;
      if (inv.paymentStatus === 'PAID') {
        totalCollected += inv.totalAmount;
        const mode = inv.paymentMode?.toUpperCase().replace(/\s+/g, '_');
        if (mode && modeBreakdown[mode] !== undefined) {
          modeBreakdown[mode] += inv.totalAmount;
        } else if (mode === 'UPI' || mode === 'CARD' || mode === 'CASH' || mode === 'NET_BANKING') {
          modeBreakdown[mode] += inv.totalAmount;
        } else {
          // If it matches standard net banking names, map to NET_BANKING
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
      invoiceCount: invoices.length
    };
  }
};
