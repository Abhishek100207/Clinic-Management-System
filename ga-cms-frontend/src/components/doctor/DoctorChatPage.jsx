import React from 'react';
import ChatContainer from '../shared/chat/ChatContainer';

const DoctorChatPage = () => {
  const patientContacts = [
    { id: 1, name: 'Abhishek Sharma', lastMessage: 'Thank you doctor, I will follow the advice.', lastTime: '10:05 AM', online: true, unread: 2 },
    { id: 2, name: 'Rahul Verma', lastMessage: 'Should I continue the medication?', lastTime: 'Yesterday', online: false, unread: 0 },
    { id: 3, name: 'Anjali Sharma', lastMessage: 'Report attached for review.', lastTime: 'Monday', online: true, unread: 1 },
    { id: 4, name: 'Priya Das', lastMessage: 'When is my next follow-up?', lastTime: 'May 10', online: false, unread: 0 },
  ];

  return (
    <div className="max-w-7xl mx-auto w-full p-4 md:p-8 h-[calc(100vh-100px)] animate-fade-in flex flex-col">
      <div className="shrink-0 mb-6">
        <h1 className="text-3xl font-black text-navy tracking-tight mb-2">Patient Communications</h1>
        <p className="text-slate-500 font-medium">Securely chat with your consulted patients and review their inquiries.</p>
      </div>
      <div className="flex-1 min-h-0">
        <ChatContainer role="doctor" contacts={patientContacts} />
      </div>
    </div>
  );
};

export default DoctorChatPage;
