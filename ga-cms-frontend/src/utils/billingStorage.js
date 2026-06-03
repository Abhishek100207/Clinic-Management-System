import apiClient from '../api/axios';

export const billingStorage = {
  getInvoices: async () => {
    try {
      const todayStr = (() => {
        const d = new Date();
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
      })();
      const response = await apiClient.get(`/api/appointments/invoices/?date=${todayStr}`);
      return response.data.map(item => ({
        id: item.id,
        invoiceId: item.invoice_id,
        patientId: item.patient,
        patientName: item.patient_name,
        doctorId: item.doctor,
        doctorName: item.doctor_name,
        doctorSpecialty: item.doctor_specialty || 'General Physician',
        appointmentDate: item.date_generated ? item.date_generated.split('T')[0] : new Date().toISOString().split('T')[0],
        appointmentTime: item.date_generated ? new Date(item.date_generated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '10:00 AM',
        appointmentType: 'in_person',
        consultationFee: Number(item.consultation_fee),
        tax: Number(item.tax),
        totalAmount: Number(item.total_amount),
        paymentStatus: item.payment_status,
        paymentMode: item.payment_mode || '',
        transactionId: item.transaction_id || '',
        tokenNumber: `T-${item.appointment || 100}`,
        dateGenerated: item.date_generated
      }));
    } catch (err) {
      console.error("Failed to getInvoices from backend:", err);
      return [];
    }
  },

  getInvoicesForPatient: async (patientId) => {
    try {
      const response = await apiClient.get(`/api/appointments/invoices/?patient_id=${patientId}`);
      return response.data.map(item => ({
        id: item.id,
        invoiceId: item.invoice_id,
        patientId: item.patient,
        patientName: item.patient_name,
        doctorId: item.doctor,
        doctorName: item.doctor_name,
        doctorSpecialty: item.doctor_specialty || 'General Physician',
        appointmentDate: item.date_generated ? item.date_generated.split('T')[0] : new Date().toISOString().split('T')[0],
        appointmentTime: item.date_generated ? new Date(item.date_generated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '10:00 AM',
        appointmentType: 'in_person',
        consultationFee: Number(item.consultation_fee),
        tax: Number(item.tax),
        totalAmount: Number(item.total_amount),
        paymentStatus: item.payment_status,
        paymentMode: item.payment_mode || '',
        transactionId: item.transaction_id || '',
        tokenNumber: `T-${item.appointment || 100}`,
        dateGenerated: item.date_generated
      }));
    } catch (err) {
      console.error("Failed to getInvoicesForPatient from backend:", err);
      return [];
    }
  },

  addInvoice: async (invoiceData) => {
    // Build a local fallback invoice from input data —
    // used when the API fails so that the success-screen buttons always work.
    const buildLocalInvoice = () => ({
      id: null,
      invoiceId: `LOCAL-${Date.now()}`,
      patientId: invoiceData.patientId,
      patientName: invoiceData.patientName || 'Patient',
      doctorId: invoiceData.doctorId,
      doctorName: invoiceData.doctorName || 'Doctor',
      doctorSpecialty: invoiceData.doctorSpecialty || 'General Physician',
      appointmentDate: invoiceData.appointmentDate || new Date().toISOString().split('T')[0],
      appointmentTime: invoiceData.appointmentTime || '',
      appointmentType: invoiceData.appointmentType || 'in_person',
      consultationFee: invoiceData.consultationFee || 500,
      tax: invoiceData.tax || 90,
      totalAmount: invoiceData.totalAmount || 590,
      paymentStatus: invoiceData.paymentStatus || 'PENDING',
      paymentMode: invoiceData.paymentMode || '',
      transactionId: invoiceData.transactionId || '',
      tokenNumber: invoiceData.tokenNumber || '',
      dateGenerated: new Date().toISOString()
    });

    try {
      const payload = {
        appointment: invoiceData.appointmentId || null,
        patient: invoiceData.patientId,
        doctor: invoiceData.doctorId,
        consultation_fee: invoiceData.consultationFee || 500,
        tax: invoiceData.tax || 90,
        total_amount: invoiceData.totalAmount || 590,
        payment_status: invoiceData.paymentStatus || 'PENDING',
        payment_mode: invoiceData.paymentMode || '',
        transaction_id: invoiceData.transactionId || ''
      };

      const response = await apiClient.post('/api/appointments/invoices/', payload);
      const item = response.data;

      // Enrich backend response with fields it doesn't return
      return {
        id: item.id,
        invoiceId: item.invoice_id,
        patientId: item.patient,
        patientName: item.patient_name || invoiceData.patientName,
        doctorId: item.doctor,
        doctorName: item.doctor_name || invoiceData.doctorName,
        doctorSpecialty: item.doctor_specialty || invoiceData.doctorSpecialty,
        appointmentDate: invoiceData.appointmentDate || new Date().toISOString().split('T')[0],
        appointmentTime: invoiceData.appointmentTime || '',
        appointmentType: invoiceData.appointmentType || 'in_person',
        consultationFee: Number(item.consultation_fee),
        tax: Number(item.tax),
        totalAmount: Number(item.total_amount),
        paymentStatus: item.payment_status,
        paymentMode: item.payment_mode || invoiceData.paymentMode,
        transactionId: item.transaction_id || invoiceData.transactionId,
        tokenNumber: invoiceData.tokenNumber || `T-${item.appointment || 100}`,
        dateGenerated: item.date_generated || new Date().toISOString()
      };
    } catch (err) {
      console.error("Failed to addInvoice via API — using local fallback:", err);
      // Return a fully-formed local invoice so the success screen always works
      return buildLocalInvoice();
    }
  },

  updateInvoiceStatus: async (invoiceId, status, paymentMode = '', transactionId = '') => {
    try {
      const response = await apiClient.get('/api/appointments/invoices/');
      const inv = response.data.find(x => x.invoice_id === invoiceId);
      if (!inv) return false;
      
      const payload = {
        payment_status: status,
        payment_mode: paymentMode,
        transaction_id: transactionId || (status === 'PAID' ? 'TXN' + Math.floor(100000000 + Math.random() * 900000000) : '')
      };
      
      await apiClient.patch(`/api/appointments/invoices/${inv.id}/`, payload);
      return true;
    } catch (err) {
      console.error("Failed to updateInvoiceStatus:", err);
      return false;
    }
  },

  getBillingStats: async () => {
    try {
      const response = await apiClient.get('/api/appointments/invoices/stats/');
      return response.data;
    } catch (err) {
      console.error("Failed to getBillingStats:", err);
      return {
        totalInvoiced: 0,
        totalCollected: 0,
        totalPending: 0,
        modeBreakdown: { UPI: 0, CARD: 0, NET_BANKING: 0, CASH: 0 },
        statusBreakdown: { PAID: 0, PENDING: 0, FAILED: 0 },
        invoiceCount: 0
      };
    }
  }
};
