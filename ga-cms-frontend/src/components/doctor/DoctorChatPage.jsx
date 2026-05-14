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
    <div className="w-full h-full animate-fade-in flex flex-col overflow-hidden">
      <div className="flex-1 min-h-0">
        <ChatContainer role="doctor" contacts={patientContacts} />
      </div>
    </div>
  );
};

export default DoctorChatPage;
