import React from 'react';
import { useAuthStore } from '../../store/authStore';

const PatientDashboard = () => {
  const { user } = useAuthStore();
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-4">Patient Dashboard</h1>
      <div className="p-6 rounded-2xl border border-white/10" style={{ background: 'rgba(255,255,255,0.05)' }}>
        <p className="text-white/80 text-lg">Welcome back, {user?.first_name || user?.username || 'Patient'}!</p>
        <p className="text-white/50 text-sm mt-2">Here you can view your appointments, prescriptions, and test results.</p>
      </div>
    </div>
  );
};

export default PatientDashboard;
