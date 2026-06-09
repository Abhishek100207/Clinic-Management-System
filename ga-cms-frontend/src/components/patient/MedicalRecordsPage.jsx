import React, { useState, useEffect } from 'react';
import apiClient from '../../api/axios';
import { fetchConsultationNotes, fetchPrescriptions, fetchLabResults, fetchScanResults } from '../../api/medicalRecords';
import { 
  FileText, 
  Activity, 
  Clipboard, 
  Pill, 
  Stethoscope, 
  Download, 
  X, 
  ChevronRight,
  Search,
  Calendar,
  User,
  ExternalLink,
  Layers
} from 'lucide-react';

const MedicalRecordsPage = () => {
  const [activeModal, setActiveModal] = useState(null);
  const [records, setRecords] = useState({
    prescriptions: [],
    soap_notes: [],
    lab_results: [],
    scan_results: []
  });


  useEffect(() => {
    const loadData = async () => {
      try {
        // Here we'd ideally pass the logged-in patient's ID if we had it in context
        // For now, we fetch all that the user has access to (backend filters by user)
        const [presReq, soapReq, labReq, scanReq] = await Promise.all([
          fetchPrescriptions(),
          fetchConsultationNotes(),
          fetchLabResults(),
          fetchScanResults()
        ]);
        setRecords({
          prescriptions: Array.isArray(presReq) ? presReq : (presReq?.results ?? (presReq?.data?.results ?? [])),
          soap_notes: Array.isArray(soapReq) ? soapReq : (soapReq?.results ?? (soapReq?.data?.results ?? [])),
          lab_results: Array.isArray(labReq) ? labReq : (labReq?.results ?? (labReq?.data?.results ?? [])),
          scan_results: Array.isArray(scanReq) ? scanReq : (scanReq?.results ?? (scanReq?.data?.results ?? []))
        });
      } catch (error) {
        console.error("Failed to fetch medical records:", error);
      }
    };

    loadData();
  }, []);

  const categories = [
    { id: 'prescriptions', title: 'Prescriptions', icon: <Pill size={28} />, color: 'blue', desc: 'Active and past medication lists' },
    { id: 'soap_notes', title: 'Consultation Notes', icon: <Stethoscope size={28} />, color: 'purple', desc: 'Detailed clinical session notes' },
    { id: 'lab_results', title: 'Lab Results', icon: <Clipboard size={28} />, color: 'amber', desc: 'Detailed pathology & blood reports' },
    { id: 'scan_results', title: 'Scan Results', icon: <Layers size={28} />, color: 'rose', desc: 'Radiology images and reports' },
  ];

  const handleDownloadPrescription = async (id) => {
    try {
      const response = await apiClient.get(`/api/medical_records/prescriptions/${id}/download/`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `prescription_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Failed to download prescription:', error);
      alert('Failed to download prescription.');
    }
  };

  const renderModalContent = () => {
    switch (activeModal) {
      case 'prescriptions':
        return (
          <div className="space-y-4">
            {records.prescriptions.length === 0 ? <p className="text-sm text-slate-500">No prescriptions found.</p> : records.prescriptions.map((item, i) => (
              <div key={i} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                    <Pill size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-navy text-sm">Prescription #{item.id}</h4>
                    <p className="text-[11px] text-slate-500">Dr. {item.doctor} • {new Date(item.created_at).toLocaleDateString()}</p>
                    <p className="text-[10px] text-blue-600 font-medium mt-1">
                      {item.medications?.map(m => `${m.drug_details?.name || m.drug_id} (${m.dosage}, ${m.frequency}${m.duration ? `, ${m.duration}` : ''})`).join(' • ')}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => handleDownloadPrescription(item.id)}
                  className="p-2 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg transition-colors"
                  title="Download Prescription PDF"
                >
                  <Download size={18} />
                </button>
              </div>
            ))}
          </div>
        );

      case 'soap_notes':
        return (
          <div className="space-y-6">
            {records.soap_notes.length === 0 ? <p className="text-sm text-slate-500">No consultation notes found.</p> : records.soap_notes.map((note, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="bg-purple-600 px-4 py-2 text-white text-[10px] font-bold uppercase tracking-widest flex justify-between">
                <span>Clinical Note #{note.id}</span>
                <span>Date: {new Date(note.created_at).toLocaleDateString()}</span>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <h5 className="text-[11px] font-bold text-purple-600 uppercase mb-1">Subjective</h5>
                  <p className="text-xs text-slate-600 leading-relaxed">{note.subjective}</p>
                </div>
                <div>
                  <h5 className="text-[11px] font-bold text-purple-600 uppercase mb-1">Objective</h5>
                  <p className="text-xs text-slate-600 leading-relaxed">{note.objective}</p>
                </div>
                <div>
                  <h5 className="text-[11px] font-bold text-purple-600 uppercase mb-1">Assessment</h5>
                  <p className="text-xs text-slate-600 leading-relaxed">{note.assessment}</p>
                </div>
                <div>
                  <h5 className="text-[11px] font-bold text-purple-600 uppercase mb-1">Plan</h5>
                  <p className="text-xs text-slate-600 leading-relaxed">{note.plan}</p>
                </div>
              </div>
            </div>
            ))}
          </div>
        );
      case 'lab_results':
        return (
          <div className="space-y-4">
            {records.lab_results.length === 0 ? <p className="text-sm text-slate-500">No lab results found.</p> : records.lab_results.map((lab, i) => (
             <div key={i} className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex justify-between items-center">
               <div>
                 <h4 className="font-bold text-amber-900 text-sm mb-1">{lab.test_name}</h4>
                 <p className="text-xs text-slate-500">Uploaded on {new Date(lab.uploaded_at).toLocaleDateString()}</p>
                 <span className="text-[10px] font-bold bg-amber-200 text-amber-800 px-2 py-1 rounded mt-2 inline-block">
                  {lab.status}
                 </span>
               </div>
               {lab.file && (
                 <a href={lab.file} target="_blank" rel="noopener noreferrer" className="p-2 bg-amber-200 hover:bg-amber-300 text-amber-800 rounded-lg transition-colors">
                   <Download size={18} />
                 </a>
               )}
             </div>
            ))}
          </div>
        );
      case 'scan_results':
        return (
          <div className="grid grid-cols-2 gap-4">
            {records.scan_results.length === 0 ? <p className="text-sm text-slate-500 col-span-2">No scan results found.</p> : records.scan_results.map((scan, i) => (
              <div key={i} className="group relative bg-slate-900 rounded-2xl aspect-square overflow-hidden flex flex-col items-center justify-center border border-slate-800">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500 to-transparent group-hover:opacity-40 transition-opacity"></div>
                <Layers className="text-blue-400 mb-2 opacity-50" size={40} />
                <span className="text-[10px] text-blue-300 font-bold uppercase tracking-widest">Radiology</span>
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                  <p className="text-white text-xs font-bold">{scan.scan_type}</p>
                  <p className="text-slate-400 text-[10px]">{new Date(scan.uploaded_at).toLocaleDateString()}</p>
                </div>
                {scan.file && (
                  <a href={scan.file} target="_blank" rel="noopener noreferrer" className="absolute top-2 right-2 p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity">
                    <ExternalLink size={14} />
                  </a>
                )}
              </div>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto w-full p-4 md:p-8 space-y-10 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-widest">
            <User size={14} /> Clinical Records
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-navy">Medical Record View</h1>
          <p className="text-slate-500 max-w-xl">
            Access your comprehensive health history, diagnostic reports, and clinical consultation notes in one secure place.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Search records..." 
              className="bg-white border border-slate-200 pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-50 transition-all w-64 shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((cat) => (
          <button 
            key={cat.id}
            onClick={() => setActiveModal(cat.id)}
            className="group bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all text-left flex flex-col justify-between h-64 relative overflow-hidden"
          >
            <div className={`absolute -right-4 -top-4 w-32 h-32 opacity-5 rounded-full bg-current ${
              cat.color === 'blue' ? 'text-blue-600' : 
              cat.color === 'emerald' ? 'text-emerald-600' : 
              cat.color === 'purple' ? 'text-purple-600' : 
              cat.color === 'amber' ? 'text-amber-600' : 'text-rose-600'
            }`}></div>
            
            <div className="space-y-4 relative z-10">
              <div className={`w-14 h-14 rounded-3xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 duration-300 ${
                cat.color === 'blue' ? 'bg-blue-600 text-white shadow-blue-100' : 
                cat.color === 'emerald' ? 'bg-emerald-500 text-white shadow-emerald-100' : 
                cat.color === 'purple' ? 'bg-purple-600 text-white shadow-purple-100' : 
                cat.color === 'amber' ? 'bg-amber-500 text-white shadow-amber-100' : 'bg-rose-600 text-white shadow-rose-100'
              }`}>
                {cat.icon}
              </div>
              <div>
                <h3 className="text-xl font-bold text-navy mb-1">{cat.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{cat.desc}</p>
              </div>
            </div>

            <div className="flex items-center justify-between relative z-10">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">View Records</span>
              <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-navy group-hover:text-white transition-all">
                <ChevronRight size={18} />
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Info Section */}
      <div className="bg-navy rounded-[3rem] p-8 md:p-12 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Clipboard size={200} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1 space-y-6">
            <h2 className="text-3xl font-bold leading-tight">Digital Health Wallet</h2>
            <p className="text-blue-100 opacity-80 leading-relaxed">
              Your medical records are encrypted and stored securely. We provide 24/7 access to your data, allowing you to share it with other healthcare providers when necessary.
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full text-xs font-bold backdrop-blur-sm">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div> HIPAA Compliant
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full text-xs font-bold backdrop-blur-sm">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div> Digitally Signed
              </div>
            </div>
          </div>
          <div className="w-full md:w-1/3 bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10">
             <div className="space-y-4">
                <div className="flex items-center justify-between text-xs font-bold text-blue-200 uppercase tracking-widest">
                  <span>Recent Activity</span>
                  <Calendar size={14} />
                </div>
                <ul className="space-y-3">
                   <li className="flex gap-3 items-start border-b border-white/5 pb-3">
                      <div className="w-2 h-2 bg-blue-400 rounded-full mt-1.5"></div>
                      <div>
                        <p className="text-xs font-bold">Prescription Updated</p>
                        <p className="text-[10px] opacity-60">Dr. Johnson • 2h ago</p>
                      </div>
                   </li>
                   <li className="flex gap-3 items-start border-b border-white/5 pb-3">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full mt-1.5"></div>
                      <div>
                        <p className="text-xs font-bold">Lab Result Released</p>
                        <p className="text-[10px] opacity-60">Pathology Center • Yesterday</p>
                      </div>
                   </li>
                </ul>
             </div>
          </div>
        </div>
      </div>

      {/* Modal / Hover View */}
      {activeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-navy/60 backdrop-blur-md animate-in fade-in duration-300" 
            onClick={() => setActiveModal(null)}
          ></div>
          <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className={`p-8 text-white flex justify-between items-center ${
              activeModal === 'prescriptions' ? 'bg-blue-600' : 
              activeModal === 'test_results' ? 'bg-emerald-500' : 
              activeModal === 'soap_notes' ? 'bg-purple-600' : 
              activeModal === 'lab_results' ? 'bg-amber-500' : 'bg-rose-600'
            }`}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                   {categories.find(c => c.id === activeModal)?.icon}
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{categories.find(c => c.id === activeModal)?.title}</h2>
                  <p className="text-white/70 text-xs font-medium">Viewing your digital clinical records</p>
                </div>
              </div>
              <button 
                onClick={() => setActiveModal(null)}
                className="p-2 hover:bg-white/20 rounded-full transition-colors text-white"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
               {renderModalContent()}
            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
               <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                 <FileText size={14} /> Last Updated: Today
               </div>
               <button 
                onClick={() => setActiveModal(null)}
                className="px-6 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200"
               >
                 Close View
               </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MedicalRecordsPage;
