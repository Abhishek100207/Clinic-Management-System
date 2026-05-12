import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AuthGuard from '../components/auth/AuthGuard';
import LoginPage from '../components/auth/LoginPage';
import SignInPage from '../components/auth/SignInPage';
import SignUpPage from '../components/auth/SignUpPage';
import UnauthorizedPage from '../components/auth/UnauthorizedPage';
import AppShell from '../components/layout/AppShell';
import { useAuthStore } from '../store/authStore';

import AdminDashboard from '../components/admin/AdminDashboard';
import DoctorDashboard from '../components/doctor/DoctorDashboard';
import ReceptionistDashboard from '../components/receptionist/ReceptionistDashboard';
import TechnicianDashboard from '../components/technician/TechnicianDashboard';
import PatientDashboard from '../components/patient/PatientDashboard';
import PatientRegistrationForm from '../components/receptionist/PatientRegistrationForm';
import AddStaffPage from '../components/admin/AddStaffPage';
import ChangePasswordPage from '../components/auth/ChangePasswordPage';
import AuditLogsPage from '../components/admin/AuditLogsPage';
import AdminAppointmentsPage from '../components/admin/AdminAppointmentsPage';
import AdminPatientsPage from '../components/admin/AdminPatientsPage';
import AdminRevenuePage from '../components/admin/AdminRevenuePage';
import AdminStaffPerformancePage from '../components/admin/AdminStaffPerformancePage';
import AdminDoctorsPage from '../components/admin/AdminDoctorsPage';
import AdminSettingsPage from '../components/admin/AdminSettingsPage';
import ComingSoonPage from '../components/shared/ComingSoonPage';
import BookAppointment from '../components/patient/BookAppointment';
import DoctorAppointmentsPage from '../components/doctor/DoctorAppointmentsPage';
import PatientAppointmentsPage from '../components/patient/PatientAppointmentsPage';

// Role-specific action pages
import ScanOrdersPage from '../components/technician/ScanOrdersPage';
import UploadResultsPage from '../components/technician/UploadResultsPage';
import QueuePage from '../components/receptionist/QueuePage';
import BillingPage from '../components/receptionist/BillingPage';
import PrescriptionsPage from '../components/patient/PrescriptionsPage';
import TestResultsPage from '../components/patient/TestResultsPage';
import DoctorConsultationsPage from '../components/doctor/DoctorConsultationsPage';
import DoctorPatientsPage from '../components/doctor/DoctorPatientsPage';
import DoctorChatPage from '../components/doctor/DoctorChatPage';
import MedicalRecordsPage from '../components/patient/MedicalRecordsPage';
import ScanReportPage from '../components/shared/ScanReportPage';

const ConsultationRouteWrapper = () => {
  const { user } = useAuthStore();
  if (user?.role === 'patient') {
    return <Navigate to="/dashboard/patient" replace />;
  }
  return <DoctorConsultationsPage />;
};

const AppointmentRouteWrapper = () => {
  const { user } = useAuthStore();
  if (user?.role === 'patient') {
    return <PatientAppointmentsPage />;
  }
  return <DoctorAppointmentsPage />;
};

const GlobalAppointmentRouteWrapper = () => {
  const { user } = useAuthStore();
  if (user?.role === 'senior_doctor') {
    return <AdminAppointmentsPage />;
  }
  // Default to booking page for others (patient/receptionist)
  return <BookAppointment />;
};

const AppRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/login" element={<SignInPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      <Route element={<AppShell />}>
        <Route path="/dashboard/admin"
          element={<AuthGuard allowedRoles={['senior_doctor']}><AdminDashboard /></AuthGuard>} />
        <Route path="/dashboard/doctor"
          element={<AuthGuard allowedRoles={['doctor', 'senior_doctor']}><DoctorDashboard /></AuthGuard>} />
        <Route path="/dashboard/receptionist"
          element={<AuthGuard allowedRoles={['receptionist']}><ReceptionistDashboard /></AuthGuard>} />
        <Route path="/dashboard/technician"
          element={<AuthGuard allowedRoles={['technician']}><TechnicianDashboard /></AuthGuard>} />
        <Route path="/dashboard/patient"
          element={<AuthGuard allowedRoles={['patient']}><PatientDashboard /></AuthGuard>} />
        <Route path="/register-patient"
          element={<AuthGuard allowedRoles={['receptionist', 'doctor', 'senior_doctor']}><PatientRegistrationForm /></AuthGuard>} />
        <Route path="/staff/add"
          element={<AuthGuard allowedRoles={['doctor', 'senior_doctor']}><AddStaffPage /></AuthGuard>} />
        <Route path="/logs"
          element={<AuthGuard allowedRoles={['senior_doctor']}><AuditLogsPage /></AuthGuard>} />

        <Route path="/appointments" element={<GlobalAppointmentRouteWrapper />} />
        <Route path="/patients" element={<AuthGuard allowedRoles={['senior_doctor']}><AdminPatientsPage /></AuthGuard>} />
        <Route path="/revenue" element={<AuthGuard allowedRoles={['senior_doctor']}><AdminRevenuePage /></AuthGuard>} />
        <Route path="/performance/staff" element={<AuthGuard allowedRoles={['senior_doctor']}><AdminStaffPerformancePage /></AuthGuard>} />
        <Route path="/doctors" element={<AuthGuard allowedRoles={['senior_doctor']}><AdminDoctorsPage /></AuthGuard>} />
        <Route path="/settings" element={<AuthGuard allowedRoles={['senior_doctor']}><AdminSettingsPage /></AuthGuard>} />
        <Route path="/my-appointments" 
          element={
            <AuthGuard allowedRoles={['doctor', 'senior_doctor', 'patient']}>
              {/* Conditional rendering based on user role or separate routes would be better, 
                  but for now we use a small helper or just split them if possible. 
                  Actually, since they share the same URL, we can use a wrapper or just check role here. */}
              <AppointmentRouteWrapper />
            </AuthGuard>
          } 
        />
        <Route path="/my-patients" 
          element={
            <AuthGuard allowedRoles={['doctor', 'senior_doctor']}>
              <DoctorPatientsPage />
            </AuthGuard>
          } 
        />
        <Route path="/consultations" 
          element={
            <AuthGuard allowedRoles={['doctor', 'senior_doctor']}>
              <ConsultationRouteWrapper />
            </AuthGuard>
          } 
        />
        <Route path="/scan-orders" 
          element={
            <AuthGuard allowedRoles={['technician', 'senior_doctor']}>
              <ScanOrdersPage />
            </AuthGuard>
          } 
        />
        <Route path="/chat" 
          element={
            <AuthGuard allowedRoles={['doctor', 'senior_doctor']}>
              <DoctorChatPage />
            </AuthGuard>
          } 
        />
        <Route path="/performance" element={<ComingSoonPage />} />
        <Route path="/queue" element={<QueuePage />} />
        <Route path="/billing" element={<BillingPage />} />
        <Route path="/upload-results" element={<UploadResultsPage />} />
        <Route path="/test-results" 
          element={
            <AuthGuard allowedRoles={['doctor', 'senior_doctor', 'technician']}>
              <TestResultsPage />
            </AuthGuard>
          } 
        />
        <Route path="/medical-records" 
          element={
            <AuthGuard allowedRoles={['patient']}>
              <MedicalRecordsPage />
            </AuthGuard>
          } 
        />
        <Route path="/scan-report/:reportId" 
          element={
            <AuthGuard allowedRoles={['doctor', 'senior_doctor', 'patient', 'technician']}>
              <ScanReportPage />
            </AuthGuard>
          } 
        />

        <Route path="/change-password" element={<ChangePasswordPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Route>
    </Routes>
  );
};

export default AppRouter;
