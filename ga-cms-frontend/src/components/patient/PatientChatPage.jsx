import React from 'react';
import ChatContainer from '../shared/chat/ChatContainer';

const PatientChatPage = () => {
  const doctorContacts = [
    { id: 1, name: 'Dr. Sarah Johnson', lastMessage: 'Please share your latest blood reports.', lastTime: '09:30 AM', online: true, unread: 1 },
    { id: 2, name: 'Dr. Robert Chen', lastMessage: 'The prescription has been updated.', lastTime: 'Yesterday', online: false, unread: 0 },
  ];

  return (
    <div className="w-full h-full animate-fade-in flex flex-col overflow-hidden">
      <div className="flex-1 min-h-0">
        <ChatContainer role="patient" contacts={doctorContacts} />
      </div>
    </div>
  );
};

export default PatientChatPage;
