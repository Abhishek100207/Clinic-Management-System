import React, { useState } from 'react';
import ChatContainer from './ChatContainer';
import { useAuthStore } from '../../../store/authStore';
import { authApi } from '../../../api/auth';
import api from '../../../api/axios';
import { Spinner } from '../Spinner';
import { useSearchParams } from 'react-router-dom';
import { Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import ErrorBoundary from '../ErrorBoundary';

const StaffChatPage = () => {
  const { user } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tabUnreadCounts, setTabUnreadCounts] = useState({
    'Patients': 0,
    'Doctors': 0,
    'Senior Doctor': 0,
    'Technicians': 0,
    'Receptionists': 0
  });
  
  // Dynamic tabs based on user role and restrictions
  const getTabsForRole = (role) => {
    switch (role) {
      case 'senior_doctor':
        return ['Patients', 'Doctors', 'Technicians', 'Receptionists'];
      case 'doctor':
        return ['Patients', 'Doctors', 'Senior Doctor', 'Technicians', 'Receptionists'];
      case 'technician':
        return ['Doctors', 'Senior Doctor', 'Technicians', 'Receptionists'];
      case 'receptionist':
        return ['Doctors', 'Senior Doctor', 'Technicians', 'Receptionists'];
      case 'patient':
        return ['Doctors'];
      default:
        return [];
    }
  };

  const tabs = getTabsForRole(user?.role);
  const activeTab = searchParams.get('tab') || tabs[0] || 'Patients';
  
  const { data: contactsData, isLoading: loading } = useQuery({
    queryKey: ['chatContacts', activeTab],
    queryFn: async () => {
      let data = [];
      const convsRes = await api.get('/api/chat/messages/conversations/');
      const conversationsMap = {};
      const unreadCounts = {
        'Patients': 0,
        'Doctors': 0,
        'Senior Doctor': 0,
        'Technicians': 0,
        'Receptionists': 0
      };
      
      const convsList = Array.isArray(convsRes?.data) ? convsRes.data : (convsRes?.data?.results ?? []);
      convsList.forEach(c => {
        conversationsMap[c.id] = c;
        if (c.role === 'patient') unreadCounts['Patients'] += c.unread;
        else if (c.role === 'doctor') unreadCounts['Doctors'] += c.unread;
        else if (c.role === 'senior_doctor') unreadCounts['Senior Doctor'] += c.unread;
        else if (c.role === 'technician') unreadCounts['Technicians'] += c.unread;
        else if (c.role === 'receptionist') unreadCounts['Receptionists'] += c.unread;
      });
      setTabUnreadCounts(unreadCounts);
      
      if (activeTab === 'Patients') {
        const res = await api.get('/api/users/patients/');
        const patientsArray = Array.isArray(res?.data) ? res.data : (res?.data?.results ?? []);
        data = patientsArray
          .filter(p => p.user && p.user.id)
          .map(p => {
          const uid = p.user.id;
          const conv = conversationsMap[uid] || {};
          return {
            id: uid,
            name: p.user?.full_name || p.full_name || p.user?.username || p.username,
            role: 'patient',
            avatar: p.user?.avatar_url || null,
            online: Math.random() > 0.5,
            lastMessage: conv.lastMessage || 'No messages yet',
            lastTime: conv.lastTime || '',
            unread: conv.unread || 0,
            last_time_raw: conv.last_time_raw || null
          };
        });
      } else if (user?.role === 'patient' && activeTab === 'Doctors') {
        const res = await api.get('/api/users/doctors/');
        const doctorsArray = Array.isArray(res?.data) ? res.data : (res?.data?.results ?? []);
        data = doctorsArray
          .filter(d => d.user && d.user.id)
          .map(d => {
          const uid = d.user.id;
          const conv = conversationsMap[uid] || {};
          return {
            id: uid,
            name: d.user?.full_name || d.user?.username || 'Doctor',
            role: 'doctor',
            avatar: d.user?.avatar_url || null,
            online: Math.random() > 0.5,
            lastMessage: conv.lastMessage || 'No messages yet',
            lastTime: conv.lastTime || '',
            unread: conv.unread || 0,
            last_time_raw: conv.last_time_raw || null
          };
        });
      } else {
        const staff = await authApi.listStaff();
        const staffList = Array.isArray(staff) ? staff : [];
        
        const roleMap = {
          'Doctors': 'doctor',
          'Senior Doctor': 'senior_doctor',
          'Technicians': 'technician',
          'Receptionists': 'receptionist'
        };
        
        const targetRole = roleMap[activeTab];
        
        data = staffList
          .filter(member => {
            if (member.id === user?.id || member.email === user?.email) return false;
            if (member.role !== targetRole) return false;
            if (member.role === 'senior_doctor') {
              return user?.role === 'doctor' || user?.role === 'senior_doctor' || user?.role === 'technician' || user?.role === 'receptionist';
            }
            return true;
          })
          .map(member => {
            const conv = conversationsMap[member.id] || {};
            return {
              id: member.id,
              name: member.full_name || member.username,
              role: member.role,
              avatar: null,
              online: Math.random() > 0.5,
              lastMessage: conv.lastMessage || 'No messages yet',
              lastTime: conv.lastTime || '',
              unread: conv.unread || 0,
              last_time_raw: conv.last_time_raw || null
            };
          });
      }
        
      data.sort((a, b) => {
        const timeA = a.last_time_raw ? new Date(a.last_time_raw) : new Date(0);
        const timeB = b.last_time_raw ? new Date(b.last_time_raw) : new Date(0);
        return timeB - timeA;
      });

      return data;
    },
    enabled: !!user,
    refetchInterval: 10000
  });

  const contacts = contactsData || [];

  const handleTabChange = (tab) => {
    setSearchParams({ tab });
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-white">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="h-full">
        <ChatContainer 
          role={user?.role} 
          contacts={contacts} 
          tabs={tabs.length > 1 ? tabs : null} 
          activeTab={activeTab}
          onTabChange={handleTabChange}
          tabUnreadCounts={tabUnreadCounts}
        />
      </div>
    </ErrorBoundary>
  );
};

export default StaffChatPage;
