import React from 'react';

const AvailabilityCalendar = ({ availabilities = [] }) => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
      <div className="bg-slate-50 p-4 border-b border-gray-100 flex justify-between items-center">
        <h3 className="font-bold text-navy">Weekly Availability</h3>
        <button className="text-xs font-semibold text-blue-600 hover:underline">Edit Schedule</button>
      </div>
      <div className="p-4 overflow-x-auto">
        <div className="min-w-[600px] grid grid-cols-7 gap-2">
          {days.map((day, idx) => {
            const dayAvails = availabilities.filter(a => a.day_of_week === idx);
            return (
              <div key={day} className="flex flex-col gap-2">
                <div className="text-center py-2 bg-gray-50 rounded-lg">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{day}</span>
                </div>
                <div className="flex flex-col gap-1 min-h-[100px]">
                  {dayAvails.length > 0 ? dayAvails.map((avail, i) => (
                    <div key={i} className="bg-blue-50 border border-blue-100 p-2 rounded-[6px] text-[10px] text-blue-800">
                      <div className="font-bold">{avail.start_time.substring(0,5)} - {avail.end_time.substring(0,5)}</div>
                      <div className="opacity-75">{avail.appointment_type === 'in_person' ? '🏥 Clinic' : '💻 Virtual'}</div>
                    </div>
                  )) : (
                    <div className="h-full border border-dashed border-gray-100 rounded-[6px] flex items-center justify-center">
                      <span className="text-[10px] text-slate-300">Closed</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AvailabilityCalendar;
