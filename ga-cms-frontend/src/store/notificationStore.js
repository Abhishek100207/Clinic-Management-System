import { create } from 'zustand';
import api from '../api/axios';

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  searchQuery: '',
  filter: 'all', // 'all', 'unread', 'read'
  userId: null,
  loading: false,

  init: (user) => {
    if (!user) return;
    set({ userId: user.id });
    get().fetchNotifications(user);
  },

  fetchNotifications: async (user) => {
    if (!user) return;
    set({ loading: true });
    const userId = user.id;
    const role = user.role;

    // Load local storage read/deleted states
    const storageKey = `notifications_state_user_${userId}`;
    let savedState = { readIds: {}, deletedIds: {} };
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        savedState = JSON.parse(saved);
      }
    } catch (e) {
      console.error("Failed to parse notifications interaction state", e);
    }

    const readIds = savedState.readIds || {};
    const deletedIds = savedState.deletedIds || {};
    let rawNotifications = [];

    try {
      if (role === 'patient') {
        // 1. Fetch appointments
        try {
          const apptRes = await api.get('/api/appointments/appointments/');
          const appts = Array.isArray(apptRes.data) ? apptRes.data : (apptRes.data.results || []);
          appts.forEach(appt => {
            const id = `appt-${appt.id}`;
            rawNotifications.push({
              id,
              title: `Appointment ${appt.status.charAt(0).toUpperCase() + appt.status.slice(1)}`,
              preview: `Your appointment with Dr. ${appt.doctor_name} is ${appt.status}.`,
              body: `Dear Patient,\n\nYour appointment request with Dr. ${appt.doctor_name} (${appt.doctor_specialty || 'General'}) is ${appt.status.toUpperCase()}.\n\nDate: ${appt.date}\nTime: ${appt.time?.substring(0, 5) || 'N/A'}\nType: ${appt.appointment_type === 'in_person' ? 'In-Person' : 'Virtual'}\n\nPlease arrive 15 minutes before your scheduled slot.`,
              sender: 'appointments@gaclinic.com',
              timestamp: appt.created_at || `${appt.date}T${appt.time}`,
              isRead: !!readIds[id]
            });
          });
        } catch (err) {
          console.error("Failed to fetch patient appointments", err);
        }

        // 2. Fetch prescriptions
        try {
          const prescRes = await api.get('/api/medical_records/prescriptions/');
          const prescs = Array.isArray(prescRes.data) ? prescRes.data : (prescRes.data.results || []);
          prescs.forEach(presc => {
            const id = `presc-${presc.id}`;
            const medsBody = (presc.medications || []).map(m => 
              `- ${m.drug_details?.name || 'Medication'}: ${m.dosage} (${m.frequency}) for ${m.duration}`
            ).join('\n');
            rawNotifications.push({
              id,
              title: `New Prescription Issued`,
              preview: `A new prescription has been added to your medical records.`,
              body: `Dear Patient,\n\nDr. ${presc.doctor_name || 'Staff'} has uploaded a new prescription for your treatment plan.\n\nNotes: ${presc.notes || 'N/A'}\n\nMedications:\n${medsBody || 'No medications listed.'}`,
              sender: 'prescriptions@gaclinic.com',
              timestamp: presc.created_at,
              isRead: !!readIds[id]
            });

            if (presc.follow_up_date) {
              const fId = `presc-followup-${presc.id}`;
              rawNotifications.push({
                id: fId,
                title: `Follow-up Target Recommended`,
                preview: `Dr. ${presc.doctor_name || 'Staff'} has recommended a follow-up visit by ${presc.follow_up_date}.`,
                body: `Dear Patient,\n\nYour consulting physician Dr. ${presc.doctor_name || 'Staff'} has recommended a follow-up visit.\n\nRecommended Date: ${presc.follow_up_date}\nNotes: ${presc.notes || 'None'}\n\nPlease book a follow-up appointment around this target date.`,
                sender: 'prescriptions@gaclinic.com',
                timestamp: presc.created_at,
                isRead: !!readIds[fId]
              });
            }
          });
        } catch (err) {
          console.error("Failed to fetch prescriptions", err);
        }

        // 3. Fetch Lab Results
        try {
          const labRes = await api.get('/api/medical_records/lab-results/');
          const labs = Array.isArray(labRes.data) ? labRes.data : (labRes.data.results || []);
          labs.forEach(lab => {
            const id = `lab-${lab.id}`;
            rawNotifications.push({
              id,
              title: `Lab Results Available: ${lab.test_name}`,
              preview: `Your lab results for ${lab.test_name} are ready.`,
              body: `Dear Patient,\n\nYour laboratory test results for "${lab.test_name}" reported by ${lab.reported_by || 'Clinic Lab'} are now ${lab.status || 'Available'}.\n\nYou can access the full report on your medical records dashboard.`,
              sender: 'lab@gaclinic.com',
              timestamp: lab.uploaded_at,
              isRead: !!readIds[id]
            });
          });
        } catch (err) {
          console.error("Failed to fetch lab results", err);
        }

        // 4. Fetch Scan Results
        try {
          const scanRes = await api.get('/api/medical_records/scan-results/');
          const scans = Array.isArray(scanRes.data) ? scanRes.data : (scanRes.data.results || []);
          scans.forEach(scan => {
            const id = `scan-${scan.id}`;
            const findingsStr = Array.isArray(scan.findings) ? scan.findings.join(', ') : (scan.findings || 'Completed');
            rawNotifications.push({
              id,
              title: `Imaging Scan Ready: ${scan.scan_type}`,
              preview: `The scan report for ${scan.scan_type} is now uploaded.`,
              body: `Dear Patient,\n\nYour diagnostic scan results for "${scan.scan_type}" requested by ${scan.requesting_doctor || 'Dr. Specialist'} are ready.\n\nReported By: ${scan.reported_by || 'Radiology Department'}\nFindings: ${findingsStr}`,
              sender: 'scans@gaclinic.com',
              timestamp: scan.uploaded_at,
              isRead: !!readIds[id]
            });
          });
        } catch (err) {
          console.error("Failed to fetch scan results", err);
        }

      } else if (role === 'doctor' || role === 'senior_doctor') {
        // 1. Fetch appointments
        try {
          const apptRes = await api.get('/api/appointments/appointments/');
          const appts = Array.isArray(apptRes.data) ? apptRes.data : (apptRes.data.results || []);
          appts.forEach(appt => {
            const id = `appt-${appt.id}`;
            rawNotifications.push({
              id,
              title: `Appointment ${appt.status.charAt(0).toUpperCase() + appt.status.slice(1)}: ${appt.patient_name}`,
              preview: `${appt.patient_name} scheduled for ${appt.date} at ${appt.time?.substring(0, 5) || 'N/A'} is ${appt.status}.`,
              body: `Dr. ${user.full_name || 'Doctor'},\n\nAn appointment has been updated for patient ${appt.patient_name}.\n\nDate: ${appt.date}\nTime: ${appt.time?.substring(0, 5) || 'N/A'}\nType: ${appt.appointment_type === 'in_person' ? 'In-Person' : 'Virtual'}\nStatus: ${appt.status.toUpperCase()}`,
              sender: 'appointments@gaclinic.com',
              timestamp: appt.created_at || `${appt.date}T${appt.time}`,
              isRead: !!readIds[id]
            });
          });
        } catch (err) {
          console.error("Failed to fetch doctor appointments", err);
        }

        // 2. Fetch Scan Results
        try {
          const scanRes = await api.get('/api/medical_records/scan-results/');
          const scans = Array.isArray(scanRes.data) ? scanRes.data : (scanRes.data.results || []);
          scans.forEach(scan => {
            const id = `scan-${scan.id}`;
            const findingsStr = Array.isArray(scan.findings) ? scan.findings.join(', ') : (scan.findings || 'Completed');
            rawNotifications.push({
              id,
              title: `New Scan Uploaded: Patient ID #${scan.patient}`,
              preview: `Scan result for ${scan.scan_type} has been uploaded to patient files.`,
              body: `Hello Dr. ${user.full_name || 'Doctor'},\n\nDiagnostic scan results of type "${scan.scan_type}" have been uploaded for Patient ID #${scan.patient}.\n\nReported By: ${scan.reported_by || 'Radiologist'}\nFindings: ${findingsStr}`,
              sender: 'lab@gaclinic.com',
              timestamp: scan.uploaded_at,
              isRead: !!readIds[id]
            });
          });
        } catch (err) {
          console.error("Failed to fetch doctor scan reports", err);
        }

        // 3. Fetch Specialist Referrals
        try {
          const refRes = await api.get('/api/appointments/referrals/');
          const referrals = Array.isArray(refRes.data) ? refRes.data : (refRes.data.results || []);
          referrals.forEach(ref => {
            const id = `referral-${ref.id}`;
            rawNotifications.push({
              id,
              title: `Specialist Referral: ${ref.patient_name}`,
              preview: `Dr. ${ref.referrer_name} referred patient ${ref.patient_name} to you.`,
              body: `Dear Dr. ${user.full_name || 'Doctor'},\n\nDr. ${ref.referrer_name} has requested a specialist consult / second opinion with you for patient ${ref.patient_name}.\n\nClinical notes: ${ref.notes || 'No notes provided.'}\n\nPatient ID: #PAT-${ref.patient_id}\n\nYou can click 'View Patient Medical History' to access their full medical records and history details.`,
              sender: 'referrals@gaclinic.com',
              timestamp: ref.created_at,
              patientId: ref.patient_id, // stored for deep linking!
              isRead: !!readIds[id]
            });
          });
        } catch (err) {
          console.error("Failed to fetch specialist referrals", err);
        }

        // 3. Fetch security audit logs (senior doctor only) - Removed per request

      } else if (role === 'receptionist') {
        // 1. Fetch appointments
        try {
          const apptRes = await api.get('/api/appointments/appointments/');
          const appts = Array.isArray(apptRes?.data) ? apptRes.data : (apptRes?.data?.results || []);
          appts.forEach(appt => {
            const id = `appt-${appt.id}`;
            rawNotifications.push({
              id,
              title: `Appointment Booked: ${appt.patient_name}`,
              preview: `${appt.patient_name} with Dr. ${appt.doctor_name} is ${appt.status}.`,
              body: `Hello Reception,\n\nA new appointment booking is registered.\n\nPatient Name: ${appt.patient_name}\nDoctor: Dr. ${appt.doctor_name}\nDate: ${appt.date}\nTime: ${appt.time?.substring(0, 5) || 'N/A'}\nType: ${appt.appointment_type === 'in_person' ? 'In-Person' : 'Virtual'}\nStatus: ${appt.status.toUpperCase()}`,
              sender: 'appointments@gaclinic.com',
              timestamp: appt.created_at || `${appt.date}T${appt.time}`,
              isRead: !!readIds[id]
            });
          });
        } catch (err) {
          console.error("Failed to fetch receptionist appointments", err);
        }

        // 2. Fetch Patients (new registrations)
        try {
          const patientRes = await api.get('/api/users/patients/');
          const patients = Array.isArray(patientRes?.data) ? patientRes.data : (patientRes?.data?.results || []);
          patients.forEach(pat => {
            const id = `pat-reg-${pat.id}`;
            const timestamp = pat.user?.date_joined || pat.user?.created_at || new Date(Date.now() - (patients.length - pat.id) * 3600000).toISOString();
            rawNotifications.push({
              id,
              title: `New Patient Registered: ${pat.full_name}`,
              preview: `${pat.full_name} registered via online portal.`,
              body: `Hello Reception,\n\nA new patient has registered online.\n\nName: ${pat.full_name}\nEmail: ${pat.email || 'N/A'}\nMobile: ${pat.mobile_number || 'N/A'}\nPatient ID: #PAT-${pat.id}\n\nPlease review and verify their medical profile records.`,
              sender: 'support@gaclinic.com',
              timestamp,
              isRead: !!readIds[id]
            });
          });
        } catch (err) {
          console.error("Failed to fetch receptionist patients", err);
        }

      } else if (role === 'technician') {
        // 1. Fetch scan orders
        try {
          const orderRes = await api.get('/api/medical_records/scan-orders/');
          const orders = Array.isArray(orderRes?.data) ? orderRes.data : (orderRes?.data?.results || []);
          orders.forEach(ord => {
            const id = `scan-ord-${ord.id}`;
            rawNotifications.push({
              id,
              title: `Scan Ordered: ${ord.scan_type}`,
              preview: `Dr. ${ord.doctorName} requested ${ord.scan_type} for ${ord.patientName}.`,
              body: `Hello Scan Technician,\n\nDr. ${ord.doctorName} has ordered a diagnostic imaging scan.\n\nPatient Name: ${ord.patientName}\nScan Type: ${ord.scan_type}\nStatus: ${ord.status.toUpperCase()}\nNotes: ${ord.notes || 'None'}\n\nPlease prepare the scan bay and update the status when complete.`,
              sender: 'doctor@gaclinic.com',
              timestamp: ord.ordered_at,
              isRead: !!readIds[id]
            });
          });
        } catch (err) {
          console.error("Failed to fetch technician scan orders", err);
        }
      }
    } catch (err) {
      console.error("Dynamic notification fetch error", err);
    }

    // Filter out deleted notifications
    const activeNotifications = rawNotifications.filter(n => !deletedIds[n.id]);

    // Sort by timestamp desc
    activeNotifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    set({ notifications: activeNotifications, userId, loading: false });
  },

  setSearchQuery: (query) => set({ searchQuery: query }),
  
  setFilter: (filter) => set({ filter }),

  markAsRead: (id) => {
    const { notifications, userId } = get();
    if (!userId) return;

    const updated = notifications.map(n => 
      n.id === id ? { ...n, isRead: true } : n
    );

    const storageKey = `notifications_state_user_${userId}`;
    let savedState = { readIds: {}, deletedIds: {} };
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) savedState = JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse notifications interaction state', e);
    }
    
    savedState.readIds = savedState.readIds || {};
    savedState.readIds[id] = true;
    localStorage.setItem(storageKey, JSON.stringify(savedState));

    set({ notifications: updated });
  },

  toggleReadStatus: (id) => {
    const { notifications, userId } = get();
    if (!userId) return;

    const updated = notifications.map(n => 
      n.id === id ? { ...n, isRead: !n.isRead } : n
    );

    const storageKey = `notifications_state_user_${userId}`;
    let savedState = { readIds: {}, deletedIds: {} };
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) savedState = JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse notifications interaction state', e);
    }
    
    savedState.readIds = savedState.readIds || {};
    savedState.readIds[id] = !savedState.readIds[id];
    localStorage.setItem(storageKey, JSON.stringify(savedState));

    set({ notifications: updated });
  },

  markAllAsRead: () => {
    const { notifications, userId } = get();
    if (!userId) return;

    const updated = notifications.map(n => ({ ...n, isRead: true }));

    const storageKey = `notifications_state_user_${userId}`;
    let savedState = { readIds: {}, deletedIds: {} };
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) savedState = JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse notifications interaction state', e);
    }
    
    savedState.readIds = savedState.readIds || {};
    notifications.forEach(n => {
      savedState.readIds[n.id] = true;
    });
    localStorage.setItem(storageKey, JSON.stringify(savedState));

    set({ notifications: updated });
  },

  deleteNotification: (id) => {
    const { notifications, userId } = get();
    if (!userId) return;

    const updated = notifications.filter(n => n.id !== id);

    const storageKey = `notifications_state_user_${userId}`;
    let savedState = { readIds: {}, deletedIds: {} };
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) savedState = JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse notifications interaction state', e);
    }
    
    savedState.deletedIds = savedState.deletedIds || {};
    savedState.deletedIds[id] = true;
    localStorage.setItem(storageKey, JSON.stringify(savedState));

    set({ notifications: updated });
  }
}));

