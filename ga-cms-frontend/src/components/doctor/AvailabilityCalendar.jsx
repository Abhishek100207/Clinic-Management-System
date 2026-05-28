import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { calendarStorage } from '../../utils/calendarStorage';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Edit3, 
  Trash2, 
  X, 
  Plus, 
  Clock, 
  MapPin, 
  Video,
  Info
} from 'lucide-react';

const AvailabilityCalendar = ({ 
  doctorId = null, 
  availabilities = [], 
  viewMode = 'admin', // 'admin' (doctor edit) or 'patient' (booking)
  onDateSelect = null, 
  selectedDate = null 
}) => {
  const { user } = useAuthStore();
  
  // Set default doctor ID:
  // If doctorId is passed, use it. Otherwise, look for logged-in doctor profile, or default to '1'.
  const resolvedDoctorId = doctorId || user?.doctor_profile?.id || '1';

  // State for Month/Year Navigation
  // If selectedDate is passed, open that month by default
  const initialDate = selectedDate ? new Date(selectedDate) : new Date();
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [viewType, setViewType] = useState('monthly'); // 'monthly' or 'weekly'
  
  // Storage trigger to force re-render when edits happen
  const [updateTrigger, setUpdateTrigger] = useState(0);

  // Edit Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingDate, setEditingDate] = useState(null);
  const [formStatus, setFormStatus] = useState('available'); // 'available', 'leave', 'hold', 'unavailable'
  const [formReason, setFormReason] = useState('');
  const [formSessions, setFormSessions] = useState([
    { start_time: '09:00', end_time: '12:00', appointment_type: 'in_person' }
  ]);

  // Sync state if selectedDate changes
  useEffect(() => {
    if (selectedDate) {
      setCurrentDate(new Date(selectedDate));
    }
  }, [selectedDate]);

  // Listen to localstorage updates for synchronization
  useEffect(() => {
    const handleStorageChange = () => {
      setUpdateTrigger(prev => prev + 1);
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Determine permissions
  // Only Doctor or Senior Doctor can edit the schedules. 
  // Others (Patient, Receptionist, Technician) can only view.
  const hasWriteAccess = viewMode === 'admin' && user && (user.role === 'doctor' || user.role === 'senior_doctor');

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Calendar calculations
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sunday, 1 = Monday, etc.

  // Navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const getStartOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day; // adjust to Sunday
    return new Date(d.setDate(diff));
  };

  const handlePrevWeek = () => {
    setCurrentDate(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 7);
      return d;
    });
  };

  const handleNextWeek = () => {
    setCurrentDate(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 7);
      return d;
    });
  };

  // Open Modal for Edit
  const handleCellClick = (dateStr, dayStatus) => {
    if (!hasWriteAccess) {
      // In patient mode, allow clicking any day to display its availability status in the booking panel
      if (viewMode === 'patient') {
        if (onDateSelect) {
          onDateSelect(dateStr);
        }
      }
      return;
    }

    setEditingDate(dateStr);
    setFormStatus(dayStatus.status);
    setFormReason(dayStatus.reason || '');
    setFormSessions(dayStatus.sessions || [
      { start_time: '09:00', end_time: '12:00', appointment_type: 'in_person' }
    ]);
    setShowModal(true);
  };

  // Modal actions
  const handleAddSession = () => {
    setFormSessions([
      ...formSessions,
      { start_time: '09:00', end_time: '12:00', appointment_type: 'in_person' }
    ]);
  };

  const handleRemoveSession = (index) => {
    setFormSessions(formSessions.filter((_, i) => i !== index));
  };

  const handleSessionChange = (index, field, value) => {
    const updated = formSessions.map((session, i) => {
      if (i === index) {
        return { ...session, [field]: value };
      }
      return session;
    });
    setFormSessions(updated);
  };

  const handleSaveOverride = () => {
    const dataToSave = {
      status: formStatus,
    };

    if (formStatus === 'leave' || formStatus === 'hold') {
      dataToSave.reason = formReason || `${formStatus === 'leave' ? 'On Leave' : 'On Hold'}`;
    } else if (formStatus === 'available') {
      dataToSave.sessions = formSessions;
    }

    calendarStorage.saveOverride(resolvedDoctorId, editingDate, dataToSave);
    setShowModal(false);
    setUpdateTrigger(prev => prev + 1);
  };

  const handleResetToDefault = () => {
    calendarStorage.deleteOverride(resolvedDoctorId, editingDate);
    setShowModal(false);
    setUpdateTrigger(prev => prev + 1);
  };

  // Render Month Cells
  const renderCells = () => {
    const cells = [];
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // Fill preceding empty cells
    for (let i = 0; i < firstDayIndex; i++) {
      cells.push(
        <div key={`empty-${i}`} className="relative w-full aspect-square">
          <div className="absolute inset-0 bg-slate-50/50 border border-slate-100 rounded-xl" />
        </div>
      );
    }

    // Fill actual day cells
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayStatus = calendarStorage.getDayStatus(resolvedDoctorId, dateStr, availabilities);
      const isSelected = selectedDate === dateStr;

      const dateObj = new Date(dateStr);
      const dayName = weekdays[dateObj.getDay()];

      let statusStyles = '';
      let tooltipText = '';
      let editIconColor = 'text-slate-400 hover:text-slate-600';
      let statusLabel = null;

      switch (dayStatus.status) {
        case 'available':
          statusStyles = isSelected 
            ? 'bg-emerald-500/25 border-2 border-emerald-500 text-emerald-950 ring-4 ring-emerald-300/30 z-10 scale-[1.02] shadow-md cursor-pointer'
            : 'bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-800 hover:-translate-y-0.5 hover:shadow-sm cursor-pointer transition-all duration-150 backdrop-blur-md';
          tooltipText = 'Available';
          editIconColor = 'text-emerald-600 hover:text-emerald-800';
          if (viewMode === 'admin') {
            statusLabel = <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider block mt-1">Available</span>;
          }
          break;
        case 'leave':
          statusStyles = isSelected
            ? 'bg-rose-500/25 border-2 border-rose-500 text-rose-950 ring-4 ring-rose-300/30 z-10 scale-[1.02] shadow-md cursor-pointer'
            : 'bg-rose-50/70 border border-rose-100 text-rose-800 hover:bg-rose-100/50 cursor-pointer transition-colors';
          tooltipText = dayStatus.reason ? `On Leave: ${dayStatus.reason}` : 'On Leave';
          editIconColor = 'text-rose-600 hover:text-rose-800';
          if (viewMode === 'admin') {
            statusLabel = <span className="text-[10px] font-black text-rose-700 uppercase tracking-wider block mt-1 truncate" title={dayStatus.reason}>Leave</span>;
          }
          break;
        case 'hold':
          statusStyles = isSelected
            ? 'bg-amber-500/25 border-2 border-amber-500 text-amber-950 ring-4 ring-amber-300/30 z-10 scale-[1.02] shadow-md cursor-pointer'
            : 'bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-800 hover:-translate-y-0.5 hover:shadow-sm cursor-pointer transition-all duration-150 backdrop-blur-md';
          tooltipText = dayStatus.reason ? `On Hold: ${dayStatus.reason}` : 'On Hold';
          editIconColor = 'text-amber-600 hover:text-amber-800';
          if (viewMode === 'admin') {
            statusLabel = <span className="text-[10px] font-black text-amber-700 uppercase tracking-wider block mt-1 truncate" title={dayStatus.reason}>Hold</span>;
          }
          break;
        default:
          statusStyles = isSelected
            ? 'bg-slate-500/20 border-2 border-slate-450 text-slate-900 ring-4 ring-slate-200/30 z-10 scale-[1.02] shadow-md cursor-pointer'
            : 'bg-slate-500/5 hover:bg-slate-500/10 border border-slate-500/10 text-slate-500 hover:-translate-y-0.5 hover:shadow-sm cursor-pointer transition-all duration-150 backdrop-blur-md';
          tooltipText = 'Closed / Unavailable';
          editIconColor = 'text-slate-400 hover:text-slate-600';
          if (viewMode === 'admin') {
            statusLabel = <span className="text-[10px] font-black text-slate-550 uppercase tracking-wider block mt-1">Closed</span>;
          }
      }

      cells.push(
        <div key={dateStr} className="relative w-full aspect-square">
          <div 
            onClick={() => handleCellClick(dateStr, dayStatus)}
            className={`absolute inset-0 p-2 flex flex-col justify-between group rounded-xl cursor-pointer ${statusStyles}`}
            title={tooltipText}
          >
            <div className="flex justify-between items-start w-full">
              <span className="font-mono font-black text-sm">{day}</span>
              {hasWriteAccess && (
                <Edit3 size={12} className={`opacity-0 group-hover:opacity-100 ${editIconColor} transition-opacity`} />
              )}
            </div>
            {statusLabel}
          </div>
        </div>
      );
    }

    return cells;
  };

  // Original Weekly View code updated to support actual calendar dates and overrides with Glassmorphism
  const renderWeeklyView = () => {
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const startOfWeek = getStartOfWeek(currentDate);

    // Generate 7 days of the week starting from Sunday
    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return d;
    });

    return (
      <div className="min-w-[700px] grid grid-cols-7 gap-3">
        {weekDays.map((dateObj) => {
          const dateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
          const dayStatus = calendarStorage.getDayStatus(resolvedDoctorId, dateStr, availabilities);
          const isSelected = selectedDate === dateStr;
          
          const dayNameShort = weekdays[dateObj.getDay()].substring(0, 3);

          let statusStyles = '';
          let statusContent = null;
          let tooltipText = '';

          switch (dayStatus.status) {
            case 'available':
              statusStyles = isSelected
                ? 'bg-emerald-500/25 border-2 border-emerald-500 text-emerald-950 ring-4 ring-emerald-300/30 scale-[1.02] shadow-md cursor-pointer'
                : 'bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-800 hover:-translate-y-0.5 hover:shadow-sm cursor-pointer transition-all duration-150 backdrop-blur-md';
              tooltipText = 'Available';

              // Show sessions/slots if available
              const dayAvails = dayStatus.sessions || [];
              statusContent = (
                <div className="flex flex-col gap-0.5 w-full min-h-0 overflow-hidden flex-1 mt-1">
                  <span className="text-[9px] font-black uppercase tracking-wider text-emerald-700 block">Available</span>
                  <div className="flex flex-col gap-1 overflow-y-auto pr-0.5 flex-1 min-h-0">
                    {dayAvails.length > 0 ? dayAvails.map((avail, i) => (
                      <div 
                        key={i} 
                        className="bg-emerald-500/15 border border-emerald-500/20 text-emerald-850 p-1 rounded-lg text-[8.5px] font-bold"
                      >
                        <div className="flex items-center gap-1">
                          <Clock size={8} />
                          <span>{avail.start_time.substring(0,5)} - {avail.end_time.substring(0,5)}</span>
                        </div>
                        <div className="mt-0.5 flex items-center gap-1 opacity-90 text-[8px]">
                          {avail.appointment_type === 'in_person' ? (
                            <>
                              <MapPin size={7} />
                              <span>Clinic</span>
                            </>
                          ) : (
                            <>
                              <Video size={7} />
                              <span>Virtual</span>
                            </>
                          )}
                        </div>
                      </div>
                    )) : (
                      <div className="text-[9px] text-emerald-600/70 italic">No custom slots</div>
                    )}
                  </div>
                </div>
              );
              break;

            case 'leave':
              statusStyles = isSelected
                ? 'bg-rose-500/25 border-2 border-rose-500 text-rose-950 ring-4 ring-rose-300/30 scale-[1.02] shadow-md cursor-pointer'
                : 'bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-800 hover:-translate-y-0.5 hover:shadow-sm cursor-pointer transition-all duration-150 backdrop-blur-md';
              tooltipText = dayStatus.reason ? `On Leave: ${dayStatus.reason}` : 'On Leave';
              statusContent = (
                <div className="flex flex-col gap-0.5 w-full mt-1 text-left">
                  <span className="text-[9px] font-black uppercase tracking-wider text-rose-700">🌴 On Leave</span>
                  <p className="text-[9px] font-bold text-rose-600/90 leading-tight truncate" title={dayStatus.reason}>
                    {dayStatus.reason || 'Personal Leave'}
                  </p>
                </div>
              );
              break;

            case 'hold':
              statusStyles = isSelected
                ? 'bg-amber-500/25 border-2 border-amber-500 text-amber-950 ring-4 ring-amber-300/30 scale-[1.02] shadow-md cursor-pointer'
                : 'bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-800 hover:-translate-y-0.5 hover:shadow-sm cursor-pointer transition-all duration-150 backdrop-blur-md';
              tooltipText = dayStatus.reason ? `On Hold: ${dayStatus.reason}` : 'On Hold';
              statusContent = (
                <div className="flex flex-col gap-0.5 w-full mt-1 text-left">
                  <span className="text-[9px] font-black uppercase tracking-wider text-amber-700">⏳ On Hold</span>
                  <p className="text-[9px] font-bold text-amber-600/90 leading-tight truncate" title={dayStatus.reason}>
                    {dayStatus.reason || 'On Hold'}
                  </p>
                </div>
              );
              break;

            default: // Closed / unavailable
              statusStyles = isSelected
                ? 'bg-slate-500/20 border-2 border-slate-450 text-slate-900 ring-4 ring-slate-200/30 scale-[1.02] shadow-md cursor-pointer'
                : 'bg-slate-500/5 hover:bg-slate-500/10 border border-slate-500/10 text-slate-550 hover:-translate-y-0.5 hover:shadow-sm cursor-pointer transition-all duration-150 backdrop-blur-md';
              tooltipText = 'Closed / Unavailable';
              statusContent = (
                <div className="flex flex-col gap-0.5 w-full mt-1 text-left">
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">🚫 Closed</span>
                </div>
              );
          }

          return (
            <div key={dateStr} className="relative w-full aspect-square">
              <div 
                onClick={() => handleCellClick(dateStr, dayStatus)}
                className={`absolute inset-0 p-2.5 flex flex-col justify-between group rounded-2xl cursor-pointer shadow-sm ${statusStyles}`}
                title={tooltipText}
              >
                <div className="flex flex-col gap-0.5 w-full text-left">
                  <span className="text-[10px] font-black uppercase tracking-wider opacity-60">{dayNameShort}</span>
                  <span className="font-mono font-black text-sm">{dateObj.getDate()}</span>
                </div>
                
                <div className="flex-1 flex flex-col justify-end w-full overflow-hidden min-h-0">
                  {statusContent}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
      {/* Calendar Header */}
      <div className="bg-slate-50 p-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <CalendarIcon size={20} />
          </div>
          <div>
            <h3 className="font-extrabold text-navy text-lg">Doctor Schedule Calendar</h3>
            <p className="text-xs text-slate-400">
              {viewMode === 'admin' 
                ? 'Manage leaves, holds, and day-to-day custom availability' 
                : 'Select an available green date to choose timeslots'}
            </p>
          </div>
        </div>

        {/* View Toggle & Month/Week Navigation */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {viewMode === 'admin' && (
            <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button 
                onClick={() => setViewType('monthly')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${viewType === 'monthly' ? 'bg-white text-navy shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Monthly Grid
              </button>
              <button 
                onClick={() => setViewType('weekly')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${viewType === 'weekly' ? 'bg-white text-navy shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Weekly View
              </button>
            </div>
          )}

          {viewType === 'monthly' && (
            <div className="flex items-center gap-1.5 bg-white border border-gray-200 px-3 py-1 rounded-lg shadow-sm">
              <button 
                onClick={handlePrevMonth}
                className="text-slate-500 hover:text-slate-800 p-1 hover:bg-slate-50 rounded"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs font-black text-navy px-1.5 uppercase tracking-wide min-w-[100px] text-center select-none">
                {monthNames[month]} {year}
              </span>
              <button 
                onClick={handleNextMonth}
                className="text-slate-500 hover:text-slate-800 p-1 hover:bg-slate-50 rounded"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}

          {viewType === 'weekly' && (
            <div className="flex items-center gap-1.5 bg-white border border-gray-200 px-3 py-1 rounded-lg shadow-sm">
              <button 
                onClick={handlePrevWeek}
                className="text-slate-500 hover:text-slate-800 p-1 hover:bg-slate-50 rounded"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs font-black text-navy px-1.5 uppercase tracking-wide min-w-[140px] text-center select-none">
                Week of {getStartOfWeek(currentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
              <button 
                onClick={handleNextWeek}
                className="text-slate-500 hover:text-slate-800 p-1 hover:bg-slate-50 rounded"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Legend Block (Only in Monthly View) */}
      {viewType === 'monthly' && (
        <div className="bg-slate-50/50 border-b border-gray-100 p-3.5 flex flex-wrap justify-center items-center gap-6 text-xs font-semibold text-slate-600">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-emerald-500 rounded-full border border-emerald-600/10"></span>
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-rose-500 rounded-full border border-rose-600/10"></span>
            <span>On Leave (Red)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-amber-500 rounded-full border border-amber-600/10"></span>
            <span>On Hold (Yellow)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-slate-300 rounded-full border border-slate-400/10"></span>
            <span>Closed / Unavailable (Gray)</span>
          </div>
        </div>
      )}

      {/* Calendar Grid/Slots Panel */}
      <div className="p-5 overflow-x-auto">
        {viewType === 'monthly' ? (
          <div className="min-w-[700px]">
            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-3 mb-3">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center py-2 bg-slate-100 border border-slate-200 rounded-lg">
                  <span className="text-xs font-black text-slate-600 uppercase tracking-wider">{day}</span>
                </div>
              ))}
            </div>
            {/* Days Cells Grid */}
            <div className="grid grid-cols-7 gap-3">
              {renderCells()}
            </div>
          </div>
        ) : (
          renderWeeklyView()
        )}
      </div>

      {/* Write Access Instructions Helper */}
      {!hasWriteAccess && viewMode === 'admin' && (
        <div className="m-5 mt-0 p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-2.5 text-blue-800 text-xs font-medium">
          <Info size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
          <span>Note: You have **Read-only** view access to this calendar. Only the assigned Doctor or Senior Doctor can configure availability, leaves, or hold sessions.</span>
        </div>
      )}

      {/* ================= EDIT STATUS DIALOG MODAL ================= */}
      {showModal && editingDate && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
              <div>
                <h4 className="font-extrabold text-base">Edit Day Status</h4>
                <p className="text-xs text-slate-400 mt-1 font-mono font-bold">Date: {editingDate}</p>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white/80 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Form */}
            <div className="p-6 space-y-6">
              {/* Status Select */}
              <div>
                <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-2">Select Day Status</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { val: 'available', label: 'Available', color: 'border-emerald-200 text-emerald-800 bg-emerald-50' },
                    { val: 'leave', label: 'On Leave', color: 'border-rose-200 text-rose-800 bg-rose-50' },
                    { val: 'hold', label: 'On Hold', color: 'border-amber-200 text-amber-800 bg-amber-50' },
                    { val: 'unavailable', label: 'Unavailable', color: 'border-slate-200 text-slate-600 bg-slate-50' }
                  ].map(opt => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => setFormStatus(opt.val)}
                      className={`py-3 px-2 rounded-xl text-xs font-bold border-2 transition-all text-center ${
                        formStatus === opt.val 
                          ? 'border-blue-600 bg-blue-50/50 text-blue-700 shadow-sm' 
                          : 'border-slate-100 hover:border-slate-200 text-slate-500 bg-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Leave or Hold Reason */}
              {(formStatus === 'leave' || formStatus === 'hold') && (
                <div className="animate-in slide-in-from-top-2 duration-200">
                  <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-2">
                    {formStatus === 'leave' ? 'Leave Reason' : 'Hold Reason'}
                  </label>
                  <input
                    type="text"
                    value={formReason}
                    onChange={(e) => setFormReason(e.target.value)}
                    placeholder={formStatus === 'leave' ? 'e.g. Annual Leave, Personal Leave' : 'e.g. Attend Medical Conference'}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold"
                    required
                  />
                </div>
              )}

              {/* Sessions Details (Only if available) */}
              {formStatus === 'available' && (
                <div className="space-y-3.5 animate-in slide-in-from-top-2 duration-200">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-black uppercase text-slate-500 tracking-wider">Configure Sessions</label>
                    <button
                      type="button"
                      onClick={handleAddSession}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100"
                    >
                      <Plus size={12} /> Add Session
                    </button>
                  </div>

                  <div className="space-y-3 max-h-[180px] overflow-y-auto pr-1">
                    {formSessions.map((session, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-2 relative">
                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-[9px] uppercase font-bold text-slate-400 mb-1">Start Time</label>
                            <input
                              type="time"
                              value={session.start_time}
                              onChange={(e) => handleSessionChange(idx, 'start_time', e.target.value)}
                              className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs font-semibold"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] uppercase font-bold text-slate-400 mb-1">End Time</label>
                            <input
                              type="time"
                              value={session.end_time}
                              onChange={(e) => handleSessionChange(idx, 'end_time', e.target.value)}
                              className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs font-semibold"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-1">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleSessionChange(idx, 'appointment_type', 'in_person')}
                              className={`px-2.5 py-1 rounded-md text-[10px] font-bold border transition-all ${
                                session.appointment_type === 'in_person' 
                                  ? 'bg-emerald-600 text-white border-emerald-600' 
                                  : 'bg-white text-slate-500 border-slate-200'
                              }`}
                            >
                              In-Person
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSessionChange(idx, 'appointment_type', 'virtual')}
                              className={`px-2.5 py-1 rounded-md text-[10px] font-bold border transition-all ${
                                session.appointment_type === 'virtual' 
                                  ? 'bg-blue-600 text-white border-blue-600' 
                                  : 'bg-white text-slate-500 border-slate-200'
                              }`}
                            >
                              Virtual
                            </button>
                          </div>

                          {formSessions.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveSession(idx)}
                              className="text-rose-600 hover:text-rose-700 p-1 hover:bg-rose-50 rounded-lg"
                              title="Delete Session"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-between items-center gap-3">
              <button
                type="button"
                onClick={handleResetToDefault}
                className="py-2.5 px-3 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                title="Reset this day back to default base weekly schedule"
              >
                <Trash2 size={14} /> Reset
              </button>

              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="py-2.5 px-4 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveOverride}
                  className="py-2.5 px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black shadow-md shadow-slate-950/10 transition-all"
                >
                  Save Schedule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AvailabilityCalendar;
