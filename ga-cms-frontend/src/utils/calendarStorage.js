import apiClient from '../api/axios';

const CALENDAR_STORAGE_KEY = 'gacms_doctor_calendar_overrides';

// Fallback weekly availability for doctors (Mon-Fri) if not retrieved from profile
const DEFAULT_WEEKLY_AVAILABILITY = [
  { day_of_week: 1, start_time: '09:00', end_time: '13:00', appointment_type: 'in_person' },
  { day_of_week: 1, start_time: '14:00', end_time: '18:00', appointment_type: 'virtual' },
  { day_of_week: 2, start_time: '09:00', end_time: '13:00', appointment_type: 'in_person' },
  { day_of_week: 2, start_time: '14:00', end_time: '18:00', appointment_type: 'virtual' },
  { day_of_week: 3, start_time: '09:00', end_time: '13:00', appointment_type: 'in_person' },
  { day_of_week: 3, start_time: '14:00', end_time: '18:00', appointment_type: 'virtual' },
  { day_of_week: 4, start_time: '09:00', end_time: '13:00', appointment_type: 'in_person' },
  { day_of_week: 4, start_time: '14:00', end_time: '18:00', appointment_type: 'virtual' },
  { day_of_week: 5, start_time: '09:00', end_time: '13:00', appointment_type: 'in_person' },
  { day_of_week: 5, start_time: '14:00', end_time: '18:00', appointment_type: 'virtual' },
  { day_of_week: 6, start_time: '09:00', end_time: '13:00', appointment_type: 'in_person' },
  { day_of_week: 6, start_time: '14:00', end_time: '18:00', appointment_type: 'virtual' },
];

export const calendarStorage = {
  // Sync overrides from backend into localstorage cache
  syncWithBackend: async (doctorId) => {
    try {
      const docIdStr = doctorId ? doctorId.toString() : '1';
      const res = await apiClient.get(`/api/appointments/overrides/?doctor_id=${docIdStr}`);
      const overridesList = Array.isArray(res.data) ? res.data : (res.data.results || []);
      
      const formattedOverrides = {};
      overridesList.forEach(ov => {
        formattedOverrides[ov.date] = {
          id: ov.id,
          status: ov.status,
          reason: ov.reason || '',
          sessions: ov.sessions || []
        };
      });
      
      const localDataStr = localStorage.getItem(CALENDAR_STORAGE_KEY);
      const all = localDataStr ? JSON.parse(localDataStr) : {};
      all[docIdStr] = formattedOverrides;
      localStorage.setItem(CALENDAR_STORAGE_KEY, JSON.stringify(all));
      
      window.dispatchEvent(new Event('storage'));
      return formattedOverrides;
    } catch (e) {
      console.error('Failed to sync calendar overrides with backend', e);
      return {};
    }
  },

  // Get all overrides for a specific doctor
  getOverrides: (doctorId) => {
    try {
      const data = localStorage.getItem(CALENDAR_STORAGE_KEY);
      const all = data ? JSON.parse(data) : {};
      const key = doctorId ? doctorId.toString() : '1';
      return all[key] || {};
    } catch (e) {
      console.error('Error reading calendar overrides', e);
      return {};
    }
  },

  // Save an override for a specific doctor and date
  saveOverride: async (doctorId, dateStr, overrideDetails) => {
    try {
      const docIdStr = doctorId ? doctorId.toString() : '1';
      
      // Update local storage synchronously first
      const data = localStorage.getItem(CALENDAR_STORAGE_KEY);
      const all = data ? JSON.parse(data) : {};
      
      if (!all[docIdStr]) {
        all[docIdStr] = {};
      }
      
      all[docIdStr][dateStr] = overrideDetails;
      localStorage.setItem(CALENDAR_STORAGE_KEY, JSON.stringify(all));
      window.dispatchEvent(new Event('storage'));
      
      // Save to backend asynchronously
      const payload = {
        doctor: parseInt(docIdStr),
        date: dateStr,
        status: overrideDetails.status,
        reason: overrideDetails.reason || '',
        sessions: overrideDetails.sessions || null
      };
      
      await apiClient.post('/api/appointments/overrides/', payload);
      
      // Sync again to make sure everything matches
      calendarStorage.syncWithBackend(docIdStr);
      return true;
    } catch (e) {
      console.error('Error saving calendar override to backend', e);
      return false;
    }
  },

  // Delete/reset an override for a specific doctor and date
  deleteOverride: async (doctorId, dateStr) => {
    try {
      const docIdStr = doctorId ? doctorId.toString() : '1';
      
      // Delete from local storage synchronously first
      const data = localStorage.getItem(CALENDAR_STORAGE_KEY);
      const all = data ? JSON.parse(data) : {};
      
      if (all[docIdStr] && all[docIdStr][dateStr]) {
        delete all[docIdStr][dateStr];
        localStorage.setItem(CALENDAR_STORAGE_KEY, JSON.stringify(all));
        window.dispatchEvent(new Event('storage'));
      }
      
      // Delete from backend asynchronously
      await apiClient.delete(`/api/appointments/overrides/by-date/?doctor_id=${docIdStr}&date=${dateStr}`);
      
      // Sync again to verify
      calendarStorage.syncWithBackend(docIdStr);
      return true;
    } catch (e) {
      console.error('Error deleting calendar override from backend', e);
      return false;
    }
  },

  // Helper to determine the status of a specific day for a doctor
  getDayStatus: (doctorId, dateStr, dbAvailabilities = []) => {
    const overrides = calendarStorage.getOverrides(doctorId);
    
    // 1. Check if there's a custom override
    if (overrides && overrides[dateStr]) {
      return overrides[dateStr];
    }

    // Convert date string to weekday index
    const dateObj = new Date(dateStr);
    const jsDay = dateObj.getDay(); // 0 = Sunday, 1 = Monday, ... 6 = Saturday
    
    // Map JS day to Python model: 0 = Monday, ..., 6 = Sunday
    // Django model: 0 = Mon, 1 = Tue, 2 = Wed, 3 = Thu, 4 = Fri, 5 = Sat, 6 = Sun
    const pyDay = jsDay === 0 ? 6 : jsDay - 1;

    // 2. Check if doctor has database weekly availabilities
    const matchingWeekly = dbAvailabilities.filter(
      (a) => a.day_of_week === pyDay || a.day_of_week === jsDay
    );

    if (matchingWeekly.length > 0) {
      return {
        status: 'available',
        sessions: matchingWeekly.map((w) => ({
          start_time: w.start_time.substring(0, 5),
          end_time: w.end_time.substring(0, 5),
          appointment_type: w.appointment_type,
        })),
      };
    }

    // 3. Fall back to frontend default weekly availability (Mon-Fri)
    const fallbackWeekly = DEFAULT_WEEKLY_AVAILABILITY.filter((a) => a.day_of_week === jsDay);
    if (fallbackWeekly.length > 0) {
      return {
        status: 'available',
        sessions: fallbackWeekly.map((f) => ({
          start_time: f.start_time,
          end_time: f.end_time,
          appointment_type: f.appointment_type,
        })),
      };
    }

    // 4. Default to closed/unavailable
    return {
      status: 'unavailable',
    };
  },
};
