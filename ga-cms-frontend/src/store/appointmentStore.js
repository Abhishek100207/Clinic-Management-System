import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import api from '../api/axios';

export const useAppointmentStore = create(
  devtools((set, get) => ({
    appointments: [],
    stats: {
      totalPatients: 0,
      todayAppointments: 0,
      pendingApprovals: 0,
      revisitCount: 0
    },
    notificationsEnabled: true,
    loading: false,
    error: null,

    fetchDoctorDashboardData: async () => {
      set({ loading: true });
      try {
        // In a real scenario, these would be actual endpoints
        // Mocking for now to ensure UI functionality
        const res = await api.get('/api/appointments/appointments/');
        const appointments = res.data || [];
        
        // Calculate basic stats from appointments for now
        const today = new Date().toISOString().split('T')[0];
        const todayAppointments = appointments.filter(a => a.date === today).length;
        const pendingApprovals = appointments.filter(a => a.status === 'pending').length;
        
        set({ 
          appointments, 
          stats: {
            totalPatients: new Set(appointments.map(a => a.patient)).size,
            todayAppointments,
            pendingApprovals,
            revisitCount: appointments.length // Mocking revisit as total count for now
          },
          loading: false 
        });
      } catch (err) {
        set({ error: err.message, loading: false });
      }
    },

    updateAppointmentStatus: async (id, status) => {
      try {
        await api.patch(`/api/appointments/appointments/${id}/`, { status });
        const { appointments } = get();
        set({
          appointments: appointments.map(a => a.id === id ? { ...a, status } : a)
        });
      } catch (err) {
        console.error("Failed to update status", err);
      }
    },

    toggleNotifications: () => {
      set((state) => ({ notificationsEnabled: !state.notificationsEnabled }));
    },

    emergencyReschedule: async (data) => {
      try {
        // data contains: start_time, end_time, new_date, reason
        await api.post('/api/appointments/emergency-reschedule/', data);
        // Refresh data
        get().fetchDoctorDashboardData();
      } catch (err) {
        console.error("Emergency reschedule failed", err);
        throw err;
      }
    }
  }))
);
