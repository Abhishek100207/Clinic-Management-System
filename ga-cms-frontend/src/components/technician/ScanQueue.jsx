import React, { useState } from 'react';
import { 
  User, 
  MapPin, 
  Calendar, 
  Stethoscope, 
  FileText, 
  PlusCircle, 
  ChevronDown, 
  ChevronUp,
  Microscope
} from 'lucide-react';
import { Badge } from '../shared/Badge';

const ScanQueue = ({ isTechnician }) => {
  // Mock data for lab test requests
  const [requests, setRequests] = useState([
    {
      id: 'LAB-001',
      patientName: 'Amit Sharma',
      place: 'Mumbai, Maharashtra',
      consultationDate: '2026-05-10',
      doctorName: 'Dr. Sarah Johnson',
      tests: ['Complete Blood Count (CBC)', 'Lipid Profile', 'Thyroid Stimulating Hormone (TSH)'],
      status: 'Pending'
    },
    {
      id: 'LAB-002',
      patientName: 'Priya Patel',
      place: 'Ahmedabad, Gujarat',
      consultationDate: '2026-05-09',
      doctorName: 'Dr. Robert Chen',
      tests: ['Chest X-Ray', 'ECG'],
      status: 'In Progress'
    },
    {
      id: 'LAB-003',
      patientName: 'Rajesh Kumar',
      place: 'Delhi, NCR',
      consultationDate: '2026-05-08',
      doctorName: 'Dr. Sarah Johnson',
      tests: ['HbA1c', 'Liver Function Test (LFT)'],
      status: 'Completed'
    }
  ]);

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

      <div className="space-y-4">
        {requests.map((request) => (
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
                      onClick={() => alert('Uploading scan...')}
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
          ))}
      </div>
    </section>
  );
};

export default ScanQueue;
