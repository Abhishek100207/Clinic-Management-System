import React, { useState, useEffect, lazy, Suspense, useCallback } from 'react';

const UploadScanModal = lazy(() => import('./UploadScanModal')); // PERF: Lazy load modal
import { 
  User, 
  MapPin, 
  Calendar, 
  Stethoscope, 
  FileText, 
  PlusCircle, 
  ChevronDown, 
  ChevronUp,
  Microscope,
  X,
  Save,
  Loader2
} from 'lucide-react';
import { Badge } from '../shared/Badge';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

const ScanQueue = ({ isTechnician }) => {
  const navigate = useNavigate();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadData, setUploadData] = useState({
    type: 'scan',
    patient_id: '',
    scan_type: '',
    scan_date: '',
    findings: '',
    file: null
  });
  const [patients, setPatients] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('pending');

  // Mock data for lab test requests
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/medical_records/scan-orders/?status=${statusFilter}`);
      const data = Array.isArray(response.data) ? response.data : (response.data.results || []);
      
      const mappedData = data.map(order => ({
        id: `SCAN-${order.id}`,
        order_id: order.id,
        patient_id: order.patient,
        patientName: order.patientName || `Patient ${order.patient}`,
        place: 'N/A',
        consultationDate: order.ordered_at ? order.ordered_at.split('T')[0] : 'N/A',
        doctorName: order.doctorName || `Doctor ${order.doctor}`,
        tests: [order.scan_type],
        status: order.status === 'pending' ? 'Pending' : (order.status === 'in_progress' ? 'In Progress' : 'Completed')
      }));
      
      setRequests(mappedData);
    } catch (err) {
      console.error('Error fetching scan orders:', err);
      setError('Failed to load scan orders.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRequests();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchRequests]);


  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await api.get('/api/users/patients/');
        const data = response.data;
        setPatients(Array.isArray(data) ? data : (data.results || []));
      } catch (err) {
        console.error('Error fetching patients:', err);
        // Fallback to queue patients if fetch fails
        setPatients(requests.map(r => ({ id: r.id.replace('SCAN-', '').replace('LAB-', ''), full_name: r.patientName })));
      }
    };
    fetchPatients();
  }, [requests]);

  const [expandedId, setExpandedId] = useState(null);
  const [showTests, setShowTests] = useState({});

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const toggleTests = (id) => {
    setShowTests(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleEditReport = (id) => {
    alert(`Editing report for request ${id} - Adding new lab test record`);
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    const formData = new FormData();
    formData.append('patient', uploadData.patient_id);
    formData.append('file', uploadData.file);

    if (uploadData.type === 'lab') {
      formData.append('test_name', uploadData.scan_type);
      formData.append('reported_by', 'Dr. Pathologist');
    } else {
      formData.append('scan_type', uploadData.scan_type);
      formData.append('scan_date', uploadData.scan_date);
      formData.append('findings', JSON.stringify([uploadData.findings]));
      formData.append('reported_by', 'Dr. Radiologist');
    }

    try {
      const url = uploadData.type === 'lab' ? '/api/medical_records/lab-results/' : '/api/medical_records/scan-results/upload/';
      await api.post(url, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      // Update scan order status to completed
      if (uploadData.order_id) {
        await api.patch(`/api/medical_records/scan-orders/${uploadData.order_id}/`, { status: 'completed' });
      }
      alert('Upload successful!');
      setIsModalOpen(false);
      setUploadData({ type: 'scan', patient_id: '', scan_type: '', scan_date: '', findings: '', file: null });
      fetchRequests();
    } catch (err) {
      console.error('Error uploading:', err);
      alert('Failed to upload.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
          <Microscope className="text-amber-500" size={28} />
          Scan Queue
        </h2>
        <Badge colorClass="bg-slate-900 text-white px-4 py-1.5">
          {requests.length} Total Requests
        </Badge>
      </div>

      <div className="flex gap-6 border-b border-slate-100 px-2">
        <button 
          onClick={() => setStatusFilter('pending')}
          className={`pb-3 text-sm font-bold transition-all ${statusFilter === 'pending' ? 'text-amber-500 border-b-2 border-amber-500' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Pending Requests
        </button>
        <button 
          onClick={() => setStatusFilter('completed')}
          className={`pb-3 text-sm font-bold transition-all ${statusFilter === 'completed' ? 'text-amber-500 border-b-2 border-amber-500' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Completed History
        </button>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-slate-100 border-t-amber-500 rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="text-center p-8 text-rose-500">{error}</div>
        ) : requests.length === 0 ? (
          <div className="text-center p-8 text-slate-400">No pending scan orders found.</div>
        ) : (
          requests.map((request) => (
          <div 
            key={request.id} 
            className={`bg-white rounded-3xl border transition-all duration-300 overflow-hidden ${
              expandedId === request.id 
                ? 'border-amber-200 shadow-xl ring-4 ring-amber-50/50' 
                : 'border-slate-100 shadow-sm hover:border-slate-200 hover:shadow-md'
            }`}
          >
            {/* Record Header (Clickable Patient Name) */}
            <div 
              onClick={() => toggleExpand(request.id)}
              className="p-6 flex items-center justify-between cursor-pointer group"
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                  expandedId === request.id ? 'bg-amber-500 text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100'
                }`}>
                  <FileText size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800 group-hover:text-amber-600 transition-colors">
                    {request.patientName}
                  </h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                    Record ID: {request.id}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <Badge colorClass={
                  request.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                  request.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                  'bg-emerald-100 text-emerald-700'
                }>
                  {request.status}
                </Badge>
                {expandedId === request.id ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
              </div>
            </div>

            {/* Record Details (Form) */}
            {expandedId === request.id && (
              <div className="px-8 pb-8 pt-2 space-y-8 animate-in slide-in-from-top-4 duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <User size={12} /> Patient Name
                    </label>
                    <p className="text-lg font-bold text-slate-800">{request.patientName}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <MapPin size={12} /> Place
                    </label>
                    <p className="text-lg font-bold text-slate-800">{request.place}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Calendar size={12} /> Date of Consultation
                    </label>
                    <p className="text-lg font-bold text-slate-800">{request.consultationDate}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Stethoscope size={12} /> Doctor Consulted
                    </label>
                    <p className="text-lg font-bold text-slate-800">{request.doctorName}</p>
                  </div>
                </div>

                {/* List of Tests Section */}
                <div className="flex flex-wrap items-center gap-4">
                  <button 
                    onClick={() => toggleTests(request.id)}
                    className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-800 transition-colors shadow-lg"
                  >
                    <FileText size={18} />
                    {showTests[request.id] ? 'Hide' : 'Show'} List of Tests
                  </button>

                  {isTechnician && (
                    <button 
                      onClick={() => {
                        setIsModalOpen(true);
                        setUploadData({
                          ...uploadData,
                          patient_id: request.patient_id,
                          order_id: request.order_id,
                          scan_type: request.tests.join(', ')
                        });
                      }}
                      className="flex items-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-2xl font-bold text-sm hover:bg-amber-600 transition-colors shadow-lg shadow-amber-100"
                    >
                      <PlusCircle size={18} />
                      Upload Scan
                    </button>
                  )}
                </div>

                  {showTests[request.id] && (
                    <div className="p-6 bg-white border-2 border-dashed border-slate-200 rounded-3xl animate-in fade-in zoom-in-95 duration-200">
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Requested Tests</h4>
                      <div className="flex flex-wrap gap-3">
                        {request.tests.map((test, index) => (
                          <div key={index} className="px-4 py-2 bg-amber-50 text-amber-700 border border-amber-100 rounded-xl font-bold text-xs flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-amber-400 rounded-full"></div>
                            {test}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-3">
                      {isTechnician && (
                        <button 
                          onClick={() => handleEditReport(request.id)}
                          className="flex items-center gap-2 px-6 py-3 bg-indigo-50 text-indigo-700 rounded-2xl font-bold text-sm hover:bg-indigo-100 transition-colors"
                        >
                          <PlusCircle size={18} />
                          Edit Report (Add Records)
                        </button>
                      )}
                      {request.status === 'Completed' && (
                        <button 
                          onClick={() => navigate(`/scan-report/${request.result_id ? `SCAN-${request.result_id}` : request.id}`, { 
                            state: { 
                              patientData: {
                                full_name: request.patientName,
                                id: request.id,
                                address: request.place
                              } 
                            } 
                          })}
                          className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200"
                        >
                          <FileText size={18} />
                          View Report
                        </button>
                      )}
                    </div>
                    
                    {isTechnician ? (
                      <p className="text-xs font-bold text-amber-600 italic">
                        Technician Access: Use "Edit Report" to manage lab records.
                      </p>
                    ) : (
                      <p className="text-xs font-bold text-slate-400 italic">
                        Read-only access: Consultation record details only.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Upload Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <Suspense fallback={<div className="bg-white p-8 rounded-[2.5rem] shadow-2xl w-full max-w-2xl flex justify-center"><div className="w-10 h-10 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin"></div></div>}>
            <UploadScanModal 
              setIsModalOpen={setIsModalOpen}
              uploadData={uploadData}
              setUploadData={setUploadData}
              patients={patients}
              uploading={uploading}
              handleUploadSubmit={handleUploadSubmit}
            />
          </Suspense>
        </div>
      )}
    </section>
  );
};

export default ScanQueue;
