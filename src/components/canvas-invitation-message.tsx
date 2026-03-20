'use client';

import React, { useState } from 'react';
import { useCollaboration } from '@/context/collaboration-context';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Palette, Check, X, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CanvasInvitationMessageProps {
  messageContent: string;
  senderId: string;
  senderName: string;
  timestamp: string;
  isOwnMessage: boolean;
}

export function CanvasInvitationMessage({ 
  messageContent, 
  senderId, 
  senderName, 
  timestamp, 
  isOwnMessage 
}: CanvasInvitationMessageProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { acceptInvitation, declineInvitation, receivedInvitations } = useCollaboration();
  const { currentUser } = useAuth();
  const { toast } = useToast();

  // Extract invitation ID from message content
  const getInvitationId = (content: string): string | null => {
    const match = content.match(/Invitation ID: (inv_[a-z0-9_]+)/);
    return match ? match[1] : null;
  };

  // Extract canvas name from message content
  const getCanvasName = (content: string): string | null => {
    const match = content.match(/Canvas Collaboration Invite: "([^"]+)"/);
    return match ? match[1] : null;
  };

  const isCanvasInvitation = messageContent.includes('Canvas Collaboration Invite:');
  
  if (!isCanvasInvitation) {
    return null; // Not a canvas invitation, let regular message component handle it
  }

  const invitationId = getInvitationId(messageContent);
  const canvasName = getCanvasName(messageContent);
  
  // Find the invitation in our received invitations
  const invitation = invitationId ? 
    receivedInvitations.find(inv => inv.id === invitationId) : null;

  const handleAccept = async () => {
    if (!invitationId) {
      toast({
        title: "Error",
        description: "Invalid invitation ID",
        variant: "destructive",
      });
      return;
    }
    
    console.log('Accepting invitation:', invitationId);
    setIsProcessing(true);
    
    try {
      const success = await acceptInvitation(invitationId);
      if (success) {
        toast({
          title: "Success!",
          description: "Joined collaborative canvas successfully!",
        });
      } else {
        toast({
          title: "Failed to join",
          description: "Could not join the collaborative canvas",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast({
        title: "Error",
        description: "An error occurred while joining the canvas",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecline = async () => {
    if (!invitationId) return;
    
    setIsProcessing(true);
    await declineInvitation(invitationId);
    setIsProcessing(false);
  };

  const getStatusBadge = () => {
    if (!invitation) {
      // If we can't find the invitation, it might be new or from another user
      if (isOwnMessage) {
        return <Badge variant="default" className="text-blue-600">Sent</Badge>;
      } else {
        return <Badge variant="default" className="text-blue-600">New Invitation</Badge>;
      }
    }
    
    switch (invitation.status) {
      case 'accepted':
        return <Badge variant="secondary" className="text-green-600"><Check className="h-3 w-3 mr-1" />Accepted</Badge>;
      case 'declined':
        return <Badge variant="secondary" className="text-red-600"><X className="h-3 w-3 mr-1" />Declined</Badge>;
      case 'expired':
        return <Badge variant="secondary" className="text-gray-600"><Clock className="h-3 w-3 mr-1" />Expired</Badge>;
      default:
        return <Badge variant="default" className="text-yellow-600"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'now';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return date.toLocaleDateString();
  };

  // Only show accept button for received invitations that are still pending or new
  const canShowAcceptButton = !isOwnMessage && (!invitation || invitation.status === 'pending');
  const shouldShowStatusMessage = !isOwnMessage && invitation && invitation.status !== 'pending';

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}>
      <Card className={`max-w-[80%] ${isOwnMessage ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Canvas Collaboration Invite
            {getStatusBadge()}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {canvasName && (
            <div>
              <p className="font-medium">"{canvasName}"</p>
              <p className="text-sm opacity-70">
                {isOwnMessage ? 'You invited someone to collaborate' : `${senderName} invited you to collaborate`}
              </p>
            </div>
          )}
          
          {invitationId && (
            <div className="text-xs opacity-50">
              ID: {invitationId}
            </div>
          )}
          
          <div className="text-xs opacity-70">
            {formatTime(timestamp)}
          </div>

          {/* Action buttons for received invitations */}
          {canShowAcceptButton && (
            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                onClick={handleAccept}
                disabled={isProcessing}
                className="flex-1"
              >
                {isProcessing ? 'Joining...' : 'Accept & Join'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleDecline}
                disabled={isProcessing}
                className="flex-1"
              >
                Decline
              </Button>
            </div>
          )}

          {/* Status message for processed invitations */}
          {shouldShowStatusMessage && (
            <div className="text-sm pt-2 border-t border-border/20">
              {invitation.status === 'accepted' && 'You joined this collaboration'}
              {invitation.status === 'declined' && 'You declined this invitation'}
              {invitation.status === 'expired' && 'This invitation has expired'}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 