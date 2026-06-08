import apiClient from '../api/axios';

export const queueStorage = {
  getQueue: async () => {
    try {
      const todayStr = (() => {
        const d = new Date();
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
      })();
      const response = await apiClient.get(`/api/appointments/appointments/?date=${todayStr}`);
      
      const todayQueue = response.data.filter(item => {
        if (!item.date) return false;
        const [year, month, day] = item.date.split('-').map(Number);
        const d = new Date(year, month - 1, day);
        const today = new Date();
        const isToday = d.getDate() === today.getDate() &&
                       d.getMonth() === today.getMonth() &&
                       d.getFullYear() === today.getFullYear();
                       
        const hasTokenOrQueueState = item.queue_token || ['confirmed', 'checked_in', 'in_progress', 'completed', 'cancelled', 'rescheduled'].includes(item.status);
        return isToday && hasTokenOrQueueState;
      });
      
      return todayQueue.map(item => {
        let qStatus = 'waiting';
        if (item.status === 'in_progress') qStatus = 'active';
        else if (item.status === 'completed') qStatus = 'completed';
        else if (item.status === 'cancelled') qStatus = 'missed';
        else if (item.status === 'rescheduled') qStatus = 'delayed';
        // If checked_in but has a delay_offset, show as delayed
        else if (item.status === 'checked_in' && item.delay_offset > 0) qStatus = 'delayed';
        
        return {
          id: item.id,
          token: item.queue_token || `T-${item.id + 100}`,
          patientId: item.patient,
          patientName: item.patient_name || 'Patient',
          doctorId: item.doctor,
          doctorName: item.doctor_name || 'Doctor',
          doctorRoom: item.doctor === 2 ? 'Room 102' : 'Room 101',
          type: item.queue_type || 'scheduled',
          status: qStatus,
          checkInTime: item.check_in_time || item.created_at,
          waitTime: ['active', 'completed'].includes(item.status) ? 0 : (item.queue_type === 'emergency' ? 5 : 15),
          delayOffset: item.delay_offset || 0,
          priority: item.priority || 3
        };
      });
    } catch (err) {
      console.error("Failed to getQueue from backend:", err);
      return [];
    }
  },

  getQueueForDoctor: async (doctorIdOrName) => {
    const queue = await queueStorage.getQueue();
    return queue.filter(item => 
      item.doctorId?.toString() === doctorIdOrName?.toString() || 
      item.doctorName?.toLowerCase().includes(doctorIdOrName?.toString().toLowerCase())
    );
  },

  getQueueForPatient: async (patientId) => {
    const queue = await queueStorage.getQueue();
    return queue.filter(item => item.patientId?.toString() === patientId?.toString());
  },

  checkInPatient: async (checkInData) => {
    try {
      const payload = {
        patient: checkInData.patientId,
        doctor: checkInData.doctorId,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().split(' ')[0].substring(0, 5),
        appointment_type: 'in_person',
        status: 'checked_in',
        queue_type: checkInData.type || 'walkin'
      };
      
      const response = await apiClient.post('/api/appointments/appointments/', payload);
      const item = response.data;
      
      return {
        id: item.id,
        token: item.queue_token,
        patientId: item.patient,
        patientName: item.patient_name,
        doctorId: item.doctor,
        doctorName: item.doctor_name,
        doctorRoom: item.doctor === 2 ? 'Room 102' : 'Room 101',
        type: item.queue_type,
        status: 'waiting',
        checkInTime: item.check_in_time,
        waitTime: item.queue_type === 'emergency' ? 5 : 15,
        delayOffset: 0,
        priority: item.priority
      };
    } catch (err) {
      console.error("Failed to checkInPatient:", err);
      return null;
    }
  },

  updatePatientStatus: async (token, status) => {
    try {
      const queue = await queueStorage.getQueue();
      const item = queue.find(x => x.token === token);
      if (!item) return false;
      
      let dbStatus = 'checked_in';
      if (status === 'active') dbStatus = 'in_progress';
      else if (status === 'completed') dbStatus = 'completed';
      else if (status === 'missed') dbStatus = 'cancelled';
      
      await apiClient.patch(`/api/appointments/appointments/${item.id}/`, {
        status: dbStatus
      });
      
      if (status === 'active') {
        queueStorage.triggerVoiceCall(item);
      }
      return true;
    } catch (err) {
      console.error("Failed to updatePatientStatus:", err);
      return false;
    }
  },

  setEmergency: async (token, isEmergency) => {
    try {
      const queue = await queueStorage.getQueue();
      const item = queue.find(x => x.token === token);
      if (!item) return false;
      
      await apiClient.post(`/api/appointments/appointments/${item.id}/set-emergency/`, {
        is_emergency: isEmergency
      });
      return true;
    } catch (err) {
      console.error("Failed to setEmergency:", err);
      return false;
    }
  },

  setDelay: async (token, delayMinutes) => {
    try {
      const queue = await queueStorage.getQueue();
      const item = queue.find(x => x.token === token);
      if (!item) return false;
      
      await apiClient.post(`/api/appointments/appointments/${item.id}/set-delay/`, {
        delay_minutes: delayMinutes
      });
      return true;
    } catch (err) {
      console.error("Failed to setDelay:", err);
      return false;
    }
  },

  rescheduleMissed: async (token, doctorId = null) => {
    try {
      const queue = await queueStorage.getQueue();
      const item = queue.find(x => x.token === token);
      if (!item) return false;
      
      await apiClient.post(`/api/appointments/appointments/${item.id}/reschedule-missed/`, {
        doctor_id: doctorId
      });
      return true;
    } catch (err) {
      console.error("Failed to rescheduleMissed:", err);
      return false;
    }
  },

  triggerVoiceCall: (item) => {
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440, audioCtx.currentTime); 
        oscillator.frequency.setValueAtTime(554.37, audioCtx.currentTime + 0.15); 
        oscillator.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.3); 
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.6);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.6);

        setTimeout(() => {
          const announcement = `Token number ${item.token.replace('T-', 'T ')}, ${item.patientName}, please proceed to ${item.doctorRoom}, ${item.doctorName}.`;
          const utterance = new SpeechSynthesisUtterance(announcement);
          utterance.rate = 0.9; 
          utterance.pitch = 1.0;
          window.speechSynthesis.speak(utterance);
        }, 700);
      }
    } catch (err) {
      console.error("Browser text-to-speech failed", err);
    }
  }
};
