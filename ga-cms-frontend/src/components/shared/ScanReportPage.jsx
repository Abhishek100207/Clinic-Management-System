import React from 'react';
import { 
  User, 
  Calendar, 
  Activity, 
  FileText, 
  Download, 
  Printer, 
  ChevronLeft,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Stethoscope,
  MapPin,
  Droplets
} from 'lucide-react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';

const ScanReportPage = () => {
  const navigate = useNavigate();
  const { reportId } = useParams();
  const location = useLocation();
  const passedPatient = location.state?.patientData;

  // Mock data for the scan report
  const reportData = {
    id: reportId || 'SCAN-10294',
    type: reportId?.charCodeAt(reportId.length - 1) % 2 === 0 ? 'Chest X-Ray PA View' : 'Abdominal Ultrasound',
    date: `May ${10 + (reportId?.charCodeAt(reportId.length - 1) % 5)}, 2026`,
    time: '11:45 AM',
    patient: {
      name: passedPatient?.full_name || 'Abhishek Sharma',
      id: passedPatient?.id ? `PAT-${passedPatient.id}` : 'PAT-8821',
      age: passedPatient?.age || 28,
      gender: passedPatient?.gender || 'Male',
      bloodGroup: passedPatient?.blood_group || 'O+',
      place: passedPatient?.address || 'Hyderabad, Telangana'
    },
    doctor: 'Dr. Sarah Johnson',
    department: 'Radiology & Imaging',
    imageUrl: '/medical_xray_scan_1778599392682.png', 
    findings: [
      "The lung fields are clear with no evidence of focal consolidation, pleural effusion, or pneumothorax.",
      "The cardiomediastinal silhouette is within normal limits for size and contour.",
      "The trachea is midline and the hila are unremarkable.",
      "The visualised bony structures and soft tissues are within normal limits."
    ],
    impressions: [
      "No active cardiopulmonary disease identified.",
      "Normal study of the chest."
    ]
  };

  return (
    <div className="max-w-screen-2xl mx-auto w-full p-4 md:p-8 space-y-6 animate-fade-in">
      
      {/* Top Header Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-500 hover:text-navy font-bold transition-colors group"
        >
          <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center group-hover:border-navy transition-all">
            <ChevronLeft size={18} />
          </div>
          Back to Reports
        </button>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all shadow-sm">
            <Printer size={18} /> Print
          </button>
          <button className="flex items-center gap-2 bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">
            <Download size={18} /> Download PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Patient Details (25%) */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden h-full">
            <div className="bg-navy p-6 text-white">
              <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-md">
                <User size={32} />
              </div>
              <h2 className="text-xl font-black">{reportData.patient.name}</h2>
              <p className="text-blue-100/70 text-xs font-bold uppercase tracking-widest">ID: {reportData.patient.id}</p>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Calendar size={12} /> Age
                  </p>
                  <p className="text-sm font-bold text-navy">{reportData.patient.age} Years</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Activity size={12} /> Gender
                  </p>
                  <p className="text-sm font-bold text-navy">{reportData.patient.gender}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Droplets size={12} className="text-rose-500" /> Blood Group
                  </p>
                  <p className="text-sm font-bold text-navy">{reportData.patient.bloodGroup}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <MapPin size={12} /> Location
                  </p>
                  <p className="text-sm font-bold text-navy truncate">{reportData.patient.place}</p>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-50 space-y-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Requesting Doctor</p>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Stethoscope size={16} />
                    </div>
                    <p className="text-sm font-bold text-navy">{reportData.doctor}</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Scan Date & Time</p>
                  <p className="text-sm font-bold text-navy">{reportData.date} at {reportData.time}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Scan Type</p>
                  <div className="px-3 py-1 bg-amber-50 text-amber-700 rounded-lg inline-block text-xs font-bold border border-amber-100">
                    {reportData.type}
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <div className="bg-slate-900 rounded-2xl p-4 text-white">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Technician Note</p>
                  <p className="text-[11px] leading-relaxed opacity-80">
                    Scan performed using Digital Radiography System. Patient was cooperative during the procedure.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MIDDLE COLUMN: Scan Image (50%) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-slate-900 rounded-[2.5rem] border border-slate-800 shadow-2xl overflow-hidden relative flex flex-col items-center justify-center min-h-[600px] group">
            {/* Image Placeholder - In real app, this would be an actual IMG tag with reportData.imageUrl */}
            <div className="absolute inset-0 flex items-center justify-center opacity-90 group-hover:opacity-100 transition-opacity overflow-hidden">
               {/* 
                  Using a stylized div to represent the scan if the image is not available, 
                  but we'll include the img tag for the generated image 
               */}
               <img 
                 src="/medical_xray_scan_1778599392682.png" 
                 alt="Scan View" 
                 className="w-full h-full object-contain pointer-events-none select-none"
               />
            </div>

            {/* Scan Controls Overlay */}
            <div className="absolute top-6 right-6 flex flex-col gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0 duration-300">
              <button className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-white hover:bg-white/20 transition-all border border-white/10 shadow-lg">
                <ZoomIn size={20} />
              </button>
              <button className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-white hover:bg-white/20 transition-all border border-white/10 shadow-lg">
                <ZoomOut size={20} />
              </button>
              <button className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-white hover:bg-white/20 transition-all border border-white/10 shadow-lg">
                <RotateCcw size={20} />
              </button>
              <button className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-white hover:bg-white/20 transition-all border border-white/10 shadow-lg">
                <Maximize2 size={20} />
              </button>
            </div>

            {/* Scan Identity Label */}
            <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
              <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 text-white text-[10px] font-bold uppercase tracking-widest">
                Chest PA View • Digital Imaging
              </div>
              <div className="flex items-center gap-2 text-white/50 text-[10px] font-bold uppercase tracking-widest">
                <Activity size={14} /> Live View System
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Report Summary (25%) */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-6 border-b border-slate-50">
              <h3 className="text-xl font-black text-navy flex items-center gap-2">
                <FileText className="text-blue-600" size={24} />
                Clinical Report
              </h3>
            </div>
            
            <div className="p-6 space-y-8 flex-1 overflow-y-auto custom-scrollbar">
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-blue-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                  <h4 className="text-xs font-black uppercase tracking-[0.2em]">Findings</h4>
                </div>
                <ul className="space-y-4">
                  {reportData.findings.map((item, i) => (
                    <li key={i} className="flex gap-3 items-start group">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-200 shrink-0 group-hover:bg-blue-400 transition-colors"></span>
                      <p className="text-sm text-slate-600 leading-relaxed font-medium">{item}</p>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="space-y-4 pt-6 border-t border-slate-50">
                <div className="flex items-center gap-2 text-rose-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                  <h4 className="text-xs font-black uppercase tracking-[0.2em]">Clinical Impression</h4>
                </div>
                <div className="bg-rose-50/50 rounded-2xl p-5 border border-rose-100/50">
                  <ul className="space-y-3">
                    {reportData.impressions.map((item, i) => (
                      <li key={i} className="flex gap-3 items-start">
                        <span className="mt-1.5 text-rose-400 shrink-0 font-bold text-sm">#</span>
                        <p className="text-sm text-rose-900 font-bold leading-relaxed italic">
                          {item}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>

              <div className="pt-8 text-center space-y-2">
                <div className="w-24 h-12 bg-slate-100 rounded-lg mx-auto flex items-center justify-center text-[10px] text-slate-400 font-bold uppercase tracking-widest border border-slate-200 border-dashed">
                  Digital Sign
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Digitally Verified by Dr. Sarah Johnson</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ScanReportPage;
