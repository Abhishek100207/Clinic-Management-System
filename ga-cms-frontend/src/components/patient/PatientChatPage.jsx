import React, { useState, useEffect } from 'react';
import ChatContainer from '../shared/chat/ChatContainer';
import api from '../../api/axios';

const PatientChatPage = () => {
  const [doctorContacts, setDoctorContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isFirstLoad = true;
    const fetchContacts = async () => {
      try {
        if (isFirstLoad) setLoading(true);
        const convRes = await api.get('/api/chat/messages/conversations/');
        const docRes = await api.get('/api/users/doctors/');
        
        const conversations = convRes.data;
        const doctorsData = docRes.data.results || docRes.data;
        
        const convMap = {};
        conversations.forEach(c => {
          convMap[c.id] = c;
        });
        
        const mappedDoctors = doctorsData.map(d => {
          const userId = d.user?.id || d.id;
          if (convMap[userId]) {
            return convMap[userId];
          } else {
            return {
              id: userId,
              name: `Dr. ${d.user?.full_name || d.user?.first_name || 'Unknown'}`,
              lastMessage: 'Select to view messages',
              lastTime: '',
              online: false,
              unread: 0
            };
          }
        });
        
        const doctorUserIds = new Set(doctorsData.map(d => d.user?.id || d.id));
        const otherConvs = conversations.filter(c => !doctorUserIds.has(c.id));
        
        const allContacts = [...mappedDoctors, ...otherConvs];
        
        setDoctorContacts(allContacts);
      } catch (err) {
        console.error("Failed to fetch contacts", err);
      } finally {
        if (isFirstLoad) {
          setLoading(false);
          isFirstLoad = false;
        }
      }
    };
    
    fetchContacts();
    const interval = setInterval(fetchContacts, 10000);
    return () => clearInterval(interval);
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
