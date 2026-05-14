import React, { useState, useEffect } from 'react';
import ChatContainer from './ChatContainer';
import { useAuthStore } from '../../../store/authStore';
import { authApi } from '../../../api/auth';
import api from '../../../api/axios';
import { Spinner } from '../Spinner';
import { useSearchParams } from 'react-router-dom';
import { Users } from 'lucide-react';

const StaffChatPage = () => {
  const { user } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Dynamic tabs based on user role and restrictions
  const getTabsForRole = (role) => {
    switch (role) {
      case 'senior_doctor':
        return ['Doctors', 'Technicians', 'Receptionists'];
      case 'doctor':
        return ['Patients', 'Doctors', 'Senior Doctor', 'Technicians', 'Receptionists'];
      case 'technician':
        return ['Doctors', 'Technicians', 'Receptionists'];
      case 'receptionist':
        return ['Doctors', 'Technicians', 'Receptionists'];
      case 'patient':
        return ['Doctors'];
      default:
        return [];
    }
  };

  const tabs = getTabsForRole(user?.role);
  const activeTab = searchParams.get('tab') || tabs[0] || 'Patients';
  
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let data = [];
        
        if (activeTab === 'Patients') {
          const res = await api.get('/api/users/patients/');
          data = res.data.map(p => ({
            id: p.id,
            name: p.user?.full_name || p.full_name || p.user?.username || p.username,
            role: 'patient',
            avatar: p.user?.avatar_url || null,
            online: Math.random() > 0.5,
            lastMessage: 'Patient message',
            lastTime: '10:00 AM',
            unread: 0
          }));
        } else if (user?.role === 'patient' && activeTab === 'Doctors') {
          // Special case for patients: use the doctors list endpoint
          const res = await api.get('/api/users/doctors/');
          data = res.data.map(d => ({
            id: d.user?.id || d.id,
            name: d.user?.full_name || d.user?.username || 'Doctor',
            role: 'doctor',
            avatar: d.user?.avatar_url || null,
            online: Math.random() > 0.5,
            lastMessage: 'Doctor message',
            lastTime: '10:00 AM',
            unread: 0
          }));
        } else {
          const staff = await authApi.listStaff();
          
          const roleMap = {
            'Doctors': 'doctor',
            'Senior Doctor': 'senior_doctor',
            'Technicians': 'technician',
            'Receptionists': 'receptionist'
          };
          
          const targetRole = roleMap[activeTab];
          
          data = staff
            .filter(member => {
              if (member.id === user?.id || member.email === user?.email) return false;
              
              // Only show staff matching the target role
              if (member.role !== targetRole) return false;

              // Restriction: Only doctors can chat with senior doctor
              if (member.role === 'senior_doctor') {
                return user?.role === 'doctor' || user?.role === 'senior_doctor';
              }
              
              return true;
            })
            .map(member => ({
              id: member.id,
              name: member.full_name || member.username,
              role: member.role,
              avatar: null,
              online: Math.random() > 0.5,
              lastMessage: 'Internal staff message',
              lastTime: '10:00 AM',
              unread: 0
            }));
        }
          
        setContacts(data);
      } catch (err) {
        console.error("Failed to fetch data for chat:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user, activeTab]);

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
    <div className="h-full">
      <ChatContainer 
        role={user?.role} 
        contacts={contacts} 
        tabs={tabs.length > 1 ? tabs : null} // Only show tabs if there's more than one
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />
    </div>
  );
};

export default StaffChatPage;
