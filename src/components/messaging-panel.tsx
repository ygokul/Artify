'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useMessaging, type Message, type Conversation, type UserStatus } from '@/context/messaging-context';
import { useAuth } from '@/context/auth-context';
import { CanvasInvitationMessage } from '@/components/canvas-invitation-message';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  MessageCircle, 
  Send, 
  ArrowLeft, 
  Circle, 
  Users,
  MessageSquare,
  Clock,
  RefreshCw,
  Wifi
} from 'lucide-react';

interface MessagingPanelProps {
  onClose: () => void;
}

export function MessagingPanel({ onClose }: MessagingPanelProps) {
  const [newMessage, setNewMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'conversations' | 'online'>('conversations');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const {
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
  } = useMessaging();
  
  const { currentUser } = useAuth();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentChatMessages]);

  // Mark messages as read when opening a chat
  useEffect(() => {
    if (currentChatUserId) {
      markMessagesAsRead(currentChatUserId);
    }
  }, [currentChatUserId, markMessagesAsRead]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentChatUserId) return;

    const currentChat = conversations.find(c => c.participantId === currentChatUserId) ||
                       onlineUsers.find(u => u.userId === currentChatUserId);
    
    if (!currentChat) return;

    const participantName = 'participantName' in currentChat ? currentChat.participantName : currentChat.userName;
    const messageContent = newMessage.trim();
    
    // Clear input immediately for better UX
    setNewMessage('');
    setIsSending(true);
    
    const success = await sendMessage(currentChatUserId, participantName, messageContent);
    setIsSending(false);
    
    if (!success) {
      // Restore message on failure
      setNewMessage(messageContent);
    }
  };

  const startChatWithUser = (user: UserStatus) => {
    setCurrentChatUserId(user.userId);
    setActiveTab('conversations');
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'now';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return date.toLocaleDateString();
  };

  const formatLastUpdateTime = (timestamp: string | null) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 5) return 'Just now';
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const isCanvasInvitationMessage = (content: string) => {
    return content.includes('Canvas Collaboration Invite:');
  };

  // Chat view
  if (currentChatUserId) {
    const currentChat = conversations.find(c => c.participantId === currentChatUserId) ||
                       onlineUsers.find(u => u.userId === currentChatUserId);
    
    if (!currentChat) return null;

    const participantName = 'participantName' in currentChat ? currentChat.participantName : currentChat.userName;
    const isOnline = 'status' in currentChat ? currentChat.status === 'online' : currentChat.status === 'online';

    return (
      <div className="h-full flex flex-col">
        {/* Chat Header */}
        <div className="flex items-center gap-3 p-4 border-b">
          <Button variant="ghost" size="icon" onClick={() => setCurrentChatUserId(null)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">
              {getUserInitials(participantName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{participantName}</span>
              <Circle className={`h-2 w-2 ${isOnline ? 'fill-green-500 text-green-500' : 'fill-gray-400 text-gray-400'}`} />
            </div>
            <span className="text-xs text-muted-foreground">
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
          <div className="text-xs text-muted-foreground">
            Updated: {formatLastUpdateTime(lastUpdate)}
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {currentChatMessages.map((message) => {
              // Check if this is a canvas invitation message
              if (isCanvasInvitationMessage(message.content)) {
                return (
                  <CanvasInvitationMessage
                    key={message.id}
                    messageContent={message.content}
                    senderId={message.senderId}
                    senderName={message.senderName}
                    timestamp={message.timestamp}
                    isOwnMessage={message.senderId === currentUser?.id}
                  />
                );
              }

              // Regular message
              return (
                <div
                  key={message.id}
                  className={`flex ${message.senderId === currentUser?.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div className="flex items-end gap-2 max-w-[80%]">
                    {message.senderId !== currentUser?.id && (
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {getUserInitials(message.senderName)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={`px-3 py-2 rounded-lg text-sm relative ${
                        message.senderId === currentUser?.id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      } ${message.pending ? 'opacity-70' : ''}`}
                    >
                      <p className="break-words">{message.content}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-xs opacity-70">
                          {formatMessageTime(message.timestamp)}
                        </span>
                        {message.pending && (
                          <Clock className="h-3 w-3 opacity-70" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Message Input */}
        <form onSubmit={handleSendMessage} className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              maxLength={1000}
              className="flex-1"
              disabled={isLoading || isSending}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
            />
            <Button 
              type="submit" 
              size="icon" 
              disabled={!newMessage.trim() || isLoading || isSending}
              className={isSending ? 'opacity-70' : ''}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Press Enter to send • {newMessage.length}/1000
          </div>
        </form>
      </div>
    );
  }

  // Main messaging view
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-primary" />
          <span className="font-semibold">Messages</span>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={refreshMessagingData}
            disabled={isLoading}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ×
          </Button>
        </div>
      </div>

      {/* Status Bar */}
      <div className="px-4 py-2 bg-muted/30 border-b">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Wifi className="h-3 w-3 text-green-500" />
            <span>Connected</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>Updated: {formatLastUpdateTime(lastUpdate)}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        <Button
          variant={activeTab === 'conversations' ? 'secondary' : 'ghost'}
          size="sm"
          className="flex-1 rounded-none"
          onClick={() => setActiveTab('conversations')}
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Chats
          {totalUnreadMessages > 0 && (
            <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 text-xs">
              {totalUnreadMessages}
            </Badge>
          )}
        </Button>
        <Button
          variant={activeTab === 'online' ? 'secondary' : 'ghost'}
          size="sm"
          className="flex-1 rounded-none"
          onClick={() => setActiveTab('online')}
        >
          <Users className="h-4 w-4 mr-2" />
          Online
          <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
            {onlineUsers.length}
          </Badge>
        </Button>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        {activeTab === 'conversations' ? (
          <div className="p-2">
            {conversations.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">No conversations yet</p>
                <p className="text-xs">Start chatting with online users!</p>
              </div>
            ) : (
              conversations.map((conversation) => (
                <div
                  key={conversation.participantId}
                  className="p-3 hover:bg-muted rounded-lg cursor-pointer transition-colors"
                  onClick={() => setCurrentChatUserId(conversation.participantId)}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {getUserInitials(conversation.participantName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">
                          {conversation.participantName}
                        </span>
                        <Circle className={`h-2 w-2 ${conversation.status === 'online' ? 'fill-green-500 text-green-500' : 'fill-gray-400 text-gray-400'}`} />
                        {conversation.unreadCount > 0 && (
                          <Badge variant="destructive" className="h-5 w-5 p-0 text-xs">
                            {conversation.unreadCount}
                          </Badge>
                        )}
                      </div>
                      {conversation.lastMessage && (
                        <div className="flex items-center gap-1">
                          <p className="text-xs text-muted-foreground truncate">
                            {isCanvasInvitationMessage(conversation.lastMessage.content) ? (
                              <span className="flex items-center gap-1">
                                🎨 Canvas invitation
                              </span>
                            ) : (
                              <>
                                {conversation.lastMessage.senderId === currentUser?.id ? 'You: ' : ''}
                                {conversation.lastMessage.content}
                              </>
                            )}
                          </p>
                          {conversation.lastMessage.pending && (
                            <Clock className="h-3 w-3 text-muted-foreground" />
                          )}
                        </div>
                      )}
                    </div>
                    {conversation.lastMessage && !conversation.lastMessage.pending && (
                      <span className="text-xs text-muted-foreground">
                        {formatMessageTime(conversation.lastMessage.timestamp)}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="p-2">
            {onlineUsers.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">No users online</p>
                <p className="text-xs">Check back later!</p>
              </div>
            ) : (
              onlineUsers.map((user) => (
                <div
                  key={user.userId}
                  className="p-3 hover:bg-muted rounded-lg cursor-pointer transition-colors"
                  onClick={() => startChatWithUser(user)}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {getUserInitials(user.userName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{user.userName}</span>
                        <Circle className="h-2 w-2 fill-green-500 text-green-500" />
                      </div>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <Button size="sm" variant="ghost">
                      Chat
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
} 