import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import AuthGuard from '../components/auth/AuthGuard';
import AppShell from '../components/layout/AppShell';
import { useAuthStore } from '../store/authStore';
import { Spinner } from '../components/shared/Spinner';

// Lazy load pages
const LoginPage = lazy(() => import('../components/auth/LoginPage'));
const SignInPage = lazy(() => import('../components/auth/SignInPage'));
const SignUpPage = lazy(() => import('../components/auth/SignUpPage'));
const UnauthorizedPage = lazy(() => import('../components/auth/UnauthorizedPage'));
const ChangePasswordPage = lazy(() => import('../components/auth/ChangePasswordPage'));

const AdminDashboard = lazy(() => import('../components/admin/AdminDashboard'));
const DoctorDashboard = lazy(() => import('../components/doctor/DoctorDashboard'));
const ReceptionistDashboard = lazy(() => import('../components/receptionist/ReceptionistDashboard'));
const TechnicianDashboard = lazy(() => import('../components/technician/TechnicianDashboard'));
const PatientDashboard = lazy(() => import('../components/patient/PatientDashboard'));
const PatientRegistrationForm = lazy(() => import('../components/receptionist/PatientRegistrationForm'));
const AddStaffPage = lazy(() => import('../components/admin/AddStaffPage'));
const AuditLogsPage = lazy(() => import('../components/admin/AuditLogsPage'));
const AdminAppointmentsPage = lazy(() => import('../components/admin/AdminAppointmentsPage'));
const AdminPatientsPage = lazy(() => import('../components/admin/AdminPatientsPage'));
const AdminRevenuePage = lazy(() => import('../components/admin/AdminRevenuePage'));
const AdminStaffPerformancePage = lazy(() => import('../components/admin/AdminStaffPerformancePage'));
const AdminDoctorsPage = lazy(() => import('../components/admin/AdminDoctorsPage'));
const AdminReviewsPage = lazy(() => import('../components/admin/AdminReviewsPage'));
const ComingSoonPage = lazy(() => import('../components/shared/ComingSoonPage'));
const BookAppointment = lazy(() => import('../components/patient/BookAppointment'));
const DoctorAppointmentsPage = lazy(() => import('../components/doctor/DoctorAppointmentsPage'));
const PatientAppointmentsPage = lazy(() => import('../components/patient/PatientAppointmentsPage'));
const PatientProfilePage = lazy(() => import('../components/patient/PatientProfilePage'));

// Role-specific action pages
const ScanOrdersPage = lazy(() => import('../components/technician/ScanOrdersPage'));
const UploadResultsPage = lazy(() => import('../components/technician/UploadResultsPage'));
const QueuePage = lazy(() => import('../components/receptionist/QueuePage'));
const BillingPage = lazy(() => import('../components/receptionist/BillingPage'));
const PrescriptionsPage = lazy(() => import('../components/patient/PrescriptionsPage'));
const TestResultsPage = lazy(() => import('../components/patient/TestResultsPage'));
const DoctorConsultationsPage = lazy(() => import('../components/doctor/DoctorConsultationsPage'));
const DoctorPatientsPage = lazy(() => import('../components/doctor/DoctorPatientsPage'));
const DoctorChatPage = lazy(() => import('../components/doctor/DoctorChatPage'));
const MedicalRecordsPage = lazy(() => import('../components/patient/MedicalRecordsPage'));
const ScanReportPage = lazy(() => import('../components/shared/ScanReportPage'));
const PatientChatPage = lazy(() => import('../components/patient/PatientChatPage'));
const StaffChatPage = lazy(() => import('../components/shared/chat/StaffChatPage'));
const ConsultationReviewForm = lazy(() => import('../components/shared/ConsultationReviewForm'));
const DoctorPrescriptionsPage = lazy(() => import('../components/doctor/DoctorPrescriptionsPage'));

const ChatRouteWrapper = () => {
  return (
    <AuthGuard allowedRoles={['doctor', 'senior_doctor', 'patient', 'technician', 'receptionist']}>
      <StaffChatPage />
    </AuthGuard>
  );
};

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

const ReviewRouteWrapper = () => {
  const { appointmentId } = useParams();
  return (
    <div className="min-h-screen bg-[#020b18] py-12 px-4">
      <ConsultationReviewForm appointmentId={appointmentId} />
    </div>
  );
};

const AppRouter = () => {
  return (
    <Suspense fallback={<div className="h-screen w-full flex items-center justify-center"><Spinner /></div>}>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<SignInPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="/review" element={<ReviewRouteWrapper />} />
        <Route path="/review/:appointmentId" element={<ReviewRouteWrapper />} />

        <Route element={<AuthGuard><AppShell /></AuthGuard>}>
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
          <Route path="/reviews" element={<AuthGuard allowedRoles={['senior_doctor']}><AdminReviewsPage /></AuthGuard>} />
          <Route path="/my-appointments" 
            element={
              <AuthGuard allowedRoles={['doctor', 'senior_doctor', 'patient']}>
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
          <Route path="/doctor/prescriptions" 
            element={
              <AuthGuard allowedRoles={['doctor', 'senior_doctor']}>
                <DoctorPrescriptionsPage />
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
              <ChatRouteWrapper />
            } 
          />
          <Route path="/staff-chat" 
            element={
              <ChatRouteWrapper />
            } 
          />
          <Route path="/performance" element={<ComingSoonPage />} />
          <Route path="/queue" 
            element={
              <AuthGuard allowedRoles={['patient', 'receptionist', 'doctor', 'senior_doctor']}>
                <QueuePage />
              </AuthGuard>
            } 
          />
          <Route path="/billing" 
            element={
              <AuthGuard allowedRoles={['patient', 'receptionist', 'doctor', 'senior_doctor']}>
                <BillingPage />
              </AuthGuard>
            } 
          />
          <Route path="/upload-results" 
            element={
              <AuthGuard allowedRoles={['technician', 'senior_doctor', 'doctor']}>
                <UploadResultsPage />
              </AuthGuard>
            } 
          />
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
          <Route path="/profile" 
            element={
              <AuthGuard allowedRoles={['patient', 'doctor', 'senior_doctor', 'receptionist', 'technician']}>
                <PatientProfilePage />
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
    </Suspense>
  );
};

export default AppRouter;
