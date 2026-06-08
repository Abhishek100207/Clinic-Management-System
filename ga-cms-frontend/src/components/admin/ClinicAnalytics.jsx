import React from 'react';
import { BarChart3 } from 'lucide-react';

// PERF: Extracted heavy chart component for lazy loading
const ClinicAnalytics = () => {
  return (
    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-6">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl font-bold text-navy flex items-center gap-2">
          <BarChart3 className="text-blue-500" size={22} />
          Clinic Analytics
        </h2>
        <select className="bg-slate-50 border-none text-xs font-bold text-slate-500 rounded-lg px-3 py-2 outline-none">
          <option>Last 30 Days</option>
          <option>Last 7 Days</option>
        </select>
      </div>
      <div className="h-64 flex items-end justify-between gap-2 px-2">
        {[65, 45, 75, 55, 90, 70, 85, 60, 95, 75, 80, 85].map((h, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
            <div 
              className="w-full bg-indigo-100 group-hover:bg-indigo-500 rounded-t-lg transition-all duration-500 cursor-pointer relative"
              style={{ height: `${h}%` }}
            >
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                {h*10}
              </div>
            </div>
            <span className="text-[10px] font-bold text-slate-400">M{i+1}</span>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ClinicAnalytics;
