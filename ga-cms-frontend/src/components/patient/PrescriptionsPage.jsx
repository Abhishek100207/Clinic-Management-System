import React from 'react';
import { FileText, Download, Pill, Calendar } from 'lucide-react';

const PrescriptionsPage = () => {
  return (
    <div className="max-w-4xl mx-auto w-full p-4 md:p-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-navy mb-2">My Prescriptions</h1>
        <p className="text-slate-500">View and download prescriptions from your consultations.</p>
      </div>

      <div className="space-y-4">
        {[
          { id: 'RX-9901', doctor: 'Dr. Sarah Johnson', date: 'May 04, 2026', title: 'Standard Prescription' },
          { id: 'RX-8452', doctor: 'Dr. Robert Chen', date: 'April 20, 2026', title: 'Post-Surgery Medication' },
        ].map((item, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <Pill size={24} />
              </div>
              <div>
                <h3 className="font-bold text-navy">{item.title}</h3>
                <p className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                   <span className="font-medium text-slate-700">{item.doctor}</span> • <Calendar size={12} /> {item.date}
                </p>
              </div>
            </div>
            <button className="p-3 bg-slate-50 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-xl transition-colors">
              <Download size={20} />
            </button>
          </div>
        ))}

        <div className="mt-12 py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-center">
          <FileText size={48} className="text-slate-200 mx-auto mb-4" />
          <p className="text-slate-400 text-sm font-medium">Digital signatures pending for recent records.</p>
        </div>
      </div>
    </div>
  );
};

export default PrescriptionsPage;
