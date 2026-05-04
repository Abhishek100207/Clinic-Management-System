export const ROLE_CONFIG = {
  senior_doctor: {
    displayName: 'Senior Doctor (Admin)',
    dashboardRoute: '/dashboard/admin',
    navLinks: [
      { name: 'Dashboard', path: '/dashboard/admin', icon: 'LayoutDashboard' },
      { name: 'Appointments (All Doctors)', path: '/appointments', icon: 'CalendarDays' },
      { name: 'Patient Records', path: '/patients', icon: 'Users' },
      { name: 'Revenue', path: '/revenue', icon: 'IndianRupee' },
      { name: 'Staff Performance', path: '/performance/staff', icon: 'LineChart' },
      { name: 'Doctors',         path: '/doctors',          icon: 'Stethoscope' },
      { name: 'Add Staff',       path: '/staff/add',        icon: 'UserPlus' },
      { name: 'Audit Logs',      path: '/logs',             icon: 'ClipboardList' },
      { name: 'Settings', path: '/settings', icon: 'Settings' },
    ],
    badgeColor: 'bg-purple-100 text-purple-800'
  },
  doctor: {
    displayName: 'Doctor',
    dashboardRoute: '/dashboard/doctor',
    navLinks: [
      { name: 'Dashboard',       path: '/dashboard/doctor', icon: 'LayoutDashboard' },
      { name: 'My Appointments', path: '/my-appointments',  icon: 'CalendarDays' },
      { name: 'My Patients',     path: '/my-patients',      icon: 'Users' },
      { name: 'Prescriptions',   path: '/prescriptions',    icon: 'FileText' },
      { name: 'Chat',            path: '/chat',             icon: 'MessageSquare' },
    ],
    badgeColor: 'bg-blue-100 text-blue-800'
  },
  receptionist: {
    displayName: 'Receptionist',
    dashboardRoute: '/dashboard/receptionist',
    navLinks: [
      { name: 'Dashboard', path: '/dashboard/receptionist', icon: 'LayoutDashboard' },
      { name: 'Appointments', path: '/appointments', icon: 'CalendarDays' },
      { name: 'Patient Registration', path: '/register-patient', icon: 'UserPlus' },
      { name: 'Queue', path: '/queue', icon: 'ListOrdered' },
      { name: 'Billing & Invoices', path: '/billing', icon: 'CreditCard' },
    ],
    badgeColor: 'bg-emerald-100 text-emerald-800'
  },
  technician: {
    displayName: 'Scanning Technician',
    dashboardRoute: '/dashboard/technician',
    navLinks: [
      { name: 'Scan Queue', path: '/dashboard/technician', icon: 'ListOrdered' },
      { name: 'Upload Results', path: '/upload-results', icon: 'Upload' },
    ],
    badgeColor: 'bg-amber-100 text-amber-800'
  },
  patient: {
    displayName: 'Patient',
    dashboardRoute: '/dashboard/patient',
    navLinks: [
      { name: 'Dashboard', path: '/dashboard/patient', icon: 'LayoutDashboard' },
      { name: 'My Appointments', path: '/my-appointments', icon: 'CalendarDays' },
      { name: 'Book Appointment', path: '/appointments',   icon: 'PlusCircle' },
      { name: 'My Prescriptions', path: '/prescriptions', icon: 'FileText' },
      { name: 'Test Results', path: '/test-results', icon: 'Activity' },
    ],
    badgeColor: 'bg-pink-100 text-pink-800'
  }
};
