import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';
import {
  Bell,
  X,
  Search,
  Mail,
  MailOpen,
  Trash2,
  CheckCheck,
  Check,
  Inbox,
  ChevronDown,
  ChevronUp,
  FileText,
  Calendar,
  Settings,
  ShieldCheck,
  Activity
} from 'lucide-react';

const formatTimeAgo = (isoString) => {
  if (!isoString) return 'just now';
  const date = new Date(isoString);
  const seconds = Math.floor((new Date() - date) / 1000);

  let interval = Math.floor(seconds / 86400);
  if (interval >= 1) return `${interval}d ago`;

  interval = Math.floor(seconds / 3600);
  if (interval >= 1) return `${interval}h ago`;

  interval = Math.floor(seconds / 60);
  if (interval >= 1) return `${interval}m ago`;

  return 'just now';
};

// Helper to get initials and colors for notifications
const getSenderMetadata = (sender) => {
  if (sender.includes('scan') || sender.includes('lab')) {
    return {
      initials: 'SC',
      bgColor: 'from-blue-500 to-indigo-600',
      icon: <Activity size={12} className="text-white" />
    };
  }
  if (sender.includes('presc') || sender.includes('doctor')) {
    return {
      initials: 'DR',
      bgColor: 'from-emerald-400 to-teal-600',
      icon: <FileText size={12} className="text-white" />
    };
  }
  if (sender.includes('app')) {
    return {
      initials: 'AP',
      bgColor: 'from-amber-400 to-orange-500',
      icon: <Calendar size={12} className="text-white" />
    };
  }
  if (sender.includes('admin') || sender.includes('security')) {
    return {
      initials: 'AD',
      bgColor: 'from-purple-500 to-rose-600',
      icon: <Settings size={12} className="text-white" />
    };
  }
  return {
    initials: 'CL',
    bgColor: 'from-slate-400 to-slate-600',
    icon: <Mail size={12} className="text-white" />
  };
};

export const NotificationDrawer = () => {
  const { user } = useAuthStore();
  const {
    notifications,
    searchQuery,
    filter,
    init,
    setSearchQuery,
    setFilter,
    markAsRead,
    toggleReadStatus,
    markAllAsRead,
    deleteNotification
  } = useNotificationStore();

  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const dropdownRef = useRef(null);

  // Initialize notifications for the logged-in user
  useEffect(() => {
    if (user) {
      init(user);
    }
  }, [user]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Handle toggle dropdown with loading state
  const handleToggleDropdown = () => {
    if (!isOpen) {
      setLoading(true);
      setExpandedId(null);
      setTimeout(() => {
        setLoading(false);
      }, 350);
    }
    setIsOpen(!isOpen);
  };

  // Derive unread count
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Filter & Search notifications
  const filteredNotifications = notifications.filter(n => {
    const matchesSearch =
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.preview.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.sender.toLowerCase().includes(searchQuery.toLowerCase());

    if (filter === 'unread') return matchesSearch && !n.isRead;
    if (filter === 'read') return matchesSearch && n.isRead;
    return matchesSearch;
  });

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        id="notification-bell-btn"
        onClick={handleToggleDropdown}
        className="relative p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50/50 rounded-xl transition-all outline-none focus:ring-2 focus:ring-blue-100"
        title="View Notifications"
      >
        <Bell size={25} />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[14px] h-[14px] bg-rose-500 text-white rounded-full flex items-center justify-center text-[8px] font-black tracking-tight px-0.5 shadow-md ring-2 ring-white">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Popover dropdown container */}
      {isOpen && (
        <div
          className="fixed left-4 right-4 sm:left-auto sm:right-0 mt-3 w-auto sm:w-[440px] bg-white rounded-3xl border border-slate-100 shadow-2xl z-50 flex flex-col overflow-hidden animate-in zoom-in-95 origin-top-right duration-200"
          style={{ maxHeight: '600px' }}
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-50 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800">Notifications</h2>
            
            <div className="flex items-center gap-3">
              {/* Capsule Filter Tabs (Matching uploaded screenshot style) */}
              <div className="bg-slate-100 p-0.5 rounded-full flex gap-0.5">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'unread', label: 'Unread' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => { setFilter(tab.id); setExpandedId(null); }}
                    className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
                      filter === tab.id
                        ? 'bg-white text-slate-800 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-50 transition-colors"
                  title="Mark all as read"
                >
                  <CheckCheck size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Search Box */}
          <div className="px-6 py-2.5 border-b border-slate-50 bg-slate-50/20">
            <div className="relative">
              <Search className="absolute left-3 top-2 text-slate-400" size={13} />
              <input
                type="text"
                placeholder="Search alerts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 bg-slate-100/50 hover:bg-slate-100 focus:bg-white rounded-xl border border-transparent focus:border-slate-200 outline-none text-xs transition-all font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Scrollable Alerts Area */}
          <div className="flex-1 overflow-y-auto max-h-[380px] custom-scrollbar bg-white">
            {loading ? (
              // Loading skeletons
              Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="px-6 py-4 flex gap-4 items-start border-b border-slate-50 animate-pulse">
                  <div className="w-10 h-10 bg-slate-100 rounded-full shrink-0"></div>
                  <div className="flex-1 space-y-2 py-0.5">
                    <div className="flex justify-between">
                      <div className="h-3 w-24 bg-slate-100 rounded"></div>
                      <div className="h-2 w-8 bg-slate-100 rounded"></div>
                    </div>
                    <div className="h-4 w-3/4 bg-slate-100 rounded"></div>
                    <div className="h-3 w-full bg-slate-100 rounded"></div>
                  </div>
                </div>
              ))
            ) : filteredNotifications.length === 0 ? (
              // Empty State
              <div className="py-16 flex flex-col items-center justify-center text-center space-y-3 px-6">
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 text-slate-300 shadow-sm">
                  <Inbox size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-700 text-xs">No Notifications</h3>
                  <p className="text-[10px] text-slate-400 mt-1 max-w-[220px] mx-auto">
                    {searchQuery ? "No results found matching your search term." : "Your inbox is empty."}
                  </p>
                </div>
              </div>
            ) : (
              // Notifications List
              filteredNotifications.map(item => {
                const isExpanded = expandedId === item.id;
                const meta = getSenderMetadata(item.sender);
                return (
                  <div
                    key={item.id}
                    className={`px-6 py-4 flex gap-4 items-start border-b border-slate-50/70 transition-all ${
                      item.isRead ? 'bg-white opacity-85 hover:bg-slate-50/30' : 'bg-blue-50/10 hover:bg-blue-50/20'
                    }`}
                  >
                    {/* Avatar Circle on the Left */}
                    <div className={`relative h-10 w-10 rounded-full bg-gradient-to-br ${meta.bgColor} text-white font-extrabold flex items-center justify-center text-xs shadow-sm shrink-0`}>
                      {meta.initials}
                      {/* Logo Overlap badge */}
                      <div className="absolute -bottom-1 -right-1 bg-slate-800 border-2 border-white rounded-full p-0.5 shadow-sm">
                        {meta.icon}
                      </div>
                    </div>

                    {/* Middle Details Section */}
                    <div className="flex-1 min-w-0">
                      <div
                        className="cursor-pointer"
                        onClick={() => {
                          setExpandedId(isExpanded ? null : item.id);
                          if (!item.isRead) {
                            markAsRead(item.id);
                          }
                        }}
                      >
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[11px] font-bold text-slate-700 truncate max-w-[150px]">
                            {item.sender.split('@')[0]}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {formatTimeAgo(item.timestamp)}
                          </span>
                        </div>

                        <h4 className="text-xs font-bold text-slate-900 leading-snug truncate">
                          {item.title}
                        </h4>

                        {!isExpanded && (
                          <p className="text-[11px] text-slate-500 mt-1 line-clamp-1 leading-normal font-medium">
                            {item.preview}
                          </p>
                        )}
                      </div>

                      {/* Expandable Email Details */}
                      {isExpanded && (
                        <div className="mt-2.5 pt-2 border-t border-slate-100/50 space-y-2 animate-in fade-in duration-150">
                          <div className="bg-slate-50 border border-slate-200/50 rounded-xl p-3 font-sans text-xs text-slate-600 leading-relaxed whitespace-pre-line shadow-inner">
                            <div className="pb-1.5 border-b border-slate-200/65 text-[9px] text-slate-400 font-medium space-y-0.5 mb-2">
                              <div><span className="font-bold">Sender:</span> {item.sender}</div>
                              <div><span className="font-bold">Recipient:</span> {user?.email}</div>
                              <div><span className="font-bold">Timestamp:</span> {new Date(item.timestamp).toLocaleString()}</div>
                            </div>
                            <p className="font-medium text-slate-600">
                              {item.body}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Bottom action strip */}
                      <div className="mt-2 flex items-center justify-between pt-1 border-t border-transparent">
                        <button
                          onClick={() => {
                            setExpandedId(isExpanded ? null : item.id);
                            if (!item.isRead) {
                              markAsRead(item.id);
                            }
                          }}
                          className="text-[10px] font-extrabold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          {isExpanded ? (
                            <>
                              Collapse <ChevronUp size={11} />
                            </>
                          ) : (
                            <>
                              Expand <ChevronDown size={11} />
                            </>
                          )}
                        </button>

                        <div className="flex gap-2">
                          <button
                            onClick={() => toggleReadStatus(item.id)}
                            className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded transition-colors"
                            title={item.isRead ? "Mark as unread" : "Mark as read"}
                          >
                            {item.isRead ? <Mail size={12} /> : <MailOpen size={12} />}
                          </button>
                          <button
                            onClick={() => {
                              deleteNotification(item.id);
                              if (expandedId === item.id) setExpandedId(null);
                            }}
                            className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Unread Status Green Dot on Far Right */}
                    {!item.isRead && (
                      <div className="pt-2 shrink-0">
                        <span className="block w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-sm shadow-emerald-200"></span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Secure SSL footer bar */}
          <div className="p-3 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-400 text-center flex items-center justify-center gap-1">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
            <span>Clinic Security Gate Verified</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDrawer;
