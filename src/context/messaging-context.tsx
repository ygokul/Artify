'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from 'react';
import { useAuth } from './auth-context';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  content: string;
  timestamp: string;
  read: boolean;
  pending?: boolean;
}

interface UserStatus {
  userId: string;
  userName: string;
  email: string;
  status: 'online' | 'offline';
  lastSeen: string;
}

interface Conversation {
  participantId: string;
  participantName: string;
  participantEmail: string;
  lastMessage?: Message;
  unreadCount: number;
  status: 'online' | 'offline';
}

interface MessagingContextType {
  conversations: Conversation[];
  currentChatUserId: string | null;
  currentChatMessages: Message[];
  onlineUsers: UserStatus[];
  totalUnreadMessages: number;
  isLoading: boolean;
  lastUpdate: string | null;
  setCurrentChatUserId: (userId: string | null) => void;
  sendMessage: (receiverId: string, receiverName: string, content: string) => Promise<boolean>;
  markMessagesAsRead: (senderId: string) => void;
  refreshMessagingData: () => Promise<void>;
  refreshOnlineUsers: () => Promise<void>;
  setIsPollingEnabled: (enabled: boolean) => void;
}

const MessagingContext = createContext<MessagingContextType | undefined>(undefined);

export const MessagingProvider = ({ children }: { children: ReactNode }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentChatUserId, setCurrentChatUserId] = useState<string | null>(null);
  const [currentChatMessages, setCurrentChatMessages] = useState<Message[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<UserStatus[]>([]);
  const [totalUnreadMessages, setTotalUnreadMessages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [isPollingEnabled, setIsPollingEnabled] = useState(false);

  
  const { currentUser, isLoggedIn } = useAuth();
  const { toast } = useToast();
  
  // Refs for managing intervals and preventing multiple simultaneous requests
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPollingRef = useRef(false);
  const lastDataRef = useRef<string>('');

  // Check if tab/window is visible
  const [isTabVisible, setIsTabVisible] = useState(true);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Single optimized API call that gets all messaging data
  const loadAllMessagingData = useCallback(async () => {
    if (!currentUser || isPollingRef.current) return;

    try {
      isPollingRef.current = true;
      
      const params = new URLSearchParams({
        userId: currentUser.id,
        userName: currentUser.name,
        userEmail: currentUser.email,
      });

      if (currentChatUserId) {
        params.append('currentChatUserId', currentChatUserId);
      }

      const response = await fetch(`/api/messaging/combined?${params}`);
      
      if (response.ok) {
        const result = await response.json();
        const data = result.data;

        // Check if data actually changed to avoid unnecessary re-renders
        const dataString = JSON.stringify(data);
        if (dataString === lastDataRef.current) {
          return; // No changes, skip update
        }
        lastDataRef.current = dataString;

        // Update all state in one batch
        setConversations(data.conversations || []);
        setOnlineUsers(data.onlineUsers || []);
        setCurrentChatMessages(data.currentChatMessages || []);
        setTotalUnreadMessages(data.totalUnreadMessages || 0);
        setLastUpdate(data.timestamp);

      } else {
        console.error('Failed to load messaging data:', response.statusText);
      }
    } catch (error) {
      console.error('Error loading messaging data:', error);
    } finally {
      isPollingRef.current = false;
    }
  }, [currentUser, currentChatUserId]);

  // Send message with optimistic updates
  const sendMessage = async (receiverId: string, receiverName: string, content: string): Promise<boolean> => {
    if (!currentUser) return false;

    // Create optimistic message
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      receiverId,
      receiverName,
      content,
      timestamp: new Date().toISOString(),
      read: false,
      pending: true,
    };

    // Add optimistic message to current chat
    if (currentChatUserId === receiverId) {
      setCurrentChatMessages(prev => [...prev, optimisticMessage]);
    }

    // Update conversations optimistically
    setConversations(prev => {
      const updated = [...prev];
      const existingIndex = updated.findIndex(c => c.participantId === receiverId);
      
      if (existingIndex >= 0) {
        updated[existingIndex] = {
          ...updated[existingIndex],
          lastMessage: optimisticMessage,
        };
        // Move to top
        const [conversation] = updated.splice(existingIndex, 1);
        updated.unshift(conversation);
      } else {
        // Create new conversation
        updated.unshift({
          participantId: receiverId,
          participantName: receiverName,
          participantEmail: receiverName,
          lastMessage: optimisticMessage,
          unreadCount: 0,
          status: 'online',
        });
      }
      
      return updated;
    });

    try {
      setIsLoading(true);
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: currentUser.id,
          senderName: currentUser.name,
          receiverId,
          receiverName,
          content,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Replace optimistic message with confirmed message
        if (currentChatUserId === receiverId) {
          setCurrentChatMessages(prev => 
            prev.map(msg => 
              msg.pending && msg.content === content && msg.timestamp <= data.message.timestamp
                ? { ...data.message, pending: false }
                : msg
            )
          );
        }

        // Update conversations with confirmed message
        setConversations(prev => 
          prev.map(conv => 
            conv.participantId === receiverId && conv.lastMessage?.pending
              ? { ...conv, lastMessage: data.message }
              : conv
          )
        );

        // Refresh data immediately after sending to get latest state
        setTimeout(() => loadAllMessagingData(), 500);

        return true;
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Remove optimistic message on failure
      if (currentChatUserId === receiverId) {
        setCurrentChatMessages(prev => 
          prev.filter(msg => !(msg.pending && msg.content === content))
        );
      }

      // Revert conversation update
      setConversations(prev => 
        prev.map(conv => 
          conv.participantId === receiverId && conv.lastMessage?.pending
            ? { ...conv, lastMessage: conv.lastMessage ? undefined : conv.lastMessage }
            : conv
        )
      );

      toast({
        title: "Failed to send message",
        description: "Please check your connection and try again",
        variant: "destructive",
      });

      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Mark messages as read
  const markMessagesAsRead = async (senderId: string) => {
    if (!currentUser) return;

    try {
      await fetch(`/api/messages/${senderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentUserId: currentUser.id,
        }),
      });

      // Update local state immediately
      setConversations(prev => 
        prev.map(conv => 
          conv.participantId === senderId
            ? { ...conv, unreadCount: 0 }
            : conv
        )
      );

      // Recalculate total unread messages
      setTotalUnreadMessages(prev => {
        const conversation = conversations.find(c => c.participantId === senderId);
        return Math.max(0, prev - (conversation?.unreadCount || 0));
      });

    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  // Set user offline when leaving
  const setUserOffline = useCallback(async () => {
    if (!currentUser) return;

    try {
      await fetch('/api/messaging/combined', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateStatus',
          userId: currentUser.id,
          userName: currentUser.name,
          userEmail: currentUser.email,
          status: 'offline',
        }),
      });
    } catch (error) {
      console.error('Error setting user offline:', error);
    }
  }, [currentUser]);

  // Public refresh methods
  const refreshMessagingData = async () => {
    await loadAllMessagingData();
  };

  const refreshOnlineUsers = async () => {
    await loadAllMessagingData(); // Same call now includes everything
  };

  // 1. Cleanup effect: clear data on logout
  useEffect(() => {
    if (!isLoggedIn || !currentUser) {
      setConversations([]);
      setCurrentChatUserId(null);
      setCurrentChatMessages([]);
      setOnlineUsers([]);
      setTotalUnreadMessages(0);
      setLastUpdate(null);
      
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    }
  }, [isLoggedIn, currentUser]);

  // 2. Polling interval effect
  useEffect(() => {
    if (!isLoggedIn || !currentUser) return;

    // Clear existing interval
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    // Set new interval
    pollIntervalRef.current = setInterval(() => {
      // Check conditions inside interval to avoid stale closures or excessive re-renders
      if (document.hidden === false && isPollingRef.current === false) {
         // Logic is handled by isPollingRef check in loadAllMessagingData too
         // We do NOT want to put loadAllMessagingData in dependency array here if possible,
         // or we accept it might restart interval.
         // But we can just rely on the fact that we set the interval once.
         // Actually, if we use a ref for isPollingEnabled, we can access it here without re-running.
      }
    }, 5000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      setUserOffline();
    };
  }, [isLoggedIn, currentUser, setUserOffline]);

  // 3. Actual Polling Logic via a stable interval
  // We use a separate effect to update the interval callback if dependencies change?
  // No, simpler: just use one effect that depends on isPollingEnabled.
  
  useEffect(() => {
      if (!isLoggedIn || !currentUser) return;

      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

      pollIntervalRef.current = setInterval(() => {
          if (isTabVisible && !isPollingRef.current && isPollingEnabled) {
              loadAllMessagingData();
          }
      }, 5000);

      return () => {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      }
  }, [isLoggedIn, currentUser, isTabVisible, isPollingEnabled, loadAllMessagingData]);

  // 4. Immediate fetch when polling is enabled (e.g. opening panel)
  useEffect(() => {
      if (isPollingEnabled && isLoggedIn && currentUser) {
          loadAllMessagingData();
      }
  }, [isPollingEnabled, isLoggedIn, currentUser]); // Removed loadAllMessagingData

  // 5. Immediate fetch on chat switch
  useEffect(() => {
    if (currentChatUserId && isLoggedIn && currentUser) {
      loadAllMessagingData();
    }
  }, [currentChatUserId, isLoggedIn, currentUser]); // Removed loadAllMessagingData

  // 6. Immediate fetch on tab visibility
  useEffect(() => {
    if (isTabVisible && isLoggedIn && currentUser && isPollingEnabled) {
      loadAllMessagingData();
    }
  }, [isTabVisible]); // Minimal dependencies

  return (
    <MessagingContext.Provider value={{
      conversations,
      currentChatUserId,
      currentChatMessages,
      onlineUsers,
      totalUnreadMessages,
      isLoading,
      lastUpdate,
      setCurrentChatUserId,
      sendMessage,
      markMessagesAsRead,
      refreshMessagingData,
      refreshOnlineUsers,
      setIsPollingEnabled,
    }}>
      {children}
    </MessagingContext.Provider>
  );
};

export const useMessaging = (): MessagingContextType => {
  const context = useContext(MessagingContext);
  if (!context) {
    throw new Error('useMessaging must be used within a MessagingProvider');
  }
  return context;
};

export type { Message, UserStatus, Conversation }; 