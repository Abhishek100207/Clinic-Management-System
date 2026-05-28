const CALENDAR_STORAGE_KEY = 'gacms_doctor_calendar_overrides';

// Fallback weekly availability for doctors (Mon-Fri) if not retrieved from profile
const DEFAULT_WEEKLY_AVAILABILITY = [
  // Mon (0=Mon in Python, but let's align: we will map JS getDay() to day_of_week)
  // JS getDay(): 0 = Sun, 1 = Mon, 2 = Tue, 3 = Wed, 4 = Thu, 5 = Fri, 6 = Sat
  { day_of_week: 1, start_time: '09:00', end_time: '13:00', appointment_type: 'in_person' },
  { day_of_week: 1, start_time: '14:00', end_time: '18:00', appointment_type: 'virtual' },
  // Tue (2)
  { day_of_week: 2, start_time: '09:00', end_time: '13:00', appointment_type: 'in_person' },
  { day_of_week: 2, start_time: '14:00', end_time: '18:00', appointment_type: 'virtual' },
  // Wed (3)
  { day_of_week: 3, start_time: '09:00', end_time: '13:00', appointment_type: 'in_person' },
  { day_of_week: 3, start_time: '14:00', end_time: '18:00', appointment_type: 'virtual' },
  // Thu (4)
  { day_of_week: 4, start_time: '09:00', end_time: '13:00', appointment_type: 'in_person' },
  { day_of_week: 4, start_time: '14:00', end_time: '18:00', appointment_type: 'virtual' },
  // Fri (5)
  { day_of_week: 5, start_time: '09:00', end_time: '13:00', appointment_type: 'in_person' },
  { day_of_week: 5, start_time: '14:00', end_time: '18:00', appointment_type: 'virtual' },
];

const SEED_DATA = {
  // Key: doctorId (we will use string keys like '1', '2', or 'default')
  // We seed the specific June 2026 data matching the user's reference drawing:
  // June 27, 2026: Available (In Person 9-12, Virtual 2-5pm)
  // June 28, 2026: On Leave
  // June 29, 2026: On Leave
  // June 30, 2026: On Leave
  // June 24, 2026: On Hold
  '1': {
    '2026-06-24': {
      status: 'hold',
      reason: 'Attending Medical Conference',
    },
    '2026-06-27': {
      status: 'available',
      sessions: [
        { start_time: '09:00', end_time: '12:00', appointment_type: 'in_person' },
        { start_time: '14:00', end_time: '17:00', appointment_type: 'virtual' }
      ]
    },
    '2026-06-28': {
      status: 'leave',
      reason: 'On Leave (Weekend/Personal)',
    },
    '2026-06-29': {
      status: 'leave',
      reason: 'On Leave (Annual)',
    },
    '2026-06-30': {
      status: 'leave',
      reason: 'On Leave (Annual)',
    }
  },
  '2': {
    '2026-06-24': {
      status: 'hold',
      reason: 'On Leave (Medical)',
    }
  }
};

// Auto seed the localStorage if it doesn't exist yet
const initializeSeedData = () => {
  if (!localStorage.getItem(CALENDAR_STORAGE_KEY)) {
    localStorage.setItem(CALENDAR_STORAGE_KEY, JSON.stringify(SEED_DATA));
  }
};

initializeSeedData();

export const calendarStorage = {
  // Get all overrides for a specific doctor
  getOverrides: (doctorId) => {
    try {
      initializeSeedData();
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
  saveOverride: (doctorId, dateStr, overrideDetails) => {
    try {
      const data = localStorage.getItem(CALENDAR_STORAGE_KEY);
      const all = data ? JSON.parse(data) : {};
      const key = doctorId ? doctorId.toString() : '1';
      
      if (!all[key]) {
        all[key] = {};
      }
      
      all[key][dateStr] = overrideDetails;
      localStorage.setItem(CALENDAR_STORAGE_KEY, JSON.stringify(all));
      
      // Dispatch storage event to notify other components/tabs
      window.dispatchEvent(new Event('storage'));
      return true;
    } catch (e) {
      console.error('Error saving calendar override', e);
      return false;
    }
  },

  // Delete/reset an override for a specific doctor and date
  deleteOverride: (doctorId, dateStr) => {
    try {
      const data = localStorage.getItem(CALENDAR_STORAGE_KEY);
      const all = data ? JSON.parse(data) : {};
      const key = doctorId ? doctorId.toString() : '1';
      
      if (all[key] && all[key][dateStr]) {
        delete all[key][dateStr];
        localStorage.setItem(CALENDAR_STORAGE_KEY, JSON.stringify(all));
        window.dispatchEvent(new Event('storage'));
        return true;
      }
      return false;
    } catch (e) {
      console.error('Error deleting calendar override', e);
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
