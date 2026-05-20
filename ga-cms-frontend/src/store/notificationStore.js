import { create } from 'zustand';

// Helper to generate mock email notifications based on the user's role
const getMockEmails = (role, userFullName) => {
  const common = [
    {
      id: 'welcome',
      title: 'Welcome to Antigravity Clinic Portal!',
      preview: 'We are thrilled to welcome you to our advanced digital healthcare system.',
      body: `Hello ${userFullName || 'User'},\n\nWelcome to your Clinic-Management-System portal. You can now manage appointments, consultations, invoices, and view medical reports directly online.\n\nBest regards,\nClinic Admin & Support Team`,
      sender: 'admin@gaclinic.com',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      isRead: true,
    }
  ];

  if (role === 'patient') {
    return [
      {
        id: 'scan-ready',
        title: 'MRI Brain Scan Report Available',
        preview: 'The diagnostic imaging department has uploaded your brain MRI results.',
        body: `Dear ${userFullName || 'Patient'},\n\nYour MRI Brain Scan report requested by Dr. Abhishek has been reviewed and uploaded to your clinic medical records.\n\nYou can view and download the PDF report and view scanning queues directly from your patient dashboard.\n\nBest regards,\nImaging Scan Lab Team`,
        sender: 'scans@gaclinic.com',
        timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 mins ago
        isRead: false,
      },
      {
        id: 'presc-update',
        title: 'Prescription Refill Update: Dr. Abhishek',
        preview: 'A new prescription has been added to your medical records.',
        body: `Dear ${userFullName || 'Patient'},\n\nDr. Abhishek has updated your prescription dosage instructions for Neuro-Tonic (take 10ml twice daily after meals). Please view detailed prescriptions in your account dashboard.\n\nBest regards,\nDr. Abhishek`,
        sender: 'prescriptions@gaclinic.com',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
        isRead: false,
      },
      {
        id: 'appt-conf',
        title: 'Appointment Booking Confirmed',
        preview: 'Your appointment for 22nd May at 10:20 AM with Dr. Abhishek is confirmed.',
        body: `Dear ${userFullName || 'Patient'},\n\nYour booking request with Dr. Abhishek has been confirmed for May 22nd at 10:20 AM. Please arrive 15 minutes early and show your queue token at the reception desk.\n\nBest regards,\nAppointments Team`,
        sender: 'appointments@gaclinic.com',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        isRead: true,
      },
      ...common
    ];
  } else if (role === 'doctor' || role === 'senior_doctor') {
    return [
      {
        id: 'scan-uploaded',
        title: 'New MRI Scan Uploaded: Sarah Smith',
        preview: 'Technician has uploaded MRI scans for patient #PAT-491.',
        body: `Dr. ${userFullName || 'Doctor'},\n\nPatient Sarah Smith (#PAT-491) has finished their MRI scan. The report and images are now available under patient medical files.\n\nBest regards,\nImaging Lab`,
        sender: 'lab@gaclinic.com',
        timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(), // 25 mins ago
        isRead: false,
      },
      {
        id: 'appt-cancelled',
        title: 'Appointment Cancelled: Patient John Doe',
        preview: 'John Doe cancelled his appointment scheduled for tomorrow at 11:40 AM.',
        body: `Dr. ${userFullName || 'Doctor'},\n\nPatient John Doe has cancelled their appointment on May 21st, 11:40 AM due to travel. The slot has been released back to availability.\n\nBest regards,\nReception Desk`,
        sender: 'receptionist@gaclinic.com',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
        isRead: false,
      },
      {
        id: 'audit-alert',
        title: 'Monthly Security Audit Log Ready',
        preview: 'The system has compiled the audit logs for access verification.',
        body: `Hello Dr. ${userFullName || 'Doctor'},\n\nThe system monthly security audit report is ready. 24 new staff logins were verified. Please check the logs dashboard.\n\nBest regards,\nSecurity Auditor`,
        sender: 'security@gaclinic.com',
        timestamp: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(), // 1.5 days ago
        isRead: true,
      },
      ...common
    ];
  } else if (role === 'receptionist') {
    return [
      {
        id: 'new-patient',
        title: 'New Patient Portal Registration',
        preview: 'A new patient has submitted registration details online.',
        body: `Hello Team,\n\nPatient Robert Downey has registered via the clinic portal. Please review and verify the demographic/insurance information in patient records.\n\nBest regards,\nPortal Admin`,
        sender: 'support@gaclinic.com',
        timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 mins ago
        isRead: false,
      },
      {
        id: 'bill-paid',
        title: 'Online Payment Received: Invoice #INV-882',
        preview: 'Online payment of ₹590.00 received for Sarah Smith.',
        body: `Hello Reception,\n\nSarah Smith has paid ₹590.00 online for their consultation appointment with Dr. Abhishek. Invoice marked as settled.\n\nBest regards,\nBilling Gateway`,
        sender: 'billing@gaclinic.com',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        isRead: false,
      },
      ...common
    ];
  } else if (role === 'technician') {
    return [
      {
        id: 'scan-ordered',
        title: 'Scan Order Requested: Patient Sarah Smith',
        preview: 'Dr. Abhishek ordered a Brain MRI for patient #PAT-491.',
        body: `Hello Scan Lab,\n\nDr. Abhishek has ordered an urgent Brain MRI for patient Sarah Smith (#PAT-491). Please schedule and prepare the scanning bay.\n\nBest regards,\nDoctor Team`,
        sender: 'doctor@gaclinic.com',
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 mins ago
        isRead: false,
      },
      ...common
    ];
  }
  return common;
};

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  searchQuery: '',
  filter: 'all', // 'all', 'unread', 'read'
  userId: null,

  init: (user) => {
    if (!user) return;
    const storageKey = `notifications_user_${user.id}`;
    let saved = localStorage.getItem(storageKey);
    let list = [];

    if (saved) {
      try {
        list = JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse notifications", e);
        list = getMockEmails(user.role, user.full_name);
        localStorage.setItem(storageKey, JSON.stringify(list));
      }
    } else {
      list = getMockEmails(user.role, user.full_name);
      localStorage.setItem(storageKey, JSON.stringify(list));
    }

    set({ notifications: list, userId: user.id });
  },

  setSearchQuery: (query) => set({ searchQuery: query }),
  
  setFilter: (filter) => set({ filter }),

  markAsRead: (id) => {
    const { notifications, userId } = get();
    if (!userId) return;

    const updated = notifications.map(n => 
      n.id === id ? { ...n, isRead: true } : n
    );

    localStorage.setItem(`notifications_user_${userId}`, JSON.stringify(updated));
    set({ notifications: updated });
  },

  toggleReadStatus: (id) => {
    const { notifications, userId } = get();
    if (!userId) return;

    const updated = notifications.map(n => 
      n.id === id ? { ...n, isRead: !n.isRead } : n
    );

    localStorage.setItem(`notifications_user_${userId}`, JSON.stringify(updated));
    set({ notifications: updated });
  },

  markAllAsRead: () => {
    const { notifications, userId } = get();
    if (!userId) return;

    const updated = notifications.map(n => ({ ...n, isRead: true }));
    localStorage.setItem(`notifications_user_${userId}`, JSON.stringify(updated));
    set({ notifications: updated });
  },

  deleteNotification: (id) => {
    const { notifications, userId } = get();
    if (!userId) return;

    const updated = notifications.filter(n => n.id !== id);
    localStorage.setItem(`notifications_user_${userId}`, JSON.stringify(updated));
    set({ notifications: updated });
  }
}));
