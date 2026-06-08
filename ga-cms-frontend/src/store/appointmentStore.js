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
        const appointments = Array.isArray(res?.data) ? res.data : (res?.data?.results ?? []);

        // Sort by date DESC, then time DESC — latest appointment at the top
        const sorted = [...appointments].sort((a, b) => {
          const dateA = new Date(`${a.date}T${a.time || '00:00:00'}`);
          const dateB = new Date(`${b.date}T${b.time || '00:00:00'}`);
          return dateB - dateA;
        });

        // Calculate basic stats from appointments for now
        // Calculate basic stats from appointments for now using robust timezone match
        const todayAppointments = sorted.filter(a => {
          if (!a.date) return false;
          const [year, month, day] = a.date.split('-').map(Number);
          const d = new Date(year, month - 1, day);
          const today = new Date();
          return d.getDate() === today.getDate() &&
                 d.getMonth() === today.getMonth() &&
                 d.getFullYear() === today.getFullYear();
        }).length;
        const pendingApprovals = sorted.filter(a => a.status === 'pending').length;
        
        set({ 
          appointments: sorted, 
          stats: {
            totalPatients: new Set(sorted.map(a => a.patient)).size,
            todayAppointments,
            pendingApprovals,
            revisitCount: sorted.length
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
