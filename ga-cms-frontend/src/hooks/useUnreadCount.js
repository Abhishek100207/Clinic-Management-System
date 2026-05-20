import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { useAuthStore } from '../store/authStore';

export default function useUnreadCount() {
  const { user } = useAuthStore();
  
  const { data, refetch } = useQuery({
    queryKey: ['unreadCount'],
    queryFn: async () => {
      const res = await api.get('/api/chat/messages/conversations/');
      const total = res.data.reduce((acc, conv) => acc + conv.unread, 0);
      return { total, by_sender: res.data };
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  return {
    totalUnread: data?.total || 0,
    bySender: data?.by_sender || [],
    refetchUnread: refetch
  };
}
