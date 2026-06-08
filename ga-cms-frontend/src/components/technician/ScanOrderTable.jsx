import React from 'react';
import { Microscope, FileUp, Clock, User } from 'lucide-react';

const ScanOrderTable = ({ orders = [] }) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-xl font-bold text-navy flex items-center gap-2">
          <Microscope className="text-blue-500" size={22} />
          Scan Orders Queue
        </h2>
        <span className="text-xs font-bold bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
          {orders.length} Active Orders
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50">
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Order ID</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Patient</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Scan Type</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Doctor</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Priority</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {orders.length > 0 ? (
              orders.map((order, i) => (
                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-mono font-bold text-slate-600">
                      #{order.id}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <User size={16} />
                      </div>
                      <span className="font-bold text-navy">{order.patientName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded">
                      {order.scanType}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {order.doctorName}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded uppercase ${
                      order.priority === 'Urgent' ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {order.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-bold text-sm">
                      <FileUp size={16} /> Upload Results
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center text-slate-400 italic">
                  No scan orders in queue.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ScanOrderTable;
