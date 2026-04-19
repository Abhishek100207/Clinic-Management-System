import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../api/auth';
import { ROLE_CONFIG } from '../../utils/roleConfig';
import { Spinner } from '../shared/Spinner';

const LoginPage = () => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSuccess = async (credentialResponse) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authApi.googleLogin(credentialResponse.credential);
      setAuth(response.user, response.access);
      
      const roleConfig = ROLE_CONFIG[response.user.role];
      const from = location.state?.from?.pathname || (roleConfig ? roleConfig.dashboardRoute : '/login');
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Account not found. Contact your administrator.');
    } finally {
      setLoading(false);
    }
  };

  const handleError = () => {
    setError('Login Failed. Please try again.');
  };

  return (
    <div className="min-h-screen flex bg-offwhite">
      {/* Left Panel - Hidden on mobile */}
      <div className="hidden lg:flex w-[40%] bg-navy text-white flex-col justify-center px-16 relative">
        <div className="absolute top-8 left-16">
          <h2 className="text-2xl font-bold tracking-tight">
            GA CMS<span className="text-blue-600 block h-1 w-8 mt-1 rounded-full"></span>
          </h2>
        </div>
        <div className="max-w-md">
          <h1 className="text-4xl font-bold mb-4 tracking-tight leading-tight">Secure. Clinical. Efficient.</h1>
          <p className="text-blue-100 text-lg opacity-90">
            The complete clinic management platform for GA Clinic. Start your secure session to continue.
          </p>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12">
        <div className="w-full max-w-[440px] bg-white rounded-xl shadow-sm p-8 border border-gray-100">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-navy mb-2 tracking-tight">GA Clinic-Management-System</h1>
            <p className="text-slate-500 text-sm">Staff Portal — Sign in with your Google Workspace account</p>
          </div>

          <div className="flex flex-col items-center justify-center space-y-4">
            {loading ? (
              <div className="py-4 flex flex-col items-center">
                <Spinner size="md" className="mb-2" />
                <span className="text-sm font-medium text-slate-500">Authenticating...</span>
              </div>
            ) : (
              <div className="w-full flex justify-center">
                <GoogleLogin
                  onSuccess={handleSuccess}
                  onError={handleError}
                  useOneTap={false}
                  shape="rectangular"
                  theme="outline"
                  size="large"
                  text="signin_with"
                />
              </div>
            )}

            {error && (
               <div className="w-full bg-red-50 text-red-600 p-3 rounded-[6px] text-sm text-center border border-red-100 mt-4">
                 {error}
               </div>
            )}
          </div>
          
          <div className="mt-12 text-center border-t border-gray-100 pt-6">
            <p className="text-xs text-slate-400">
              GA Clinic-Management-System v1.0<br/>Patients: use the mobile app
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
