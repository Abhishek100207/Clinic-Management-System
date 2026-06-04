import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Calendar, Droplets, Phone, Mail, MapPin, Fingerprint, CalendarDays, HeartHandshake } from 'lucide-react';
import api from '../../api/axios';
import { useAuthStore } from '../../store/authStore';

const PatientProfilePage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [patientProfile, setPatientProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/api/users/patients/');
        const patientData = Array.isArray(res?.data) ? res.data : (res?.data?.results ?? []);
        if (patientData.length > 0) {
          setPatientProfile(patientData[0]);
        }
      } catch (err) {
        console.error("Failed to fetch patient profile", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const calculateAge = (dobString) => {
    if (!dobString) return '28';
    try {
      const birthDate = new Date(dobString);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age.toString();
    } catch (e) {
      return '28';
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      return new Date(dateStr).toLocaleDateString('en-IN', options);
    } catch (e) {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin"></div>
      </div>
    );
  }

  // Fallback to user store values if patientProfile isn't available
  const fullName = patientProfile?.full_name || user?.full_name || 'N/A';
  const email = patientProfile?.email || user?.email || 'N/A';
  const patientId = patientProfile?.patient_id || 'N/A';
  const bloodGroup = patientProfile?.blood_group || 'N/A';
  const phone = patientProfile?.mobile_number || 'N/A';
  const address = patientProfile?.address || 'N/A';
  const dob = patientProfile?.date_of_birth || '';
  const gender = patientProfile?.gender || 'N/A';
  const age = dob ? calculateAge(dob) : '28';

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8 animate-fade-in text-slate-700">
      {/* Header back navigation */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center p-2 rounded-xl bg-white border border-gray-150 hover:bg-slate-50 transition-colors shadow-sm focus:outline-none"
        >
          <ArrowLeft size={20} className="text-slate-500" />
        </button>
        <div>
          <h1 className="text-3xl font-extrabold text-navy tracking-tight">Patient Profile</h1>
          <p className="text-sm text-slate-400 font-medium">Manage and view your personal medical identity information.</p>
        </div>
      </div>

      {/* Main Profile Info Card */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-blue-600 to-indigo-700"></div>
        
        {/* Avatar and Top Info */}
        <div className="relative pt-24 px-6 sm:px-8 pb-8 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6">
            {/* Avatar Circle */}
            <div className="h-28 w-28 rounded-full bg-blue-600 border-4 border-white text-white flex items-center justify-center font-bold text-5xl shadow-lg shrink-0 overflow-hidden relative z-10">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                fullName.charAt(0)
              )}
            </div>
            
            <div className="text-center sm:text-left space-y-1">
              <h2 className="text-2xl font-black text-navy">{fullName}</h2>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100 text-xs font-bold">
                  <Fingerprint size={12} /> Patient ID: {patientId}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-bold">
                  Active Member
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile details grid */}
        <div className="p-6 sm:p-8 bg-slate-50/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoCard 
              icon={User} 
              iconColor="text-blue-500 bg-blue-50 border-blue-100"
              label="Full Name" 
              value={fullName} 
            />
            <InfoCard 
              icon={Fingerprint} 
              iconColor="text-indigo-500 bg-indigo-50 border-indigo-100"
              label="Patient ID / UHID" 
              value={patientId} 
            />
            <InfoCard 
              icon={HeartHandshake} 
              iconColor="text-emerald-500 bg-emerald-50 border-emerald-100"
              label="Age & Gender" 
              value={`${age} years • ${gender.charAt(0).toUpperCase() + gender.slice(1)}`} 
            />
            <InfoCard 
              icon={CalendarDays} 
              iconColor="text-amber-500 bg-amber-50 border-amber-100"
              label="Date of Birth" 
              value={formatDate(dob)} 
            />
            <InfoCard 
              icon={Droplets} 
              iconColor="text-red-500 bg-red-50 border-red-100"
              label="Blood Group" 
              value={bloodGroup} 
            />
            <InfoCard 
              icon={Phone} 
              iconColor="text-teal-500 bg-teal-50 border-teal-100"
              label="Phone Number" 
              value={phone} 
            />
            <InfoCard 
              icon={Mail} 
              iconColor="text-violet-500 bg-violet-50 border-violet-100"
              label="Email Address" 
              value={email} 
            />
            <InfoCard 
              icon={MapPin} 
              iconColor="text-rose-500 bg-rose-50 border-rose-100"
              label="Address" 
              value={address} 
              spanTwoCols
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const InfoCard = ({ icon: Icon, iconColor, label, value, spanTwoCols }) => {
  return (
    <div className={`bg-white p-5 rounded-2xl border border-gray-150 shadow-sm hover:shadow-md transition-shadow flex items-start gap-4 ${spanTwoCols ? 'md:col-span-2' : ''}`}>
      <div className={`p-3 rounded-xl border flex items-center justify-center shrink-0 ${iconColor}`}>
        <Icon size={20} />
      </div>
      <div className="space-y-1">
        <p className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">{label}</p>
        <p className="text-sm font-bold text-slate-800 leading-snug">{value || 'N/A'}</p>
      </div>
    </div>
  );
};

export default PatientProfilePage;
