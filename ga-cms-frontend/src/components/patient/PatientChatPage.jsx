import React, { useState, useEffect } from 'react';
import ChatContainer from '../shared/chat/ChatContainer';
import api from '../../api/axios';

const PatientChatPage = () => {
  const [doctorContacts, setDoctorContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoading(true);
        const res = await api.get('/api/users/doctors/');
        const mapped = res.data.map(d => ({
          id: d.user?.id || d.id,
          name: `Dr. ${d.user?.full_name || d.user?.first_name || 'Unknown'}`,
          lastMessage: 'Select to view messages',
          lastTime: '',
          online: false,
          unread: 0
        }));
        setDoctorContacts(mapped);
      } catch (err) {
        console.error("Failed to fetch doctors for chat", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDoctors();
  }, []);

  return (
    <div className="w-full h-full animate-fade-in flex flex-col overflow-hidden">
      <div className="flex-1 min-h-0">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        ) : (
          <ChatContainer role="patient" contacts={doctorContacts} />
        )}
      </div>
    </div>
  );
};

export default PatientChatPage;
