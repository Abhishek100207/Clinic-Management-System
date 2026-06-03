import React, { useState, useEffect } from 'react';
import { 
  Search, 
  User, 
  Clipboard, 
  FileText,
  ChevronLeft,
  ChevronRight,
  Plus,
  ChevronDown,
  Activity,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../api/axios';
import { useDebounce } from '../../hooks/useDebounce';
import { useAuthStore } from '../../store/authStore';
import OPConsultationModal from './OPConsultationModal';
import { createConsultationNote, createPrescription, fetchDrugs, checkDrugInteractions } from '../../api/medicalRecords';
import { toast } from 'react-toastify';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const DoctorPatientsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = useAuthStore(state => state.user);
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearchTerm = useDebounce(searchTerm, 300); // PERF: Debounce search input
  
  const { data: qPatientsData, isLoading: isLoadingPatients } = useQuery({
    queryKey: ['patients', page],
    queryFn: () => api.get(`/api/users/patients/?page=${page}`).then(res => res.data)
  });
  const { data: qAppointmentsData, isLoading: isLoadingAppts } = useQuery({
    queryKey: ['appointments', page],
    queryFn: () => api.get(`/api/appointments/appointments/?page=${page}`).then(res => res.data)
  });
  const { data: doctorsData, isLoading: isLoadingDocs } = useQuery({
    queryKey: ['doctors'],
    queryFn: () => api.get('/api/users/doctors/').then(res => res.data)
  });
  const { data: qScanOrdersData, isLoading: isLoadingOrders } = useQuery({
    queryKey: ['scanOrders', page],
    queryFn: () => api.get(`/api/medical_records/scan-orders/?page=${page}`).then(res => res.data)
  });
  const { data: qScanResultsData, isLoading: isLoadingResults } = useQuery({
    queryKey: ['scanResults', page],
    queryFn: () => api.get(`/api/medical_records/scan-results/?page=${page}`).then(res => res.data)
  });

  const qPatients = Array.isArray(qPatientsData) ? qPatientsData : (qPatientsData?.results || []);
  const qAppointments = Array.isArray(qAppointmentsData) ? qAppointmentsData : (qAppointmentsData?.results || []);
  const doctors = Array.isArray(doctorsData) ? doctorsData : (doctorsData?.results || []);
  const qScanOrders = Array.isArray(qScanOrdersData) ? qScanOrdersData : (qScanOrdersData?.results || []);
  const qScanResults = Array.isArray(qScanResultsData) ? qScanResultsData : (qScanResultsData?.results || []);

  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [scanOrders, setScanOrders] = useState([]);
  const [scanResults, setScanResults] = useState([]);
  
  const loading = isLoadingPatients || isLoadingAppts || isLoadingDocs || isLoadingOrders || isLoadingResults;

  // Sync React Query data to local state for local manipulation (e.g. prepending a fetched patient)
  useEffect(() => { if (qPatients) setPatients(qPatients); }, [qPatients]);
  useEffect(() => { if (qAppointments) setAppointments(qAppointments); }, [qAppointments]);
  useEffect(() => { if (qScanOrders) setScanOrders(qScanOrders); }, [qScanOrders]);
  useEffect(() => { if (qScanResults) setScanResults(qScanResults); }, [qScanResults]);

  useEffect(() => {
    if (currentUser && doctors) {
      const myProfile = doctors.find(d => d.user?.id === currentUser.id);
      if (myProfile) setMyDoctorId(myProfile.id);
    }
  }, [currentUser, doctors]);

  const [selectedPatientForHistory, setSelectedPatientForHistory] = useState(null);
  const [historyData, setHistoryData] = useState({});
  const [historyLoading, setHistoryLoading] = useState(false);
  const [expandedDates, setExpandedDates] = useState({});
  const [expandedPatients, setExpandedPatients] = useState({});

  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [myDoctorId, setMyDoctorId] = useState(1);

  const togglePatientExpanded = (patientId) => {
    setExpandedPatients(prev => ({
      ...prev,
      [patientId]: !prev[patientId]
    }));
  };

  const fetchHistory = async (patientId) => {
    setHistoryLoading(true);
    try {
      const [notesRes, prescriptionsRes, scanOrdersRes] = await Promise.all([
        api.get(`/api/medical_records/consultation-notes/?patient=${patientId}`),
        api.get(`/api/medical_records/prescriptions/?patient=${patientId}`),
        api.get(`/api/medical_records/scan-orders/?patient=${patientId}`)
      ]);
      
      const notes = Array.isArray(notesRes?.data) ? notesRes.data : (notesRes?.data?.results || []);
      const prescriptions = Array.isArray(prescriptionsRes?.data) ? prescriptionsRes.data : (prescriptionsRes?.data?.results || []);
      const scanOrders = Array.isArray(scanOrdersRes?.data) ? scanOrdersRes.data : (scanOrdersRes?.data?.results || []);

      const grouped = {};
      
      notes.forEach(note => {
        const date = note.created_at?.split('T')[0] || 'N/A';
        if (!grouped[date]) grouped[date] = { notes: [], prescriptions: [], scans: [] };
        grouped[date].notes.push(note);
      });

      prescriptions.forEach(presc => {
        const date = presc.created_at?.split('T')[0] || 'N/A';
        if (!grouped[date]) grouped[date] = { notes: [], prescriptions: [], scans: [] };
        grouped[date].prescriptions.push(presc);
      });

      scanOrders.forEach(scan => {
        const date = scan.ordered_at?.split('T')[0] || 'N/A';
        if (!grouped[date]) grouped[date] = { notes: [], prescriptions: [], scans: [] };
        grouped[date].scans.push(scan);
      });

      setHistoryData(grouped);
      // Expand the latest date by default
      const dates = Object.keys(grouped).sort().reverse();
      if (dates.length > 0) {
        setExpandedDates({ [dates[0]]: true });
      }
    } catch (err) {
      console.error("Failed to fetch history", err);
    } finally {
      setHistoryLoading(false);
    }
  };

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

  const handleOPClick = async (patient) => {
    const patientAppts = appointments.filter(a => a.patient === patient.id);
    let activeAppt = patientAppts.find(a => ['pending', 'confirmed', 'checked_in', 'in_progress'].includes(a.status));
    
    if (!activeAppt) {
      toast.info("No active appointment found. Creating a walk-in consultation...");
      try {
        const todayStr = new Date().toISOString().split('T')[0];
        const now = new Date();
        const timeStr = [
          String(now.getHours()).padStart(2, '0'),
          String(now.getMinutes()).padStart(2, '0'),
          String(now.getSeconds()).padStart(2, '0')
        ].join(':');

        const newApptRes = await api.post('/api/appointments/appointments/', {
          patient: patient.id,
          doctor: myDoctorId,
          date: todayStr,
          time: timeStr,
          appointment_type: 'in_person',
          status: 'checked_in',
          queue_type: 'walkin'
        });
        activeAppt = newApptRes.data;
        setAppointments(prev => [...prev, activeAppt]);
      } catch (err) {
        console.error("Failed to auto-create appointment for consultation", err);
        toast.error("Failed to start consultation. Please create an appointment first.");
        return;
      }
    }

    const apptDataForModal = {
      ...activeAppt,
      patient_name: patient.full_name,
      gender: patient.gender,
      blood_group: patient.blood_group || 'O+',
      age: calculateAge(patient.date_of_birth)
    };

    setSelectedAppointment(apptDataForModal);
    setIsModalOpen(true);
  };

  const handleSaveConsultation = async (data) => {
    try {
      const apptId = selectedAppointment?.id;
      if (!apptId) {
        toast.error("Cannot save without an appointment ID.");
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

      if (data.prescriptions && data.prescriptions.length > 0 && data.prescriptions[0].medicine) {
        const meds = data.prescriptions.filter(p => p.medicine).map(p => {
          const matchedDrug = availableDrugs.find(d => d.name.toLowerCase() === p.medicine.toLowerCase());
          return {
            drug_id: matchedDrug ? matchedDrug.id : (availableDrugs.length > 0 ? availableDrugs[0].id : 1),
            dosage: p.dosage,
            frequency: 'As directed',
            duration: 'As directed'
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

      if (data.recommendedTests && data.recommendedTests !== 'None') {
        const tests = data.recommendedTests.split(',').map(t => t.trim()).filter(Boolean);
        for (const test of tests) {
          try {
            await api.post('/api/medical_records/scan-orders/', {
              patient: selectedAppointment.patient || selectedAppointment.id,
              doctor: selectedAppointment.doctor || 1,
              scan_type: test,
              status: 'pending'
            });
          } catch (err) {
            console.error(`Failed to create scan order for ${test}:`, err);
          }
        }
        await api.patch(`/api/appointments/appointments/${apptId}/`, { status: 'completed' });
        toast.success(`Consultation finalized. SOAP notes saved to patient profile. ${tests.length} test orders sent to Technician.`);
      } else {
        await api.patch(`/api/appointments/appointments/${apptId}/`, { status: 'completed' });
        toast.success(`Consultation finalized. SOAP notes saved to patient profile.`);
      }

      // Clear draft from localStorage on successful save
      localStorage.removeItem(`op_draft_appt_${apptId}`);

      setAppointments(prev => prev.map(a => a.id === apptId ? { ...a, status: 'completed' } : a));
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data ? JSON.stringify(err.response.data) : err.message;
      toast.error(`Failed to save consultation records: ${errorMsg}`);
    }
  };

  // Listen to openHistoryFor / resumeOP navigation parameters
  useEffect(() => {
    if (location.state && location.state.openHistoryFor) {
      const patientId = parseInt(location.state.openHistoryFor);
      if (!patientId) return;

      const existing = patients.find(p => p.id === patientId);
      if (existing) {
        if (location.state.resumeOP) {
          handleOPClick(existing);
          setSelectedPatientForHistory(null);
        } else {
          setSelectedPatientForHistory(existing);
          fetchHistory(patientId);
        }
      } else if (!loading) {
        // If not in the loaded patient page list, dynamically fetch details from database
        const fetchReferredPatient = async () => {
          try {
            const res = await api.get(`/api/users/patients/?id=${patientId}`);
            const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
            if (data.length > 0) {
              const referredPat = data[0];
              // Prepend to current list view so referred patient is visible in "My Patients" list
              setPatients(prev => [referredPat, ...prev.filter(p => p.id !== referredPat.id)]);
              if (location.state.resumeOP) {
                handleOPClick(referredPat);
                setSelectedPatientForHistory(null);
              } else {
                setSelectedPatientForHistory(referredPat);
                fetchHistory(referredPat.id);
              }
            }
          } catch (err) {
            console.error("Failed to load referred patient details", err);
          }
        };
        fetchReferredPatient();
      }
    }
  }, [location.state, patients, loading]);

  const filteredPatients = patients.filter(p => 
    p.full_name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
    p.id?.toString().includes(debouncedSearchTerm)
  ); // PERF: Use debounced search term

  return (
    <div className="max-w-7xl mx-auto w-full p-4 md:p-8 space-y-6 animate-fade-in">
      
      {/* Header with Search in Top Right */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-extrabold text-navy">My Patients</h1>
        
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search patient..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-200 pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 shadow-sm transition-all"
          />
        </div>
      </div>

      {/* Patient Records List */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        ) : filteredPatients.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Patient & ID</th>
                  <th className="px-6 py-4">OP Status</th>
                  <th className="px-6 py-4">Report Status</th>
                  <th className="px-6 py-4 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPatients.map((patient) => {
                  const isExpanded = !!expandedPatients[patient.id];
                  const patientAppts = appointments.filter(a => a.patient === patient.id);
                  const latestAppt = patientAppts.reduce((latest, current) => {
                    if (!latest) return current;
                    return current.id > latest.id ? current : latest;
                  }, null);
                  const isOPCompleted = latestAppt ? latestAppt.status === 'completed' : false;
                  const hasResult = scanResults.some(r => r.patient === patient.id || r.patient?.id === patient.id);
                  const hasPendingOrder = scanOrders.some(o => (o.patient === patient.id || o.patient?.id === patient.id) && o.status !== 'completed');
                  const reportStatus = hasResult ? 'Available' : hasPendingOrder ? 'Pending' : 'None';
                  
                  return (
                    <React.Fragment key={patient.id}>
                      <tr className="hover:bg-slate-50/50 transition-colors">
                        {/* Patient Name & ID */}
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <button
                              onClick={() => togglePatientExpanded(patient.id)}
                              className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold mr-3 hover:bg-blue-100 transition-colors focus:outline-none"
                            >
                              {patient.full_name?.charAt(0)}
                            </button>
                            <div>
                              <button
                                onClick={() => togglePatientExpanded(patient.id)}
                                className="font-bold text-navy hover:text-blue-600 transition-colors text-left flex items-center gap-1 focus:outline-none"
                              >
                                {patient.full_name}
                                <ChevronDown 
                                  size={14} 
                                  className={`text-slate-400 transition-transform duration-200 ${
                                    isExpanded ? 'rotate-180' : ''
                                  }`} 
                                />
                              </button>
                              <p className="text-xs text-slate-500">ID: PAT-{patient.id}</p>
                            </div>
                          </div>
                        </td>

                        {/* OP Status Badge */}
                        <td className="px-6 py-4">
                          <span className={`inline-flex text-xs font-bold px-3 py-1.5 rounded-full items-center gap-1.5 border ${
                            isOPCompleted 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            <span className={`w-2 h-2 rounded-full ${isOPCompleted ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                            {isOPCompleted ? 'OP Complete' : 'OP Pending'}
                          </span>
                        </td>

                        {/* Report Status Badge */}
                        <td className="px-6 py-4">
                          <span className={`inline-flex text-xs font-bold px-3 py-1.5 rounded-full items-center gap-1.5 border ${
                            reportStatus === 'Available'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : reportStatus === 'Pending'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-slate-50 text-slate-600 border-slate-200'
                          }`}>
                            <span className={`w-2 h-2 rounded-full ${
                              reportStatus === 'Available' ? 'bg-emerald-500' : reportStatus === 'Pending' ? 'bg-amber-500' : 'bg-slate-400'
                            }`}></span>
                            {reportStatus === 'Available' ? 'Report Available' : reportStatus === 'Pending' ? 'Report Pending' : 'No Reports'}
                          </span>
                        </td>

                        {/* Action Buttons */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => {
                                setSelectedPatientForHistory(patient);
                                fetchHistory(patient.id);
                              }}
                              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all border border-slate-200 flex items-center gap-1.5 shadow-sm"
                            >
                              <Clipboard size={12} /> Medical History
                            </button>
                            <button 
                              onClick={() => navigate('/test-results', { state: { patientData: patient } })}
                              className="bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all border border-blue-100 shadow-sm flex items-center gap-1.5"
                            >
                              <Activity size={12} /> Medical Reports
                            </button>
                            {isOPCompleted && (
                              <button 
                                onClick={() => navigate('/doctor/prescriptions', { state: { patientData: patient } })}
                                className="bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all border border-emerald-100 shadow-sm flex items-center gap-1.5"
                              >
                                <CheckCircle2 size={12} /> Complete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Collapsible Details */}
                      {isExpanded && (
                        <tr>
                          <td colSpan="4" className="bg-slate-50/50 px-8 py-6 border-b border-slate-100">
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 animate-in fade-in slide-in-from-top-2 duration-200 text-left">
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Gender</p>
                                <p className="font-bold text-navy text-sm capitalize">{patient.gender || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Age</p>
                                <p className="font-bold text-navy text-sm">{calculateAge(patient.date_of_birth)}y</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Blood Group</p>
                                <p className="font-bold text-rose-600 text-sm">{patient.blood_group || 'O+'}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Mobile Number</p>
                                <p className="font-bold text-navy text-sm">{patient.mobile_number || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Email Address</p>
                                <p className="font-bold text-navy text-sm">{patient.email || 'N/A'}</p>
                              </div>
                              {patient.known_allergies && (
                                <div className="sm:col-span-2">
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Known Allergies</p>
                                  <p className="text-slate-600 text-sm font-semibold">{patient.known_allergies}</p>
                                </div>
                              )}
                              {patient.chronic_conditions && (
                                <div className="sm:col-span-2">
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Chronic Conditions</p>
                                  <p className="text-slate-600 text-sm font-semibold">{patient.chronic_conditions}</p>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-slate-50 p-12 text-center border-t border-slate-100">
            <p className="text-slate-400 font-medium">No patients found matching your search.</p>
          </div>
        )}
      </div>

      {/* Pagination controls */}
      {filteredPatients.length > 0 && (
        <div className="flex justify-between items-center px-2 py-4">
          <p className="text-xs text-slate-400 font-medium">
            Showing {filteredPatients.length} patients {qPatientsData?.count ? `of ${qPatientsData.count}` : ''}
          </p>
          <div className="flex gap-2">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 border border-slate-200 rounded-lg text-slate-400 hover:bg-white transition-colors disabled:opacity-50"
            >
              <ChevronLeft size={16} />
            </button>
            <button 
              onClick={() => setPage(p => p + 1)}
              disabled={!qPatientsData?.next}
              className="p-2 border border-slate-200 rounded-lg text-slate-400 hover:bg-white transition-colors disabled:opacity-50"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Medical History Modal */}
      {selectedPatientForHistory && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-navy text-white">
              <div>
                <h3 className="text-xl font-black">{selectedPatientForHistory.full_name}'s Medical History</h3>
                <p className="text-blue-100/70 text-xs font-bold uppercase tracking-widest">ID: PAT-{selectedPatientForHistory.id}</p>
              </div>
              <button 
                onClick={() => setSelectedPatientForHistory(null)}
                className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <Plus className="rotate-45" size={20} />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6 custom-scrollbar">
              {historyLoading ? (
                <div className="flex justify-center py-20">
                  <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.keys(historyData).length > 0 ? (
                    Object.keys(historyData).sort().reverse().map((date) => {
                      const data = historyData[date];
                      const isExpanded = expandedDates[date];
                      
                      return (
                        <div key={date} className="border border-slate-100 rounded-xl overflow-hidden">
                          {/* Accordion Header */}
                          <button 
                            onClick={() => setExpandedDates(prev => ({ ...prev, [date]: !prev[date] }))}
                            className="w-full p-4 bg-slate-50 flex justify-between items-center hover:bg-slate-100 transition-colors"
                          >
                            <span className="font-bold text-navy">{date}</span>
                            <Plus className={`transition-transform ${isExpanded ? 'rotate-45' : ''}`} size={16} />
                          </button>
                          
                          {/* Accordion Body */}
                          {isExpanded && (
                            <div className="p-4 bg-white grid grid-cols-1 md:grid-cols-3 gap-6 border-t border-slate-100">
                              
                              {/* SOAP Notes */}
                              <div className="space-y-2">
                                <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest">SOAP Notes</h5>
                                {data.notes.length > 0 ? (
                                  data.notes.map((note) => (
                                    <div key={note.id} className="text-xs text-slate-600 space-y-1">
                                      <p><strong>S:</strong> {note.subjective}</p>
                                      <p><strong>O:</strong> {note.objective}</p>
                                      <p><strong>A:</strong> {note.assessment}</p>
                                      <p><strong>P:</strong> {note.plan}</p>
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-xs text-slate-400">No notes.</p>
                                )}
                              </div>

                              {/* Prescriptions */}
                              <div className="space-y-2">
                                <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest">Prescriptions</h5>
                                {data.prescriptions.length > 0 ? (
                                  data.prescriptions.map((prescription) => (
                                    <div key={prescription.id} className="text-xs text-slate-600 space-y-1">
                                      <p className="font-bold">Notes: {prescription.notes}</p>
                                      {prescription.medications?.map((med) => (
                                        <p key={med.id} className="ml-2">
                                          • {med.drug_details?.name} - {med.dosage} ({med.frequency})
                                        </p>
                                      ))}
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-xs text-slate-400">No prescriptions.</p>
                                )}
                              </div>

                              {/* Scan Orders */}
                              <div className="space-y-2">
                                <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest">Test Requests</h5>
                                {data.scans.length > 0 ? (
                                  data.scans.map((scan) => (
                                    <div key={scan.id} className="text-xs text-slate-600 space-y-1">
                                      <p className="font-bold">{scan.scan_type}</p>
                                      <p className="flex items-center gap-1">
                                        Status: 
                                        <span className={`font-bold ${
                                          scan.status === 'completed' ? 'text-green-600' : 
                                          scan.status === 'in_progress' ? 'text-amber-600' : 'text-slate-500'
                                        }`}>
                                          {scan.status}
                                        </span>
                                      </p>
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-xs text-slate-400">No tests requested.</p>
                                )}
                              </div>

                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-10 text-slate-400">No medical history found for this patient.</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <OPConsultationModal 
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedAppointment(null);
          queryClient.invalidateQueries(['appointments']);
        }}
        patient={selectedAppointment}
        onSave={handleSaveConsultation}
      />
    </div>
  );
};

export default DoctorPatientsPage;
