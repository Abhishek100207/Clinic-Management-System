import React, { useState, useEffect } from 'react';
import { 
  Search, 
  User, 
  Clipboard, 
  FileText,
  ChevronLeft,
  ChevronRight,
  Plus
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../api/axios';
import { useDebounce } from '../../hooks/useDebounce';

const DoctorPatientsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300); // PERF: Debounce search input
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatientForHistory, setSelectedPatientForHistory] = useState(null);
  const [historyData, setHistoryData] = useState({});
  const [historyLoading, setHistoryLoading] = useState(false);
  const [expandedDates, setExpandedDates] = useState({});

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



  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await api.get('/api/users/patients/');
        setPatients(Array.isArray(res?.data) ? res.data : (res?.data?.results || []));
      } catch (err) {
        console.error("Failed to fetch patients", err);
        setPatients([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

  // Listen to openHistoryFor navigation parameter to auto-display referred patient history
  useEffect(() => {
    if (location.state && location.state.openHistoryFor) {
      const patientId = parseInt(location.state.openHistoryFor);
      if (!patientId) return;

      const existing = patients.find(p => p.id === patientId);
      if (existing) {
        setSelectedPatientForHistory(existing);
        fetchHistory(patientId);
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
              setSelectedPatientForHistory(referredPat);
              fetchHistory(referredPat.id);
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
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        ) : filteredPatients.length > 0 ? (
          filteredPatients.map((patient) => (
            <div key={patient.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row items-center justify-between gap-6 group">
              
              {/* Patient Info */}
              <div className="flex items-center gap-5 flex-1">
                <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg">
                  {patient.full_name?.charAt(0)}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-12 flex-1">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Patient Name</p>
                    <p className="font-bold text-navy">{patient.full_name}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Patient ID</p>
                    <p className="font-bold text-navy text-sm">#PAT-{patient.id}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Blood Group</p>
                    <p className="font-bold text-rose-600 text-sm">{patient.blood_group || 'O+'}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 w-full md:w-auto">
                <button 
                  onClick={() => {
                    setSelectedPatientForHistory(patient);
                    fetchHistory(patient.id);
                  }}
                  className="flex-1 md:flex-none px-6 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                >
                  <Clipboard size={14} /> Medical History
                </button>
                <button 
                  onClick={() => navigate(`/scan-report/SCAN-${patient.id}`, { state: { patientData: patient } })}
                  className="flex-1 md:flex-none px-6 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100 flex items-center justify-center gap-2"
                >
                  <FileText size={14} /> View Scan
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-slate-50 rounded-3xl p-12 text-center border border-dashed border-slate-200">
            <p className="text-slate-400 font-medium">No patients found matching your search.</p>
          </div>
        )}
      </div>

      {/* Pagination Placeholder */}
      {filteredPatients.length > 0 && (
        <div className="flex justify-between items-center px-2 py-4">
          <p className="text-xs text-slate-400 font-medium">Showing {filteredPatients.length} patients</p>
          <div className="flex gap-2">
            <button className="p-2 border border-slate-200 rounded-lg text-slate-400 hover:bg-white transition-colors"><ChevronLeft size={16} /></button>
            <button className="p-2 border border-slate-200 rounded-lg text-slate-400 hover:bg-white transition-colors"><ChevronRight size={16} /></button>
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
    </div>
  );
};

export default DoctorPatientsPage;
