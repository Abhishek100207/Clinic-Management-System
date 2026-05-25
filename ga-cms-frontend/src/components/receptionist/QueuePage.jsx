import React, { useState, useEffect, useRef } from 'react';
import { 
  ListOrdered, Search, Filter, Clock, User, AlertTriangle, 
  Play, CheckCircle, Volume2, Maximize2, Minimize2, Plus, 
  RefreshCw, X, ChevronRight, Check, AlertCircle, HelpCircle, Calendar
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { queueStorage } from '../../utils/queueStorage';
import api from '../../api/axios';
import { Badge } from '../shared/Badge';
import SearchableSelect from '../common/SearchableSelect';

const QueuePage = () => {
  const { user } = useAuthStore();
  const [queue, setQueue] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [confirmedToday, setConfirmedToday] = useState([]); // Today's confirmed appts not yet checked-in
  
  // View states
  const [isTvMode, setIsTvMode] = useState(false);
  const [showAttachedTv, setShowAttachedTv] = useState(false);
  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Receptionist check-in form state
  const [checkInForm, setCheckInForm] = useState({
    patientId: '',
    doctorId: '',
    type: 'walkin'
  });
  
  // Delay input state
  const [activeDelayToken, setActiveDelayToken] = useState(null);
  const [delayMinutes, setDelayMinutes] = useState(15);
  
  // Voice synthesis toggle on TV
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  
  // TV last serving token track (to flash on change)
  const [lastActiveToken, setLastActiveToken] = useState(null);
  const [flashActiveCard, setFlashActiveCard] = useState(false);

  // Load initial queue data
  const refreshQueue = async () => {
    const data = await queueStorage.getQueue();
    setQueue(data);
    
    // Check if new token was called (status === 'active') to trigger flash on TV mode
    const currentActive = data.find(item => item.status === 'active');
    if (currentActive && currentActive.token !== lastActiveToken) {
      setLastActiveToken(currentActive.token);
      setFlashActiveCard(true);
      const timer = setTimeout(() => setFlashActiveCard(false), 5000);
      return () => clearTimeout(timer);
    }
  };

  // Fetch today's confirmed (paid/scheduled) appointments not yet in queue
  const fetchConfirmedToday = async () => {
    try {
      const res = await api.get('/api/appointments/appointments/');
      const today = new Date();
      const confirmed = res.data.filter(item => {
        if (!item.date) return false;
        const [year, month, day] = item.date.split('-').map(Number);
        const d = new Date(year, month - 1, day);
        const isToday = d.getDate() === today.getDate() &&
                        d.getMonth() === today.getMonth() &&
                        d.getFullYear() === today.getFullYear();
        // Show confirmed appointments that haven't been given a token yet, and exclude virtual meetings (they don't physically check-in)
        return isToday && item.status === 'confirmed' && !item.queue_token && item.appointment_type !== 'virtual';
      });
      setConfirmedToday(confirmed);
    } catch (err) {
      console.error('Failed to fetch confirmed appointments:', err);
    }
  };

  useEffect(() => {
    refreshQueue();
    fetchConfirmedToday();
    
    // Periodically sync from localStorage to simulate real-time updates
    const interval = setInterval(() => {
      refreshQueue();
      fetchConfirmedToday();
    }, 3000);
    
    // Listen to storage events from other tabs/dashboards
    window.addEventListener('storage', () => {
      refreshQueue();
      fetchConfirmedToday();
    });
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', refreshQueue);
    };
  }, [lastActiveToken]);

  // Load patients and doctors for Receptionist check-in dropdowns
  useEffect(() => {
    if (user?.role === 'receptionist' || user?.role === 'senior_doctor') {
      const loadOptions = async () => {
        try {
          const [patientRes, doctorRes] = await Promise.all([
            api.get('/api/users/patients/'),
            api.get('/api/users/doctors/')
          ]);
          const patientsArray = Array.isArray(patientRes?.data) ? patientRes.data : (patientRes?.data?.results ?? []);
          const doctorsArray = Array.isArray(doctorRes?.data) ? doctorRes.data : (doctorRes?.data?.results ?? []);
          setPatients(patientsArray);
          setDoctors(doctorsArray);
          
          if (doctorsArray.length > 0) {
            setCheckInForm(prev => ({
              ...prev,
              doctorId: doctorsArray[0].id.toString()
            }));
          }
        } catch (e) {
          console.error("Failed to load options for check-in form", e);
        }
      };
      loadOptions();
    }
  }, [user]);

  // Handle patient check-in
  const handleCheckIn = async (e) => {
    e.preventDefault();
    if (!checkInForm.patientId) {
      alert("Please select a patient.");
      return;
    }
    
    const selectedPatient = patients.find(p => p.id.toString() === checkInForm.patientId.toString());
    const selectedDoc = doctors.find(d => d.id.toString() === checkInForm.doctorId.toString());
    
    if (!selectedPatient) return;
    
    const checkInData = {
      patientId: selectedPatient.id,
      patientName: selectedPatient.user?.full_name || selectedPatient.user?.first_name || 'Patient',
      doctorId: selectedDoc ? selectedDoc.id : '1',
      doctorName: selectedDoc ? `Dr. ${selectedDoc.user?.full_name || selectedDoc.user?.first_name}` : 'Dr. Sarah Johnson',
      type: checkInForm.type
    };
    
    const newItem = await queueStorage.checkInPatient(checkInData);
    if (newItem) {
      setCheckInForm(prev => ({ ...prev, patientId: '' }));
      refreshQueue();
    }
  };

  // Check-in a confirmed (pre-booked) appointment directly into the queue
  const handleCheckInConfirmed = async (appointmentId, patientName) => {
    try {
      await api.patch(`/api/appointments/appointments/${appointmentId}/`, {
        status: 'checked_in',
        queue_type: 'scheduled'
      });
      refreshQueue();
      fetchConfirmedToday();
    } catch (err) {
      console.error('Failed to check-in confirmed appointment:', err);
      alert('Failed to check-in. Please try again.');
    }
  };

  // Queue actions
  const handleCall = async (token) => {
    await queueStorage.updatePatientStatus(token, 'active');
    refreshQueue();
  };

  const handleComplete = async (token) => {
    await queueStorage.updatePatientStatus(token, 'completed');
    refreshQueue();
  };

  const handleMissed = async (token) => {
    await queueStorage.updatePatientStatus(token, 'missed');
    refreshQueue();
  };

  const handleToggleEmergency = async (token, currentIsEmergency) => {
    await queueStorage.setEmergency(token, !currentIsEmergency);
    refreshQueue();
  };

  const handleSetDelay = async (token) => {
    await queueStorage.setDelay(token, delayMinutes);
    setActiveDelayToken(null);
    refreshQueue();
  };

  const handleReschedule = async (token) => {
    // Put back to queue
    await queueStorage.rescheduleMissed(token);
    refreshQueue();
  };

  // Filter queues
  const filteredQueue = queue.filter(item => {
    const matchesSearch = item.patientName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.token.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDoctor = selectedDoctorFilter === 'all' || item.doctorId?.toString() === selectedDoctorFilter.toString();
    return matchesSearch && matchesDoctor;
  });

  const activeWaitingList = filteredQueue.filter(item => ['waiting', 'active', 'delayed'].includes(item.status));
  const completedMissedList = filteredQueue.filter(item => ['completed', 'missed'].includes(item.status));

  // Speech Announcement Trigger
  const announceCurrent = (item) => {
    queueStorage.triggerVoiceCall(item);
  };

  // Render Waiting Room TV view
  if (isTvMode) {
    // Get all consulting (active) patients
    const activeConsultations = queue.filter(item => item.status === 'active');
    // Get upcoming waiting patients (excluding completed/missed/active)
    const upcomingQueue = queue.filter(item => ['waiting', 'delayed'].includes(item.status))
      .sort((a, b) => a.priority - b.priority || new Date(a.checkInTime) - new Date(b.checkInTime));

    return (
      <div className="fixed inset-0 z-50 bg-slate-950 text-slate-100 flex flex-col h-screen w-screen overflow-hidden p-6 md:p-8 font-sans select-none animate-in fade-in duration-300">
        
        {/* TV Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-5 mb-6 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center font-bold text-2xl shadow-lg shadow-blue-500/20 text-white">GA</div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
                GA CLINIC PATIENT CALL BOARD
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></span>
              </h1>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Live Waiting Room Screen</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className={`p-3 rounded-xl border transition-all ${
                voiceEnabled 
                  ? 'border-blue-500/30 bg-blue-600/20 text-blue-400' 
                  : 'border-slate-800 bg-slate-900 text-slate-500'
              }`}
              title="Toggle Voice Announcements"
            >
              <Volume2 size={20} />
            </button>
            <button 
              onClick={() => setIsTvMode(false)}
              className="p-3 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-xl transition-colors flex items-center gap-2 text-sm font-bold"
            >
              <Minimize2 size={16} /> Exit TV Mode
            </button>
          </div>
        </div>

        {/* TV Main Grid */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 overflow-hidden min-h-0">
          
          {/* NOW SERVING (Left 7/12) */}
          <div className="lg:col-span-7 flex flex-col gap-6 h-full overflow-hidden">
            <h2 className="text-sm font-bold uppercase tracking-widest text-blue-400">Now Consulting</h2>
            
            {activeConsultations.length > 0 ? (
              <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-1">
                {activeConsultations.map((item, idx) => (
                  <div 
                    key={item.token}
                    className={`flex-1 rounded-3xl border p-8 flex flex-col justify-between transition-all duration-500 ${
                      idx === 0 && flashActiveCard
                        ? 'bg-blue-600/25 border-blue-500 shadow-2xl shadow-blue-500/10 scale-[1.01] animate-pulse'
                        : 'bg-slate-900/60 border-slate-800/80 backdrop-blur-md shadow-xl'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="text-xl font-bold uppercase tracking-widest px-4 py-1.5 bg-emerald-500/15 border border-emerald-500/30 rounded-full text-emerald-400 animate-pulse">
                          Now Serving
                        </span>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => announceCurrent(item)}
                            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700"
                            title="Re-announce Voice"
                          >
                            <Volume2 size={16} />
                          </button>
                          <span className="text-slate-500 text-sm font-mono">{item.doctorRoom}</span>
                        </div>
                      </div>
                      
                      <div className="mt-8 text-center">
                        <div className="text-[120px] font-black leading-none font-mono text-blue-500 drop-shadow-md select-text">
                          {item.token}
                        </div>
                        <h3 className="text-4xl font-extrabold mt-6 text-white leading-tight">
                          {item.patientName}
                        </h3>
                      </div>
                    </div>
                    
                    <div className="border-t border-slate-800 pt-6 mt-8 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Assigned Doctor</p>
                        <p className="text-xl font-extrabold text-slate-200 mt-1">{item.doctorName}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Room</p>
                        <p className="text-xl font-black text-blue-400 mt-1 font-mono">{item.doctorRoom}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 bg-slate-900/40 border border-slate-800/60 backdrop-blur-sm rounded-3xl p-12 flex flex-col items-center justify-center text-center">
                <Clock className="text-slate-700 mb-4 animate-spin-slow" size={64} />
                <p className="text-2xl font-bold text-slate-400">All Consultations Cleared</p>
                <p className="text-sm text-slate-500 mt-2">Doctors are currently awaiting check-ins or paperwork.</p>
              </div>
            )}
          </div>

          {/* UPCOMING TOKENS (Right 5/12) */}
          <div className="lg:col-span-5 flex flex-col gap-6 h-full overflow-hidden">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center justify-between">
              <span>Waiting Queue</span>
              <span className="text-xs bg-slate-800 px-3 py-1 rounded-full text-slate-300 font-mono">
                {upcomingQueue.length} Patient{upcomingQueue.length !== 1 && 's'}
              </span>
            </h2>
            
            <div className="flex-1 bg-slate-900/40 border border-slate-800/60 backdrop-blur-sm rounded-3xl p-6 overflow-hidden flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto space-y-3.5 pr-2 custom-scrollbar">
                {upcomingQueue.length > 0 ? (
                  upcomingQueue.map((item, idx) => (
                    <div 
                      key={item.token}
                      className={`p-4.5 rounded-2xl border transition-all flex items-center justify-between ${
                        item.priority === 1 
                          ? 'bg-rose-950/20 border-rose-900/40' 
                          : item.status === 'delayed'
                            ? 'bg-amber-950/20 border-amber-900/40'
                            : 'bg-slate-900/80 border-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`text-2xl font-black font-mono tracking-tight ${
                          item.priority === 1 ? 'text-rose-400' : 'text-blue-400'
                        }`}>
                          {item.token}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-slate-200 text-sm">
                              {item.patientName.replace(/^(.).*?\s+(.).*$/, '$1*** $2***')} {/* anonymized */}
                            </p>
                            {item.priority === 1 && (
                              <span className="text-[9px] bg-rose-500/20 border border-rose-500/40 text-rose-400 px-1.5 py-0.5 rounded font-black uppercase">EMERGENCY</span>
                            )}
                            {item.status === 'delayed' && (
                              <span className="text-[9px] bg-amber-500/20 border border-amber-500/40 text-amber-400 px-1.5 py-0.5 rounded font-black uppercase">DELAYED</span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1">{item.doctorName} • {item.doctorRoom}</p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Est. Wait</p>
                        <p className="text-sm font-bold font-mono text-slate-300 mt-0.5">
                          {item.priority === 1 ? '5m' : `${(idx + 1) * 15 + item.delayOffset}m`}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 py-12">
                    <CheckCircle className="text-slate-700 mb-2" size={42} />
                    <p className="font-bold text-slate-400">Queue is Clear</p>
                    <p className="text-xs text-slate-500 mt-1">No pending patients in line.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Ticker scrolling footer */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl py-3.5 px-6 mt-6 shrink-0 overflow-hidden relative flex items-center gap-4">
          <span className="text-xs font-black uppercase tracking-widest text-rose-500 bg-rose-500/10 border border-rose-500/20 px-3 py-1 rounded shrink-0">ANNOUNCEMENT</span>
          <div className="flex-1 overflow-hidden relative w-full">
            <div className="animate-marquee whitespace-nowrap text-slate-300 font-medium text-sm flex gap-12">
              <span>🚨 Please check your token number and report to your doctor's desk.</span>
              <span>ℹ️ Emergency patients are attended to immediately; queue priority might shift automatically.</span>
              <span>💵 Token generations are mapped directly to check-in invoice payments.</span>
              <span>🏥 Thank you for cooperation. Stay safe!</span>
            </div>
          </div>
        </div>
        
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes marquee {
            0% { transform: translateX(100%); }
            100% { transform: translateX(-100%); }
          }
          .animate-marquee {
            animation: marquee 25s linear infinite;
            display: inline-block;
          }
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #1e293b;
            border-radius: 99px;
          }
        `}} />
      </div>
    );
  }

  // ----------------------------------------------------
  // Dynamic Views based on User Role
  // ----------------------------------------------------

  // A. PATIENT QUEUE VIEWPORT
  const renderPatientView = () => {
    const patientQueueItems = queue.filter(item => item.patientId?.toString() === user?.id?.toString());
    const activeToken = patientQueueItems.find(item => ['waiting', 'active', 'delayed'].includes(item.status));
    
    // Calculate stats
    const queueListForDoc = activeToken 
      ? queue.filter(item => item.doctorId === activeToken.doctorId && ['waiting', 'active', 'delayed'].includes(item.status))
          .sort((a, b) => a.priority - b.priority || new Date(a.checkInTime) - new Date(b.checkInTime))
      : [];
      
    const position = activeToken 
      ? queueListForDoc.findIndex(item => item.token === activeToken.token) + 1
      : 0;

    const waitEst = activeToken 
      ? activeToken.status === 'active' 
        ? 0 
        : (position * 15) + activeToken.delayOffset
      : 0;

    return (
      <div className="space-y-8">
        
        {/* Token summary header */}
        {activeToken ? (
          <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
            <div className="absolute -right-12 -bottom-12 opacity-10">
              <ListOrdered size={240} />
            </div>
            
            <div className="relative z-10 flex-1 space-y-4">
              <div>
                <span className="text-[10px] uppercase tracking-widest font-black bg-white/20 px-3.5 py-1.5 rounded-full border border-white/10">Active Queue Status</span>
              </div>
              <h2 className="text-3xl font-extrabold leading-tight">
                {activeToken.status === 'active' 
                  ? "It's your turn! Please enter the room." 
                  : "You are checked in. Please wait in the lounge."}
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pt-4 max-w-lg">
                <div>
                  <p className="text-xs text-blue-100/70 font-semibold uppercase tracking-wider">Assigned Doctor</p>
                  <p className="text-lg font-bold">{activeToken.doctorName}</p>
                </div>
                <div>
                  <p className="text-xs text-blue-100/70 font-semibold uppercase tracking-wider">Consulting Room</p>
                  <p className="text-lg font-black font-mono text-blue-300">{activeToken.doctorRoom}</p>
                </div>
                <div>
                  <p className="text-xs text-blue-100/70 font-semibold uppercase tracking-wider">Check-in Type</p>
                  <p className="text-lg font-bold capitalize">{activeToken.type}</p>
                </div>
              </div>
            </div>

            <div className="relative z-10 bg-white rounded-3xl p-6 text-slate-800 text-center w-full md:w-56 shrink-0 shadow-lg flex flex-col justify-between h-48 border border-white/20">
              <div>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider">Token Number</p>
                <div className="text-5xl font-black font-mono text-blue-600 mt-2">{activeToken.token}</div>
              </div>
              
              <div className="border-t border-slate-100 pt-4 flex justify-between text-xs font-bold">
                <div className="text-left">
                  <span className="block text-[9px] text-slate-400 uppercase leading-none">Position</span>
                  <span className="text-sm font-black text-navy">{activeToken.status === 'active' ? 'Serving' : `#${position}`}</span>
                </div>
                <div className="text-right">
                  <span className="block text-[9px] text-slate-400 uppercase leading-none">Wait Est.</span>
                  <span className="text-sm font-black text-emerald-600">{activeToken.status === 'active' ? 'Now' : `${waitEst} mins`}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-sm flex flex-col md:flex-row items-center gap-6">
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center shrink-0">
              <Calendar size={28} />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-navy">No Active Queue Token</h3>
              <p className="text-slate-500 text-sm mt-1">If you have scheduled an appointment today, please confirm check-in at the reception desk to obtain a token and wait-list status.</p>
            </div>
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-3 rounded-xl transition-all shadow-md shrink-0">
              Book Appointment
            </button>
          </div>
        )}

        {/* Active Clinic Queue (Read-Only) */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mt-8">
          <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-extrabold text-navy text-lg">Active Clinic Queue</h3>
              <p className="text-xs text-slate-500 mt-0.5">Real-time status of all patients waiting across the clinic</p>
            </div>
            
            <div className="flex gap-2">
              <SearchableSelect
                className="w-48"
                value={selectedDoctorFilter}
                onChange={(val) => setSelectedDoctorFilter(val)}
                options={[
                  { value: 'all', label: 'All Doctors' },
                  ...doctors.map(d => ({ value: d.id, label: `Dr. ${d.user?.full_name || d.user?.first_name}` }))
                ]}
              />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Token</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Patient ID/Name</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Assigned Doctor</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {activeWaitingList.length > 0 ? (
                  activeWaitingList.map(item => {
                    const isOwnToken = item.token === activeToken?.token;
                    return (
                      <tr key={item.token} className={`transition-colors ${
                        isOwnToken ? 'bg-blue-50/50' : 
                        item.priority === 1 ? 'bg-rose-50/30 hover:bg-rose-50/50' : 
                        'hover:bg-slate-50/30'
                      }`}>
                        <td className="px-6 py-4">
                          <span className={`font-mono font-bold px-2 py-1 rounded ${
                            isOwnToken ? 'bg-blue-600 text-white' : 
                            item.priority === 1 ? 'bg-rose-100 text-rose-700' : 
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {item.token}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                              <User size={14} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className={`text-sm font-bold ${isOwnToken ? 'text-blue-600' : 'text-slate-800'}`}>
                                  {isOwnToken ? item.patientName : item.patientName.replace(/^(.).*?\s+(.).*$/, '$1*** $2***')}
                                </p>
                                {item.priority === 1 && (
                                  <span className="text-[8px] font-black bg-rose-100 border border-rose-200 text-rose-700 px-1 rounded uppercase">EMERGENCY</span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-400">Checked in {new Date(item.checkInTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-semibold text-slate-700">{item.doctorName}</span>
                          <span className="block text-[10px] text-slate-400">{item.doctorRoom}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                            item.status === 'active' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                            item.status === 'delayed' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                            'bg-slate-100 border-slate-200 text-slate-600'
                          }`}>
                            {item.status} {item.status === 'delayed' && `(${item.delayOffset}m)`}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-slate-400 italic">
                      No active patients in clinic queue.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // B. DOCTOR QUEUE VIEWPORT
  const renderDoctorView = () => {
    const docName = user?.full_name || 'Dr. Sarah Johnson';
    const docQueue = queue.filter(item => 
      item.doctorId?.toString() === user?.id?.toString() || 
      item.doctorName?.toLowerCase().includes(docName?.toString().toLowerCase())
    );
    
    // Sort doctor queue: active first, then waiting (emergency highest priority), then delayed
    const sortedDocQueue = [...docQueue].filter(item => ['waiting', 'active', 'delayed'].includes(item.status))
      .sort((a, b) => {
        if (a.status === 'active') return -1;
        if (b.status === 'active') return 1;
        return a.priority - b.priority || new Date(a.checkInTime) - new Date(b.checkInTime);
      });
      
    const currentServing = sortedDocQueue.find(item => item.status === 'active');
    const waitingList = sortedDocQueue.filter(item => item.status !== 'active');
    
    const completedToday = docQueue.filter(item => item.status === 'completed');
    const missedToday = docQueue.filter(item => item.status === 'missed');

    return (
      <div className="space-y-8">
        
        {/* Doctor stats metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: 'Now serving', val: currentServing ? currentServing.token : 'None', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100' },
            { label: 'In Waiting Line', val: waitingList.length, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' },
            { label: 'Completed Consults', val: completedToday.length, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
            { label: 'Missed Calls', val: missedToday.length, color: 'text-rose-600', bg: 'bg-rose-50 border-rose-100' },
          ].map((card, i) => (
            <div key={i} className={`p-5 rounded-2xl border ${card.bg} shadow-sm`}>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{card.label}</p>
              <p className={`text-3xl font-black mt-2 font-mono ${card.color}`}>{card.val}</p>
            </div>
          ))}
        </div>

        {/* Serving Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-8">
            {/* Active patient consult */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-6">
              <h3 className="text-lg font-extrabold text-navy mb-4 flex items-center gap-2">
                <CheckCircle className="text-emerald-500" size={20} />
                Now in Room Consultation
              </h3>
              
              {currentServing ? (
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-black text-2xl font-mono shadow-md">
                      {currentServing.token}
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-navy">{currentServing.patientName}</h4>
                      <p className="text-xs text-slate-500">ID: {currentServing.patientId} • Check-in: {currentServing.type.toUpperCase()}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <button 
                      onClick={() => handleComplete(currentServing.token)}
                      className="flex-1 md:flex-none px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                    >
                      <Check size={16} /> Finalize Consult
                    </button>
                    <button 
                      onClick={() => handleMissed(currentServing.token)}
                      className="flex-1 md:flex-none px-4 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-rose-600 font-bold text-xs rounded-xl transition-all"
                    >
                      Patient Absent (Missed)
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border border-dashed border-slate-200 rounded-2xl p-12 text-center text-slate-400">
                  <Clock size={32} className="mx-auto mb-2 text-slate-300" />
                  <p className="font-bold">No Patient Currently in Consultation</p>
                  <p className="text-xs text-slate-400 mt-1">Select the next patient from your waiting line to call them in.</p>
                </div>
              )}
            </div>

            {/* Waiting line table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <h3 className="font-extrabold text-navy text-lg">Upcoming Waiting Patients</h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Token</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Patient Name</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Check-in Type</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {waitingList.length > 0 ? (
                      waitingList.map((item, idx) => (
                        <tr key={item.token} className="hover:bg-slate-50/30 transition-colors">
                          <td className="px-6 py-4">
                            <span className="font-mono font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded">
                              {item.token}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-bold text-navy">{item.patientName}</td>
                          <td className="px-6 py-4">
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${
                              item.priority === 1 ? 'bg-rose-100 text-rose-700' :
                              item.type === 'walkin' ? 'bg-blue-50 text-blue-700' :
                              'bg-slate-100 text-slate-600'
                            }`}>
                              {item.type}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                              item.status === 'delayed' ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-slate-100 border-slate-200 text-slate-600'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button 
                                onClick={() => handleCall(item.token)}
                                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white font-bold text-[10px] rounded-lg border border-blue-100 transition-all flex items-center gap-1 uppercase"
                              >
                                <Play size={10} /> Call to Room
                              </button>
                              <button 
                                onClick={() => handleMissed(item.token)}
                                className="px-3 py-1.5 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 font-bold text-[10px] rounded-lg border border-slate-200 hover:border-rose-100 transition-all uppercase"
                              >
                                Absent
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="px-6 py-12 text-center text-slate-400 italic">
                          No patients waiting in queue.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Missed queue pane */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
              <h4 className="font-extrabold text-navy mb-4 flex items-center gap-2">
                <AlertCircle className="text-rose-500" size={18} />
                Missed Appointments Today
              </h4>
              
              <div className="space-y-3">
                {missedToday.length > 0 ? (
                  missedToday.map(item => (
                    <div key={item.token} className="flex justify-between items-center p-3 border border-slate-100 rounded-xl bg-slate-50/50">
                      <div>
                        <p className="text-xs font-bold text-navy">{item.patientName}</p>
                        <p className="text-[10px] text-slate-400 font-mono">Token: {item.token}</p>
                      </div>
                      <button 
                        onClick={() => handleReschedule(item.token)}
                        className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold transition-all uppercase flex items-center gap-1 shadow-sm"
                      >
                        <RefreshCw size={10} /> Re-Queue
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic text-center py-6">No missed appointments.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // C. RECEPTIONIST CONTROL PANEL
  const renderReceptionistView = () => {
    return (
      <div className="space-y-8">
        {/* Walk-in patient check-in + filter grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Active Queue Table (Left 2/3) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Scheduled Today — Pending Check-in */}
            {confirmedToday.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-amber-200 flex items-center gap-2">
                  <Calendar size={18} className="text-amber-600" />
                  <div>
                    <h3 className="font-extrabold text-amber-900 text-sm">Scheduled Today — Pending Check-in</h3>
                    <p className="text-[10px] text-amber-700">These patients have a confirmed appointment for today but haven't been checked in yet.</p>
                  </div>
                  <span className="ml-auto text-[10px] font-black bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full">{confirmedToday.length} pending</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-amber-100/60">
                        <th className="px-5 py-3 text-[10px] font-bold text-amber-700 uppercase tracking-widest">Patient Name</th>
                        <th className="px-5 py-3 text-[10px] font-bold text-amber-700 uppercase tracking-widest">Assigned Doctor</th>
                        <th className="px-5 py-3 text-[10px] font-bold text-amber-700 uppercase tracking-widest">Appt Time</th>
                        <th className="px-5 py-3 text-[10px] font-bold text-amber-700 uppercase tracking-widest">Type</th>
                        <th className="px-5 py-3 text-[10px] font-bold text-amber-700 uppercase tracking-widest text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-100">
                      {confirmedToday.map(appt => (
                        <tr key={appt.id} className="hover:bg-amber-100/30 transition-colors">
                          <td className="px-5 py-3">
                            <span className="font-bold text-navy text-sm">{appt.patient_name}</span>
                          </td>
                          <td className="px-5 py-3 text-sm text-slate-700 font-medium">{appt.doctor_name || 'Dr. Arjun'}</td>
                          <td className="px-5 py-3">
                            <span className="font-mono text-xs text-slate-600 bg-white border border-amber-100 px-2 py-0.5 rounded">
                              {appt.time ? appt.time.slice(0, 5) : '—'}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <span className="text-[9px] font-black bg-blue-50 border border-blue-100 text-blue-700 px-1.5 py-0.5 rounded uppercase">
                              {appt.appointment_type === 'in_person' ? 'In-Person' : appt.appointment_type}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right">
                            <button
                              onClick={() => handleCheckInConfirmed(appt.id, appt.patient_name)}
                              className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] rounded-lg shadow-sm transition-all uppercase flex items-center gap-1 ml-auto"
                            >
                              <CheckCircle size={12} /> Check-In Now
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="font-extrabold text-navy text-lg">Active Clinic Queue</h3>
                  <p className="text-xs text-slate-400">Controls priority, delays, missed statuses, and calls</p>
                </div>
                
                <div className="flex gap-2">
                  <SearchableSelect
                    className="w-48"
                    value={selectedDoctorFilter}
                    onChange={(val) => setSelectedDoctorFilter(val)}
                    options={[
                      { value: 'all', label: 'All Doctors' },
                      ...doctors.map(d => ({ value: d.id, label: `Dr. ${d.user?.full_name || d.user?.first_name}` }))
                    ]}
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Token</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Patient Name</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Assigned Doctor</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {activeWaitingList.length > 0 ? (
                      activeWaitingList.map(item => (
                        <tr key={item.token} className={`hover:bg-slate-50/30 transition-colors ${
                          item.priority === 1 ? 'bg-rose-50/30' : ''
                        }`}>
                          <td className="px-6 py-4">
                            <span className={`font-mono font-bold px-2 py-1 rounded ${
                              item.priority === 1 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {item.token}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-navy">{item.patientName}</span>
                              {item.priority === 1 && (
                                <span className="text-[8px] font-black bg-rose-100 border border-rose-200 text-rose-700 px-1 rounded uppercase">EMERGENCY</span>
                              )}
                              {item.type === 'walkin' && (
                                <span className="text-[8px] font-black bg-blue-50 border border-blue-100 text-blue-700 px-1 rounded uppercase">WALK-IN</span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400">Checked in {new Date(item.checkInTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm font-semibold text-slate-700">{item.doctorName}</span>
                            <span className="block text-[10px] text-slate-400">{item.doctorRoom}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                              item.status === 'active' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                              item.status === 'delayed' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                              'bg-slate-100 border-slate-200 text-slate-600'
                            }`}>
                              {item.status} {item.status === 'delayed' && `(${item.delayOffset}m)`}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-1.5">
                              {item.status !== 'active' && (
                                <button 
                                  onClick={() => handleCall(item.token)}
                                  className="p-1.5 bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white rounded-lg border border-blue-100 transition-all"
                                  title="Call Patient (TTS announcement)"
                                >
                                  <Play size={12} />
                                </button>
                              )}
                              {item.status === 'active' && (
                                <button 
                                  onClick={() => handleComplete(item.token)}
                                  className="p-1.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white rounded-lg border border-emerald-100 transition-all"
                                  title="Finalize Consultation"
                                >
                                  <Check size={12} />
                                </button>
                              )}
                              <button 
                                onClick={() => handleToggleEmergency(item.token, item.priority === 1)}
                                className={`p-1.5 rounded-lg border transition-all ${
                                  item.priority === 1 
                                    ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100' 
                                    : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-rose-50 hover:text-rose-600'
                                }`}
                                title="Toggle Emergency Priority"
                              >
                                <AlertTriangle size={12} />
                              </button>
                              
                              <button 
                                onClick={() => {
                                  setActiveDelayToken(item.token);
                                  setDelayMinutes(15);
                                }}
                                className="p-1.5 bg-slate-50 border border-slate-200 text-slate-400 hover:bg-amber-50 hover:text-amber-600 rounded-lg transition-all"
                                title="Mark Patient Delayed"
                              >
                                <Clock size={12} />
                              </button>
                              
                              <button 
                                onClick={() => handleMissed(item.token)}
                                className="p-1.5 bg-slate-50 border border-slate-200 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-all"
                                title="Mark Missed (Absent)"
                              >
                                <X size={12} />
                              </button>
                            </div>
                            
                            {/* Delay input inline popover */}
                            {activeDelayToken === item.token && (
                              <div className="absolute right-6 mt-1 bg-white border border-slate-100 p-3 rounded-xl shadow-lg z-20 flex items-center gap-2 animate-in slide-in-from-top-2 duration-150">
                                <span className="text-[10px] font-bold text-slate-500 uppercase">Minutes:</span>
                                <input 
                                  type="number" 
                                  value={delayMinutes} 
                                  onChange={(e) => setDelayMinutes(e.target.value)} 
                                  className="w-16 border border-slate-200 px-2 py-1 rounded text-xs focus:outline-none"
                                />
                                <button 
                                  onClick={() => handleSetDelay(item.token)}
                                  className="px-2 py-1 bg-blue-600 text-white rounded text-[10px] font-bold"
                                >
                                  OK
                                </button>
                                <button 
                                  onClick={() => setActiveDelayToken(null)}
                                  className="p-1 text-slate-400 hover:text-slate-600"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="px-6 py-12 text-center text-slate-400 italic">
                          No active patients in queue.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Completed & Missed Queue History */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <h3 className="font-extrabold text-navy text-lg">Shift Logs (Completed & Missed)</h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Token</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Patient</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Doctor</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {completedMissedList.length > 0 ? (
                      completedMissedList.map(item => (
                        <tr key={item.token} className="hover:bg-slate-50/30 transition-colors">
                          <td className="px-6 py-4">
                            <span className="font-mono font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded">
                              {item.token}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-bold text-slate-700">{item.patientName}</td>
                          <td className="px-6 py-4 text-sm text-slate-600">{item.doctorName}</td>
                          <td className="px-6 py-4">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                              item.status === 'completed' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {item.status === 'missed' && (
                              <button 
                                onClick={() => handleReschedule(item.token)}
                                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white font-bold text-[10px] rounded-lg border border-blue-100 transition-all uppercase flex items-center gap-1 inline-flex"
                              >
                                <RefreshCw size={10} /> Re-Checkin
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="px-6 py-12 text-center text-slate-400 italic">
                          No history logged for this filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          {/* Walk-in check-in form (Right 1/3) */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
              <h3 className="font-extrabold text-navy text-lg mb-4 flex items-center gap-2">
                <Plus size={20} className="text-blue-500" />
                Register Walk-in Check-in
              </h3>
              
              <form onSubmit={handleCheckIn} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Select Registered Patient</label>
                  <SearchableSelect
                    className="w-full"
                    value={checkInForm.patientId}
                    onChange={(val) => setCheckInForm(prev => ({ ...prev, patientId: val }))}
                    options={patients.map(p => ({ value: p.id, label: `${p.user?.full_name || p.user?.first_name} (ID: ${p.patient_id})` }))}
                    placeholder="-- Choose Patient --"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Select Doctor Room</label>
                  <SearchableSelect
                    className="w-full"
                    value={checkInForm.doctorId}
                    onChange={(val) => setCheckInForm(prev => ({ ...prev, doctorId: val }))}
                    options={doctors.map(d => ({ value: d.id, label: `Dr. ${d.user?.full_name || d.user?.first_name} (${d.specialty || 'General'})` }))}
                    placeholder="-- Select Doctor --"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Check-in Priority</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { val: 'walkin', label: 'Walk-in' },
                      { val: 'scheduled', label: 'On Slot' },
                      { val: 'emergency', label: 'Emergency' }
                    ].map(typeOpt => (
                      <button
                        key={typeOpt.val}
                        type="button"
                        onClick={() => setCheckInForm(prev => ({ ...prev, type: typeOpt.val }))}
                        className={`py-2 px-1 text-center font-bold text-xs rounded-lg border transition-all ${
                          checkInForm.type === typeOpt.val
                            ? typeOpt.val === 'emergency' 
                              ? 'bg-rose-50 border-rose-200 text-rose-700 shadow-sm'
                              : 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm'
                            : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        {typeOpt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-100 transition-all text-xs flex items-center justify-center gap-2 mt-6"
                >
                  <Plus size={16} /> Generate Check-in Token
                </button>
              </form>
            </div>

            {/* Launch TV Button & Embedded Attached Window */}
            <div className="space-y-4">
              <button 
                onClick={() => setShowAttachedTv(prev => !prev)}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2 shadow-md"
              >
                <Maximize2 size={14} /> 📺 Launch TV Screen
              </button>

              {showAttachedTv && (
                <div className="bg-white rounded-3xl border border-slate-100 p-5 text-slate-800 overflow-hidden flex flex-col gap-5 animate-in fade-in slide-in-from-top-4 duration-300 shadow-md relative">
                  
                  {/* Header containing Title, Subtitle and Top Right Actions */}
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-pulse"></span>
                        <h4 className="text-xs font-extrabold tracking-widest uppercase text-navy">Waiting Room Display</h4>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 font-semibold uppercase tracking-wider">Attached Live Preview Console</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setVoiceEnabled(prev => !prev)}
                        className={`p-2.5 rounded-full transition-all flex items-center justify-center border ${
                          voiceEnabled 
                            ? 'bg-blue-50 border-blue-200 text-blue-600 shadow-sm' 
                            : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100 hover:text-slate-650'
                        }`}
                        title="Toggle Voice"
                      >
                        <Volume2 size={16} />
                      </button>
                      <button 
                        onClick={() => setIsTvMode(true)}
                        className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-700 rounded-full transition-all flex items-center justify-center shadow-sm"
                        title="Open Full Screen TV Mode"
                      >
                        <Maximize2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Active Consultations */}
                  <div className="space-y-3.5">
                    <h5 className="text-[10px] font-bold uppercase tracking-widest text-blue-600">Now Consulting</h5>
                    {queue.filter(item => item.status === 'active').length > 0 ? (
                      <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                        {queue.filter(item => item.status === 'active').map((item, idx) => (
                          <div 
                            key={item.token}
                            className={`rounded-2xl border p-4 flex flex-col gap-3 transition-all duration-500 ${
                              idx === 0 && flashActiveCard
                                ? 'bg-blue-50/80 border-blue-300 shadow-md shadow-blue-100/50 animate-pulse'
                                : 'bg-slate-50/70 border-slate-100 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-mono font-black text-blue-650 px-3 py-1 bg-blue-50 border border-blue-100 rounded-xl">
                                {item.token}
                              </span>
                              <span className="text-xs text-slate-500 font-extrabold tracking-wider uppercase">{item.doctorRoom}</span>
                            </div>
                            <div className="flex justify-between items-end">
                              <div>
                                <p className="font-extrabold text-lg text-navy leading-none">{item.patientName}</p>
                                <p className="text-xs text-slate-500 mt-1.5 font-medium">{item.doctorName}</p>
                              </div>
                              <button 
                                onClick={() => announceCurrent(item)}
                                className="p-2.5 bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-750 rounded-full border border-slate-200 transition-all flex items-center justify-center shadow-sm"
                                title="Re-announce voice call"
                              >
                                <Volume2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-6 text-center">
                        <Clock className="text-slate-350 mx-auto mb-2 animate-spin-slow" size={24} />
                        <p className="text-xs font-bold text-slate-500">All Consultations Cleared</p>
                        <p className="text-[10px] text-slate-400 mt-1">Awaiting doctor calls.</p>
                      </div>
                    )}
                  </div>

                  {/* Waiting Queue */}
                  <div className="space-y-3.5">
                    <h5 className="text-[10px] font-bold uppercase tracking-widest text-slate-450">Waiting Queue</h5>
                    <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                      {queue.filter(item => ['waiting', 'delayed'].includes(item.status)).length > 0 ? (
                        queue.filter(item => ['waiting', 'delayed'].includes(item.status))
                          .sort((a, b) => a.priority - b.priority || new Date(a.checkInTime) - new Date(b.checkInTime))
                          .map((item, idx) => (
                            <div 
                              key={item.token}
                              className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                                item.priority === 1 
                                  ? 'bg-rose-50/60 border-rose-100 text-rose-700' 
                                  : item.status === 'delayed'
                                    ? 'bg-amber-50/60 border-amber-100 text-amber-700'
                                    : 'bg-slate-50/40 border-slate-100 text-slate-700 hover:bg-slate-50/80'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <span className={`font-mono font-black text-sm w-14 text-left ${item.priority === 1 ? 'text-rose-600' : 'text-blue-600'}`}>
                                  {item.token}
                                </span>
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <p className="font-bold text-navy text-sm leading-none">{item.patientName}</p>
                                    {item.priority === 1 && (
                                      <span className="text-[8px] bg-rose-100 border border-rose-200 text-rose-700 px-1.5 py-0.5 rounded font-black uppercase">EMG</span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-slate-500 mt-1 font-medium">{item.doctorName} • {item.doctorRoom}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-[10px] font-mono text-slate-500 font-bold">{(idx + 1) * 15 + item.delayOffset}m</p>
                              </div>
                            </div>
                          ))
                      ) : (
                        <div className="text-center text-slate-400 py-6 border border-dashed border-slate-200 rounded-2xl bg-slate-50/20">
                          <CheckCircle className="text-slate-300 mx-auto mb-2" size={24} />
                          <p className="text-xs font-bold text-slate-500">Queue is Clear</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Ticker scrolling footer */}
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 shrink-0 overflow-hidden relative flex items-center gap-3 mt-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg shrink-0">Ticker</span>
                    <div className="flex-1 overflow-hidden relative w-full h-5 flex items-center">
                      <div className="animate-marquee whitespace-nowrap text-slate-700 font-bold text-xs flex gap-8">
                        <span>🚨 Check token number and report to room.</span>
                        <span>ℹ️ Emergency patients are prioritized first.</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto w-full p-4 md:p-8 space-y-8 animate-fade-in select-none">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          animation: marquee 25s linear infinite;
          display: inline-block;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 99px;
        }
      `}} />
      
      {/* Universal Page Header - Hidden for receptionist so records cover the window */}
      {user?.role !== 'receptionist' && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-navy mb-2 flex items-center gap-2">
              <ListOrdered className="text-blue-600" size={36} />
              Live Clinic Queue
            </h1>
            <p className="text-slate-500 text-sm">Real-time status tracking, token allocations, and consultant wait times.</p>
          </div>
          
          {/* Launch TV Button visible to all staff except receptionist (who has it under walk-in check-in) */}
          {['doctor', 'senior_doctor'].includes(user?.role) && (
            <button 
              onClick={() => setIsTvMode(true)}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-5 py-3 rounded-xl border border-slate-800 transition-all shadow-md flex items-center gap-2"
            >
              <Maximize2 size={14} /> 📺 Launch TV Screen
            </button>
          )}
        </div>
      )}

      {/* Render appropriate layout */}
      {user?.role === 'patient' && renderPatientView()}
      {(user?.role === 'doctor' || user?.role === 'senior_doctor') && renderDoctorView()}
      {user?.role === 'receptionist' && renderReceptionistView()}
    </div>
  );
};

export default QueuePage;
