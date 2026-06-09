import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import { useAppointmentStore } from '../../store/appointmentStore';
import DoctorStats from './DoctorStats';
import AppointmentTable from './AppointmentTable';
import AvailabilityCalendar from './AvailabilityCalendar';
import EmergencyRescheduler from './EmergencyRescheduler';
import RescheduleModal from '../shared/appointments/RescheduleModal';
import ConsultationModal from './ConsultationModal';
import { Badge } from '../shared/Badge';
import { queueStorage } from '../../utils/queueStorage';
import { billingStorage } from '../../utils/billingStorage';
import { 
  Bell, 
  Settings, 
  AlertTriangle, 
  CheckCircle, 
  FileText, 
  ToggleLeft, 
  ToggleRight, 
  Plus,
  Search,
  Users,
  ChevronRight,
  Stethoscope,
  ListOrdered,
  Play,
  Check,
  Clock
} from 'lucide-react';
import api from '../../api/axios';
import { createConsultationNote, createPrescription, fetchDrugs, checkDrugInteractions } from '../../api/medicalRecords';
import ErrorBoundary from '../shared/ErrorBoundary';

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { 
    appointments, 
    stats, 
    fetchDoctorDashboardData, 
    updateAppointmentStatus,
    notificationsEnabled,
    toggleNotifications,
    emergencyReschedule
  } = useAppointmentStore();

  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [showMorningConfirmation, setShowMorningConfirmation] = useState(false);
  const [isConfirmedForToday, setIsConfirmedForToday] = useState(false);
  const [rescheduleData, setRescheduleData] = useState({ isOpen: false, appointment: null });
  const [consultationData, setConsultationData] = useState({ isOpen: false, appointment: null });

  const [patients, setPatients] = useState([]);
  const [patientSearch, setPatientSearch] = useState('');
  const [todayRevenue, setTodayRevenue] = useState(0);

  // Live Queue states & handlers
  const [queue, setQueue] = useState([]);

  const refreshQueue = async () => {
    const docName = user?.full_name || 'Dr. Sarah Johnson';
    const data = await queueStorage.getQueueForDoctor(docName);
    setQueue(data);

    try {
      const invoices = await billingStorage.getInvoices();
      const today = new Date();
      const todayRevenueVal = invoices
        .filter(inv => {
          if (!inv.dateGenerated) return false;
          const d = new Date(inv.dateGenerated);
          return d.getDate() === today.getDate() &&
                 d.getMonth() === today.getMonth() &&
                 d.getFullYear() === today.getFullYear() &&
                 inv.paymentStatus === 'PAID';
        })
        .reduce((sum, inv) => sum + inv.totalAmount, 0);
      setTodayRevenue(todayRevenueVal);
    } catch (err) {
      console.error("Failed to fetch doctor revenue:", err);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshQueue();
    // Storage sync
    window.addEventListener('storage', refreshQueue);
    // Periodical fallback polling
    const interval = setInterval(refreshQueue, 1000);
    return () => {
      window.removeEventListener('storage', refreshQueue);
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleCallPatient = async (token) => {
    setQueue(prev => prev.map(item => item.token === token ? { ...item, status: 'active' } : item));
    queueStorage.updatePatientStatus(token, 'active').then(() => refreshQueue());
  };

  const handleFinalizeConsult = async (token) => {
    setQueue(prev => prev.map(item => item.token === token ? { ...item, status: 'completed' } : item));
    queueStorage.updatePatientStatus(token, 'completed').then(() => refreshQueue());
  };

  const handleMissedPatient = async (token) => {
    setQueue(prev => prev.map(item => item.token === token ? { ...item, status: 'missed' } : item));
    queueStorage.updatePatientStatus(token, 'missed').then(() => refreshQueue());
  };

  useEffect(() => {
    fetchDoctorDashboardData();
    
    const fetchPatients = async () => {
      try {
        const res = await api.get('/api/users/patients/');
        const data = Array.isArray(res?.data) ? res.data : (res?.data?.results || []);
        setPatients(data);
      } catch (err) {
        console.error("Failed to fetch patients list:", err);
      }
    };
    fetchPatients();
    
    // Logic for morning confirmation: Show if it's before 11 AM and not yet confirmed
    const hour = new Date().getHours();
    if (hour < 11) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowMorningConfirmation(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConfirmSchedule = () => {
    setIsConfirmedForToday(true);
    setShowMorningConfirmation(false);
    // In a real app, this might send an API call to "activate" the day's schedule
  };

  const handleEmergencyConfirm = async (data) => {
    try {
      await emergencyReschedule(data);
      setIsEmergencyModalOpen(false);
      alert("Patients have been notified and appointments rescheduled.");
    } catch (err) { // eslint-disable-line no-unused-vars
      alert("Failed to reschedule. Please try again.");
    }
  };

  const handleRescheduleSubmit = async (data) => {
    try {
      await api.post(`/api/appointments/appointments/${rescheduleData.appointment.id}/reschedule/`, data);
      setRescheduleData({ isOpen: false, appointment: null });
      fetchDoctorDashboardData();
      alert("Appointment rescheduled successfully.");
    } catch (err) {
      alert("Failed to reschedule. " + (err.response?.data?.error || ""));
    }
  };

  const handleAction = (id, action) => { // eslint-disable-line no-unused-vars
    if (action === 'reschedule') {
      const appt = appointments.find(a => a.id === id);
      setRescheduleData({ isOpen: true, appointment: appt });
    } else if (action === 'consult') {
      const appt = appointments.find(a => a.id === id);
      setConsultationData({ isOpen: true, appointment: appt });
    } else {
      updateAppointmentStatus(id, action);
    }
  };

  const handleConsultationSave = async (data) => {
    try {
      const apptId = consultationData.appointment?.id;
      if (!apptId) {
        alert("Cannot save consultation without a valid appointment ID.");
        return;
      }
      
      await createConsultationNote({
        appointment: apptId,
        subjective: data.soap.subjective,
        objective: data.soap.objective,
        assessment: data.soap.assessment,
        plan: data.soap.plan,
      });

      let availableDrugs = [];
      try {
        availableDrugs = await fetchDrugs();
      } catch(e) { /* eslint-disable-line no-unused-vars */ }

      if (data.prescriptions && data.prescriptions.length > 0 && data.prescriptions[0].medication) {
        const meds = data.prescriptions.filter(p => p.medication).map(p => {
          const matchedDrug = availableDrugs.find(d => d.name.toLowerCase() === p.medication.toLowerCase());
          return {
            drug_id: matchedDrug ? matchedDrug.id : (availableDrugs.length > 0 ? availableDrugs[0].id : 1),
            dosage: p.dosage || 'Not specified',
            frequency: p.frequency || 'As directed',
            duration: p.duration || 'As directed',
            instructions: p.instructions || ''
          };
        });

        if (meds.length > 1) {
          try {
            const drugIds = meds.map(m => m.drug_id);
            const interactionRes = await checkDrugInteractions(drugIds);
            if (interactionRes.interactions && interactionRes.interactions.length > 0) {
              const proceed = window.confirm(`WARNING: Drug Interactions Detected:\n- ${interactionRes.interactions.join('\n- ')}\n\nDo you still want to prescribe these medications?`);
              if (!proceed) return;
            }
          } catch(e) { console.error("Interaction check failed", e); }
        }

        await createPrescription({
          appointment: apptId,
          medications: meds
        });
      }

      alert("Consultation finalized successfully!");
      setConsultationData({ isOpen: false, appointment: null });
    } catch (error) {
      console.error(error);
      const errorMsg = error.response?.data ? JSON.stringify(error.response.data) : error.message;
      alert(`Failed to save consultation: ${errorMsg}`);
    }
  };

  const activeWaitingQueue = queue.filter(item => ['waiting', 'active', 'delayed'].includes(item.status))
    .sort((a, b) => {
      if (a.status === 'active') return -1;
      if (b.status === 'active') return 1;
      return a.priority - b.priority || new Date(a.checkInTime) - new Date(b.checkInTime);
    });

  const currentServing = activeWaitingQueue.find(item => item.status === 'active');
  const waitingList = activeWaitingQueue.filter(item => item.status !== 'active');

  return (
    <ErrorBoundary>
      <div className="max-w-7xl mx-auto w-full p-4 md:p-8 space-y-8 animate-fade-in">
      
      {/* Morning Confirmation Banner */}
      {showMorningConfirmation && !isConfirmedForToday && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-xl">
              <CheckCircle size={28} />
            </div>
            <div>
              <h2 className="text-xl font-bold">Good Morning, Dr. {user?.full_name}!</h2>
              <p className="text-blue-100 opacity-90">Ready to start your day? Please confirm your availability for today's sessions.</p>
            </div>
          </div>
          <button 
            onClick={handleConfirmSchedule}
            className="bg-white text-blue-600 font-bold px-8 py-3 rounded-xl hover:bg-blue-50 transition-colors shadow-md whitespace-nowrap"
          >
            Confirm Daily Schedule
          </button>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-navy mb-2">Doctor Dashboard</h1>
          <div className="flex items-center gap-3">
            <Badge colorClass="bg-blue-100 text-blue-800">Senior Doctor</Badge>
            <span className="text-slate-400">•</span>
            <span className="text-sm font-medium text-slate-500">Last login: Today, 08:30 AM</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-gray-100 px-4 py-2 rounded-xl shadow-sm">
            <span className="text-sm font-bold text-slate-600">Auto-Notifications</span>
            <button onClick={toggleNotifications} className="text-blue-600 transition-colors">
              {notificationsEnabled ? <ToggleRight size={32} /> : <ToggleLeft size={32} className="text-slate-300" />}
            </button>
          </div>
          <button 
            onClick={() => setIsEmergencyModalOpen(true)}
            className="flex items-center gap-2 bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold px-4 py-2 rounded-xl border border-rose-100 transition-colors"
          >
            <AlertTriangle size={18} />
            Emergency
          </button>
        </div>
      </div>

      {/* Statistics */}
      <DoctorStats stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Live Queue Widget */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <ListOrdered size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-navy text-lg">Patient Call & Queue Control</h3>
                  <p className="text-xs text-slate-400">Manage real-time consulting calls and token announcements</p>
                </div>
              </div>
              
              <button 
                onClick={() => navigate('/queue')}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 transition-all flex items-center gap-1 group"
              >
                Full Queue Screen
                <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Active patient consult */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                  Now in Room Consultation
                </h4>

                {currentServing ? (
                  <div className="bg-gradient-to-r from-slate-50 to-blue-50/30 border border-blue-100/50 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-5 transition-all">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="min-w-[4.5rem] px-2 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-black text-xl font-mono shadow-md shadow-blue-500/10 shrink-0 whitespace-nowrap">
                        {currentServing.token}
                      </div>
                      <div className="overflow-hidden">
                        <h5 className="font-extrabold text-navy text-base leading-snug truncate">{currentServing.patientName}</h5>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          Check-in: <span className="capitalize">{currentServing.type}</span> • Status: <span className="font-bold text-blue-600 uppercase">{currentServing.status}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 w-full sm:w-auto mt-4 sm:mt-0 flex-wrap sm:flex-nowrap">
                      <button 
                        onClick={() => setConsultationData({ isOpen: true, appointment: { patient_name: currentServing.patientName, patient_id: currentServing.patientId, id: currentServing.id } })}
                        className="flex-1 sm:flex-none px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
                      >
                        <Stethoscope size={14} /> {localStorage.getItem(`op_draft_appt_${currentServing.id}`) ? 'Continue OP' : 'Take OP'}
                      </button>
                      <button 
                        onClick={() => handleFinalizeConsult(currentServing.token)}
                        className="flex-1 sm:flex-none px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-500/10 transition-all flex items-center justify-center gap-1.5"
                      >
                        <Check size={14} /> Finish
                      </button>
                      <button 
                        onClick={() => handleMissedPatient(currentServing.token)}
                        className="flex-1 sm:flex-none px-4 py-2.5 bg-white border border-slate-200 hover:bg-rose-50 hover:border-rose-100 text-rose-600 font-bold text-xs rounded-xl transition-all"
                      >
                        Absent
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="border border-dashed border-slate-200 rounded-2xl p-8 text-center text-slate-400">
                    <Clock size={24} className="mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-bold">No Active Consultation</p>
                    <p className="text-xs text-slate-400 mt-0.5">Select the next patient from your waiting line to call them in.</p>
                  </div>
                )}
              </div>

              {/* Waiting list */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
                  Upcoming Waiting Patients ({waitingList.length})
                </h4>

                <div className="space-y-3">
                  {waitingList.slice(0, 3).map((item) => (
                    <div 
                      key={item.token} 
                      className="flex items-center justify-between p-3.5 border border-slate-100 hover:border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50/80 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold bg-white border border-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs">
                          {item.token}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-navy text-sm">{item.patientName}</span>
                            {item.priority === 1 && (
                              <span className="text-[8px] bg-rose-100 text-rose-700 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider animate-pulse">Emergency</span>
                            )}
                            {item.status === 'delayed' && (
                              <span className="text-[8px] bg-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">Delayed</span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 font-medium">Checked in {new Date(item.checkInTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleCallPatient(item.token)}
                          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] rounded-lg shadow-sm transition-all flex items-center gap-1 uppercase"
                        >
                          <Play size={10} fill="currentColor" /> Call to Room
                        </button>
                        <button 
                          onClick={() => handleMissedPatient(item.token)}
                          className="px-2.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-400 hover:text-rose-600 font-bold text-[10px] rounded-lg transition-all uppercase"
                        >
                          Absent
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {waitingList.length === 0 && (
                    <div className="text-center py-6 border border-dashed border-slate-100 rounded-xl">
                      <p className="text-xs text-slate-400 italic">No patients waiting in queue.</p>
                    </div>
                  )}

                  {waitingList.length > 3 && (
                    <button 
                      onClick={() => navigate('/queue')}
                      className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-500 font-bold text-xs rounded-xl border border-slate-100 transition-all text-center block"
                    >
                      View remaining {waitingList.length - 3} waiting patients
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <AvailabilityCalendar availabilities={user?.doctor_profile?.availabilities || []} />
        </div>

        {/* Sidebar: Activity Log & Notifications */}
        <div className="space-y-8">
          
          {/* Activity Log (Prescriptions & Notifications) */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-navy flex items-center gap-2">
                <FileText size={18} className="text-blue-500" />
                Activity Log
              </h3>
              <button onClick={() => navigate('/consultations')} className="text-xs text-slate-400 hover:text-blue-600">View All</button>
            </div>
            <div className="p-5 space-y-4">
              {appointments.slice(0, 3).map((appt, i) => (
                <div key={appt.id || i} className="flex gap-3">
                  <div className="mt-1 w-7 h-7 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                    <FileText size={14} />
                  </div>
                  <div>
                    <p className="text-sm text-navy font-medium leading-tight">{appt.patient_name || 'Patient'} — {appt.status}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{appt.date} at {appt.time?.slice(0,5) || 'N/A'}</p>
                  </div>
                </div>
              ))}
              {appointments.length === 0 && (
                <p className="text-xs text-slate-400 italic text-center py-2">No recent activity.</p>
              )}
            </div>
          </div>

          {/* Quick Settings/Actions */}
          <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-lg overflow-hidden relative">
            <div className="absolute -right-4 -bottom-4 opacity-10">
              <Settings size={120} />
            </div>
            <h3 className="font-bold text-lg mb-4">Quick Settings</h3>
            <ul className="space-y-3">
              <li className="flex items-center justify-between text-sm opacity-90">
                <span>OP Availability</span>
                <span className="px-2 py-0.5 bg-emerald-500 rounded text-[10px] font-bold">ACTIVE</span>
              </li>
              <li className="flex items-center justify-between text-sm opacity-90">
                <span>Consultation Fee</span>
                <span className="font-bold">₹500</span>
              </li>
              <li className="flex items-center justify-between text-sm opacity-90">
                <span>Total Revenue (Today)</span>
                <span className="font-bold text-emerald-400">₹{todayRevenue.toLocaleString('en-IN')}</span>
              </li>
            </ul>
            <button 
              onClick={() => navigate('/change-password')}
              className="w-full mt-6 bg-white/10 hover:bg-white/20 py-2 rounded-lg font-bold text-sm transition-colors border border-white/10"
            >
              Update Profile
            </button>
          </div>

          {/* Quick Patient Search */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-navy flex items-center gap-2">
                <Users size={18} className="text-indigo-500" />
                Recent Patients
              </h3>
              <button onClick={() => navigate('/my-patients')} className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-widest">View All</button>
            </div>
            <div className="p-4 space-y-3">
               <div className="relative mb-4">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                 <input 
                   type="text" 
                   placeholder="Quick search..." 
                   value={patientSearch}
                   onChange={(e) => setPatientSearch(e.target.value)}
                   className="w-full bg-slate-50 border border-slate-100 pl-9 pr-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                 />
               </div>
               {patients.filter(p => 
                 p.full_name?.toLowerCase().includes(patientSearch.toLowerCase()) ||
                 p.patient_id?.toLowerCase().includes(patientSearch.toLowerCase())
               ).slice(0, 5).map((patient, i) => (
                 <div key={i} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer group">
                   <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                       {patient.full_name?.charAt(0)}
                     </div>
                     <div>
                       <p className="text-[13px] font-bold text-navy">{patient.full_name}</p>
                       <p className="text-[10px] text-slate-400">ID: {patient.patient_id} • {patient.gender || 'M'}</p>
                     </div>
                   </div>
                   <button 
                    onClick={() => {
                      setConsultationData({ isOpen: true, appointment: { patient_name: patient.full_name, patient_id: patient.id } });
                    }}
                    className="p-1.5 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                   >
                     <Stethoscope size={14} />
                   </button>
                 </div>
               ))}
               {patients.filter(p => 
                 p.full_name?.toLowerCase().includes(patientSearch.toLowerCase()) ||
                 p.patient_id?.toLowerCase().includes(patientSearch.toLowerCase())
               ).length === 0 && (
                 <p className="text-xs text-slate-400 text-center py-2 italic">No patients found</p>
               )}
            </div>
          </div>

        </div>
      </div>

      <EmergencyRescheduler 
        isOpen={isEmergencyModalOpen} 
        onClose={() => setIsEmergencyModalOpen(false)}
        onConfirm={handleEmergencyConfirm}
      />

      <RescheduleModal 
        isOpen={rescheduleData.isOpen}
        onClose={() => setRescheduleData({ isOpen: false, appointment: null })}
        onConfirm={handleRescheduleSubmit}
        appointment={rescheduleData.appointment}
      />

      <ConsultationModal 
        isOpen={consultationData.isOpen}
        onClose={() => setConsultationData({ isOpen: false, appointment: null })}
        patient={consultationData.appointment}
        onSave={handleConsultationSave}
      />

    </div>
  </ErrorBoundary>
  );
};

export default DoctorDashboard;
