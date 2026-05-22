// localStorage queue storage utility for GA Clinic Management System

const STORAGE_KEY = 'clinic_queue';

const MOCK_QUEUE = [
  {
    token: 'T-101',
    patientId: '1',
    patientName: 'Arjun Mehra',
    doctorId: '1',
    doctorName: 'Dr. Sarah Johnson',
    doctorRoom: 'Room 101',
    type: 'scheduled', // scheduled | walkin | emergency
    status: 'completed', // waiting | active | completed | missed | delayed
    checkInTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    waitTime: 0,
    delayOffset: 0,
    priority: 3 // 1: Emergency, 2: Walk-in, 3: Regular
  },
  {
    token: 'T-102',
    patientId: '2',
    patientName: 'Priya Sharma',
    doctorId: '2',
    doctorName: 'Dr. Robert Chen',
    doctorRoom: 'Room 102',
    type: 'scheduled',
    status: 'active',
    checkInTime: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 mins ago
    waitTime: 0,
    delayOffset: 0,
    priority: 3
  },
  {
    token: 'T-103',
    patientId: '3',
    patientName: 'Vikram Singh',
    doctorId: '1',
    doctorName: 'Dr. Sarah Johnson',
    doctorRoom: 'Room 101',
    type: 'walkin',
    status: 'waiting',
    checkInTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 mins ago
    waitTime: 15,
    delayOffset: 0,
    priority: 2
  },
  {
    token: 'T-104',
    patientId: '4',
    patientName: 'Sneha Patel',
    doctorId: '1',
    doctorName: 'Dr. Sarah Johnson',
    doctorRoom: 'Room 101',
    type: 'emergency',
    status: 'waiting',
    checkInTime: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 mins ago
    waitTime: 5,
    delayOffset: 0,
    priority: 1
  },
  {
    token: 'T-105',
    patientId: '5',
    patientName: 'Rahul Verma',
    doctorId: '2',
    doctorName: 'Dr. Robert Chen',
    doctorRoom: 'Room 102',
    type: 'scheduled',
    status: 'delayed',
    checkInTime: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    waitTime: 30,
    delayOffset: 20,
    priority: 3
  },
  {
    token: 'T-106',
    patientId: '6',
    patientName: 'Anjali Sharma',
    doctorId: '1',
    doctorName: 'Dr. Sarah Johnson',
    doctorRoom: 'Room 101',
    type: 'scheduled',
    status: 'missed',
    checkInTime: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    waitTime: 0,
    delayOffset: 0,
    priority: 3
  }
];

export const queueStorage = {
  getQueue: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_QUEUE));
        return MOCK_QUEUE;
      }
      return JSON.parse(stored);
    } catch (e) {
      console.error("Error reading queue from localStorage", e);
      return MOCK_QUEUE;
    }
  },

  saveQueue: (queue) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
      // Dispatch a storage event to synchronize tabs/views immediately
      window.dispatchEvent(new Event('storage'));
      return true;
    } catch (e) {
      console.error("Error saving queue to localStorage", e);
      return false;
    }
  },

  getQueueForDoctor: (doctorIdOrName) => {
    const queue = queueStorage.getQueue();
    return queue.filter(item => 
      item.doctorId?.toString() === doctorIdOrName?.toString() || 
      item.doctorName?.toLowerCase().includes(doctorIdOrName?.toString().toLowerCase())
    );
  },

  getQueueForPatient: (patientId) => {
    const queue = queueStorage.getQueue();
    // Return the active/waiting items first, then any completed/missed
    return queue.filter(item => item.patientId?.toString() === patientId?.toString());
  },

  checkInPatient: (checkInData) => {
    try {
      const queue = queueStorage.getQueue();
      
      // Calculate token number (sequential)
      const numericTokens = queue.map(item => parseInt(item.token.replace('T-', ''))).filter(n => !isNaN(n));
      const nextNum = numericTokens.length > 0 ? Math.max(...numericTokens) + 1 : 101;
      const token = `T-${nextNum}`;

      let priority = 3; // default regular
      if (checkInData.type === 'emergency') priority = 1;
      else if (checkInData.type === 'walkin') priority = 2;

      const newItem = {
        token,
        patientId: checkInData.patientId?.toString() || 'PAT-' + Math.floor(100 + Math.random() * 900),
        patientName: checkInData.patientName || 'Walk-in Patient',
        doctorId: checkInData.doctorId?.toString() || '1',
        doctorName: checkInData.doctorName || 'Dr. Sarah Johnson',
        doctorRoom: checkInData.doctorRoom || (checkInData.doctorId?.toString() === '2' ? 'Room 102' : 'Room 101'),
        type: checkInData.type || 'walkin',
        status: 'waiting',
        checkInTime: new Date().toISOString(),
        waitTime: 15, // base wait estimation
        delayOffset: 0,
        priority
      };

      queue.push(newItem);
      queueStorage.saveQueue(queue);
      return newItem;
    } catch (e) {
      console.error("Error checking in patient", e);
      return null;
    }
  },

  updatePatientStatus: (token, status) => {
    try {
      const queue = queueStorage.getQueue();
      const updated = queue.map(item => {
        if (item.token === token) {
          // If called, play notification and voice synthesis if enabled
          if (status === 'active') {
            queueStorage.triggerVoiceCall(item);
          }
          return {
            ...item,
            status,
            // If active/completed, clear wait time estimation
            waitTime: (status === 'active' || status === 'completed') ? 0 : item.waitTime
          };
        }
        return item;
      });
      queueStorage.saveQueue(updated);
      return true;
    } catch (e) {
      console.error("Error updating patient queue status", e);
      return false;
    }
  },

  setEmergency: (token, isEmergency) => {
    try {
      const queue = queueStorage.getQueue();
      const updated = queue.map(item => {
        if (item.token === token) {
          return {
            ...item,
            type: isEmergency ? 'emergency' : 'scheduled',
            priority: isEmergency ? 1 : 3,
            // Emergency has minimal wait time
            waitTime: isEmergency ? 5 : item.waitTime
          };
        }
        return item;
      });
      queueStorage.saveQueue(updated);
      return true;
    } catch (e) {
      console.error("Error setting emergency status", e);
      return false;
    }
  },

  setDelay: (token, delayMinutes) => {
    try {
      const queue = queueStorage.getQueue();
      const updated = queue.map(item => {
        if (item.token === token) {
          return {
            ...item,
            status: 'delayed',
            delayOffset: Number(delayMinutes) || 15
          };
        }
        return item;
      });
      queueStorage.saveQueue(updated);
      return true;
    } catch (e) {
      console.error("Error setting delay", e);
      return false;
    }
  },

  rescheduleMissed: (token, doctorId = null, doctorName = null) => {
    try {
      const queue = queueStorage.getQueue();
      const updated = queue.map(item => {
        if (item.token === token) {
          return {
            ...item,
            status: 'waiting',
            checkInTime: new Date().toISOString(), // reset check-in time to push back
            doctorId: doctorId?.toString() || item.doctorId,
            doctorName: doctorName || item.doctorName,
            delayOffset: 0,
            waitTime: 15
          };
        }
        return item;
      });
      queueStorage.saveQueue(updated);
      return true;
    } catch (e) {
      console.error("Error rescheduling missed patient", e);
      return false;
    }
  },

  triggerVoiceCall: (item) => {
    try {
      if ('speechSynthesis' in window) {
        // Stop current speech first
        window.speechSynthesis.cancel();
        
        // Simple chime sound simulation using Web Audio API
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440, audioCtx.currentTime); // A4
        oscillator.frequency.setValueAtTime(554.37, audioCtx.currentTime + 0.15); // C#5
        oscillator.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.3); // E5
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.6);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.6);

        // Speech announcement
        setTimeout(() => {
          const announcement = `Token number ${item.token.replace('T-', 'T ')}, ${item.patientName}, please proceed to ${item.doctorRoom}, ${item.doctorName}.`;
          const utterance = new SpeechSynthesisUtterance(announcement);
          utterance.rate = 0.9; // slightly slower for clarity
          utterance.pitch = 1.0;
          window.speechSynthesis.speak(utterance);
        }, 700);
      }
    } catch (err) {
      console.error("Browser text-to-speech failed", err);
    }
  }
};
