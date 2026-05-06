import React from 'react';
import { IndianRupee, TrendingUp, Download, Calendar, BarChart3 } from 'lucide-react';

const AdminRevenuePage = () => {
  return (
    <div className="max-w-7xl mx-auto w-full p-4 md:p-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-navy mb-2">Financial Analytics</h1>
          <p className="text-slate-500">Track clinic revenue, insurance claims, and financial performance.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-emerald-600 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all">
            <Download size={18} />
            Generate Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center h-full flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
              <BarChart3 size={28} className="text-emerald-500" />
            </div>
            <h3 className="text-lg font-bold text-navy mb-2">Revenue Streams</h3>
            <p className="text-slate-500 text-sm max-w-xs mx-auto">
              Visual analytics of consultation fees, scan charges, and pharmacy sales.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
          <h3 className="font-bold text-navy text-lg mb-6">Financial Summary</h3>
          <div className="space-y-6">
            <div className="p-4 bg-emerald-50 rounded-2xl">
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Today's Total</p>
              <p className="text-3xl font-black text-navy flex items-center gap-1">
                <IndianRupee size={24} className="text-emerald-500" /> 45,200
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-medium">Consultations</span>
                <span className="font-bold text-navy">₹18,500</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-medium">Diagnostic Scans</span>
                <span className="font-bold text-navy">₹22,400</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-medium">Other Services</span>
                <span className="font-bold text-navy">₹4,300</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminRevenuePage;
