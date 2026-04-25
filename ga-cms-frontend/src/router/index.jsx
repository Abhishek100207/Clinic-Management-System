import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AuthGuard from '../components/auth/AuthGuard';
import LoginPage from '../components/auth/LoginPage';
import SignInPage from '../components/auth/SignInPage';
import SignUpPage from '../components/auth/SignUpPage';
import UnauthorizedPage from '../components/auth/UnauthorizedPage';
import AppShell from '../components/layout/AppShell';

import AdminDashboard from '../components/dashboards/AdminDashboard';
import DoctorDashboard from '../components/dashboards/DoctorDashboard';
import ReceptionistDashboard from '../components/dashboards/ReceptionistDashboard';
import TechnicianDashboard from '../components/dashboards/TechnicianDashboard';
import PatientRegistrationForm from '../components/patients/PatientRegistrationForm';
import AddStaffPage from '../components/staff/AddStaffPage';
import ChangePasswordPage from '../components/auth/ChangePasswordPage';

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
          element={<AuthGuard allowedRoles={['doctor','senior_doctor']}><DoctorDashboard /></AuthGuard>} />
        <Route path="/dashboard/receptionist"
          element={<AuthGuard allowedRoles={['receptionist']}><ReceptionistDashboard /></AuthGuard>} />
        <Route path="/dashboard/technician"
          element={<AuthGuard allowedRoles={['technician']}><TechnicianDashboard /></AuthGuard>} />
        <Route path="/register-patient"
          element={<AuthGuard allowedRoles={['receptionist','doctor','senior_doctor']}><PatientRegistrationForm /></AuthGuard>} />
        <Route path="/staff/add"
          element={<AuthGuard allowedRoles={['doctor','senior_doctor']}><AddStaffPage /></AuthGuard>} />
        <Route path="/change-password" element={<ChangePasswordPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Route>
    </Routes>
  );
};

export default AppRouter;
