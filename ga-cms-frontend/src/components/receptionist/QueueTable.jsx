import React, { memo } from 'react';
import { User, Clock, ArrowRight } from 'lucide-react';

// PERF: Memoize component to prevent unnecessary re-renders
const QueueTable = memo(({ queue = [] }) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-xl font-bold text-navy flex items-center gap-2">
          <Clock className="text-amber-500" size={22} />
          Current Queue
        </h2>
        <span className="text-xs font-bold bg-amber-100 text-amber-700 px-3 py-1 rounded-full">
          {queue.length} Patients Waiting
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50">
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Token</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Patient Name</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Doctor</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Waiting</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {queue.length > 0 ? (
              queue.map((item, i) => (
                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      #{item.token}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <User size={16} />
                      </div>
                      <span className="font-bold text-navy">{item.patientName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                    {item.doctorName}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {item.waitTime} mins
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-blue-600 hover:text-blue-700 font-bold text-sm flex items-center gap-1 group">
                      Call Next <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center text-slate-400 italic">
                  Queue is currently empty.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
});

export default QueueTable;
