import React from 'react';
import ChatContainer from '../shared/chat/ChatContainer';

const PatientChatPage = () => {
  const doctorContacts = [
    { id: 1, name: 'Dr. Sarah Johnson', lastMessage: 'Please share your latest blood reports.', lastTime: '09:30 AM', online: true, unread: 1 },
    { id: 2, name: 'Dr. Robert Chen', lastMessage: 'The prescription has been updated.', lastTime: 'Yesterday', online: false, unread: 0 },
  ];

  return (
    <div className="max-w-7xl mx-auto w-full p-4 md:p-8 h-[calc(100vh-100px)] animate-fade-in flex flex-col">
      <div className="shrink-0 mb-6">
        <h1 className="text-3xl font-black text-navy tracking-tight mb-2">Doctor Consultations</h1>
        <p className="text-slate-500 font-medium">Chat with your consulted doctors for follow-ups and inquiries.</p>
      </div>
      <div className="flex-1 min-h-0">
        <ChatContainer role="patient" contacts={doctorContacts} />
      </div>
    </div>
  );
};

export default PatientChatPage;
