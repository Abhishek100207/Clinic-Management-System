import React, { useState, useEffect } from 'react';
import { X, Calendar as CalIcon, Loader2 } from 'lucide-react';
import api from '../../../api/axios';

const RescheduleModal = ({ isOpen, onClose, onConfirm, appointment }) => {
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [reason, setReason] = useState('');
  const [slots, setSlots] = useState([]);
  const [fetchingSlots, setFetchingSlots] = useState(false);

  // Reset fields whenever the modal opens for a new appointment
  useEffect(() => {
    if (isOpen) {
      setNewDate('');
      setNewTime('');
      setReason('');
      setSlots([]);
    }
  }, [isOpen, appointment?.id]);

  // Fetch available slots whenever date changes
  useEffect(() => {
    if (!newDate || !appointment?.doctor) return;

    const doctorId = appointment.doctor;
    const apptType = appointment.appointment_type || 'in_person';

    const fetchSlots = async () => {
      setFetchingSlots(true);
      setNewTime('');
      setSlots([]);
      try {
        const res = await api.get(
          `/api/appointments/slots/?doctor_id=${doctorId}&date=${newDate}&appointment_type=${apptType}`
        );
        const allSlots = res.data.available_slots || [];

        // Get today's date string in YYYY-MM-DD (local)
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
        const isToday = newDate === todayStr;
        const nowMinutes = isToday ? today.getHours() * 60 + today.getMinutes() : 0;

        // Filter by appointment type window and hide past slots for today
        const filtered = allSlots.filter(s => {
          const hour   = parseInt((s.time || '').substring(0, 2) || '0');
          const minute = parseInt((s.time || '00:00').substring(3, 5) || '0');
          const inWindow = apptType === 'in_person'
            ? hour >= 9 && hour < 13
            : hour >= 14 && hour < 18;
          if (!inWindow) return false;
          if (isToday && (hour * 60 + minute) <= nowMinutes) return false;
          return true;
        });

        setSlots(filtered);
      } catch (err) {
        console.error('Failed to fetch slots', err);
        setSlots([]);
      } finally {
        setFetchingSlots(false);
      }
    };

    fetchSlots();
  }, [newDate, appointment?.doctor, appointment?.appointment_type]);

  if (!isOpen) return null;

  // Minimum date: today
  const minDate = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  })();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">

        {/* Header */}
        <div className="bg-blue-600 p-6 text-white">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Reschedule Appointment</h2>
            <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>
          <p className="text-blue-100 text-sm mt-1 opacity-90">
            For {appointment?.patient_name || appointment?.doctor_name}
          </p>
        </div>

        <div className="p-8 space-y-5">

          {/* Date picker */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">New Date</label>
            <div className="relative">
              <CalIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="date"
                value={newDate}
                min={minDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Time slot picker */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Select Time Slot
            </label>

            {!newDate && (
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-400 text-xs italic text-center">
                Please select a date first
              </div>
            )}

            {newDate && fetchingSlots && (
              <div className="flex items-center gap-2 text-blue-600 text-xs font-semibold p-3 bg-blue-50 rounded-xl">
                <Loader2 size={14} className="animate-spin" />
                Checking available slots…
              </div>
            )}

            {newDate && !fetchingSlots && slots.length === 0 && (
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-amber-700 text-xs text-center">
                No available slots on this date. Please try another date.
              </div>
            )}

            {newDate && !fetchingSlots && slots.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {slots.map(s => {
                  const label = s.time?.substring(0, 5) || s.time;
                  const isSelected = newTime === s.time;
                  return (
                    <button
                      key={s.time}
                      type="button"
                      disabled={!s.available}
                      onClick={() => setNewTime(s.time)}
                      className={`py-2 px-1 rounded-xl text-xs font-bold transition-all border ${
                        isSelected
                          ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200'
                          : s.available
                            ? 'bg-white border-slate-200 text-slate-600 hover:border-blue-400 hover:bg-blue-50'
                            : 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed opacity-50'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Reason */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Reason</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="E.g. Doctor unavailable, Patient requested change..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-colors h-24 resize-none text-sm"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm({ new_date: newDate, new_time: newTime, reason })}
              disabled={!newDate || !newTime || !reason.trim()}
              className="flex-1 bg-blue-600 text-white font-bold px-8 py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RescheduleModal;
