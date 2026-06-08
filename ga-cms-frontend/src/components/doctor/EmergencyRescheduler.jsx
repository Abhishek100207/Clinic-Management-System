import React, { useState } from 'react';
import { AlertTriangle, Send, X } from 'lucide-react';

const EmergencyRescheduler = ({ isOpen, onClose, onConfirm }) => {
  const [reason, setReason] = useState('Emergency surgery required');
  const [newDate, setNewDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('12:00');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="bg-rose-600 p-6 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <AlertTriangle className="animate-pulse" />
            <h2 className="text-xl font-bold">Emergency Reschedule</h2>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-lg transition-colors">
            <X />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-600">
            Affected patients will be automatically notified and moved to a new slot.
          </p>
          
          <div>
            <label className="block text-sm font-bold text-navy mb-2">Impacted Time Range</label>
            <div className="grid grid-cols-2 gap-3">
              <input 
                type="time" 
                value={startTime} 
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-rose-500 outline-none"
              />
              <input 
                type="time" 
                value={endTime} 
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-rose-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-navy mb-2">New Proposed Date</label>
            <input 
              type="date" 
              value={newDate} 
              onChange={(e) => setNewDate(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-rose-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-navy mb-2">Message to Patients</label>
            <textarea 
              value={reason} 
              onChange={(e) => setReason(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-rose-500 outline-none min-h-[100px]"
              placeholder="Explain the emergency..."
            />
          </div>

          <button 
            onClick={() => onConfirm({ startTime, endTime, newDate, reason })}
            className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg active:scale-[0.98]"
          >
            <Send size={18} />
            Notify Affected Patients
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmergencyRescheduler;
