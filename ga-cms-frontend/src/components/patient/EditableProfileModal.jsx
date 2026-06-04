/* eslint-disable react-hooks/set-state-in-effect, no-unused-vars, react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import { 
  User, 
  Fingerprint, 
  HeartHandshake, 
  CalendarDays, 
  Droplets, 
  Phone, 
  Mail, 
  MapPin, 
  X, 
  Edit2, 
  Save, 
  Camera, 
  Loader2 
} from 'lucide-react';
import api from '../../api/axios';
import { useAuthStore } from '../../store/authStore';

const PRESET_AVATARS = [
  { name: 'Felix', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix' },
  { name: 'Aneka', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Aneka' },
  { name: 'Jack', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Jack' },
  { name: 'Lily', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Lily' },
  { name: 'Clinic', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Clinic' },
  { name: 'User', url: 'https://api.dicebear.com/7.x/initials/svg?seed=User' }
];

const EditableProfileModal = ({ isOpen, onClose, onUpdate, initialProfile }) => {
  const { user, setUser } = useAuthStore();
  const [patientProfile, setPatientProfile] = useState(initialProfile || null);
  const [loadingProfile, setLoadingProfile] = useState(!initialProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('other');
  const [bloodGroup, setBloodGroup] = useState('');
  const [address, setAddress] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [showAvatarInput, setShowAvatarInput] = useState(false);

  // Fetch latest profile from API if initialProfile is not provided
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoadingProfile(true);
        const res = await api.get('/api/users/patients/');
        const patientData = Array.isArray(res?.data) ? res.data : (res?.data?.results ?? []);
        if (patientData.length > 0) {
          setPatientProfile(patientData[0]);
          if (onUpdate) onUpdate(patientData[0]);
        }
      } catch (err) {
        console.error("Failed to fetch profile details", err);
      } finally {
        setLoadingProfile(false);
      }
    };

    if (isOpen) {
      if (!initialProfile) {
        fetchProfileData();
      } else {
        setPatientProfile(initialProfile);
        setLoadingProfile(false);
      }
    }
  }, [isOpen, initialProfile]);

  // Sync form states with patientProfile and user store
  useEffect(() => {
    if (patientProfile) {
      setFullName(patientProfile.full_name || user?.full_name || '');
      setEmail(patientProfile.email || user?.email || '');
      setPhone(patientProfile.mobile_number || '');
      setDob(patientProfile.date_of_birth || '');
      setGender(patientProfile.gender || 'other');
      setBloodGroup(patientProfile.blood_group || '');
      setAddress(patientProfile.address || '');
      setAvatarUrl(patientProfile.user?.avatar_url || user?.avatar_url || '');
    }
  }, [patientProfile, user]);

  if (!isOpen) return null;

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

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError("Image size must be less than 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setAvatarUrl(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError("Full Name is required.");
      return;
    }
    if (!email.trim()) {
      setError("Email address is required.");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const payload = {
        full_name: fullName,
        email: email,
        mobile_number: phone,
        date_of_birth: dob,
        gender: gender,
        blood_group: bloodGroup,
        address: address,
        avatar_url: avatarUrl
      };

      const res = await api.patch('/api/users/patients/', payload);
      const updatedProfile = res.data;

      // Update patient state locally
      setPatientProfile(updatedProfile);
      
      // Update global auth store user object
      if (updatedProfile.user) {
        setUser(updatedProfile.user);
      }

      // Update parent component state
      if (onUpdate) {
        onUpdate(updatedProfile);
      }

      setIsEditing(false);
      setShowAvatarInput(false);
    } catch (err) {
      console.error("Failed to save patient profile", err);
      setError(err?.response?.data?.error || "Failed to update profile. Please check the values and try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError(null);
    setShowAvatarInput(false);
    // Revert form state values
    if (patientProfile) {
      setFullName(patientProfile.full_name || user?.full_name || '');
      setEmail(patientProfile.email || user?.email || '');
      setPhone(patientProfile.mobile_number || '');
      setDob(patientProfile.date_of_birth || '');
      setGender(patientProfile.gender || 'other');
      setBloodGroup(patientProfile.blood_group || '');
      setAddress(patientProfile.address || '');
      setAvatarUrl(patientProfile.user?.avatar_url || user?.avatar_url || '');
    }
  };

  const currentFullName = patientProfile?.full_name || user?.full_name || 'N/A';
  const currentEmail = patientProfile?.email || user?.email || 'N/A';
  const patientId = patientProfile?.patient_id || 'N/A';
  const currentBloodGroup = patientProfile?.blood_group || 'N/A';
  const currentPhone = patientProfile?.mobile_number || 'N/A';
  const currentAddress = patientProfile?.address || 'N/A';
  const currentDob = patientProfile?.date_of_birth || '';
  const currentGender = patientProfile?.gender || 'N/A';
  const currentAge = currentDob ? calculateAge(currentDob) : '28';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center text-slate-700">
          <div className="flex items-center gap-2">
            <User className="text-blue-600" size={20} />
            <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">
              {isEditing ? 'Edit Profile Details' : 'Patient Profile Details'}
            </span>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 hover:bg-slate-200 rounded-full transition-colors focus:outline-none"
            disabled={saving}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto text-slate-700">
          {loadingProfile ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          ) : (
            <form onSubmit={handleSave}>
              {/* Cover Photo Gradient Banner */}
              <div className="w-full h-24 bg-gradient-to-r from-blue-600 to-indigo-700 relative"></div>
              
              {/* Avatar and Basic Info */}
              <div className="relative px-6 sm:px-8 pb-4 border-b border-slate-100">
                <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4">
                  {/* Circular Avatar */}
                  <div className="h-20 w-20 rounded-full bg-blue-600 border-4 border-white text-white flex items-center justify-center font-bold text-3xl shadow-md shrink-0 overflow-hidden relative z-10 -mt-10">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      currentFullName.charAt(0)
                    )}
                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => setShowAvatarInput(!showAvatarInput)}
                        className="absolute inset-0 bg-black/40 flex items-center justify-center text-white opacity-0 hover:opacity-100 transition-opacity"
                      >
                        <Camera size={20} />
                      </button>
                    )}
                  </div>
                  
                  <div className="text-center sm:text-left space-y-1 pb-1 flex-1">
                    <h4 className="text-lg font-black text-navy">{currentFullName}</h4>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 text-[10px] font-bold">
                        <Fingerprint size={10} /> ID: {patientId}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold">
                        Active Member
                      </span>
                    </div>
                  </div>

                  {!isEditing && (
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-1.5 px-4 py-2 border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-bold transition-all"
                    >
                      <Edit2 size={13} /> Edit Profile
                    </button>
                  )}
                </div>

                {/* Avatar URL / Gallery / Preset selector (Edit Mode only) */}
                {isEditing && showAvatarInput && (
                  <div className="mt-4 p-4 bg-slate-50 border border-slate-150 rounded-2xl space-y-4 animate-in slide-in-from-top-2 duration-200">
                    
                    {/* Predefined Avatars */}
                    <div className="space-y-2">
                      <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Predefined Avatars</label>
                      <div className="flex flex-wrap gap-2.5">
                        {PRESET_AVATARS.map((preset, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setAvatarUrl(preset.url)}
                            className={`w-10 h-10 rounded-full border-2 overflow-hidden transition-all hover:scale-110 active:scale-95 ${
                              avatarUrl === preset.url ? 'border-blue-600 ring-2 ring-blue-100 scale-105' : 'border-slate-200 hover:border-slate-350'
                            }`}
                          >
                            <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-150">
                      {/* Upload from Gallery */}
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Upload from Gallery</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                          id="avatar-file-upload"
                        />
                        <label
                          htmlFor="avatar-file-upload"
                          className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm text-center"
                        >
                          <Camera size={13} className="text-blue-500" />
                          Choose Image File
                        </label>
                      </div>

                      {/* Custom Image URL */}
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Custom Image URL</label>
                        <input
                          type="text"
                          value={avatarUrl.startsWith('data:') ? '' : avatarUrl}
                          onChange={(e) => setAvatarUrl(e.target.value)}
                          placeholder="Paste image web link here..."
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>

                  </div>
                )}
              </div>

              {/* Error Alert */}
              {error && (
                <div className="m-6 p-3 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl text-xs font-medium">
                  {error}
                </div>
              )}

              {/* Details Grid / Fields Form */}
              <div className="p-6 bg-slate-50/50">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  {isEditing ? (
                    <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-sm space-y-1.5">
                      <label className="block text-[9px] uppercase tracking-wider font-extrabold text-slate-400">Full Name</label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none text-slate-800 font-medium"
                      />
                    </div>
                  ) : (
                    <ModalInfoCard 
                      icon={User} 
                      iconColor="text-blue-500 bg-blue-50 border-blue-100"
                      label="Full Name" 
                      value={currentFullName} 
                    />
                  )}

                  {/* Patient ID (Read-only) */}
                  <ModalInfoCard 
                    icon={Fingerprint} 
                    iconColor="text-indigo-500 bg-indigo-50 border-indigo-100"
                    label="Patient ID / UHID" 
                    value={patientId} 
                  />

                  {/* Age & Gender */}
                  {isEditing ? (
                    <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-sm space-y-1.5">
                      <label className="block text-[9px] uppercase tracking-wider font-extrabold text-slate-400">Gender</label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none text-slate-800 font-medium bg-white"
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  ) : (
                    <ModalInfoCard 
                      icon={HeartHandshake} 
                      iconColor="text-emerald-500 bg-emerald-50 border-emerald-100"
                      label="Age & Gender" 
                      value={`${currentAge} years • ${currentGender.charAt(0).toUpperCase() + currentGender.slice(1)}`} 
                    />
                  )}

                  {/* Date of Birth */}
                  {isEditing ? (
                    <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-sm space-y-1.5">
                      <label className="block text-[9px] uppercase tracking-wider font-extrabold text-slate-400">Date of Birth</label>
                      <input
                        type="date"
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none text-slate-800 font-medium"
                      />
                    </div>
                  ) : (
                    <ModalInfoCard 
                      icon={CalendarDays} 
                      iconColor="text-amber-500 bg-amber-50 border-amber-100"
                      label="Date of Birth" 
                      value={formatDate(currentDob)} 
                    />
                  )}

                  {/* Blood Group */}
                  {isEditing ? (
                    <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-sm space-y-1.5">
                      <label className="block text-[9px] uppercase tracking-wider font-extrabold text-slate-400">Blood Group</label>
                      <select
                        value={bloodGroup}
                        onChange={(e) => setBloodGroup(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none text-slate-800 font-medium bg-white"
                      >
                        <option value="">Select Blood Group</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                      </select>
                    </div>
                  ) : (
                    <ModalInfoCard 
                      icon={Droplets} 
                      iconColor="text-red-500 bg-red-50 border-red-100"
                      label="Blood Group" 
                      value={currentBloodGroup} 
                    />
                  )}

                  {/* Phone Number */}
                  {isEditing ? (
                    <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-sm space-y-1.5">
                      <label className="block text-[9px] uppercase tracking-wider font-extrabold text-slate-400">Phone Number</label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none text-slate-800 font-medium"
                      />
                    </div>
                  ) : (
                    <ModalInfoCard 
                      icon={Phone} 
                      iconColor="text-teal-500 bg-teal-50 border-teal-100"
                      label="Phone Number" 
                      value={currentPhone} 
                    />
                  )}

                  {/* Email Address */}
                  {isEditing ? (
                    <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-sm space-y-1.5 sm:col-span-2">
                      <label className="block text-[9px] uppercase tracking-wider font-extrabold text-slate-400">Email Address</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none text-slate-800 font-medium"
                      />
                    </div>
                  ) : (
                    <ModalInfoCard 
                      icon={Mail} 
                      iconColor="text-violet-500 bg-violet-50 border-violet-100"
                      label="Email Address" 
                      value={currentEmail} 
                    />
                  )}

                  {/* Address */}
                  {isEditing ? (
                    <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-sm space-y-1.5 sm:col-span-2">
                      <label className="block text-[9px] uppercase tracking-wider font-extrabold text-slate-400">Address</label>
                      <textarea
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none text-slate-800 font-medium resize-none"
                      />
                    </div>
                  ) : (
                    <ModalInfoCard 
                      icon={MapPin} 
                      iconColor="text-rose-500 bg-rose-50 border-rose-100"
                      label="Address" 
                      value={currentAddress} 
                      spanTwoCols
                    />
                  )}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                {isEditing ? (
                  <>
                    <button
                      type="button"
                      onClick={handleCancel}
                      disabled={saving}
                      className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl font-bold text-xs transition-all active:scale-95 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-100 transition-all active:scale-95 disabled:opacity-50"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                        </>
                      ) : (
                        <>
                          <Save size={13} /> Save Changes
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <button 
                    type="button"
                    onClick={onClose}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md transition-all active:scale-95"
                  >
                    Close Profile
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

const ModalInfoCard = ({ icon: Icon, iconColor, label, value, spanTwoCols }) => {
  return (
    <div className={`bg-white p-4 rounded-xl border border-gray-150 shadow-sm flex items-start gap-3.5 ${spanTwoCols ? 'sm:col-span-2' : ''}`}>
      <div className={`p-2.5 rounded-lg border flex items-center justify-center shrink-0 ${iconColor}`}>
        <Icon size={16} />
      </div>
      <div className="space-y-0.5">
        <p className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400">{label}</p>
        <p className="text-xs font-bold text-slate-800 leading-snug">{value || 'N/A'}</p>
      </div>
    </div>
  );
};

export default EditableProfileModal;
