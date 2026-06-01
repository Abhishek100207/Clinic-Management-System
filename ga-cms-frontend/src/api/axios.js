import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    // Do not attach token for auth endpoints
    if (token && !config.url.includes('/auth/login') && !config.url.includes('/auth/register') && !config.url.includes('/auth/refresh')) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => {
    if (response.config.url?.includes('/api/appointments/appointments/') && response.config.method === 'get') {
      try {
        const rescheduledStr = localStorage.getItem('rescheduled_appts_overrides');
        if (rescheduledStr) {
          const overrides = JSON.parse(rescheduledStr);
          const processAppt = (appt) => {
            if (overrides[appt.id]) {
              return {
                ...appt,
                date: overrides[appt.id].date,
                time: overrides[appt.id].time,
                status: overrides[appt.id].status || appt.status
              };
            }
            return appt;
          };

          if (Array.isArray(response.data)) {
            response.data = response.data.map(processAppt);
          } else if (response.data?.results && Array.isArray(response.data.results)) {
            response.data.results = response.data.results.map(processAppt);
          }
        }
      } catch (e) {
        console.error("Failed to merge appointment overrides", e);
      }
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Do not trigger refresh logic for auth endpoints
    if (originalRequest.url.includes('/auth/login') || originalRequest.url.includes('/auth/register') || originalRequest.url.includes('/auth/refresh')) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't intercept auth endpoints to prevent infinite loops
      const url = originalRequest.url || '';
      if (url.includes('/auth/login') || url.includes('/auth/refresh') || url.includes('/auth/register')) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;
      try {
        const { data } = await axios.post(
          `${apiClient.defaults.baseURL}/auth/refresh/`,
          {},
          { withCredentials: true }
        );
        useAuthStore.getState().setToken(data.access);
        originalRequest.headers['Authorization'] = `Bearer ${data.access}`;
        return apiClient(originalRequest);
      } catch (err) {
        useAuthStore.getState().logout();
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
