import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AppRouter from './router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import api from './api/axios';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,      // 30 seconds
      cacheTime: 300000,     // 5 minutes
      retry: 1,
      onError: (error) => {
        toast.error(error.response?.data?.error || "Failed to fetch data");
      }
    },
    mutations: {
      onError: (error) => {
        toast.error(error.response?.data?.error || "Operation failed");
      }
    }
  }
});

// Provided in specs, need actual env var to work fully or use a dummy for now.
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'your-google-client-id.apps.googleusercontent.com';

function App() {
  useEffect(() => {
    // Fire silently in background
    api.get('/api/health/').catch(() => {});
  }, []);

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AppRouter />
          <ToastContainer
            position="bottom-right"
            autoClose={4000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            pauseOnHover
            draggable
            theme="light"
          />
        </BrowserRouter>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  );
}

export default App;

