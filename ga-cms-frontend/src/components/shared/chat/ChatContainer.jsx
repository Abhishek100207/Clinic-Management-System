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
  Activity,
  Plus,
  FileText,
  Play,
  Mic,
  File,
  Download
} from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import useWebSocket from '../../../hooks/useWebSocket';
import { Spinner } from '../Spinner';
import ErrorBoundary from '../ErrorBoundary';
import { useAuthStore } from '../../../store/authStore';
import api from '../../../api/axios';

const ChatContainer = ({ role, contacts, tabs, activeTab, onTabChange, tabUnreadCounts = {} }) => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [selectedChat, setSelectedChat] = useState(null);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showChatDropdown, setShowChatDropdown] = useState(false);
  const [showSidebarDropdown, setShowSidebarDropdown] = useState(false);
  const [showChatSearch, setShowChatSearch] = useState(false);
  const [chatSearchTerm, setChatSearchTerm] = useState('');
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const { messages: wsMessages, sendMessage } = useWebSocket(selectedChat?.id);

  // Format websocket messages to match our UI needs
  const chatMessages = wsMessages.map(m => {
    let type = 'text';
    if (m.attachment_url) {
      const ext = m.attachment_url.split('.').pop().toLowerCase();
      if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) type = 'image';
      else if (['mp4', 'webm', 'ogg'].includes(ext)) type = 'video';
      else if (['mp3', 'wav', 'ogg'].includes(ext)) type = 'audio';
      else if (ext === 'pdf') type = 'pdf';
      else type = 'file';
    }

    return {
      id: m.id,
      senderId: m.sender === user?.id ? 'me' : 'other',
      text: m.message,
      fileUrl: m.attachment_url ? `http://localhost:8000${m.attachment_url}` : null,
      fileName: m.attachment_name,
      fileSize: 'Attachment',
      time: new Date(m.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: m.is_read ? 'read' : 'sent',
      type: type,
      pending: m.pending,
      failed: m.failed
    };
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, selectedChat]);

  // Reset selected chat when switching tabs to prevent messages leaking across tabs
  useEffect(() => {
    setSelectedChat(null);
  }, [activeTab]);

  const handleSendMessage = async (e, fileData = null) => {
    if (e) e.preventDefault();
    if (!message.trim() && !fileData) return;
    if (!selectedChat?.id) return;

    let textToSend = message;
    if (fileData) {
      textToSend = `[File: ${fileData.name}] ${message}`;
    }

    sendMessage(textToSend);
    setMessage('');
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!selectedChat?.id) return;
    
    const formData = new FormData();
    formData.append('receiver_id', selectedChat.id);
    formData.append('file', file);
    
    try {
      await api.post('/api/chat/messages/upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success("File sent");
    } catch (err) {
      console.error("Failed to upload file", err);
      toast.error(err.response?.data?.error || "Failed to upload file");
    }
    
    e.target.value = ''; // Reset input
  };

  const handleDeleteChat = async () => {
    if (!selectedChat) return;
    try {
      await api.post('/api/chat/messages/delete-chat/', { other_user_id: selectedChat.id });
      toast.success("Chat deleted");
      setSelectedChat(null);
      queryClient.invalidateQueries({ queryKey: ['chatContacts'] });
    } catch (err) {
      toast.error("Failed to delete chat");
    }
    setShowChatDropdown(false);
  };

  const handleBlockUser = async () => {
    if (!selectedChat) return;
    try {
      await api.post('/api/chat/messages/block-user/', { other_user_id: selectedChat.id });
      toast.success("User blocked");
      setSelectedChat(null);
    } catch (err) {
      toast.error("Failed to block user");
    }
    setShowChatDropdown(false);
  };

  const handleClearHistory = async () => {
    try {
      await api.post('/api/chat/messages/clear-history/');
      toast.success("Chat history cleared");
      setSelectedChat(null);
      queryClient.invalidateQueries({ queryKey: ['chatContacts'] });
    } catch (err) {
      toast.error("Failed to clear history");
    }
    setShowSidebarDropdown(false);
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/api/chat/messages/mark-read/', {});
      toast.success("All messages marked as read");
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
      queryClient.invalidateQueries({ queryKey: ['chatContacts'] });
    } catch (err) {
      toast.error("Failed to mark all as read");
    }
    setShowSidebarDropdown(false);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const filteredContacts = (contacts || []).filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectChat = async (contact) => {
    setSelectedChat(contact);
    if (window.innerWidth < 1024) {
      setShowMobileSidebar(false);
    }
    try {
      await api.patch('/api/chat/messages/mark-read/', { sender_id: contact.id });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
    } catch (err) {
      console.error("Failed to mark messages as read", err);
    }
  };

  const renderMessageContent = (msg) => {
    switch (msg.type) {
      case 'image':
        return (
          <div className="space-y-2">
            <img src={msg.fileUrl} alt={msg.fileName} className="max-w-full rounded-lg border border-slate-100 shadow-sm" />
            {msg.text && <p className="mt-2">{msg.text}</p>}
          </div>
        );
      case 'video':
        return (
          <div className="space-y-2">
            <video controls className="max-w-full rounded-lg border border-slate-100 shadow-sm">
              <source src={msg.fileUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            {msg.text && <p className="mt-2">{msg.text}</p>}
          </div>
        );
      case 'audio':
        return (
          <div className="space-y-2 min-w-[240px]">
            <audio controls className="w-full h-10">
              <source src={msg.fileUrl} />
            </audio>
            {msg.text && <p className="mt-2">{msg.text}</p>}
          </div>
        );
      case 'pdf':
      case 'file':
        return (
          <div className="flex items-center gap-3 bg-black/5 p-3 rounded-xl border border-black/5">
            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-rose-500 shadow-sm">
              {msg.type === 'pdf' ? <FileText size={24} /> : <File size={24} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate text-slate-800">{msg.fileName}</p>
              <p className="text-[10px] text-slate-500 font-medium">{msg.fileSize} • {msg.type.toUpperCase()}</p>
            </div>
            <a href={msg.fileUrl} download={msg.fileName} className="text-slate-400 hover:text-blue-600">
              <Download size={20} />
            </a>
          </div>
        );
      default:
        return <p>{msg.text}</p>;
    }
  };

  return (
    <ErrorBoundary>
      <div className="flex bg-white overflow-hidden h-full animate-fade-in relative">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept="image/*,video/*,audio/*,.pdf"
      />
      
      {/* Sidebar: Chat List */}
      <div className={`w-full lg:w-[400px] border-r border-slate-100 flex flex-col bg-white transition-all duration-300 ${!showMobileSidebar ? 'hidden lg:flex' : 'flex'}`}>
        {/* Sidebar Header */}
        <div className="p-3 shrink-0 bg-slate-50/50 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 shrink-0 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold overflow-hidden shadow-sm ring-2 ring-white">
              {user?.avatar_url ? (
                <img src={user.avatar_url} className="w-full h-full object-cover" alt="" />
              ) : (
                user?.full_name?.charAt(0) || 'U'
              )}
            </div>
            
            {/* Tabs if provided */}
            {tabs && (
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => onTabChange(tab)}
                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter whitespace-nowrap transition-all ${
                      activeTab === tab 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'bg-white text-slate-400 hover:text-slate-600 border border-slate-100'
                    }`}
                  >
                    <span className="flex items-center gap-1">
                      {tab}
                      {tabUnreadCounts[tab] > 0 && (
                        <span className="bg-emerald-500 text-white text-[9px] font-black px-1 py-0.5 rounded-full min-w-[14px] h-[14px] flex items-center justify-center">
                          {tabUnreadCounts[tab]}
                        </span>
                      )}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            <div className="relative">
              <div onClick={() => setShowSidebarDropdown(!showSidebarDropdown)} className="w-10 h-10 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200/50 cursor-pointer transition-all">
                <MoreVertical size={20} />
              </div>
              {showSidebarDropdown && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowSidebarDropdown(false)}></div>
                  <div className="absolute right-0 top-10 bg-white shadow-xl border border-slate-100 rounded-xl py-2 w-48 z-50">
                    <button onClick={handleMarkAllRead} className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 text-sm font-medium">Mark all as read</button>
                    <button onClick={handleClearHistory} className="w-full text-left px-4 py-2 hover:bg-slate-50 text-red-500 text-sm font-medium">Clear chats history</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Search */}
        <div className="px-4 py-2 bg-white">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search or start new chat" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-100 border-none pl-12 pr-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-0 transition-all placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Contact List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="">
            {filteredContacts.length > 0 ? filteredContacts.map((contact) => (
              <div 
                key={contact.id}
                onClick={() => handleSelectChat(contact)}
                className={`px-4 py-3 cursor-pointer transition-all duration-200 flex items-center gap-4 group border-b border-slate-50 ${
                  selectedChat?.id === contact.id 
                    ? 'bg-slate-100' 
                    : 'bg-white hover:bg-slate-50'
                }`}
              >
                <div className="relative shrink-0">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 ${
                    selectedChat?.id === contact.id ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'
                  }`}>
                    {contact.avatar ? (
                      <img src={contact.avatar} className="w-full h-full object-cover rounded-full" alt="" />
                    ) : (
                      contact.name?.charAt(0) || '?'
                    )}
                  </div>
                  {contact.online && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-[15px] truncate text-slate-900">{contact.name}</h3>
                    <span className={`text-[10px] font-medium ${selectedChat?.id === contact.id ? 'text-blue-600' : 'text-slate-400'}`}>
                      {contact.lastTime ? new Date(contact.lastTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-0.5">
                    <p className={`text-xs truncate ${selectedChat?.id === contact.id ? 'text-slate-600' : 'text-slate-500'}`}>
                      {contact.lastMessage}
                    </p>
                    {contact.unread > 0 && selectedChat?.id !== contact.id && (
                      <span className="bg-emerald-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center ml-2">
                        {contact.unread}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )) : (
              <div className="p-8 text-center">
                <p className="text-slate-400 text-sm">No conversations found</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col bg-[#efeae2] transition-all duration-300 ${showMobileSidebar ? 'hidden lg:flex' : 'flex'}`}>
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setShowMobileSidebar(true)}
                  className="lg:hidden p-2 text-slate-500"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-base">
                  {selectedChat.name?.charAt(0) || '?'}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base leading-tight">{selectedChat.name}</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-medium text-slate-500">
                      {selectedChat.online ? 'Online' : 'Away'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-slate-500 relative">
                {showChatSearch && (
                  <input 
                    type="text" 
                    placeholder="Search in chat..."
                    value={chatSearchTerm}
                    onChange={(e) => setChatSearchTerm(e.target.value)}
                    className="absolute right-20 top-1/2 -translate-y-1/2 bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-sm outline-none shadow-sm w-48 z-10"
                    autoFocus
                  />
                )}
                <Search onClick={() => setShowChatSearch(!showChatSearch)} size={20} className="cursor-pointer hover:text-slate-800" />
                
                <div className="relative">
                  <MoreVertical onClick={() => setShowChatDropdown(!showChatDropdown)} size={20} className="cursor-pointer hover:text-slate-800" />
                  {showChatDropdown && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowChatDropdown(false)}></div>
                      <div className="absolute right-0 top-8 bg-white shadow-xl border border-slate-100 rounded-xl py-2 w-40 z-50">
                        <button onClick={handleDeleteChat} className="w-full text-left px-4 py-2 hover:bg-slate-50 text-red-500 text-sm font-medium">Delete chat</button>
                        <button onClick={handleBlockUser} className="w-full text-left px-4 py-2 hover:bg-slate-50 text-red-500 text-sm font-medium">Block user</button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 lg:p-10 space-y-4 custom-scrollbar bg-[url('https://w0.peakpx.com/wallpaper/818/148/HD-wallpaper-whatsapp-background-minimalist-pattern-whatsapp-pattern.jpg')] bg-repeat bg-opacity-5 relative">
              <div className="flex justify-center mb-6">
                <span className="bg-[#dcf8c6] border border-emerald-100 text-[10px] font-bold text-slate-600 uppercase tracking-wider px-4 py-1 rounded shadow-sm">
                  Messages are end-to-end encrypted
                </span>
              </div>
              
              {chatMessages.filter(msg => {
                if (!chatSearchTerm) return true;
                return msg.text?.toLowerCase().includes(chatSearchTerm.toLowerCase()) || msg.fileName?.toLowerCase().includes(chatSearchTerm.toLowerCase());
              }).map((msg) => (

                <div key={msg.id} className={`flex ${msg.senderId === 'me' ? 'justify-end' : 'justify-start'} animate-in fade-in duration-300`}>
                  <div className={`max-w-[85%] lg:max-w-[65%] px-3 py-2 rounded-lg shadow-sm text-sm relative ${
                    msg.senderId === 'me' 
                      ? msg.failed ? 'bg-red-100 text-slate-800 border border-red-300' : 'bg-[#dcf8c6] text-slate-800'
                      : 'bg-white text-slate-800'
                  } ${msg.pending ? 'opacity-60' : ''}`}>
                    {renderMessageContent(msg)}
                    <div className="flex items-center justify-end gap-1 mt-1">
                      <span className="text-[9px] text-slate-500 uppercase">{msg.time}</span>
                      {msg.senderId === 'me' && (
                        msg.pending ? (
                          <div className="w-3 h-3 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin inline-block ml-1"></div>
                        ) : msg.failed ? (
                          <button onClick={() => sendMessage(msg.text)} className="text-[10px] text-red-600 hover:text-red-800 font-bold ml-1 px-1.5 py-0.5 bg-red-200 rounded">RETRY</button>
                        ) : (
                          <CheckCheck size={14} className={msg.status === 'read' ? 'text-blue-400' : 'text-slate-400'} />
                        )
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="px-4 py-3 bg-[#f0f2f5] shrink-0 flex items-center gap-3">
              <div className="relative flex items-center gap-2 text-slate-500">
                <Smile onClick={() => setShowEmojiPicker(!showEmojiPicker)} size={24} className="cursor-pointer hover:text-slate-800" />
                {showEmojiPicker && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowEmojiPicker(false)}></div>
                    <div className="absolute bottom-12 left-0 z-50 shadow-2xl rounded-2xl">
                      <EmojiPicker onEmojiClick={(e) => setMessage(prev => prev + e.emoji)} />
                    </div>
                  </>
                )}
                <Plus onClick={triggerFileInput} size={24} className="cursor-pointer hover:text-slate-800" />
              </div>
              <form 
                onSubmit={handleSendMessage}
                className="flex-1 flex items-center gap-3"
              >
                <input 
                  type="text" 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type a message" 
                  className="flex-1 bg-white border-none px-4 py-2.5 rounded-lg text-sm outline-none shadow-sm"
                />
                <button 
                  type="submit"
                  disabled={!message.trim()}
                  className="p-2 text-slate-500 hover:text-blue-600 disabled:opacity-30"
                >
                  <Send size={24} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-[#f8f9fa] border-b-[6px] border-emerald-500">
            <div className="w-64 h-64 opacity-10 mb-8">
              <MessageSquare size={256} />
            </div>
            <h3 className="text-3xl font-light text-slate-600 mb-4">WhatsApp for Clinic</h3>
            <p className="text-slate-500 text-sm max-w-sm mx-auto leading-relaxed">
              Send and receive secure messages with your {role === 'doctor' ? 'patients' : 'doctors'}.<br/>
              Select a chat to get started.
            </p>
            <div className="mt-auto flex items-center gap-2 text-xs text-slate-400">
              <Activity size={14} />
              End-to-end encrypted
            </div>
          </div>
        )}
      </div>
      </div>
    </ErrorBoundary>
  );
};

export default ChatContainer;
