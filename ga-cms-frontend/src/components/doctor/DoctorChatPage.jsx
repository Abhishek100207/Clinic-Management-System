import React from 'react';
import { MessageSquare, Search, Send, User } from 'lucide-react';

const DoctorChatPage = () => {
  return (
    <div className="max-w-7xl mx-auto w-full p-4 md:p-8 h-[calc(100vh-120px)] flex flex-col animate-fade-in">
      <div className="mb-6 shrink-0">
        <h1 className="text-3xl font-extrabold tracking-tight text-navy mb-2">Patient Communications</h1>
        <p className="text-slate-500">Secure messaging with patients and colleagues.</p>
      </div>

      <div className="flex-1 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex">
        {/* Sidebar */}
        <div className="w-80 border-r border-gray-100 flex flex-col">
          <div className="p-4 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                type="text" 
                placeholder="Search chats..." 
                className="w-full bg-slate-50 border-none pl-9 pr-4 py-2 rounded-lg text-xs outline-none"
              />
            </div>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <MessageSquare size={32} className="text-slate-200 mb-2" />
            <p className="text-xs text-slate-400 font-medium">No active conversations</p>
          </div>
        </div>

        {/* Chat Window */}
        <div className="flex-1 flex flex-col bg-slate-50/30">
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <div className="w-20 h-20 bg-white rounded-full shadow-sm flex items-center justify-center mb-6">
              <MessageSquare size={36} className="text-blue-500" />
            </div>
            <h3 className="text-xl font-bold text-navy mb-2">Secure Consultation Chat</h3>
            <p className="text-slate-500 text-sm max-w-sm mx-auto">
              Select a patient from the list to start a secure conversation or respond to an inquiry.
            </p>
          </div>
          
          <div className="p-6 bg-white border-t border-gray-100 shrink-0">
            <div className="flex gap-4">
              <input 
                disabled
                type="text" 
                placeholder="Type your message..." 
                className="flex-1 bg-slate-50 border-none px-4 py-3 rounded-xl text-sm outline-none cursor-not-allowed"
              />
              <button disabled className="bg-blue-600 text-white p-3 rounded-xl opacity-50 cursor-not-allowed">
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorChatPage;
