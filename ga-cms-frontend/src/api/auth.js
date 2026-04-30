import apiClient from './axios';

export const authApi = {
  // Google OAuth
  googleLogin: async (idToken) => {
    const res = await apiClient.post('/auth/google/', { id_token: idToken });
    return res.data;
  },

  // Sign In — step 1: validate credentials, trigger OTP
  loginRequestOtp: async (email, password) => {
    const res = await apiClient.post('/auth/login/request-otp/', { email, password });
    return res.data;
  },

  // Sign In — step 2: verify OTP, get JWT
  loginVerifyOtp: async (email, otp) => {
    const res = await apiClient.post('/auth/login/verify-otp/', { email, otp });
    return res.data;
  },

  // Sign Up — step 1: validate fields, trigger OTP
  registerRequestOtp: async (username, email, password, role) => {
    const res = await apiClient.post('/auth/register/request-otp/', { username, email, password, role });
    return res.data;
  },

  // Sign Up — step 2: verify OTP, create account, get JWT
  registerVerifyOtp: async (email, otp) => {
    const res = await apiClient.post('/auth/register/verify-otp/', { email, otp });
    return res.data;
  },

  getMe: async () => {
    const res = await apiClient.get('/auth/me/');
    return res.data;
  },

  logout: async () => {
    const res = await apiClient.post('/auth/logout/');
    return res.data;
  },

  changePassword: async (current_password, new_password, confirm_password) => {
    const res = await apiClient.post('/auth/change-password/', { current_password, new_password, confirm_password });
    return res.data;
  },

  // Staff management (doctor / senior_doctor only)
  addStaff: async (data) => {
    const res = await apiClient.post('/api/users/staff/add/', data);
    return res.data;
  },

  listStaff: async () => {
    const res = await apiClient.get('/api/users/staff/');
    return res.data;
  },
};
