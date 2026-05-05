import React from 'react';
import { ListOrdered, Search, Filter, Clock, User } from 'lucide-react';

const QueuePage = () => {
  return (
    <div className="max-w-7xl mx-auto w-full p-4 md:p-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-navy mb-2">Live Clinic Queue</h1>
          <p className="text-slate-500">Real-time management of patient walk-ins and scheduled appointments.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Filter queue..." 
              className="bg-white border border-slate-200 pl-10 pr-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all w-64 shadow-sm"
            />
          </div>
          <button className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-blue-500 transition-colors shadow-sm">
            <Filter size={18} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-12 text-center">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <ListOrdered size={28} className="text-emerald-500" />
          </div>
          <h3 className="text-lg font-bold text-navy mb-2">Queue Management Module</h3>
          <p className="text-slate-500 text-sm max-w-xs mx-auto mb-6">
            This module will allow you to assign tokens, track wait times, and call patients to respective consulting rooms.
          </p>
          <div className="flex items-center justify-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Development in Progress</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QueuePage;
