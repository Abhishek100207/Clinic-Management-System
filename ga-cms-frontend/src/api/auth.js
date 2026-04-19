import apiClient from './axios';

export const authApi = {
  googleLogin: async (idToken) => {
    const response = await apiClient.post('/auth/google/', { id_token: idToken });
    return response.data;
  },
  getMe: async () => {
    const response = await apiClient.get('/auth/me/');
    return response.data;
  },
  logout: async () => {
    const response = await apiClient.post('/auth/logout/');
    return response.data;
  }
};
