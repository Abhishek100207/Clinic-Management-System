import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';

export default function useWebSocket(otherUserId) {
  const [messages, setMessages] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const ws = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxRetries = 5;

  const isIntentionalClose = useRef(false);

  const connect = useCallback(function doConnect() {
    if (!otherUserId) return;
    
    isIntentionalClose.current = false;
    const token = useAuthStore.getState().accessToken;
    if (!token) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = import.meta.env.VITE_API_URL 
      ? import.meta.env.VITE_API_URL.replace('http://', '').replace('https://', '')
      : window.location.host;
      
    const wsUrl = `${protocol}//${host}/ws/chat/${otherUserId}/?token=${token}`;

    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      setConnectionStatus('open');
      reconnectAttempts.current = 0;
    };

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'history') {
          setMessages(data.messages);
        } else if (data.type === 'message') {
          setMessages(prev => {
            const pendingIndex = prev.findIndex(m => m.pending && m.message === data.message.message);
            if (pendingIndex !== -1) {
              const newMessages = [...prev];
              newMessages[pendingIndex] = { ...data.message, pending: false, failed: false };
              return newMessages;
            }
            return [...prev, data.message];
          });
        } else if (data.type === 'error') {
          setMessages(prev => {
            const newMessages = [...prev];
            const pendingIndex = newMessages.findIndex(m => m.pending && m.message === data.original_text);
            if (pendingIndex !== -1) {
              newMessages[pendingIndex] = { ...newMessages[pendingIndex], failed: true, pending: false };
            }
            return newMessages;
          });
        }
      } catch (err) {
        console.error("Failed to parse websocket message", err);
      }
    };

    ws.current.onclose = () => {
      if (isIntentionalClose.current) {
        setConnectionStatus('closed');
        return;
      }
      if (reconnectAttempts.current < maxRetries) {
        setConnectionStatus('reconnecting');
        const timeout = Math.pow(2, reconnectAttempts.current) * 1000;
        setTimeout(() => {
          reconnectAttempts.current += 1;
          doConnect();
        }, timeout);
      } else {
        setConnectionStatus('closed');
      }
    };

    ws.current.onerror = () => {
      // Handled by onclose
    };
  }, [otherUserId]);

  useEffect(() => {
    setMessages([]); // Clear messages immediately when user changes
    connect();
    return () => {
      isIntentionalClose.current = true;
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [connect]);

  const sendMessage = useCallback((messageText) => {
    if (!messageText.trim()) return;
    
    const optimisticMessage = {
      id: Date.now(),
      sender: useAuthStore.getState().user?.id,
      receiver: otherUserId,
      message: messageText,
      sent_at: new Date().toISOString(),
      pending: true,
      failed: false
    };
    
    setMessages(prev => [...prev, optimisticMessage]);

    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ message: messageText }));
    } else {
      setMessages(prev => {
        const newMessages = [...prev];
        const idx = newMessages.findIndex(m => m.id === optimisticMessage.id);
        if (idx !== -1) {
          newMessages[idx].failed = true;
          newMessages[idx].pending = false;
        }
        return newMessages;
      });
    }
  }, [otherUserId]);

  return { messages, sendMessage, connectionStatus };
}
