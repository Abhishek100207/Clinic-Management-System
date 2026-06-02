import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { FileText, Plus, Search, User } from 'lucide-react';

const DoctorPrescriptionsPage = () => {
  const location = useLocation();
  const initialSearch = location.state?.patientData?.full_name || '';
  const [searchTerm, setSearchTerm] = useState(initialSearch);

  const mockPrescriptions = [
    { id: 'RX-9901', patient: 'Abhishek', date: 'May 04, 2026', title: 'Standard Prescription' },
    { id: 'RX-8452', patient: 'Anjali Sharma', date: 'April 20, 2026', title: 'Post-Surgery Medication' },
  ];

  const filteredPrescriptions = mockPrescriptions.filter(p => {
    const term = searchTerm.toLowerCase();
    return p.patient.toLowerCase().includes(term) ||
           p.id.toLowerCase().includes(term) ||
           p.title.toLowerCase().includes(term);
  });

  return (
    <div className="max-w-7xl mx-auto w-full p-4 md:p-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-navy mb-2">Prescription Management</h1>
          <p className="text-slate-500">Create, view, and manage prescriptions for your patients.</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all">
          <Plus size={18} />
          New Prescription
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-12 text-center">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText size={28} className="text-blue-500" />
          </div>
          <h3 className="text-lg font-bold text-navy mb-2">Prescription Records</h3>
          <p className="text-slate-500 text-sm max-w-xs mx-auto mb-6">
            Search for patients to view their previous prescriptions or generate a new digital RX.
          </p>
          <div className="relative max-w-md mx-auto mb-8">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search patient name..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>

          {filteredPrescriptions.length > 0 ? (
            <div className="max-w-2xl mx-auto space-y-4 text-left">
              {filteredPrescriptions.map((item) => (
                <div key={item.id} className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center hover:bg-slate-100/85 transition-all">
                  <div>
                    <h4 className="font-bold text-navy text-sm">{item.title}</h4>
                    <p className="text-xs text-slate-500 mt-1">Patient: {item.patient} • Date: {item.date}</p>
                  </div>
                  <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">{item.id}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 text-sm">No prescriptions found matching your search.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorPrescriptionsPage;
