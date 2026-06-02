import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Activity, Download, FileCheck, Search } from 'lucide-react';

const TestResultsPage = () => {
  const location = useLocation();
  const initialSearch = location.state?.patientData?.full_name || '';
  const [searchTerm, setSearchTerm] = useState(initialSearch);

  const allReports = [
    { name: 'Blood Culture', date: 'May 01, 2026', type: 'Laboratory', status: 'Available', patient: 'Abhishek' },
    { name: 'X-Ray Chest PA', date: 'April 28, 2026', type: 'Imaging', status: 'Available', patient: 'Abhishek' },
  ];

  const filteredReports = allReports.filter(report => {
    const term = searchTerm.toLowerCase();
    return report.name.toLowerCase().includes(term) ||
           report.type.toLowerCase().includes(term) ||
           (report.patient && report.patient.toLowerCase().includes(term));
  });

  return (
    <div className="max-w-5xl mx-auto w-full p-4 md:p-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-navy mb-2">Medical Reports</h1>
          <p className="text-slate-500">Access your lab results and diagnostic scan reports.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search reports..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white border border-slate-200 pl-10 pr-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all w-64 shadow-sm"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredReports.map((report, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <Activity size={24} />
              </div>
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded">
                {report.status}
              </span>
            </div>
            <h3 className="font-bold text-navy text-lg">{report.name}</h3>
            <p className="text-xs text-slate-500 mb-6">{report.type} • {report.date}</p>
            <button className="w-full flex items-center justify-center gap-2 bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-600 py-3 rounded-xl font-bold text-sm transition-colors border border-transparent hover:border-blue-100">
              <Download size={18} /> Download PDF
            </button>
          </div>
        ))}

        <div className="md:col-span-2 mt-8 py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-center">
          <FileCheck size={48} className="text-slate-200 mx-auto mb-4" />
          <p className="text-slate-400 text-sm font-medium">All reports are digitally verified by Scanning Center B.</p>
        </div>
      </div>
    </div>
  );
};

export default TestResultsPage;
