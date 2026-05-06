import React from 'react';
import { LineChart, Search, Target, Award, Star } from 'lucide-react';

const AdminStaffPerformancePage = () => {
  return (
    <div className="max-w-7xl mx-auto w-full p-4 md:p-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-navy mb-2">Staff Performance & KPIs</h1>
        <p className="text-slate-500">Monitor productivity, patient feedback, and efficiency metrics for all clinic staff.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm text-center">
          <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Target size={24} className="text-blue-500" />
          </div>
          <h3 className="font-bold text-navy mb-1">Efficiency Index</h3>
          <p className="text-3xl font-black text-blue-600">92%</p>
          <p className="text-xs text-slate-400 mt-2 font-medium">System-wide average</p>
        </div>
        
        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm text-center">
          <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Star size={24} className="text-amber-500" />
          </div>
          <h3 className="font-bold text-navy mb-1">Patient Satisfaction</h3>
          <p className="text-3xl font-black text-amber-600">4.8/5</p>
          <p className="text-xs text-slate-400 mt-2 font-medium">Based on 150+ reviews</p>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm text-center">
          <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Award size={24} className="text-emerald-500" />
          </div>
          <h3 className="font-bold text-navy mb-1">Staff Utilization</h3>
          <p className="text-3xl font-black text-emerald-600">85%</p>
          <p className="text-xs text-slate-400 mt-2 font-medium">Current shift load</p>
        </div>

        <div className="md:col-span-2 lg:col-span-3 bg-white p-12 rounded-3xl border border-gray-100 shadow-sm text-center">
          <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <LineChart size={28} className="text-indigo-500" />
          </div>
          <h3 className="text-lg font-bold text-navy mb-2">Detailed Performance Metrics</h3>
          <p className="text-slate-500 text-sm max-w-sm mx-auto">
            Analytical view of average consultation times, response rates, and service completion speed.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminStaffPerformancePage;
