import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Send, 
  MoreVertical, 
  Phone, 
  Video, 
  Paperclip, 
  Smile, 
  CheckCheck, 
  User,
  Image as ImageIcon,
  ChevronLeft,
  X,
  MessageSquare,
  Activity
} from 'lucide-react';

const ChatContainer = ({ role, contacts }) => {
  const [selectedChat, setSelectedChat] = useState(null);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showMobileSidebar, setShowMobileSidebar] = useState(true);
  const messagesEndRef = useRef(null);

  const [chatMessages, setChatMessages] = useState([
    { id: 1, senderId: 'other', text: 'Hello, how can I help you today?', time: '10:00 AM', status: 'read' },
    { id: 2, senderId: 'me', text: 'I have some questions about my prescription.', time: '10:05 AM', status: 'read' },
    { id: 3, senderId: 'other', text: 'Sure, go ahead. I am here to clarify anything.', time: '10:06 AM', status: 'read' },
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, selectedChat]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    const newMessage = {
      id: Date.now(),
      senderId: 'me',
      text: message,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent'
    };

    setChatMessages([...chatMessages, newMessage]);
    setMessage('');
  };

  const filteredContacts = (contacts || []).filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectChat = (contact) => {
    setSelectedChat(contact);
    if (window.innerWidth < 1024) {
      setShowMobileSidebar(false);
    }
  };

  return (
    <div className="flex bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden h-full animate-fade-in relative">
      
      {/* Sidebar: Chat List */}
      <div className={`w-full lg:w-96 border-r border-slate-100 flex flex-col bg-slate-50/30 transition-all duration-300 ${!showMobileSidebar ? 'hidden lg:flex' : 'flex'}`}>
        {/* Sidebar Header */}
        <div className="p-8 pb-4 shrink-0">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-black text-navy tracking-tight">Messages</h2>
            <div className="w-10 h-10 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-100 cursor-pointer transition-all">
              <MoreVertical size={20} />
            </div>
          </div>
          
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search conversations..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-100 pl-12 pr-4 py-4 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-50 transition-all shadow-sm"
            />
          </div>
        </div>

        {/* Contact List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-8">
          <div className="space-y-1 mt-4">
            {filteredContacts.map((contact) => (
              <div 
                key={contact.id}
                onClick={() => handleSelectChat(contact)}
                className={`p-4 rounded-[1.5rem] cursor-pointer transition-all duration-300 flex items-center gap-4 group ${
                  selectedChat?.id === contact.id 
                    ? 'bg-blue-600 text-white shadow-xl shadow-blue-100 -translate-y-0.5' 
                    : 'bg-transparent hover:bg-white text-slate-600 hover:shadow-md'
                }`}
              >
                <div className="relative shrink-0">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl transition-all duration-300 ${
                    selectedChat?.id === contact.id ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600'
                  }`}>
                    {contact.avatar ? (
                      <img src={contact.avatar} className="w-full h-full object-cover rounded-2xl" alt="" />
                    ) : (
                      contact.name?.charAt(0) || '?'
                    )}
                  </div>
                  {contact.online && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="font-bold text-[15px] truncate">{contact.name}</h3>
                    <span className={`text-[10px] font-bold uppercase tracking-wider opacity-60 ${selectedChat?.id === contact.id ? 'text-white' : 'text-slate-400'}`}>
                      {contact.lastTime}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className={`text-xs truncate ${selectedChat?.id === contact.id ? 'text-blue-50' : 'text-slate-400 font-medium'}`}>
                      {contact.lastMessage}
                    </p>
                    {contact.unread > 0 && selectedChat?.id !== contact.id && (
                      <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full min-w-[20px] text-center">
                        {contact.unread}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col bg-white transition-all duration-300 ${showMobileSidebar ? 'hidden lg:flex' : 'flex'}`}>
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="p-6 lg:p-8 border-b border-slate-50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setShowMobileSidebar(true)}
                  className="lg:hidden w-10 h-10 rounded-xl bg-slate-50 text-slate-500 flex items-center justify-center mr-2"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg">
                  {selectedChat.name?.charAt(0) || '?'}
                </div>
                <div>
                  <h3 className="font-black text-navy text-lg leading-tight">{selectedChat.name}</h3>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${selectedChat.online ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {selectedChat.online ? 'Online now' : 'Away'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-500 flex items-center justify-center hover:bg-blue-50 hover:text-blue-600 transition-all border border-transparent hover:border-blue-100">
                  <Phone size={20} />
                </button>
                <button className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-500 flex items-center justify-center hover:bg-blue-50 hover:text-blue-600 transition-all border border-transparent hover:border-blue-100">
                  <Video size={20} />
                </button>
                <button className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-500 flex items-center justify-center hover:bg-blue-50 hover:text-blue-600 transition-all border border-transparent hover:border-blue-100">
                  <MoreVertical size={20} />
                </button>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-8 bg-slate-50/20 custom-scrollbar">
              <div className="flex justify-center">
                <span className="bg-white border border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] px-4 py-1.5 rounded-full shadow-sm">
                  Consultation Session Started
                </span>
              </div>
              
              {chatMessages.map((msg, i) => (
                <div key={msg.id} className={`flex ${msg.senderId === 'me' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                  <div className={`max-w-[75%] lg:max-w-[60%] space-y-1 ${msg.senderId === 'me' ? 'items-end' : 'items-start'} flex flex-col`}>
                    <div className={`p-4 lg:p-5 rounded-[2rem] text-sm font-medium shadow-sm transition-all hover:shadow-md ${
                      msg.senderId === 'me' 
                        ? 'bg-slate-900 text-white rounded-tr-none' 
                        : 'bg-white text-slate-700 rounded-tl-none border border-slate-50'
                    }`}>
                      {msg.text}
                    </div>
                    <div className="flex items-center gap-2 px-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{msg.time}</span>
                      {msg.senderId === 'me' && (
                        <CheckCheck size={14} className={msg.status === 'read' ? 'text-blue-500' : 'text-slate-300'} />
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-6 lg:p-8 shrink-0">
              <form 
                onSubmit={handleSendMessage}
                className="bg-white border border-slate-100 rounded-[2.5rem] p-3 flex items-center gap-3 shadow-xl shadow-slate-100 focus-within:ring-4 focus-within:ring-blue-50 transition-all"
              >
                <button type="button" className="w-12 h-12 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-slate-100 transition-colors">
                  <Smile size={24} />
                </button>
                <button type="button" className="w-12 h-12 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-slate-100 transition-colors">
                  <Paperclip size={20} />
                </button>
                <input 
                  type="text" 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type a secure message..." 
                  className="flex-1 bg-transparent outline-none text-sm font-medium text-slate-700 px-2"
                />
                <button 
                  type="submit"
                  disabled={!message.trim()}
                  className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-50 disabled:shadow-none active:scale-95"
                >
                  <Send size={20} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center animate-fade-in">
            <div className="w-32 h-32 bg-blue-50 text-blue-600 rounded-[3rem] flex items-center justify-center mb-8 relative">
              <MessageSquare size={56} />
              <div className="absolute -right-2 -bottom-2 w-10 h-10 bg-white rounded-2xl shadow-lg flex items-center justify-center text-blue-600">
                <CheckCheck size={24} />
              </div>
            </div>
            <h3 className="text-3xl font-black text-navy mb-4 tracking-tight">Select a conversation</h3>
            <p className="text-slate-500 text-sm max-w-sm mx-auto leading-relaxed font-medium">
              Choose one of your {role === 'doctor' ? 'patients' : 'doctors'} from the sidebar to start a secure, encrypted consultation chat.
            </p>
            <div className="mt-12 flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] bg-slate-50 px-6 py-3 rounded-2xl">
              <Activity size={14} className="text-blue-500" />
              End-to-End Encrypted Session
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatContainer;
