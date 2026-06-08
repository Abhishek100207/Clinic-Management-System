import React, { useState, useEffect } from 'react';
import ChatContainer from '../shared/chat/ChatContainer';
import api from '../../api/axios';

const DoctorChatPage = () => {
  const [patientContacts, setPatientContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const res = await api.get('/api/chat/messages/conversations/');
        setPatientContacts(res.data);
      } catch (err) {
        console.error("Failed to fetch contacts", err);
      } finally {
        setLoading(false);
      }
    };
    fetchContacts();
    
    // Poll every 10 seconds to update last message and sorting
    const interval = setInterval(fetchContacts, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-full animate-fade-in flex flex-col overflow-hidden">
      <div className="flex-1 min-h-0">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        ) : (
          <ChatContainer role="doctor" contacts={patientContacts} />
        )}
      </div>
    </div>
  );
};

export default DoctorChatPage;
